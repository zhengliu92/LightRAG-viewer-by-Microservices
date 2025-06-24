import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import {
  GetKbFileAssetsRequest,
  GetKbFileAssetsResponse,
  QueryKBContextRequest,
  QueryKBContextResponse,
  QueryKBFiguresRequest,
  QueryKBFiguresResponse,
  QueryKBTablesRequest,
  QueryKBTablesResponse,
} from "@/interfaces/kbfile-assets";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const getKbFileAssets = async (req: GetKbFileAssetsRequest) => {
  return await makeRequest<typeof req, GetKbFileAssetsResponse>(
    api.file_asset.get_file_assets,
    req
  );
};

export const useGetKbFileAssets = () => {
  const { mutateAsync: getKbFileAssetsAsync } = useMutation({
    mutationKey: ["getKbFileAssets"],
    mutationFn: (kb_file_id: string) => getKbFileAssets({ kb_file_id }),
    onSuccess: (data) => {
      if (data.code !== 200) {
        toast.error("获取文件解析结果失败");
      }
    },
  });
  return { getKbFileAssetsAsync };
};

export const queryKBFigures = async (req: QueryKBFiguresRequest) => {
  return await makeRequest<typeof req, QueryKBFiguresResponse>(
    api.kb.query_figures,
    req
  );
};

export const useQueryKBFigures = () => {
  const { mutateAsync: queryKBFiguresAsync } = useMutation({
    mutationKey: ["queryKBFigures"],
    mutationFn: (req: QueryKBFiguresRequest) => queryKBFigures(req),
    onSuccess: (data) => {
      if (data.code !== 200) {
        toast.error("获取文件解析结果失败");
      }
    },
  });
  return { queryKBFiguresAsync };
};

export const queryKBTables = async (req: QueryKBTablesRequest) => {
  return await makeRequest<typeof req, QueryKBTablesResponse>(
    api.kb.query_tables,
    req
  );
};



export const useQueryKBTables = () => {
  const { mutateAsync: queryKBTablesAsync } = useMutation({
    mutationKey: ["queryKBTables"],
    mutationFn: (req: QueryKBTablesRequest) => queryKBTables(req),
    onSuccess: (data) => {
      if (data.code !== 200) {
        toast.error("获取文件解析结果失败");
      }
    },
  });
  return { queryKBTablesAsync };
};



export const queryKBContext = async (req: QueryKBContextRequest) => {
  return await makeRequest<typeof req, QueryKBContextResponse>(
    api.kb.query_context,
    req
  );
};


export const useQueryKBContext = () => {
  const { mutateAsync: queryKBContextAsync } = useMutation({
    mutationKey: ["queryKBContext"],
    mutationFn: (req: QueryKBContextRequest) => queryKBContext(req),
    onSuccess: (data) => {
      if (data.code !== 200) {
        toast.error(data.message || "获取知识库上下文失败");
      }
    },
  });
  return { queryKBContextAsync };
};