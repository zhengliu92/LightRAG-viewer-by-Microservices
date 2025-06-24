import {} from "@/interfaces/login";
import {
  UpdateUserRequest,
  UpdateUserResponse,
  UserMeResponse,
} from "@/interfaces/user";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import { useLocale } from "./use-locale";
import { toast } from "sonner";
import { BaseResponse } from "@/interfaces/base";
import { useAuth } from "./use-auth";

const updateUser = async (req: UpdateUserRequest) => {
  return await makeRequest<typeof req, UpdateUserResponse>(
    api.user.update,
    req
  );
};

const getMe = async (req: any) => {
  return await makeRequest<typeof req, UserMeResponse>(api.user.update, req);
};

interface UpdaterProps<TRequest, TResponse> {
  key: string;
  mutationFn: (req: TRequest) => Promise<BaseResponse<TResponse>>;
}

const Updater = <TRequest, TResponse>({
  key,
  mutationFn,
}: UpdaterProps<TRequest, TResponse>) => {
  const { locale } = useLocale();
  const { clearUp } = useAuth();
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: [key],
    mutationFn: mutationFn,
    onSuccess: async (data) => {
      if (data.code === 200) {
        toast.success(locale.success.update);
        return;
      }
      if (data.code === 401) {
        toast.error(locale.error.session_expired);
        clearUp();
        return;
      }
      toast.error(data.message || locale.error.unknown);
    },
  });

  return { data, loading, mutateAsync };
};

export const useUpdateUser = () => {
  return Updater<UpdateUserRequest, UpdateUserResponse>({
    key: "update-user",
    mutationFn: updateUser,
  });
};

export const useGetMe = () => {
  return Updater<any, UserMeResponse>({
    key: "me",
    mutationFn: getMe,
  });
};
