package gapi

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	pb "gateway_service/pb"
	"gateway_service/util"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) DeleteFiles(ctx context.Context, req *pb.DeleteFilesRequest) (*pb.DeleteFilesResponse, error) {
	authPayload, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	bucketName := authPayload.Username
	_, err = s.fileService.DeleteFiles(ctx, &file_service.DeleteFilesRequest{BucketName: bucketName, FileNames: req.FileNames})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete files: %v", err)
	}
	return &pb.DeleteFilesResponse{Message: "success"}, nil
}

func (s *Server) Base64UploadFiles(ctx context.Context, req *pb.Base64UploadFilesRequest) (*pb.Base64UploadFilesResponse, error) {
	authPayload, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	bucketName := authPayload.Username

	files := make([]*file_service.File, len(req.Files))
	for i, file := range req.Files {
		files[i] = &file_service.File{
			Name:    file.Name,
			Content: file.Content,
		}
	}

	resp, err := s.fileService.Base64UploadFiles(ctx, &file_service.Base64UploadFilesRequest{
		BucketName: bucketName,
		Files:      files,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to upload files: %v", err)
	}

	return &pb.Base64UploadFilesResponse{Message: resp.Message}, nil

}

func (s *Server) GetFileBytes(ctx context.Context, req *pb.GetFileBytesRequest) (*pb.GetFileBytesResponse, error) {
	_, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	kbfile, err := s.store.GetKBFile(ctx, uuid.MustParse(req.FileId))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get KB file: %v", err)
	}

	owner, err := s.GetUserById(ctx, kbfile.OwnerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get owner: %v", err)
	}

	resp, err := s.fileService.GetFileBytes(ctx, &file_service.GetFileBytesRequest{
		BucketName: owner.Username,
		FileName:   kbfile.Path,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get file bytes: %v", err)
	}
	return &pb.GetFileBytesResponse{FileName: resp.FileName, ContentType: resp.ContentType, Content: resp.Content}, nil
}

func (s *Server) ListBucketFiles(ctx context.Context, req *pb.ListBucketFilesRequest) (*pb.ListBucketFilesResponse, error) {
	authPayload, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	bucketName := authPayload.Username

	resp, err := s.fileService.ListBucketFiles(ctx, &file_service.ListBucketFilesRequest{
		BucketName:  bucketName,
		FolderName:  req.FolderName,
		OmitRegexes: []string{".*\\.part\\d+$"},
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list bucket files: %v", err)
	}
	files := make([]*pb.ObjectInfo, len(resp.Files))
	for i, file := range resp.Files {
		files[i] = &pb.ObjectInfo{Name: file.Name, Size: file.Size, LastModified: file.LastModified}
	}
	return &pb.ListBucketFilesResponse{Message: resp.Message, Files: files, FolderName: resp.FolderName}, nil
}

func (s *Server) NewFolderInBucket(ctx context.Context, req *pb.NewFolderInBucketRequest) (*pb.NewFolderInBucketResponse, error) {
	user, err := s.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	pathName := req.FolderName + "/"
	name := req.FolderName[strings.LastIndex(req.FolderName, "/")+1:] + "/"
	folderName := ""
	if strings.Contains(req.FolderName, "/") {
		folderName = req.FolderName[:strings.LastIndex(req.FolderName, "/")]
	}
	kbfile, err := s.store.CreateKBFile(ctx, db.CreateKBFileParams{
		OwnerID: user.ID,
		Name:    name,
		Path:    pathName,
		Folder:  folderName,
		Size:    0,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create KB file: %v", err)
	}

	bucketName := user.Username

	resp, err := s.fileService.NewFolderInBucket(ctx, &file_service.NewFolderInBucketRequest{
		BucketName: bucketName,
		FolderName: req.FolderName,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create folder in bucket: %v", err)
	}
	return &pb.NewFolderInBucketResponse{Message: resp.Message, KbFileId: kbfile.ID.String()}, nil
}

func (s *Server) UploadChunk(ctx context.Context, req *pb.UploadChunkRequest) (*pb.UploadChunkResponse, error) {
	authPayload, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	bucketName := authPayload.Username
	resp, err := s.fileService.UploadChunk(ctx, &file_service.UploadChunkRequest{
		BucketName: bucketName,
		FileName:   req.FileName,
		ChunkIndex: req.ChunkIndex,
		ChunkData:  req.ChunkData,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to upload chunk: %v", err)
	}
	return &pb.UploadChunkResponse{Message: resp.Message, Success: resp.Success, ChunkName: resp.ChunkName}, nil
}

func (s *Server) CompleteUpload(ctx context.Context, req *pb.CompleteUploadRequest) (*pb.CompleteUploadResponse, error) {
	authPayload, err := s.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	bucketName := authPayload.Username

	resp, err := s.fileService.CompleteUpload(ctx, &file_service.CompleteUploadRequest{
		BucketName:  bucketName,
		FileName:    req.FileName,
		TotalChunks: req.TotalChunks,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to complete upload: %v", err)
	}
	return &pb.CompleteUploadResponse{Message: resp.Message}, nil
}
