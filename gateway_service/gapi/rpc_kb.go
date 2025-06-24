package gapi

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	pb "gateway_service/pb"
	"gateway_service/rag_client"
	"gateway_service/util"
	"sync"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) CreateKB(ctx context.Context, req *pb.CreateKBRequest) (*pb.CreateKBResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	if req.ProjectId != nil {
		exists, err := server.store.IsUserInProject(ctx, db.IsUserInProjectParams{
			UserID:    user.ID,
			ProjectID: uuid.MustParse(*req.ProjectId),
		})
		if !exists {
			return nil, status.Error(codes.PermissionDenied, "您没有权限创建知识库")
		}

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to check if user is in project")
		}
	}

	kb_name := req.Name

	kb, err := server.store.CreateKB(ctx, db.CreateKBParams{
		Name:    kb_name,
		OwnerID: user.ID,
	})

	if err != nil {
		if db.ErrorCode(err) == db.UniqueViolation {
			return nil, status.Error(codes.AlreadyExists, "knowledge base already exists")
		}
		return nil, status.Error(codes.Internal, "failed to create knowledge base")
	}

	if req.ProjectId != nil {
		err = server.store.AddKBToProject(ctx, db.AddKBToProjectParams{
			ProjectID:       uuid.MustParse(*req.ProjectId),
			KnowledgeBaseID: kb.ID,
		})
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to add knowledge base to project")
		}
	}

	// create rag config
	err = server.store.UpsertRagConfig(ctx, db.UpsertRagConfigParams{
		OwnerID:               user.ID,
		KbID:                  kb.ID,
		ChunkTokenSize:        2400,
		ChunkOverlapTokenSize: 240,
		EmbedModel:            "bge-m3",
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create rag config")
	}
	exists, err := server.fileService.IsObjectExists(ctx, &file_service.IsObjectExistsRequest{
		BucketName: user.Username,
		ObjectName: kb_name + "/",
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if object exists")
	}

	if exists.Exists {
		return &pb.CreateKBResponse{
			Message: "knowledge base created successfully",
		}, nil
	}

	_, err = server.NewFolderInBucket(ctx, &pb.NewFolderInBucketRequest{
		FolderName: kb_name,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create folder in bucket")
	}

	return &pb.CreateKBResponse{
		Message: "knowledge base created successfully",
	}, nil
}

func (server *Server) GetUserKBs(ctx context.Context, req *pb.GetUserKBsRequest) (*pb.GetUserKBsResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbs, err := server.store.GetUserKBs(ctx, user.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list knowledge bases")
	}

	response := &pb.GetUserKBsResponse{
		Kbs: make([]*pb.KB, len(kbs)),
	}

	for i, kb := range kbs {
		response.Kbs[i] = convertKB(kb)
	}

	return response, nil
}

func (server *Server) ChangeKBName(ctx context.Context, req *pb.ChangeKBNameRequest) (*pb.ChangeKBNameResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kb, err := server.store.GetKB(ctx, uuid.MustParse(req.Id))
	if err != nil {
		if err == db.ErrRecordNotFound {
			return nil, status.Error(codes.NotFound, "knowledge base not found")
		}
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	if kb.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	kb, err = server.store.ChangeKBName(ctx, db.ChangeKBNameParams{
		ID:   uuid.MustParse(req.Id),
		Name: req.Name,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update knowledge base name")
	}

	_, err = server.NewFolderInBucket(ctx, &pb.NewFolderInBucketRequest{
		FolderName: req.Name,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create folder in bucket")
	}

	return &pb.ChangeKBNameResponse{
		Message: "knowledge base name updated successfully",
	}, nil
}

func (server *Server) DeleteKB(ctx context.Context, req *pb.DeleteKBRequest) (*pb.DeleteKBResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kb, err := server.store.GetKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		if err == db.ErrRecordNotFound {
			return nil, status.Error(codes.NotFound, "knowledge base not found")
		}
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	var hasPermission bool = false

	if req.ProjId != nil {
		proj, err := server.store.GetProjectByID(ctx, uuid.MustParse(*req.ProjId))
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to get project")
		}
		if proj.OwnerID == user.ID {
			hasPermission = true
		}
	}

	if !hasPermission && kb.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "没有权限删除此知识库")
	}

	err = server.store.DeleteKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to delete knowledge base")
	}

	_, err = server.ragClient.DeleteKB(ctx, &rag_client.DeleteKBRequest{
		UserID: user.ID.String(),
		KbID:   kb.ID.String(),
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to delete knowledge base")
	}

	return &pb.DeleteKBResponse{
		Message: "knowledge base deleted successfully",
	}, nil
}

func convertKB(kb db.GetUserKBsRow) *pb.KB {
	return &pb.KB{
		Id:                       kb.ID.String(),
		Name:                     kb.Name,
		OwnerId:                  kb.OwnerID.String(),
		KbFileCount:              &kb.KbFileCount,
		KbFileBuildFinishedCount: &kb.KbFileBuildFinishedCount,
		CreatedAt:                timestamppb.New(kb.CreatedAt),
		UpdatedAt:                timestamppb.New(kb.UpdatedAt),
	}
}

func (server *Server) UpsertRagConfig(ctx context.Context, req *pb.UpsertRagConfigRequest) (*pb.UpsertRagConfigResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kb, err := server.store.GetKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: kb.ID,
		UserID:          user.ID,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if knowledge base is accessible")
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	num_valid_kb_files, err := server.store.GetNumValidKBFilesByKBID(ctx, kb.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get number of valid kb files")
	}

	if num_valid_kb_files > 0 {
		return nil, status.Error(codes.AlreadyExists, "knowledge base has built kb files, cannot update rag config")
	}

	err = server.store.UpsertRagConfig(ctx, db.UpsertRagConfigParams{
		OwnerID:               user.ID,
		KbID:                  kb.ID,
		ChunkTokenSize:        req.ChunkTokenSize,
		ChunkOverlapTokenSize: req.ChunkOverlapTokenSize,
		EmbedModel:            req.EmbedModel,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to upsert rag config")
	}

	return &pb.UpsertRagConfigResponse{
		Message: "rag config upserted successfully",
	}, nil
}

func (server *Server) GetRagConfigByKBID(ctx context.Context, req *pb.GetRagConfigByKBIDRequest) (*pb.GetRagConfigByKBIDResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kb, err := server.store.GetKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: kb.ID,
		UserID:          user.ID,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if knowledge base is accessible")
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	ragConfig, err := server.store.GetRagConfigByKBID(ctx, kb.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get rag config")
	}

	return &pb.GetRagConfigByKBIDResponse{
		ChunkTokenSize:        ragConfig.ChunkTokenSize,
		ChunkOverlapTokenSize: ragConfig.ChunkOverlapTokenSize,
		EmbedModel:            ragConfig.EmbedModel,
	}, nil
}

func (server *Server) ParseAndBuildKB(ctx context.Context, req *pb.ParseAndBuildKBRequest) (*pb.ParseAndBuildKBResponse, error) {
	kb, err := server.GetKBWithKBFilesByKBID(ctx, &pb.GetKBWithKBFilesByKBIDRequest{
		KbId: req.KbId,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	kbfiles := kb.Data.KbFiles

	//  add redis lock to prevent two or more users start the task at the same time

	for _, kbfile := range kbfiles {
		if (*kbfile.ParsePercentage > 0 &&
			*kbfile.ParsePercentage < 100) ||
			(*kbfile.BuildPercentage > 0 &&
				*kbfile.BuildPercentage < 100) {
			return nil, status.Error(codes.Unavailable, "解析或构建任务正在进行中")
		}
	}

	kb_files_to_build := make([]*pb.KBFileWithKBMapping, 0)
	for _, kbfile := range kbfiles {
		if *kbfile.IsBuildFinished ||
			*kbfile.IsParseFailed {
			continue
		}
		kb_files_to_build = append(kb_files_to_build, kbfile)
	}

	len_kb_files_to_build := len(kb_files_to_build)

	if len_kb_files_to_build == 0 {
		return &pb.ParseAndBuildKBResponse{
			Message: "No files to process",
		}, nil
	}

	type ChanFileToBuild struct {
		fileId    string
		startTime time.Time
	}

	chan_kb_files_to_build := make(chan ChanFileToBuild, len_kb_files_to_build)

	for _, kbfile := range kb_files_to_build {
		kb_file_db, err := server.store.GetKBFile(ctx, uuid.MustParse(kbfile.Id))
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to get kb file")
		}

		if kb_file_db.IsAssetsUpdated {
			chan_kb_files_to_build <- ChanFileToBuild{
				fileId:    kbfile.Id,
				startTime: time.Now(),
			}

		} else {
			server.StartParseKBFile(ctx, &pb.StartParseKBFileRequest{
				KbFileId: kbfile.Id,
			})
			chan_kb_files_to_build <- ChanFileToBuild{
				fileId:    kbfile.Id,
				startTime: time.Now(),
			}
		}
	}

	var wg sync.WaitGroup
	wg.Add(len_kb_files_to_build)
	done := make(chan struct{})
	bgCtx := context.Background()
	// Copy metadata and auth info from original context
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		bgCtx = metadata.NewIncomingContext(bgCtx, md)
	}
	go func() {
		wg.Wait()
		close(done)
	}()

	go func() {

		defer close(chan_kb_files_to_build)

		for kbfile := range chan_kb_files_to_build {
			select {
			case <-done:
				server.logger.Info("all files processing completed")
				return

			default:

				file, err := server.store.GetKBFile(bgCtx, uuid.MustParse(kbfile.fileId))

				if err != nil {
					server.logger.Errorf("failed to get kb file %s: %v", kbfile.fileId, err)
					wg.Done()
					continue
				}

				if file.IsParseFailed {
					server.logger.Errorf("failed to parse kb file %s: %v", kbfile.fileId, err)
					wg.Done()
					continue
				}

				if file.ParsePercentage == 100 && !file.IsParseFailed {
					_, err = server.StartBuildKBFile(bgCtx, &pb.StartBuildKBFileRequest{
						KbFileId:      kbfile.fileId,
						KbId:          kb.Data.Id,
						ApiKey:        req.ApiKey,
						ProjectApiKey: req.ProjectApiKey,
						ApiProvider:   req.ApiProvider,
					})
					if err != nil {
						server.logger.Errorf("failed to start build kb file %s: %v", kbfile.fileId, err)
					}
					wg.Done()
					continue
				}

				timeNow := time.Now()

				if timeNow.Sub(kbfile.startTime) > server.config.ParseTimeout {
					wg.Done()
					continue
				}

				time.Sleep(2 * time.Second)

				chan_kb_files_to_build <- kbfile

			}
		}
	}()

	return &pb.ParseAndBuildKBResponse{
		Message: "Start parsing and building knowledge base",
	}, nil
}

func (server *Server) GetKBGraph(ctx context.Context, req *pb.GetKBGraphRequest) (*pb.GetKBGraphResponse, error) {

	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: uuid.MustParse(req.KbId),
		UserID:          user.ID,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if knowledge base is accessible")
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	count, err := server.store.GetNumValidKBFilesByKBID(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	if count == 0 {
		return nil, status.Error(codes.NotFound, "no valid kb files found")
	}

	kb, err := server.store.GetKBWithKBFilesByKBID(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get knowledge base")
	}

	return server.ragClient.GetKBGraph(ctx, &rag_client.GetKBGraphRequest{
		KbID: kb.ID.String(),
	})
}
