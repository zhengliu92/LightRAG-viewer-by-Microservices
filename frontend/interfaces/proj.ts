import { IKb } from "./kb";
import { User } from "./user";
export interface ProjectWithUsersKBs {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  kbs: IKb[];
  users: User[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  is_member?: boolean;
  is_owner?: boolean;
}

export interface UserWithProjects extends User {
  projects?: Project[];
}

export interface ListProjectsRequest {}

export interface ListProjectsResponse {
  projects: Project[];
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface CreateProjectResponse {
  message: string;
}

export interface AddUserToProjectRequest {
  project_id: string;
  user_id: string;
}

export interface AddUserToProjectResponse {
  message: string;
}

export interface RemoveUserFromProjectRequest {
  project_id: string;
  user_id: string;
}

export interface RemoveUserFromProjectResponse {
  message: string;
}

export interface GetProjectWithUsersKBsRequest {
  project_id: string;
}

export interface GetProjectWithUsersKBsResponse {
  project: ProjectWithUsersKBs;
}

export interface ListUsersWithProjectsRequest {}

export interface ListUsersWithProjectsResponse {
  usersWithProjects: UserWithProjects[];
}

export interface DeleteProjectRequest {
  project_id: string;
}

export interface DeleteProjectResponse {
  message: string;
}

export interface RenameProjectRequest {
  project_id: string;
  new_name: string;
}

export interface RenameProjectResponse {
  message: string;
}
