import {
  CompleteUploadRequest,
  CompleteUploadResponse,
  DeleteFilesResponse,
  DeleteFilesRequest,
  UploadChunkRequest,
  UploadChunkResponse,
  CreateFolderResponse,
  CreateFolderRequest,
  GetFileBytesResponse,
  GetFileBytesRequest,
} from "@/interfaces/file";

import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  GetKBFilesByFolderRequest,
  GetKBFilesByFolderResponse,
} from "@/interfaces/kb";

export async function getKBFilesByFolder(req: GetKBFilesByFolderRequest) {
  return await makeRequest<typeof req, GetKBFilesByFolderResponse>(
    api.kb_files.get_kbFiles_by_folder,
    req
  );
}

export function useCurrentFolderData(folder: string) {
  const queryClient = useQueryClient();
  const [currentFolder, setCurrentFolder] = useState(folder);
  const { data, isPending, refetch } = useQuery({
    queryKey: ["getKBFilesByFolder", currentFolder],
    queryFn: () => getKBFilesByFolder({ folder: currentFolder }),
  });

  const invalidateListUserFiles = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["getKBFilesByFolder", currentFolder],
    });
  };

  useEffect(() => {
    invalidateListUserFiles();
  }, [currentFolder]);

  return {
    data: data?.data?.data,
    isPending,
    refetch,
    currentFolder,
    setCurrentFolder,
    invalidateListUserFiles,
  };
}

export const getFileContent = async (req: GetFileBytesRequest) => {
  try {
    const data = await makeRequest<typeof req, GetFileBytesResponse>(
      api.file.get_file_bytes,
      req
    );
    if (data?.code !== 200) {
      toast.error(data?.message || "文件打开失败");
      return;
    }
    if (data?.data?.content) {
      // Decode base64 string to binary data
      const binaryContent = atob(data.data.content);
      // Convert binary string to Uint8Array
      const bytes = new Uint8Array(binaryContent.length);
      for (let i = 0; i < binaryContent.length; i++) {
        bytes[i] = binaryContent.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.data.content_type });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  } catch (error) {
    toast.error("文件打开失败");
    console.error("Failed to get file bytes:", error);
  }
};

export const uploadChunk = async (req: UploadChunkRequest) => {
  return await makeRequest<typeof req, UploadChunkResponse>(
    api.file.upload_chunk,
    req
  );
};

export const completeUpload = async (req: CompleteUploadRequest) => {
  return await makeRequest<typeof req, CompleteUploadResponse>(
    api.file.complete_upload,
    req
  );
};

export const deleteFiles = async (req: DeleteFilesRequest) => {
  return await makeRequest<typeof req, DeleteFilesResponse>(
    api.file.delete_files,
    req
  );
};

export const createFolder = async (req: CreateFolderRequest) => {
  return await makeRequest<typeof req, CreateFolderResponse>(
    api.file.create_folder,
    req
  );
};

export function useUploadChunk() {
  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["uploadChunk"],
    mutationFn: (req: UploadChunkRequest) => uploadChunk(req),
  });
  return { data, isPending, mutateAsync };
}

export function useCompleteUpload() {
  const { data, isPending, mutateAsync } = useMutation({
    mutationKey: ["completeUpload"],
    mutationFn: (req: CompleteUploadRequest) => completeUpload(req),
  });
  return { data, isPending, mutateAsync };
}

export function useCreateFolder() {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["createFolder"],
    mutationFn: (req: CreateFolderRequest) => createFolder(req),
  });
  return { mutateAsync, isPending };
}

export async function useUploadFileByChunks(
  file: File,
  currentFolder: string,
  onProgress?: (progress: number) => void,
  onCancel?: (cancel: () => void) => void,
  onEachFileUploaded?: (file_name: string, file_size: number) => Promise<void>
) {
  const chunkSize = 5 * 1024 * 1024; // 5MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadedChunkNames: string[] = [];
  const upload_path =
    currentFolder === "" ? file.name : currentFolder + "/" + file.name;
  let isCancelled = false;
  let can_cleanup = true;

  // Create cancel function
  const cancelUpload = async () => {
    isCancelled = true;
    // Delete all uploaded chunks
    if (uploadedChunkNames.length > 0) {
      try {
        while (!can_cleanup) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        deleteFiles({ file_names: uploadedChunkNames });
      } catch (error) {
        console.error("Failed to clean up chunks:", error);
      }
    }
  };

  // Provide cancel function to caller
  onCancel?.(cancelUpload);

  try {
    for (let i = 0; i < totalChunks && !isCancelled; i++) {
      can_cleanup = false;

      const chunkData = file.slice(i * chunkSize, (i + 1) * chunkSize);
      const chunkIndex = i;

      // Convert chunk to base64
      const chunkDataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isCancelled) {
            reject(new Error("Upload cancelled during base64 conversion"));
            return;
          }
          const base64String = reader.result as string;
          resolve(base64String.split(",")[1]);
        };
        reader.onerror = () =>
          reject(new Error("Failed to convert chunk to base64"));
        reader.readAsDataURL(chunkData);
      });

      if (isCancelled) {
        throw new Error("Upload cancelled before chunk upload");
      }

      // Upload chunk
      const chunkRequest: UploadChunkRequest = {
        file_name: upload_path,
        chunk_index: chunkIndex,
        chunk_data: chunkDataBase64,
      };

      const responseChunk = await uploadChunk(chunkRequest);
      can_cleanup = true;
      console.log(`Chunk ${i + 1} response:`, responseChunk);

      if (responseChunk.code !== 200) {
        throw new Error(`Failed to upload chunk ${chunkIndex}`);
      }
      const chunkName = responseChunk.data?.chunk_name;
      if (chunkName) {
        uploadedChunkNames.push(chunkName);
      }

      if (!isCancelled) {
        onProgress?.((i + 1) / totalChunks);
      }
    }

    if (isCancelled) {
      throw new Error("Upload cancelled before completion");
    }

    console.log(
      `Upload completed for ${file.name}. Total chunks:`,
      uploadedChunkNames
    );

    // Complete upload
    const completeUploadRequest: CompleteUploadRequest = {
      file_name: upload_path,
      total_chunks: totalChunks,
    };
    const response = await completeUpload(completeUploadRequest);
    onEachFileUploaded?.(file.name, file.size);
    if (response.code !== 200) {
      throw new Error("Failed to complete upload");
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("cancelled")) {
        console.log(
          `Upload cancelled for ${file.name}. Chunks to clean:`,
          uploadedChunkNames
        );
      } else {
        console.error(`Upload failed for ${file.name}. Error:`, error);
      }
    }

    // Clean up chunks if upload failed (not cancelled)
    if (!isCancelled && uploadedChunkNames.length > 0) {
      try {
        await deleteFiles({ file_names: uploadedChunkNames });
        console.log(
          `Cleaned up ${uploadedChunkNames.length} chunks after failure:`,
          uploadedChunkNames
        );
      } catch (cleanupError) {
        console.error("Failed to clean up chunks after failure:", cleanupError);
      }
    }
    throw error;
  }
}
