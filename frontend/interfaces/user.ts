export type User = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  role_name: string;
  hashed_password: string;
  is_email_verified: boolean;
  last_login: string;
  phone: string;
  created_at: string;
  deleted_at: string;
  avatar: string;
};

export interface UpdateUserRequest {
  username: string;
  full_name?: string;
  email?: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role_name?: string;
  is_active?: boolean;
}

export interface UpdateUserResponse {
  user: User;
}

export interface UserMeResponse {
  user: User;
}

export interface GetUserMeRequest {}

export interface GetUserMeResponse {
  user: User;
}

export interface GetUserByIdRequest {
  id: string;
}

export interface GetUserByIdResponse {
  user: User;
}
