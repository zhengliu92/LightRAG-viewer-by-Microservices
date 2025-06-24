package rag_server

type HistoryMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	ID      string `json:"id"`
}
type ParseRequest struct {
	KbID            string           `json:"kb_id"`
	Query           string           `json:"query"`
	APIKey          string           `json:"api_key"`
	ProjectID       *string          `json:"project_id,omitempty"`
	HistoryMessages []HistoryMessage `json:"history_messages,omitempty"`
	Temperature     float64          `json:"temperature"`
	Threshold       float64          `json:"threshold"`
	TopN            int              `json:"top_n"`
	MaxMemory       int              `json:"max_memory"`
	QueryMode       string           `json:"query_mode,omitempty"`
	APIProvider     string           `json:"api_provider"`
}

type QueryRequest struct {
	KbID            string           `json:"kb_id"`
	Query           string           `json:"query"`
	APIKey          string           `json:"api_key"`
	ProjectID       *string          `json:"project_id,omitempty"`
	HistoryMessages []HistoryMessage `json:"history_messages,omitempty"`
	Temperature     float64          `json:"temperature"`
	Threshold       float64          `json:"threshold"`
	TopN            int              `json:"top_n"`
	MaxMemory       int              `json:"max_memory"`
	QueryMode       string           `json:"query_mode,omitempty"`
	APIProvider     string           `json:"api_provider"`
	EmbedModel      string           `json:"embed_model"`
}
