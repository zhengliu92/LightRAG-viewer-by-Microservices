package rag_server

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"io"
	"net/http"

	"github.com/google/uuid"
)

func (s *Server) handleQueryStream(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := s.authorizeUser(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var req ParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ragConfig, err := s.store.GetRagConfigByKBID(r.Context(), uuid.MustParse(req.KbID))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	accessible, err := s.store.IsKbAccessibleByUserID(r.Context(), db.IsKbAccessibleByUserIDParams{
		KnowledgeBaseID: ragConfig.KbID,
		UserID:          user.ID,
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !accessible {
		http.Error(w, "您没有权限操作此知识库", http.StatusForbidden)
		return
	}

	query := QueryRequest{
		KbID:            ragConfig.KbID.String(),
		Query:           req.Query,
		APIKey:          req.APIKey,
		ProjectID:       req.ProjectID,
		APIProvider:     req.APIProvider,
		EmbedModel:      ragConfig.EmbedModel,
		HistoryMessages: req.HistoryMessages,
		Temperature:     req.Temperature,
		Threshold:       req.Threshold,
		TopN:            req.TopN,
		MaxMemory:       req.MaxMemory,
		QueryMode:       req.QueryMode,
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	jsonData, err := json.Marshal(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	httpReq, err := http.NewRequestWithContext(r.Context(), "POST", s.config.RAG_CLIENT_ADDRESS+"/query/stream", bytes.NewBuffer(jsonData))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, string(body), resp.StatusCode)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	reader := bufio.NewReader(resp.Body)
	for {
		chunk, err := reader.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				s.logger.Errorf("Error reading stream: %v", err)
			}
			return
		}
		fmt.Fprintf(w, "data: %s\n\n", chunk)
		flusher.Flush()
	}
}
