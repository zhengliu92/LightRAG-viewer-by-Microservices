package gapi

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	"gateway_service/parser_service"
	pb "gateway_service/pb"
	"gateway_service/rag_client"
	"gateway_service/util"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (s *Server) deleteFilesRecursively(ctx context.Context, filePath string, ownerID uuid.UUID) error {
	isFolder := filePath[len(filePath)-1] == '/'
	if isFolder {
		folderName := filePath[:len(filePath)-1]
		files, err := s.store.GetKBFilesByFolder(ctx, db.GetKBFilesByFolderParams{
			OwnerID: ownerID,
			Folder:  folderName,
		})
		if err != nil {
			return err
		}
		for _, file := range files {
			s.deleteFilesRecursively(ctx, file.Path, ownerID)
		}

	}
	// delete folder
	err := s.store.DeleteKBFileByPathAndOwnerID(ctx, db.DeleteKBFileByPathAndOwnerIDParams{
		Path:    filePath,
		OwnerID: ownerID,
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *Server) DeleteKBFiles(ctx context.Context, req *pb.DeleteKBFilesRequest) (*pb.DeleteKBFilesResponse, error) {
	user, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	filePaths := make([]string, len(req.FileIds))
	for i, file_id := range req.FileIds {
		file, err := s.store.GetKBFile(ctx, uuid.MustParse(file_id))
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get file: %v", err)
		}
		filePaths[i] = file.Path
	}

	for _, filePath := range filePaths {
		err = s.deleteFilesRecursively(ctx, filePath, user.ID)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to delete files: %v", err)
		}
	}

	bucketName := user.Username
	_, err = s.fileService.DeleteFiles(ctx, &file_service.DeleteFilesRequest{BucketName: bucketName, FileNames: filePaths})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete files: %v", err)
	}
	return &pb.DeleteKBFilesResponse{Message: "success"}, nil
}

func (server *Server) CreateKBFile(ctx context.Context, req *pb.CreateKBFileRequest) (*pb.CreateKBFileResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)

	}
	var kbFileID uuid.UUID
	// Create the KB file
	kbFile, err := server.store.CreateKBFile(ctx, db.CreateKBFileParams{
		Name:    req.Name,
		Path:    req.Path,
		Folder:  req.Folder,
		OwnerID: user.ID,
		Size:    req.Size,
	})

	if err != nil {
		// get error code from err
		errCode := db.ErrorCode(err)
		if errCode == db.UniqueViolation {
			// get kbfile
			kbFileRow, _ := server.store.GetKBFileByOwnerAndPath(ctx, db.GetKBFileByOwnerAndPathParams{
				Username: user.Username,
				Path:     req.Path,
			})
			kbFileID = kbFileRow.ID
		} else {
			// check if it is already exists
			return nil, status.Errorf(codes.Internal, "failed to create KB file: %v", err)
		}
	} else {
		kbFileID = kbFile.ID
	}

	if req.KbId != nil {

		kb, err := server.store.GetKB(ctx, uuid.MustParse(*req.KbId))
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to get knowledge base")
		}

		accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
			KnowledgeBaseID: kb.ID,
			UserID:          user.ID,
		})

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to check if KB is accessible")
		}

		if !accessible {
			return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
		}

		err = server.store.AddFileToKB(ctx, db.AddFileToKBParams{
			KbFileID: kbFileID,
			KbID:     kb.ID,
		})

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to get default knowledge base")
		}
	}

	return &pb.CreateKBFileResponse{
		Message: "success",
	}, nil
}

func (server *Server) StartParseKBFile(ctx context.Context, req *pb.StartParseKBFileRequest) (*pb.StartParseKBFileResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbFile, err := server.store.GetKBFile(ctx, uuid.MustParse(req.KbFileId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB file")
	}

	if kbFile.ParsePercentage > 0 && kbFile.ParsePercentage < 100 {
		return nil, status.Error(codes.Unavailable, "解析任务正在进行中")
	}

	fileOwner, err := server.GetUserById(ctx, kbFile.OwnerID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get file owner")
	}

	_, err = server.parserClient.ParseDocument(ctx, &parser_service.ParseDocumentRequest{
		UserId:     user.ID.String(),
		DocId:      kbFile.ID.String(),
		BucketName: fileOwner.Username,
		DocPath:    kbFile.Path,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to parse document: %v", err)
	}

	_, err = server.store.UpdateKBFile(ctx, db.UpdateKBFileParams{
		ID:              kbFile.ID,
		ParseStatus:     pgtype.Text{String: QueueStart, Valid: true},
		ParsePercentage: pgtype.Float8{Float64: 1, Valid: true},
		IsParseFinished: pgtype.Bool{Bool: false, Valid: true},
		IsParseFailed:   pgtype.Bool{Bool: false, Valid: true},
		IsAssetsUpdated: pgtype.Bool{Bool: false, Valid: true},
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update KB file")
	}

	return &pb.StartParseKBFileResponse{
		Message: "success",
	}, nil
}

func (server *Server) StartBuildKBFile(ctx context.Context, req *pb.StartBuildKBFileRequest) (*pb.StartBuildKBFileResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: uuid.MustParse(req.KbId),
		UserID:          user.ID,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if KB is accessible")
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	kbFile, err := server.store.GetKBFile(ctx, uuid.MustParse(req.KbFileId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB file")
	}

	if !kbFile.IsAssetsUpdated || !kbFile.IsParseFinished || kbFile.IsParseFailed {
		return nil, status.Error(codes.InvalidArgument, "KB file is not ready to build")
	}

	kbMapping, err := server.store.GetKBFileMapping(ctx, db.GetKBFileMappingParams{
		KbFileID: kbFile.ID,
		KbID:     uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB mapping")
	}

	// check if KB file is in progress
	if kbMapping.BuildPercentage > 0 && kbMapping.BuildPercentage < 100 {
		return nil, status.Error(codes.InvalidArgument, "KB file is already in progress")
	}

	kbConfig, err := server.store.GetRagConfigByKBID(ctx, uuid.MustParse(req.KbId))

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB config")
	}

	text, err := server.store.GetFileFullTextByKBFileID(ctx, kbFile.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get file full text")
	}

	imgs, err := server.store.GetFileFiguresByKBFileID(ctx, kbFile.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get file figures")
	}

	tables, err := server.store.GetFileTablesByKBFileID(ctx, kbFile.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get file tables")
	}

	req_rag := &rag_client.BuildKBFileRequest{
		KbID:                  req.KbId,
		ChunkTokenSize:        kbConfig.ChunkTokenSize,
		ChunkOverlapTokenSize: kbConfig.ChunkOverlapTokenSize,
		EmbedModel:            kbConfig.EmbedModel,
		APIKey:                req.ApiKey,
		ProjectID:             *req.ProjectApiKey,
		APIProvider:           req.ApiProvider,
		KBFile: rag_client.KBFile{
			KbFileID: kbFile.ID.String(),
			KbID:     req.KbId,
			FileText: rag_client.KBFileText{
				KbFileID:    kbFile.ID.String(),
				FileContent: text.FullText,
			},
			Figures: convertFileFigureToKBFigures(&imgs),
			Tables:  convertFileTableToKBTable(&tables),
		},
	}
	_, err = server.ragClient.BuildKBFile(ctx, req_rag)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	_, err = server.store.UpdateKBFileMapping(ctx, db.UpdateKBFileMappingParams{
		KbFileID:        kbFile.ID,
		KbID:            uuid.MustParse(req.KbId),
		BuildStatus:     pgtype.Text{String: QueueStart, Valid: true},
		BuildPercentage: pgtype.Float8{Float64: 1, Valid: true},
		IsBuildFinished: pgtype.Bool{Bool: false, Valid: true},
		IsBuildFailed:   pgtype.Bool{Bool: false, Valid: true},
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update KB file mapping")
	}

	return &pb.StartBuildKBFileResponse{
		Message: "success",
	}, nil

}

func (server *Server) StopBuildKBFile(ctx context.Context, req *pb.StopBuildKBFileRequest) (*pb.StopBuildKBFileResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	resp, err := server.ragClient.StopBuildKBFile(ctx, &rag_client.StopBuildKBFileRequest{
		UserID:   user.ID.String(),
		KbFileID: req.KbFileId,
		KbID:     req.KbId,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to stop build KB file")
	}

	return &pb.StopBuildKBFileResponse{
		Message: resp.Message,
	}, nil
}

func (server *Server) UpdateKBFile(ctx context.Context, req *pb.UpdateKBFileRequest) (*pb.UpdateKBFileResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	// Check if KB file exists and user owns it
	kbFile, err := server.store.GetKBFile(ctx, uuid.MustParse(req.Id))
	if err != nil {
		if err == db.ErrRecordNotFound {
			return nil, status.Error(codes.NotFound, "KB file not found")
		}
		return nil, status.Error(codes.Internal, "failed to get KB file")
	}

	if kbFile.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "not authorized to update this KB file")
	}

	// Build update params
	arg := db.UpdateKBFileParams{
		ID: uuid.MustParse(req.Id),
	}

	if req.Name != nil {
		arg.Name = pgtype.Text{String: *req.Name, Valid: true}
	}
	if req.Path != nil {
		arg.Path = pgtype.Text{String: *req.Path, Valid: true}
	}
	if req.Folder != nil {
		arg.Folder = pgtype.Text{String: *req.Folder, Valid: true}
	}
	if req.OwnerId != nil {
		arg.OwnerID = pgtype.UUID{Bytes: uuid.MustParse(*req.OwnerId), Valid: true}
	}

	if req.ParsePercentage != nil {
		arg.ParsePercentage = pgtype.Float8{Float64: float64(*req.ParsePercentage), Valid: true}
	}

	if req.IsParseFinished != nil {
		arg.IsParseFinished = pgtype.Bool{Bool: *req.IsParseFinished, Valid: true}
	}
	// Update the KB file
	_, err = server.store.UpdateKBFile(ctx, arg)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update KB file")
	}

	return &pb.UpdateKBFileResponse{Message: "success"}, nil
}

func (server *Server) GetKBFilesByFolder(ctx context.Context, req *pb.GetKBFilesByFolderRequest) (*pb.GetKBFilesByFolderResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbFiles, err := server.store.GetKBFilesWithKBsByFolder(ctx, db.GetKBFilesWithKBsByFolderParams{
		OwnerID: user.ID,
		Folder:  req.Folder,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB files")
	}
	kbFilesParse, err := db.ParseKBFileWithKBs(&kbFiles)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to parse KB files")
	}

	response := &pb.GetKBFilesByFolderResponse{
		Data: make([]*pb.KBFileWithKBs, len(kbFilesParse)),
	}

	for i, file := range kbFilesParse {
		response.Data[i] = convertKBFileWithKBs(file)
	}

	return response, nil
}

func (server *Server) GetKBWithKBFilesByKBID(ctx context.Context, req *pb.GetKBWithKBFilesByKBIDRequest) (*pb.GetKBWithKBFilesByKBIDResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbWithKBFiles, err := server.store.GetKBWithKBFilesByKBID(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB with KB files")
	}

	accessible, err := server.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: uuid.MustParse(req.KbId),
		UserID:          user.ID,
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if KB is accessible")
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限访问此知识库")
	}

	exists, err := server.fileService.IsObjectExists(ctx, &file_service.IsObjectExistsRequest{
		BucketName: user.Username,
		ObjectName: kbWithKBFiles.Name + "/",
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to check if object exists")
	}

	if !exists.Exists {
		_, err = server.NewFolderInBucket(ctx, &pb.NewFolderInBucketRequest{
			FolderName: kbWithKBFiles.Name,
		})

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to create folder in bucket")
		}
	}

	kbWithKBFilesParse, err := db.ParseKBWithKBFiles(&kbWithKBFiles)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to parse KB with KB files")
	}

	response := &pb.GetKBWithKBFilesByKBIDResponse{
		Data: convertKBWithKBFiles(&kbWithKBFilesParse),
	}

	return response, nil
}

func convertKBFileWithKBMapping(data *db.KBFileWithKBMapping) *pb.KBFileWithKBMapping {

	parsePercentage := float32(data.ParsePercentage)

	return &pb.KBFileWithKBMapping{
		Id:              data.ID.String(),
		Name:            data.Name,
		Path:            data.Path,
		Folder:          data.Folder,
		OwnerId:         data.OwnerID.String(),
		ParseStatus:     data.ParseStatus,
		ParsePercentage: &parsePercentage,
		IsParseFinished: &data.IsParseFinished,
		IsParseFailed:   &data.IsParseFailed,
		BuildStatus:     data.BuildStatus,
		BuildPercentage: &data.BuildPercentage,
		IsBuildFinished: &data.IsBuildFinished,
		IsBuildFailed:   &data.IsBuildFailed,
		Size:            &data.Size,
		CreatedAt:       timestamppb.New(data.CreatedAt),
		UpdatedAt:       timestamppb.New(data.UpdatedAt),
	}
}

func convertKBWithKBFiles(data *db.KBWithKBFiles) *pb.KBWithKBFiles {
	kbFiles := make([]*pb.KBFileWithKBMapping, len(data.KbFiles))
	for i, kbFile := range data.KbFiles {
		kbFiles[i] = convertKBFileWithKBMapping(&kbFile)
	}

	return &pb.KBWithKBFiles{
		Id:          data.ID.String(),
		Name:        data.Name,
		OwnerId:     data.OwnerID.String(),
		CreatedAt:   timestamppb.New(data.CreatedAt),
		UpdatedAt:   timestamppb.New(data.UpdatedAt),
		KbFiles:     kbFiles,
		KbFileCount: &data.KbFileCount,
	}
}

func convertKBFileWithKBs(file db.KBFileWithKBs) *pb.KBFileWithKBs {
	Kbs := make([]*pb.KBBrief, len(file.Kbs))
	for i, kb := range file.Kbs {
		Kbs[i] = &pb.KBBrief{
			Id:   kb.ID.String(),
			Name: kb.Name,
		}
	}
	parsePercentage := float32(file.ParsePercentage)
	return &pb.KBFileWithKBs{
		Id:              file.ID.String(),
		Name:            file.Name,
		Path:            file.Path,
		Folder:          file.Folder,
		OwnerId:         file.OwnerID.String(),
		ParseStatus:     file.ParseStatus,
		ParsePercentage: &parsePercentage,
		IsParseFinished: &file.IsParseFinished,
		IsParseFailed:   &file.IsParseFailed,
		Size:            &file.Size,
		CreatedAt:       timestamppb.New(file.CreatedAt),
		UpdatedAt:       timestamppb.New(file.UpdatedAt),
		Kbs:             Kbs,
	}
}

func (server *Server) AddFileToKB(ctx context.Context, req *pb.AddFileToKBRequest) (*pb.AddFileToKBResponse, error) {
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

	err = server.store.AddFileToKB(ctx, db.AddFileToKBParams{
		KbFileID: uuid.MustParse(req.KbFileId),
		KbID:     uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to add file to knowledge base")
	}

	return &pb.AddFileToKBResponse{
		Message: "file added to knowledge base",
	}, nil
}

func convertFileFigureToKBFigures(fileFigures *[]db.FileFigure) []rag_client.KBFigure {
	if fileFigures == nil {
		return nil
	}
	kbFigures := make([]rag_client.KBFigure, len(*fileFigures))
	for i, fileFigure := range *fileFigures {
		kbFigures[i] = rag_client.KBFigure{
			ImgID:    fileFigure.ID.String(),
			Caption:  fileFigure.Caption,
			KbFileID: fileFigure.KbFileID.String(),
		}
	}
	return kbFigures
}

func convertFileTableToKBTable(fileTables *[]db.FileTable) []rag_client.KBTable {
	if fileTables == nil {
		return nil
	}
	kbTables := make([]rag_client.KBTable, len(*fileTables))
	for i, fileTable := range *fileTables {
		kbTables[i] = rag_client.KBTable{
			TableID:   fileTable.ID.String(),
			TableHTML: fileTable.TableHtml,
			Caption:   fileTable.Caption,
			KbFileID:  fileTable.KbFileID.String(),
		}
	}
	return kbTables
}

func (server *Server) UnlinkKBDocument(ctx context.Context, req *pb.UnlinkKBDocumentRequest) (*pb.UnlinkKBDocumentResponse, error) {
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

	kbfilemapping, err := server.store.GetKBFileMapping(ctx, db.GetKBFileMappingParams{
		KbFileID: uuid.MustParse(req.KbFileId),
		KbID:     uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get KB file mapping")
	}

	if kbfilemapping.BuildPercentage >= 100 {

		kbconfig, err := server.store.GetRagConfigByKBID(ctx, uuid.MustParse(req.KbId))

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to get KB config")
		}

		_, err = server.ragClient.UnlinkKBDocument(ctx, &rag_client.UnlinkKBDocumentRequest{
			UserID:       user.ID.String(),
			KbFileID:     req.KbFileId,
			KbID:         req.KbId,
			EmbedModel:   kbconfig.EmbedModel,
			DecodeAPIKey: false,
		})

		if err != nil {
			return nil, status.Error(codes.Internal, "failed to unlink KB document")
		}

	}

	err = server.store.RemoveFileFromKB(ctx, db.RemoveFileFromKBParams{
		KbFileID: uuid.MustParse(req.KbFileId),
		KbID:     uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to delete KB file mapping")
	}

	return &pb.UnlinkKBDocumentResponse{
		Message: "KB document unlinked",
	}, nil
}
