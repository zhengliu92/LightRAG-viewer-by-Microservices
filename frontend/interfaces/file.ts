export interface GetFileBytesRequest {
  file_id: string;
}

export interface GetFileBytesResponse {
  file_name: string;
  content_type: string;
  content: string;
}

export interface GetFileRequest {
  folder_name: string;
}
export interface ObjectInfo {
  name: string;
  size: number;
  last_modified: Date;
}

export interface GetFileResponse {
  message: string;
  files: ObjectInfo[];
  folder_name: string;
}

export interface UploadChunkRequest {
  file_name: string;
  chunk_index: number;
  chunk_data: string;
}

export interface UploadChunkResponse {
  message: string;
  success: boolean;
  chunk_name: string;
}

export interface CompleteUploadRequest {
  file_name: string;
  total_chunks: number;
}

export interface CompleteUploadResponse {
  message: string;
  success: boolean;
}

export interface DeleteFilesRequest {
  file_names: string[];
}

export interface DeleteFilesResponse {
  message: string;
}

export interface CreateFolderRequest {
  folder_name: string;
}

export interface CreateFolderResponse {
  message: string;
}
