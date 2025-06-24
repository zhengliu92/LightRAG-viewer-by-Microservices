export interface IKb {
  id: string;
  name: string;
  owner_id: string;
  kb_file_count: number;
  kb_file_build_finished_count: number;
  created_at: string;
  updated_at: string;
  is_project_kb?: boolean;
  project_name?: string;
  project_id?: string;
}

export interface IProjKb {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  kbs: IKb[];
}

export interface KBFile {
  id: string;
  name: string;
  path: string;
  folder: string;
  owner_id: string;
  parse_status: string;
  parse_percentage: number;
  is_parse_finished: boolean;
  is_parse_failed: boolean;
  build_status: string;
  build_percentage: number;
  is_build_finished: boolean;
  is_build_failed: boolean;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface KBWithKBFiles {
  id: string;
  name: string;
  owner_id: string;
  kb_file_count: number;
  created_at: string;
  updated_at: string;
  kb_files: KBFile[];
}

export interface KBBrief {
  id: string;
  name: string;
}

export interface KBFileWithKBs {
  id: string;
  name: string;
  path: string;
  folder: string;
  owner_id: string;
  parse_status: string;
  parse_percentage: number;
  is_parse_finished: boolean;
  size: number;
  created_at: string;
  updated_at: string;
  kbs?: KBBrief[];
}

export interface CreateKbRequest {
  name: string;
  project_id?: string;
}

export interface CreateKbResponse {
  message: string;
}

export interface ChangeKbNameRequest {
  id: string;
  name: string;
}

export interface ChangeKbNameResponse {
  message: string;
}

export interface GetKbRequest {
  id: string;
}

export interface GetKbResponse {
  knowledge_base: IKb;
}

export interface CreateKbResponse {
  knowledge_base: IKb;
}

export interface DeleteKbRequest {
  kb_id: string;
  proj_id?:string;
}

export interface DeleteKbResponse {
  message: string;
}

export interface GetUserKBsRequest {}

export interface GetUserKBsResponse {
  kbs: IKb[];
}

export interface GetUserProjWithKbsRequest {
  user_id: string;
}

export interface GetUserProjWithKbsResponse {
  projects: IProjKb[];
}

export interface CreateKBFileRequest {
  name: string;
  path: string;
  folder: string;
  size: number;
  kb_id?: string;
}

export interface CreateKBFileResponse {
  message: string;
}

export interface UpdateKBFileRequest {
  id: string;
  name?: string;
  path?: string;
  folder?: string;
  owner_id?: string;
}

export interface UpdateKBFileResponse {
  message: string;
}

export interface GetKBWithKBFilesByKBIDRequest {
  kb_id: string;
}

export interface GetKBWithKBFilesByKBIDResponse {
  data: KBWithKBFiles;
}

export interface GetKBFilesByFolderRequest {
  folder: string;
}

export interface GetKBFilesByFolderResponse {
  data: KBFileWithKBs[];
}

export interface DeleteKBFilesRequest {
  file_ids: string[];
}

export interface DeleteKBFilesResponse {
  message: string;
}

export interface AddFileToKBRequest {
  kb_id: string;
  kb_file_id: string;
}

export interface AddFileToKBResponse {
  message: string;
}

export interface RemoveFileFromKBRequest {
  kb_id: string;
  kb_file_id: string;
}

export interface RemoveFileFromKBResponse {
  message: string;
}

export interface StartParseKBFileRequest {
  kb_file_id: string;
}

export interface StartParseKBFileRespqonse {
  message: string;
}

export interface StartBuildKBFileRequest {
  kb_file_id: string;
  kb_id: string;
  api_key?: string;
  project_api_key?: string;
  api_provider?: string;
}

export interface StartBuildKBFileResponse {
  message: string;
}

export interface StopBuildKBFileRequest {
  kb_id: string;
  kb_file_id: string;
}

export interface StopBuildKBFileResponse {
  message: string;
}

export interface UpsertRagConfigRequest {
  kb_id: string;
  chunk_token_size: number;
  chunk_overlap_token_size: number;
  embed_model: string;
}

export interface UpsertRagConfigResponse {
  message: string;
}

export interface GetRagConfigByKBIDRequest {
  kb_id: string;
}

export interface GetRagConfigByKBIDResponse {
  chunk_token_size: number;
  chunk_overlap_token_size: number;
  embed_model: string;
}

export interface ParseAndBuildKBRequest {
  kb_id: string;
  api_key?: string;
  project_api_key?: string;
  api_provider?: string;
}

export interface ParseAndBuildKBResponse {
  message: string;
}

export type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
  query?: string;
};

export interface QueryKBRequest {
  username: string;
  kb_name: string;
  query: string;
  api_key: string;
  project_id?: string;
  api_provider: string;
  history_messages?: Message[];
  temperature?: number;
}

export interface GetKBGraphRequest {
  kb_id: string;
}

export interface Node {
  entity_type: string;
  description: string;
  id: string;
  source_id: string;
}

export interface Edge {
  source: string;
  target: string;
  keywords: string;
  description: string;
  weight: number;
  source_id: string;
}

export interface GetKBGraphResponse {
  nodes: Node[];
  edges: Edge[];
}
export type GraphNode = {
  id: string;
  name: string;
  val: number;
  entity_type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};
