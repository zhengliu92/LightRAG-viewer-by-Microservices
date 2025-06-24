package gapi

import (
	"context"
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	pb "gateway_service/pb"
	"gateway_service/rag_client"
	"gateway_service/util"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetFileAssetsByKBFileID(ctx context.Context, req *pb.GetFileAssetsByKBFileIDRequest) (*pb.GetFileAssetsByKBFileIDResponse, error) {
	_, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbFile, err := s.store.GetKBFile(ctx, uuid.MustParse(req.KbFileId))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get kb file: %v", err)
	}

	if !kbFile.IsAssetsUpdated {
		return nil, status.Errorf(codes.FailedPrecondition, "kb file is not updated")
	}

	// create a error group for concurrent operations
	eg, ctx := errgroup.WithContext(ctx)
	var texts []db.FileText
	var figures []db.FileFigure
	var tables []db.FileTable

	eg.Go(func() error {
		var err error
		texts, err = s.store.GetFileTextsByKBFileID(ctx, uuid.MustParse(req.KbFileId))
		return err
	})
	eg.Go(func() error {
		var err error
		figures, err = s.store.GetFileFiguresByKBFileID(ctx, uuid.MustParse(req.KbFileId))
		return err
	})
	eg.Go(func() error {
		var err error
		tables, err = s.store.GetFileTablesByKBFileID(ctx, uuid.MustParse(req.KbFileId))
		return err
	})

	if err := eg.Wait(); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get file assets by kb file id: %v", err)
	}

	pbFigures, err := s.convertDbFileFigureToPbFileFigure(&figures)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert db file figure to pb file figure: %v", err)
	}

	return &pb.GetFileAssetsByKBFileIDResponse{
		FileTexts:   convertDbFileTextToPbFileText(&texts),
		FileFigures: pbFigures,
		FileTables:  convertDbFileTableToPbFileTable(&tables),
	}, nil
}

func convertDbFileTextToPbFileText(text *[]db.FileText) []*pb.FileText {
	if len(*text) == 0 {
		return nil
	}
	pbTexts := make([]*pb.FileText, len(*text))
	for i, t := range *text {
		pbTexts[i] = &pb.FileText{
			Id:         t.ID.String(),
			OwnerId:    t.OwnerID.String(),
			KbFileId:   t.KbFileID.String(),
			Section:    t.Section,
			PageNumber: &t.PageNumber,
			Text:       t.Text,
		}
	}
	return pbTexts
}

func (s *Server) convertDbFileFigureToPbFileFigure(figures *[]db.FileFigure) ([]*pb.FileFigure, error) {
	if len(*figures) == 0 {
		return nil, nil
	}
	ctx := context.Background()

	pbFigures := make([]*pb.FileFigure, len(*figures))
	for i, f := range *figures {
		owner, err := s.GetUserById(ctx, f.OwnerID)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get user by id: %v", err)
		}
		response, err := s.fileService.GetFileBytes(context.Background(), &file_service.GetFileBytesRequest{
			BucketName: owner.Username,
			FileName:   f.ImgPath,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get file bytes: %v", err)
		}
		pbFigures[i] = &pb.FileFigure{
			Id:         f.ID.String(),
			OwnerId:    f.OwnerID.String(),
			KbFileId:   f.KbFileID.String(),
			Section:    f.Section,
			PageNumber: &f.PageNumber,
			ImgBytes:   response.Content,
			Caption:    f.Caption,
		}
	}
	return pbFigures, nil
}

func convertDbFileTableToPbFileTable(table *[]db.FileTable) []*pb.FileTable {
	if len(*table) == 0 {
		return nil
	}
	pbTables := make([]*pb.FileTable, len(*table))
	for i, t := range *table {
		pbTables[i] = &pb.FileTable{
			Id:         t.ID.String(),
			OwnerId:    t.OwnerID.String(),
			KbFileId:   t.KbFileID.String(),
			Section:    t.Section,
			PageNumber: &t.PageNumber,
			TableHtml:  t.TableHtml,
			Caption:    t.Caption,
		}
	}
	return pbTables
}

func (s *Server) GetFigureByID(ctx context.Context, req *pb.GetFigureByIDRequest) (*pb.GetFigureByIDResponse, error) {
	_, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	figure, err := s.store.GetFileFigureByID(ctx, uuid.MustParse(req.Id))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get figure by id: %v", err)
	}

	owner, err := s.GetUserById(ctx, figure.OwnerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user by id: %v", err)
	}

	response, err := s.fileService.GetFileBytes(ctx, &file_service.GetFileBytesRequest{
		BucketName: owner.Username,
		FileName:   figure.ImgPath,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get file bytes: %v", err)
	}

	return &pb.GetFigureByIDResponse{Figure: response.Content}, nil
}

func (s *Server) QueryKBFigures(ctx context.Context, req *pb.QueryKBFiguresRequest) (*pb.QueryKBFiguresResponse, error) {
	user, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	accessible, err := s.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		UserID:          user.ID,
		KnowledgeBaseID: uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check if kb is accessible by user: %v", err)
	}
	if !accessible {
		return nil, status.Errorf(codes.PermissionDenied, "user does not have permission to access this kb")
	}

	cache_key := fmt.Sprintf("query:kb_figures:%s:%s", req.KbId, req.MessageId)
	if cached_data, err := s.redisClient.Get(ctx, cache_key).Result(); err == nil {
		var pbFigures []*pb.FileFigure
		err := json.Unmarshal([]byte(cached_data), &pbFigures)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to unmarshal cached data: %v", err)
		}
		return &pb.QueryKBFiguresResponse{Figures: pbFigures}, nil
	}

	kb, err := s.store.GetKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get kb by id: %v", err)
	}

	kb_config, err := s.store.GetRagConfigByKBID(ctx, kb.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get kb config by kb id: %v", err)
	}

	resp, err := s.ragClient.QueryKBFigures(ctx, &rag_client.QueryKBFiguresRequest{
		KbID:        kb.ID.String(),
		Query:       req.Query,
		APIKey:      req.ApiKey,
		ProjectID:   *req.ProjectApiKey,
		APIProvider: req.ApiProvider,
		EmbedModel:  kb_config.EmbedModel,
		Temperature: req.Temperature,
		Threshold:   req.Threshold,
		TopN:        req.TopN,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to query kb figures: %v", err)
	}

	dbFigures := make([]db.FileFigure, len(resp.Figures))
	for i, f := range resp.Figures {
		figure, err := s.store.GetFileFigureByID(ctx, uuid.MustParse(f.ID))
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get file figure by id: %v", err)
		}
		dbFigures[i] = figure
	}

	pbFigures, err := s.convertDbFileFigureToPbFileFigure(&dbFigures)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert db file figure to pb file figure: %v", err)
	}
	if len(pbFigures) > 0 {
		figuresJSON, err := json.Marshal(pbFigures)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal figures: %v", err)
		}
		s.redisClient.Set(ctx, cache_key, figuresJSON, time.Hour)
	}

	return &pb.QueryKBFiguresResponse{Figures: pbFigures}, nil
}

func (s *Server) QueryKBTables(ctx context.Context, req *pb.QueryKBTablesRequest) (*pb.QueryKBTablesResponse, error) {
	user, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	accessible, err := s.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		UserID:          user.ID,
		KnowledgeBaseID: uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check if kb is accessible by user: %v", err)
	}
	if !accessible {
		return nil, status.Errorf(codes.PermissionDenied, "user does not have permission to access this kb")
	}

	cache_key := fmt.Sprintf("query:kb_tables:%s:%s", req.KbId, req.MessageId)
	if cached_data, err := s.redisClient.Get(ctx, cache_key).Result(); err == nil {
		var pbTables []*pb.KBTable
		err := json.Unmarshal([]byte(cached_data), &pbTables)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to unmarshal cached data: %v", err)
		}
		return &pb.QueryKBTablesResponse{Tables: pbTables}, nil
	}

	kb, err := s.store.GetKB(ctx, uuid.MustParse(req.KbId))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get kb by id: %v", err)
	}

	kb_config, err := s.store.GetRagConfigByKBID(ctx, kb.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get kb config by kb id: %v", err)
	}

	resp, err := s.ragClient.QueryKBTables(ctx, &rag_client.QueryKBTablesRequest{
		KbID:        kb.ID.String(),
		Query:       req.Query,
		APIKey:      req.ApiKey,
		ProjectID:   *req.ProjectApiKey,
		APIProvider: req.ApiProvider,
		EmbedModel:  kb_config.EmbedModel,
		Temperature: req.Temperature,
		Threshold:   req.Threshold,
		TopN:        req.TopN,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to query kb tables: %v", err)
	}

	pbTables := make([]*pb.KBTable, len(resp.Tables))
	for i, t := range resp.Tables {
		pbTables[i] = &pb.KBTable{
			Id:        t.ID,
			Content:   t.Content,
			Score:     t.Score,
			TableHtml: t.TableHTML,
		}
	}
	// save cache
	if len(pbTables) > 0 {
		cache_data, err := json.Marshal(pbTables)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to marshal tables: %v", err)
		}
		s.redisClient.Set(ctx, cache_key, cache_data, time.Hour)
	}

	return &pb.QueryKBTablesResponse{Tables: pbTables}, nil

}

func (s *Server) QueryKBContext(ctx context.Context, req *pb.QueryKBContextRequest) (*pb.QueryKBContextResponse, error) {
	user, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	accessible, err := s.store.IsKbAccessibleByUserID(ctx, db.IsKbAccessibleByUserIDParams{
		UserID:          user.ID,
		KnowledgeBaseID: uuid.MustParse(req.KbId),
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check if kb is accessible by user: %v", err)
	}

	if !accessible {
		return nil, status.Error(codes.PermissionDenied, "您没有权限操作此知识库")
	}

	resp, err := s.ragClient.QueryKBContext(ctx, &rag_client.QueryKBContextRequest{
		KbID:  req.KbId,
		Query: req.Query,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to query kb context: %v", err)
	}

	return &pb.QueryKBContextResponse{
		EntitiesContext:  resp.EntitiesContext,
		RelationsContext: resp.RelationsContext,
		TextUnitsContext: resp.TextUnitsContext,
	}, nil
}
