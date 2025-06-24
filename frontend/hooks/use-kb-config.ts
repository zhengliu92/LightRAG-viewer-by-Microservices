import {
  GetRagConfigByKBIDRequest,
  GetRagConfigByKBIDResponse,
  UpsertRagConfigRequest,
  UpsertRagConfigResponse,
} from "@/interfaces/kb";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const upsertRagConfig = async (req: UpsertRagConfigRequest) => {
  return await makeRequest<typeof req, UpsertRagConfigResponse>(
    api.kb.upsert_rag_config,
    req
  );
};

export const getRagConfigByKBID = async (req: GetRagConfigByKBIDRequest) => {
  const api_config = {
    url: api.kb.get_rag_config_by_kb_id.url.replace("{kb_id}", req.kb_id),
    method: api.kb.get_rag_config_by_kb_id.method,
  };
  return await makeRequest<any, GetRagConfigByKBIDResponse>(api_config, {});
};

export const useKbConfig = (kb_id: string) => {
  const queryClient = useQueryClient();

  const { data: ragConfig, isLoading: ragConfigLoading } = useQuery({
    queryKey: ["ragConfig"],
    queryFn: () => getRagConfigByKBID({ kb_id }),
  });

  const { mutateAsync: upsertRagConfigAsync } = useMutation({
    mutationFn: upsertRagConfig,
    onSuccess: (data) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ["ragConfig"] });
        toast.success("更新成功");
      } else {
        toast.error(data.message);
      }
    },
  });

  return {
    ragConfig: ragConfig?.data,
    ragConfigLoading,
    upsertRagConfigAsync,
  };
};
