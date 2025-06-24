import { BaseResponse } from "@/interfaces/base";
import {
  AddFileToKBRequest,
  AddFileToKBResponse,
  CreateKBFileRequest,
  CreateKBFileResponse,
  DeleteKBFilesRequest,
  DeleteKBFilesResponse,
  RemoveFileFromKBResponse,
  RemoveFileFromKBRequest,
  UpdateKBFileResponse,
  UpdateKBFileRequest,
  StartParseKBFileRequest,
  StartParseKBFileRespqonse,
  StartBuildKBFileResponse,
  StartBuildKBFileRequest,
  StopBuildKBFileRequest,
  StopBuildKBFileResponse,
} from "@/interfaces/kb";
import { makeRequest } from "@/services/services";

import { api } from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiKey } from "./use-api";

export const createKbFile = async (req: CreateKBFileRequest) => {
  return await makeRequest<typeof req, CreateKBFileResponse>(
    api.kb_files.create_kb_file,
    req
  );
};

export const StartParseKBFile = async (req: StartParseKBFileRequest) => {
  return await makeRequest<typeof req, StartParseKBFileRespqonse>(
    api.kb_files.start_parse_kb_file,
    req
  );
};

export const useStartParseKBFile = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: AsyncStartParseKBFile } = useMutation({
    mutationFn: StartParseKBFile,
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success("文件解析开始");
      } else {
        toast.error(`无法开始解析: ${data.message}`);
      }
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
      }, 300);
    },
  });
  return { AsyncStartParseKBFile };
};

export const updateKbFile = async (req: UpdateKBFileRequest) => {
  return await makeRequest<typeof req, UpdateKBFileResponse>(
    api.kb_files.update_kb_file,
    req
  );
};

export const startBuildKbFile = async (req: StartBuildKBFileRequest) => {
  if (!req.api_key) {
    toast.error("请先设置API key");
    return;
  }
  return await makeRequest<typeof req, StartBuildKBFileResponse>(
    api.kb_files.start_build_kb_file,
    req
  );
};

export const useStartBuildKbFile = () => {
  const queryClient = useQueryClient();
  const { apiKey, projectApiKey, apiProvider } = useApiKey();
  const { mutateAsync: AsyncStartBuildKbFile } = useMutation({
    mutationFn: (req: StartBuildKBFileRequest) =>
      startBuildKbFile({
        ...req,
        api_key: apiKey || "",
        project_api_key: projectApiKey || "",
        api_provider: apiProvider || "",
      }),
    onSuccess: (data) => {
      if (data?.code === 200) {
        toast.success("开始构建知识库");
      } else {
        toast.error(`无法开始构建: ${data?.message}`);
      }
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
      }, 300);
    },
  });
  return { AsyncStartBuildKbFile };
};

export const stopBuildKbFile = async (req: StopBuildKBFileRequest) => {
  return await makeRequest<typeof req, StopBuildKBFileResponse>(
    api.kb_files.stop_build_kb_file,
    req
  );
};

export const useStopBuildKbFile = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: AsyncStopBuildKbFile } = useMutation({
    mutationFn: stopBuildKbFile,
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success("文件构建停止成功");
      } else {
        toast.error(`无法停止构建`);
      }
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
      }, 300);
    },
  });
  return { AsyncStopBuildKbFile };
};

export const deleteKbFile = async (
  params: DeleteKBFilesRequest
): Promise<BaseResponse<DeleteKBFilesResponse>> => {
  return await makeRequest(api.kb_files.delete_kb_files, params);
};

export const addFileToKbAsync = async (
  params: AddFileToKBRequest
): Promise<BaseResponse<AddFileToKBResponse>> => {
  return await makeRequest(api.kb_files.add_file_to_kb, params);
};

export const removeFileFromKbAsync = async (
  params: RemoveFileFromKBRequest
): Promise<BaseResponse<RemoveFileFromKBResponse>> => {
  return await makeRequest(api.kb_files.remove_file_from_kb, params);
};

export const useRemoveFileFromKb = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: AsyncRemoveFileFromKb } = useMutation({
    mutationFn: removeFileFromKbAsync,
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success("文件从知识库中移除成功");
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
        }, 300);
        queryClient.invalidateQueries({ queryKey: ["userKbs"] });
        queryClient.invalidateQueries({ queryKey: ["kbGraphs"] });
      } else {
        toast.error(data.message);
      }
    },
  });

  return {
    AsyncRemoveFileFromKb,
  };
};

export const linkKbFileWithKB = async (
  kb_file_id: string,
  kb_ids_org: string[],
  kb_ids_new: string[]
) => {
  const toAdd = kb_ids_new
    .filter((kb_id) => !kb_ids_org.includes(kb_id))
    .map((kb_id) => ({
      kb_file_id,
      kb_id,
      action: "add" as const,
    }));

  const toRemove = kb_ids_org
    .filter((kb_id) => !kb_ids_new.includes(kb_id))
    .map((kb_id) => ({
      kb_file_id,
      kb_id,
      action: "remove" as const,
    }));

  const actions = [...toAdd, ...toRemove];

  try {
    const resp = await Promise.all(
      actions.map(async (action) => {
        if (action.action === "add") {
          return addFileToKbAsync({
            kb_file_id: action.kb_file_id,
            kb_id: action.kb_id,
          });
        } else {
          return removeFileFromKbAsync({
            kb_file_id: action.kb_file_id,
            kb_id: action.kb_id,
          });
        }
      })
    );
    if (resp.every((r) => r.code === 200)) {
      toast.success("文件绑定知识库成功");
    } else {
      toast.error("某些文件绑定知识库失败");
    }
  } catch (error) {
    toast.error("文件绑定知识库失败");
    throw error;
  }
};
