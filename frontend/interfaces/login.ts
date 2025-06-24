import { User } from "./user";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
}

export interface LogoutRequest {
  session_id: string;
}

export interface LogoutResponse {
  msg: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  phone?: string;
}

export interface CreateUserResponse {
  user: User;
}

export interface RenewAccessTokenRequest {
  refresh_token: string;
}

export interface RenewAccessTokenResponse {
  access_token: string;
  access_token_expires_at: string;
}
