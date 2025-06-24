package rag_client

type KBFileText struct {
	KbFileID    string `json:"kbfile_id"`
	FileContent string `json:"file_content"`
}

type KBFigure struct {
	ImgID    string `json:"img_id"`
	KbFileID string `json:"kbfile_id"`
	Caption  string `json:"caption"`
}

type KBTable struct {
	TableID   string `json:"table_id"`
	KbFileID  string `json:"kbfile_id"`
	Caption   string `json:"caption"`
	TableHTML string `json:"table_html"`
}

type KBFile struct {
	KbFileID string     `json:"kbfile_id"`
	KbID     string     `json:"kb_id"`
	FileText KBFileText `json:"file_text"`
	Figures  []KBFigure `json:"figures"`
	Tables   []KBTable  `json:"tables"`
}

type BuildKBFileRequest struct {
	UserID                string `json:"user_id"`
	KbID                  string `json:"kb_id"`
	ChunkTokenSize        int32  `json:"chunk_token_size"`
	ChunkOverlapTokenSize int32  `json:"chunk_overlap_token_size"`
	KBFile                KBFile `json:"kbfile"`
	APIKey                string `json:"api_key"`
	ProjectID             string `json:"project_id"`
	APIProvider           string `json:"api_provider"`
	EmbedModel            string `json:"embed_model"`
}

type BuildKBFileResponse struct {
	Message string `json:"message"`
}

type QueryKBFiguresRequest struct {
	UserID      string  `json:"user_id"`
	KbID        string  `json:"kb_id"`
	Query       string  `json:"query"`
	APIKey      string  `json:"api_key"`
	ProjectID   string  `json:"project_id,omitempty"`
	APIProvider string  `json:"api_provider"`
	EmbedModel  string  `json:"embed_model"`
	Temperature float32 `json:"temperature"`
	Threshold   float32 `json:"threshold"`
	TopN        int32   `json:"top_n"`
}

type QueryKBTablesRequest struct {
	UserID      string  `json:"user_id"`
	KbID        string  `json:"kb_id"`
	Query       string  `json:"query"`
	APIKey      string  `json:"api_key"`
	ProjectID   string  `json:"project_id,omitempty"`
	APIProvider string  `json:"api_provider"`
	EmbedModel  string  `json:"embed_model"`
	Temperature float32 `json:"temperature"`
	Threshold   float32 `json:"threshold"`
	TopN        int32   `json:"top_n"`
}

type QueryKBContextRequest struct {
	KbID  string `json:"kb_id"`
	Query string `json:"query"`
}

type QueryKBContextResponse struct {
	EntitiesContext  []string `json:"entities_context"`
	RelationsContext []string `json:"relations_context"`
	TextUnitsContext []string `json:"text_units_context"`
}

type QueryFigureType struct {
	ID      string  `json:"id"`
	Content string  `json:"content"`
	Score   float32 `json:"score"`
}

type QueryTableType struct {
	ID        string  `json:"id"`
	Score     float32 `json:"score"`
	Content   string  `json:"content"`
	TableHTML string  `json:"table_html"`
}

type QueryKBFiguresResponse struct {
	Figures []QueryFigureType `json:"figures"`
}

type QueryKBTablesResponse struct {
	Tables []QueryTableType `json:"tables"`
}

type DeleteKBRequest struct {
	UserID string `json:"user_id"`
	KbID   string `json:"kb_id"`
}

type DeleteKBResponse struct {
	Message string `json:"message"`
}

type GetKBGraphRequest struct {
	UserID string `json:"user_id"`
	KbID   string `json:"kb_id"`
}

type StopBuildKBFileRequest struct {
	UserID   string `json:"user_id"`
	KbFileID string `json:"kb_file_id"`
	KbID     string `json:"kb_id"`
}

type StopBuildKBFileResponse struct {
	Message string `json:"message"`
}

type UnlinkKBDocumentRequest struct {
	UserID       string `json:"user_id"`
	KbFileID     string `json:"kbfile_id"`
	KbID         string `json:"kb_id"`
	EmbedModel   string `json:"embed_model"`
	DecodeAPIKey bool   `json:"decode_api_key"`
}

type UnlinkKBDocumentResponse struct {
	Message string `json:"message"`
}
