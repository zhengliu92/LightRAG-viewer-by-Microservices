export interface FileFigure {
  id: string;
  owner_id: string;
  section: string;
  kb_file_id: string;
  caption: string;
  img_bytes: string;
  page_number: number;
}

export interface FileTable {
  id: string;
  owner_id: string;
  section: string;
  kb_file_id: string;
  table_html: string;
  caption: string;
  page_number: number;
}

export interface FileText {
  id: string;
  owner_id: string;
  kb_file_id: string;
  text: string;
  section: string;
  page_number: number;
}
export interface FileAssets {
  figures: FileFigure[];
  tables: FileTable[];
  texts: FileText[];
}

export interface GetKbFileAssetsRequest {
  kb_file_id: string;
}

export interface GetKbFileAssetsResponse {
  file_texts: FileText[];
  file_figures: FileFigure[];
  file_tables: FileTable[];
}

export interface QueryKBFiguresRequest {
  kb_id: string;
  message_id: string;
  query: string;
  api_provider: string;
  api_key: string;
  project_api_key?: string;
  temperature: number;
  threshold: number;
  top_n: number;
}


export interface QueryKBContextRequest {
  kb_id: string;
  query: string;
}

export interface QueryKBContextResponse {
  entities_context: string[];
  relations_context: string[];
  text_units_context: string[];
}


export interface QueryKBFiguresResponse {
  figures: FileFigure[];
}

export interface QueryKBTablesRequest {
  kb_id: string;
  message_id: string;
  query: string;
  api_provider: string;
  api_key: string;
  project_api_key?: string;
  temperature: number;
  threshold: number;
  top_n: number;
}

export type QueryTableResult = {
  id: string;
  score: number;
  content: string;
  table_html: string;
};

export interface QueryKBTablesResponse {
  tables: QueryTableResult[];
}

