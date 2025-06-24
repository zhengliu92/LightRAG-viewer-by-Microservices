package gapi

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"testing"

	pb "github.com/zhengliu92/minio-file-server/file_service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func Test_ChunkUpload(t *testing.T) {

	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewFileServiceClient(conn)

	file, err := os.Open("../test/mov.mp4")
	if err != nil {
		log.Fatalf("Failed to open file: %v", err)
	}
	defer file.Close()
	buffer := make([]byte, 5*1024*1024) // 每个分片 5 MB
	fileName := "mov.mp4"
	chunkIndex := int64(0)

	for {
		n, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			log.Fatalf("Failed to read file: %v", err)
		}
		if n == 0 {
			break
		}
		_, err = client.UploadChunk(context.Background(), &pb.UploadChunkRequest{
			BucketName: "abc",
			FileName:   fileName,
			ChunkIndex: chunkIndex,
			ChunkData:  buffer[:n],
		})
		if err != nil {
			log.Fatalf("Failed to upload chunk: %v", err)
		}
		chunkIndex++
	}
	t.Logf("Total chunks: %d\n", chunkIndex)
}

func Test_Compose(t *testing.T) {

	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewFileServiceClient(conn)

	resp, err := client.CompleteUpload(context.Background(), &pb.CompleteUploadRequest{
		BucketName:  "abc",
		FileName:    "mov.mp4",
		TotalChunks: 78,
	})
	if err != nil {
		log.Fatalf("Failed to complete upload: %v", err)
	}
	fmt.Println(resp)

}
