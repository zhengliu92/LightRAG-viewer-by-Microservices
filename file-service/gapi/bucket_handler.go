package gapi

import (
	"context"
	"fmt"
	"time"

	pb "github.com/zhengliu92/minio-file-server/file_service"
)

func (s *Server) BucketExists(ctx context.Context, req *pb.BucketExistsRequest) (*pb.BucketExistsResponse, error) {
	exists, err := s.minioCrud.BucketExists(req.BucketName)
	if err != nil {
		return nil, err
	}
	return &pb.BucketExistsResponse{
		Exists:  exists,
		Message: "Bucket exists",
	}, nil
}

func (s *Server) NewFolderInBucket(ctx context.Context, req *pb.NewFolderInBucketRequest) (*pb.NewFolderInBucketResponse, error) {
	err := s.minioCrud.NewFolderInBucket(req.BucketName, req.FolderName)
	if err != nil {
		return nil, err
	}
	return &pb.NewFolderInBucketResponse{
		Message: "Folder created successfully",
	}, nil
}

func (s *Server) CreateBucket(ctx context.Context, req *pb.CreateBucketRequest) (*pb.CreateBucketResponse, error) {
	// Ensure bucket_name is provided
	if req.BucketName == "" {
		return nil, fmt.Errorf("Bucket name is required")
	}

	err := s.minioCrud.CreateBucketIfNotExists(req.BucketName)
	if err != nil {
		return nil, err
	}

	return &pb.CreateBucketResponse{
		Message: "Bucket created successfully",
	}, nil
}

func (s *Server) DeleteBucket(ctx context.Context, req *pb.DeleteBucketRequest) (*pb.DeleteBucketResponse, error) {
	// Ensure bucket_name is provided
	if req.BucketName == "" {
		return nil, fmt.Errorf("Bucket name is required")
	}

	err := s.minioCrud.ClearAndDeleteBucket(req.BucketName)
	if err != nil {
		return nil, err
	}

	return &pb.DeleteBucketResponse{
		Message: "Bucket deleted successfully",
	}, nil
}

func (s *Server) ListBucketFiles(ctx context.Context, req *pb.ListBucketFilesRequest) (*pb.ListBucketFilesResponse, error) {
	// Ensure bucket_name is provided
	if req.BucketName == "" {
		return nil, fmt.Errorf("Bucket name is required")
	}

	files, err := s.minioCrud.ListObjects(req.BucketName, req.FolderName, req.OmitRegexes)
	if err != nil {
		return nil, err
	}
	filesInfo := make([]*pb.ObjectInfo, len(files))
	for i, file := range files {
		filesInfo[i] = &pb.ObjectInfo{
			Name:         file.Name,
			Size:         &file.Size,
			LastModified: file.LastModified.Format(time.RFC3339),
		}
	}

	return &pb.ListBucketFilesResponse{
		Files:      filesInfo,
		FolderName: req.FolderName,
	}, nil

}
