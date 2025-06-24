package gapi

import (
	"bytes"
	"context"
	"fmt"
	"mime"
	"path/filepath"

	"github.com/minio/minio-go/v7"
	pb "github.com/zhengliu92/minio-file-server/file_service"
	"golang.org/x/sync/errgroup"
)

func (s *Server) GetFileText(ctx context.Context, req *pb.GetFileTextRequest) (*pb.GetFileTextResponse, error) {
	if req.BucketName == "" || req.FileName == "" {
		return nil, fmt.Errorf("bucket name and file name are required")
	}

	// Get file content as bytes
	fileBytes, err := s.minioCrud.GetObjectBytes(req.BucketName, req.FileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get file content: %w", err)
	}

	// Convert bytes to string
	content := string(fileBytes)

	return &pb.GetFileTextResponse{
		Message: "File content retrieved successfully",
		Content: content,
	}, nil

}

func (s *Server) SaveStringToFile(ctx context.Context, req *pb.SaveStringToFileRequest) (*pb.SaveStringToFileResponse, error) {
	// Validate request
	if req.BucketName == "" || req.FileName == "" {
		return nil, fmt.Errorf("bucket name and file name are required")
	}

	// Convert string content to bytes reader
	bytesReader := bytes.NewReader([]byte(req.Content))
	size := int64(len(req.Content))

	// Determine content type based on file extension
	contentType := mime.TypeByExtension(filepath.Ext(req.FileName))
	if contentType == "" {
		contentType = "text/plain" // Default to text/plain for string content
	}

	// Upload to Minio
	_, err := s.minioCrud.Client.PutObject(
		ctx,
		req.BucketName,
		req.FileName,
		bytesReader,
		size,
		minio.PutObjectOptions{
			ContentType: contentType,
		})
	if err != nil {
		return nil, fmt.Errorf("failed to save string to file: %w", err)
	}

	return &pb.SaveStringToFileResponse{
		Message: "String saved to file successfully",
	}, nil
}

// UploadFiles uploads multiple files to a Minio server concurrently.
func (s *Server) Base64UploadFiles(ctx context.Context, req *pb.Base64UploadFilesRequest) (*pb.Base64UploadFilesResponse, error) {
	var g errgroup.Group
	for _, file := range req.Files {
		// Capture file in the loop to avoid race conditions
		g.Go(func() error {
			// Validate file content
			if len(file.Content) == 0 {
				return fmt.Errorf("file %s has no content", file.Name)
			}

			// Prepare file data for upload
			bytesReader := bytes.NewReader(file.Content)
			size := int64(len(file.Content))
			contentType := mime.TypeByExtension(filepath.Ext(file.Name))
			if contentType == "" {
				contentType = "application/octet-stream" // Default to binary stream if MIME type is empty
			}

			// Upload to Minio
			_, err := s.minioCrud.Client.PutObject(
				ctx,
				req.BucketName,
				file.Name,
				bytesReader,
				size,
				minio.PutObjectOptions{
					ContentType: contentType,
				})
			if err != nil {
				return fmt.Errorf("failed to upload file %s: %w", file.Name, err)
			}
			return nil
		})
	}

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &pb.Base64UploadFilesResponse{
		Message: "Files uploaded successfully",
	}, nil
}

func (s *Server) GetFilesUrl(ctx context.Context, req *pb.GetFilesUrlRequest) (*pb.GetFilesUrlResponse, error) {
	var g errgroup.Group
	urls := make([]string, len(req.FileNames))
	for i, file := range req.FileNames {
		// Capture file in the loop to avoid
		g.Go(func() error {
			// Get presigned URL
			url, err := s.minioCrud.GetObjectURL(req.BucketName, file)
			if err != nil {
				return fmt.Errorf("failed to get URL for file %s: %w", file, err)
			}
			urls[i] = url
			return nil
		})
	}

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &pb.GetFilesUrlResponse{
		Message: "Files URL retrieved successfully",
		Urls:    urls,
	}, nil
}

func (s *Server) DeleteFiles(ctx context.Context, req *pb.DeleteFilesRequest) (*pb.DeleteFilesResponse, error) {
	var g errgroup.Group

	for _, file := range req.FileNames {
		// Capture file in the
		g.Go(func() error {
			// Delete file from Minio
			err := s.minioCrud.RemoveObject(req.BucketName, file)
			if err != nil {
				return fmt.Errorf("failed to delete file %s: %w", file, err)
			}
			return nil
		})
	}

	// Wait for all goroutines to complete
	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &pb.DeleteFilesResponse{
		Message: "Files deleted successfully",
	}, nil
}

func (s *Server) GetFileBytes(ctx context.Context, req *pb.GetFileBytesRequest) (*pb.GetFileBytesResponse, error) {
	bytes, err := s.minioCrud.GetObjectBytes(req.BucketName, req.FileName)
	if err != nil {
		return nil, fmt.Errorf("failed to get file bytes: %w", err)
	}
	return &pb.GetFileBytesResponse{
		Content:     bytes,
		FileName:    req.FileName,
		ContentType: mime.TypeByExtension(filepath.Ext(req.FileName)),
	}, nil
}

func (s *Server) UploadChunk(ctx context.Context, req *pb.UploadChunkRequest) (*pb.UploadChunkResponse, error) {
	objectName := fmt.Sprintf("%s.part%d", req.FileName, req.ChunkIndex)

	exists, _ := s.minioCrud.HasFile(req.BucketName, objectName)

	if exists {
		return &pb.UploadChunkResponse{
			Message:   "Chunk already exists",
			Success:   true,
			ChunkName: objectName,
		}, nil
	}

	// 上传分片到 MinIO
	_, err := s.minioCrud.Client.PutObject(ctx, req.BucketName, objectName,
		bytes.NewReader(req.ChunkData), int64(len(req.ChunkData)), minio.PutObjectOptions{})
	if err != nil {
		return &pb.UploadChunkResponse{
			Message:   "Failed to upload chunk",
			Success:   false,
			ChunkName: objectName,
		}, err
	}

	return &pb.UploadChunkResponse{
		Message:   "Chunk uploaded successfully",
		Success:   true,
		ChunkName: objectName,
	}, nil
}

// 合并分片
func (s *Server) CompleteUpload(ctx context.Context, req *pb.CompleteUploadRequest) (*pb.CompleteUploadResponse, error) {
	finalObjectName := req.FileName
	src_opts := []minio.CopySrcOptions{}
	dst_opts := minio.CopyDestOptions{
		Bucket: req.BucketName,
		Object: finalObjectName,
	}

	// 遍历所有分片，加入合并列表
	for i := int64(0); i < req.TotalChunks; i++ {
		partName := fmt.Sprintf("%s.part%d", req.FileName, i)
		src_opts = append(src_opts, minio.CopySrcOptions{
			Bucket: req.BucketName,
			Object: partName,
		})
	}

	if _, err := s.minioCrud.Client.ComposeObject(ctx, dst_opts, src_opts...); err != nil {
		return &pb.CompleteUploadResponse{
			Message: "Failed to complete upload",
			Success: false,
		}, err
	}

	var g errgroup.Group
	concurrentLimit := 5
	ch := make(chan struct{}, concurrentLimit)
	for i := int64(0); i < req.TotalChunks; i++ {
		ch <- struct{}{}
		i := i
		g.Go(func() error {
			defer func() {
				<-ch
			}()
			partName := fmt.Sprintf("%s.part%d", req.FileName, i)
			err := s.minioCrud.RemoveObject(req.BucketName, partName)
			if err != nil {
				return fmt.Errorf("failed to delete part %s: %w", partName, err)
			}
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &pb.CompleteUploadResponse{
		Message: "File upload completed successfully",
		Success: true,
	}, nil
}

func (s *Server) IsObjectExists(ctx context.Context, req *pb.IsObjectExistsRequest) (*pb.IsObjectExistsResponse, error) {
	exists, err := s.minioCrud.HasFile(req.BucketName, req.ObjectName)
	if err != nil {
		if mErr, ok := err.(minio.ErrorResponse); ok && mErr.Code == "NoSuchKey" {
			return &pb.IsObjectExistsResponse{
				Exists: false,
			}, nil
		}
		return nil, fmt.Errorf("failed to check if object exists: %w", err)
	}
	return &pb.IsObjectExistsResponse{
		Exists: exists,
	}, nil
}
