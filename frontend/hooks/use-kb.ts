"use client";

import { BaseResponse } from "@/interfaces/base";
import {
  ChangeKbNameRequest,
  CreateKbRequest,
  CreateKbResponse,
  DeleteKBFilesRequest,
  DeleteKBFilesResponse,
  DeleteKbRequest,
  DeleteKbResponse,
  GetKBWithKBFilesByKBIDRequest,
  GetKBWithKBFilesByKBIDResponse,
  GetUserKBsRequest,
  GetUserKBsResponse,
  GetUserProjWithKbsResponse,
  IKb,
  IProjKb,
  ParseAndBuildKBRequest,
  ParseAndBuildKBResponse,
  UpdateKBFileRequest,
  UpdateKBFileResponse,
} from "@/interfaces/kb";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useApiKey } from "./use-api";

export const deleteKBFiles = async (req: DeleteKBFilesRequest) => {
  return await makeRequest<typeof req, DeleteKBFilesResponse>(
    api.kb_files.delete_kb_files,
    req
  );
};

export const updateKBFile = async (req: UpdateKBFileRequest) => {
  return await makeRequest<typeof req, UpdateKBFileResponse>(
    api.kb_files.update_kb_file,
    req
  );
};

export const parseAndBuildKB = async (req: ParseAndBuildKBRequest) => {
  return await makeRequest<typeof req, ParseAndBuildKBResponse>(
    api.kb.parse_and_build_kb,
    req
  );
};

export const useParseAndBuildKB = () => {
  const queryClient = useQueryClient();
  const { apiKey, projectApiKey, apiProvider } = useApiKey();

  const { mutateAsync } = useMutation({
    mutationFn: (req: ParseAndBuildKBRequest) => {
      if (!apiKey) {
        toast.error("请先设置API密钥");
        return Promise.reject(new Error("API key not set"));
      }

      return parseAndBuildKB({
        ...req,
        api_key: apiKey || "",
        project_api_key: projectApiKey || "",
        api_provider: apiProvider || "",
      });
    },

    onSuccess: (data) => {
      if (data?.code === 200) {
        toast.success("开始解析并构建知识库");
      } else {
        toast.error("无法解析并构建知识库");
      }
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["getKbWithFilesByKbId"] });
      }, 300);
    },
  });

  return { parseAndBuildKBAsync: mutateAsync };
};

export const useDeleteKbFiles = () => {
  const queryClient = useQueryClient();
  const { mutate: deleteKbFiles } = useMutation({
    mutationFn: deleteKBFiles,
    onSuccess: (data) => {
      if (data?.code === 200) {
        toast.success("删除文件成功");
        queryClient.invalidateQueries({ queryKey: ["getKBFilesByFolder"] });
      } else {
        toast.error("删除文件失败");
      }
    },
  });
  return { mutate: deleteKbFiles };
};

export const createKb = async (req: CreateKbRequest) => {
  return await makeRequest<typeof req, CreateKbResponse>(api.kb.create_kb, req);
};

export const getUserKbs = async (req: GetUserKBsRequest) => {
  return await makeRequest<typeof req, GetUserKBsResponse>(
    api.kb.get_user_kbs,
    req
  );
};

export const getUserProjWithKbs = async (req: any) => {
  return await makeRequest<any, GetUserProjWithKbsResponse>(
    api.proj.user_projs_with_kbs,
    {}
  );
};

export const getKbWithFilesByKbId = async (
  req: GetKBWithKBFilesByKBIDRequest
) => {
  const apiConfig = {
    url: api.kb_files.get_kbWithFiles_by_kbID.url.replace(
      "{kb_id}",
      req.kb_id.toString()
    ),
    method: api.kb_files.get_kbWithFiles_by_kbID.method,
  };
  return await makeRequest<any, GetKBWithKBFilesByKBIDResponse>(apiConfig, {});
};

export const useGetKbWithFilesByKbId = (kb_id: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["getKbWithFilesByKbId", kb_id],
    queryFn: () => getKbWithFilesByKbId({ kb_id }),
  });
  return { data: data?.data?.data, isLoading, refetch };
};

export async function changeKbName(
  params: ChangeKbNameRequest
): Promise<BaseResponse<any>> {
  const apiConfig = {
    url: api.kb.change_kb_name.url.replace("{id}", params.id.toString()),
    method: api.kb.change_kb_name.method,
  };
  return await makeRequest(apiConfig, { name: params.name });
}

export const deleteKb = async (
  req: DeleteKbRequest
): Promise<BaseResponse<DeleteKbResponse>> => {
  return await makeRequest(api.kb.delete_kb, req, {});
};

export const deleteKbAsync = async (
  kb_id: string,
  proj_id?: string
) => {
  const resp = await getKbWithFilesByKbId({ kb_id });
  if (resp.code !== 200) {
    toast.error(resp.message || "获取知识库失败");
    return;
  }
  const db_data = resp.data?.data;
  if (!db_data) {
    toast.error("知识库不存在");
    return;
  }
  const kb_files = db_data.kb_files;
  if (
    kb_files &&
    kb_files.some(
      (file) =>
        (file.parse_percentage > 0 && file.parse_percentage < 100) ||
        (file.build_percentage > 0 && file.build_percentage < 100)
    )
  ) {
    toast.error("知识库中有些文件正在解析或构建中，请停止后再删除知识库");
    return;
  }

  const r = await deleteKb({ kb_id, proj_id });
  if (r.code === 200) {
    toast.success("删除知识库成功");
  } else {
    toast.error(r.message || "删除知识库失败");
  }
  return { data: r.data };
};

export const useKb = () => {
  const [activeKbId, setActiveKbId] = useState<string | null>(null);
  const [all_kbs, setAllKbs] = useState<IKb[]>([]);
  const { data: kbs, isLoading } = useQuery({
    queryKey: ["userKbs"],
    queryFn: () => getUserKbs({}),
    staleTime: 1000 * 60, // 1分钟
    gcTime: 1000 * 60 * 5, // 5分钟
  });

  const { data: userProjs, isLoading: userProjsLoading } = useQuery({
    queryKey: ["userProjs"],
    queryFn: () => getUserProjWithKbs({}),
    staleTime: 1000 * 60, // 1分钟
    gcTime: 1000 * 60 * 5, // 5分钟
  });

  useEffect(() => {
    // Create a Map to store unique KBs using ID as key
    const kbMap = new Map();

    // Add regular KBs
    if (kbs?.data?.kbs) {
      kbs.data.kbs.forEach((kb: IKb) => {
        kbMap.set(kb.id, { ...kb, is_project_kb: false });
      });
    }

    // Add project KBs
    if (userProjs?.data?.projects) {
      userProjs.data.projects.forEach((proj: IProjKb) => {
        if (!proj.kbs) return;
        proj.kbs.forEach((kb: IKb) => {
          // Only add if not already present, or override if you want project KBs to take precedence
          if (!kbMap.has(kb.id)) {
            kbMap.set(kb.id, { ...kb, is_project_kb: true });
          }
        });
      });
    }

    // Convert Map values back to array
    setAllKbs(Array.from(kbMap.values()));
  }, [kbs, userProjs]);

  const getKbById = useCallback(
    (kb_id: string) => {
      if (!all_kbs) return null;
      return all_kbs.find((kb: IKb) => kb.id === kb_id) ?? null;
    },
    [all_kbs]
  );

  const { mutateAsync: createKbAsync } = useMutation({
    mutationFn: createKb,
    onSuccess(data) {
      if (data?.code === 200) {
        toast.success("创建知识库成功");
      } else if (data?.code === 409) {
        toast.error("知识库名称已存在");
      } else {
        toast.error(data?.message || "创建知识库失败");
      }
    },
  });

  const { mutateAsync: updateKbFileAsync } = useMutation({
    mutationKey: ["updateKbFile"],
    mutationFn: updateKBFile,
    onSuccess(data) {
      if (data?.code === 200) {
        toast.success("更新知识库成功");
      } else {
        toast.error("更新知识库失败");
      }
    },
  });

  const { mutateAsync: renameKbAsync } = useMutation({
    mutationKey: ["renameKb"],
    mutationFn: changeKbName,
    async onSuccess(data) {
      if (data?.code === 200) {
        toast.success("重命名知识库成功");
      } else if (data?.code === 409) {
        toast.error("知识库名称已存在");
      } else {
        toast.error(data?.message || "重命名知识库失败");
      }
    },
  });

  return {
    kbs: kbs?.data?.kbs ?? [],
    projs: userProjs?.data?.projects || [],
    all_kbs,
    isLoading,
    createKb,
    createKbAsync,
    renameKbAsync,
    updateKbFileAsync,
    getKbById,
    activeKbId,
    setActiveKbId,
  };
};
