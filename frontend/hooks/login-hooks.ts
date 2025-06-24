import {
  CreateUserRequest,
  CreateUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
} from "@/interfaces/login";
import { makeRequest } from "@/services/services";
import { api } from "@/utils/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const loginFunc = async (req: LoginRequest) => {
  return await makeRequest<typeof req, LoginResponse>(api.user.login, req);
};

const registerFunc = async (req: CreateUserRequest) => {
  return await makeRequest<typeof req, CreateUserResponse>(
    api.user.create,
    req
  );
};

const logoutFunc = async (req: LogoutRequest) => {
  return await makeRequest<typeof req, LoginResponse>(api.user.logout, req);
};

export const useLogin = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["login"],
    mutationFn: loginFunc,
  });
  return { data, loading, login: mutateAsync };
};

export const useRegister = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["register"],
    mutationFn: registerFunc,
  });
  return { data, loading, register: mutateAsync };
};

export const useLogout = () => {
  const {
    data,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationKey: ["logout"],
    mutationFn: logoutFunc,
  });
  return { data, loading, logout: mutateAsync };
};
