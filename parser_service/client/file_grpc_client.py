from pathlib import Path
import grpc
from typing import List, Tuple
from .file_grpc.file_service_py_pb2 import (
    GetFilesUrlRequest,
    Base64UploadFilesRequest,
    UploadChunkRequest,
    CompleteUploadRequest,
    GetFileBytesRequest,
    DeleteFilesRequest,
    CreateBucketRequest,
    ListBucketFilesRequest,
    DeleteBucketRequest,
    File,
    SaveStringToFileRequest,
    GetFileTextRequest,
    NewFolderInBucketRequest,
    NewFolderInBucketResponse,
)
from .file_grpc.file_service_py_pb2_grpc import FileServiceStub
import os

FILE_SERVICE_HOST = os.getenv("FILE_SERVICE_HOST", "192.168.1.100")
FILE_SERVICE_PORT = os.getenv("FILE_SERVICE_PORT", 50051)


class FileServiceClient:
    def __init__(self, host: str = FILE_SERVICE_HOST, port: int = FILE_SERVICE_PORT):
        """Initialize the FileService client.

        Args:
            host: The server hostname
            port: The server port
        """
        try:
            options = [
                ("grpc.max_receive_message_length", 25 * 1024 * 1024),
                ("grpc.max_send_message_length", 25 * 1024 * 1024),
            ]
            self.channel = grpc.insecure_channel(f"{host}:{port}", options=options)
            # Test the connection by creating a stub
            self.stub = FileServiceStub(self.channel)
            # Optional: Add a timeout for the connection
            grpc.channel_ready_future(self.channel).result(timeout=3)
        except grpc.FutureTimeoutError:
            raise ConnectionError(f"Could not connect to gRPC server at {host}:{port}")
        except Exception as e:
            raise ConnectionError(f"Failed to initialize gRPC client: {str(e)}")

    def get_files_url(
        self, bucket_name: str, files: List[str]
    ) -> Tuple[str, List[str]]:
        """Get URLs for files in a bucket."""
        request = GetFilesUrlRequest(bucket_name=bucket_name, file_names=files)
        response = self.stub.GetFilesUrl(request)
        return response.message, response.urls

    def new_folder_in_bucket(
        self,
        bucket_name: str,
        folder_name: str,
    ) -> NewFolderInBucketResponse:
        request = NewFolderInBucketRequest(
            bucket_name=bucket_name, folder_name=folder_name
        )
        response = self.stub.NewFolderInBucket(request)
        return response

    def saveStringToFile(self, bucket_name: str, file_name: str, content: str) -> str:
        """Save a string to a file in a bucket.

        Args:
            bucket_name: Name of the bucket
            file_name: Name of the file to create
            content: String content to save to the file

        Returns:
            str: Response message from the server
        """
        request = SaveStringToFileRequest(
            bucket_name=bucket_name, file_name=file_name, content=content
        )
        response = self.stub.SaveStringToFile(request)
        return response.message

    def base64_upload_files(
        self,
        bucket_name: str,
        folder_name: str,
    ) -> List[str]:
        """Upload files using base64 encoding.

        Args:
            bucket_name: Name of the bucket
            files: List of tuples containing (filename, file_content_bytes)
        """
        assets_dir = Path(folder_name) / "assets"
        fs_client.new_folder_in_bucket(bucket_name, str(assets_dir))

        def _upload(files: List[str]):
            file_contents = []
            file_names = []
            file_names_map = {}
            for file in files:
                if not os.path.exists(file):
                    continue
                with open(file, "rb") as f:
                    file_contents.append(f.read())
                    file_name = Path(folder_name, "assets", os.path.basename(file))
                    file_names.append(str(file_name))
                    file_names_map[file] = str(file_name)

            pb_files = [
                File(name=name, content=content)
                for name, content in zip(file_names, file_contents)
            ]
            try:
                request = Base64UploadFilesRequest(
                    bucket_name=bucket_name, files=pb_files
                )
                self.stub.Base64UploadFiles(request)
            except Exception as e:
                raise e

            return file_names_map

        return _upload

    def upload_chunk(
        self, bucket_name: str, file_name: str, chunk_index: int, chunk_data: bytes
    ) -> Tuple[str, bool]:
        """Upload a single chunk of a file."""
        request = UploadChunkRequest(
            bucket_name=bucket_name,
            file_name=file_name,
            chunk_index=chunk_index,
            chunk_data=chunk_data,
        )
        response = self.stub.UploadChunk(request)
        return response.message, response.success

    def complete_upload(
        self, bucket_name: str, file_name: str, total_chunks: int
    ) -> Tuple[str, bool]:
        """Complete a chunked file upload."""
        request = CompleteUploadRequest(
            bucket_name=bucket_name, file_name=file_name, total_chunks=total_chunks
        )
        response = self.stub.CompleteUpload(request)
        return response.message, response.success

    def get_file_text(self, bucket_name: str, file_name: str) -> str:
        request = GetFileTextRequest(bucket_name=bucket_name, file_name=file_name)
        response = self.stub.GetFileText(request)
        return response.content

    def get_file_bytes(
        self, bucket_name: str, file_name: str
    ) -> Tuple[str, str, bytes]:
        """Get file content as bytes."""
        request = GetFileBytesRequest(bucket_name=bucket_name, file_name=file_name)
        response = self.stub.GetFileBytes(request)
        return response

    def delete_files(self, bucket_name: str, files: List[str]) -> str:
        """Delete files from a bucket."""
        request = DeleteFilesRequest(bucket_name=bucket_name, files=files)
        response = self.stub.DeleteFiles(request)
        return response.message

    def create_bucket(self, bucket_name: str) -> str:
        """Create a new bucket."""
        request = CreateBucketRequest(bucket_name=bucket_name)
        response = self.stub.CreateBucket(request)
        return response.message

    def list_bucket_files(self, bucket_name: str) -> Tuple[str, List[str]]:
        """List all files in a bucket."""
        request = ListBucketFilesRequest(bucket_name=bucket_name)
        response = self.stub.ListBucketFiles(request)
        return response.message, response.files

    def delete_bucket(self, bucket_name: str) -> str:
        """Delete a bucket."""
        request = DeleteBucketRequest(bucket_name=bucket_name)
        response = self.stub.DeleteBucket(request)
        return response.message

    def close(self):
        """Close the gRPC channel."""
        self.channel.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


fs_client = FileServiceClient()
