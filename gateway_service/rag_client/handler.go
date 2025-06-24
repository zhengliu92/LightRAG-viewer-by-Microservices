package rag_client

import (
	"bytes"
	"context"
	"encoding/json"
	"gateway_service/pb"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type RagClient struct {
	baseURL string
	logger  *logrus.Logger
}

func NewRagClient(baseurl string, logger *logrus.Logger) *RagClient {
	return &RagClient{baseURL: baseurl, logger: logger}
}

func (h *RagClient) BuildKBFile(ctx context.Context, req *BuildKBFileRequest) (*BuildKBFileResponse, error) {

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/documents/insert", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusConflict {
			return nil, status.Error(codes.AlreadyExists, "任务已存在")
		}
		return nil, status.Error(codes.Internal, "failed to build KB file")
	}

	var respBody BuildKBFileResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) StopBuildKBFile(ctx context.Context, req *StopBuildKBFileRequest) (*StopBuildKBFileResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	timeOut := time.Duration(5 * time.Second)
	ctx, cancel := context.WithTimeout(ctx, timeOut)
	defer cancel()

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/documents/stop_insert", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("accept", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		h.logger.Error("failed to stop build KB file", "error", err)
		return nil, err
	}
	defer resp.Body.Close()

	var respBody StopBuildKBFileResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) QueryKBFigures(ctx context.Context, req *QueryKBFiguresRequest) (*QueryKBFiguresResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/query/figures", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody QueryKBFiguresResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) QueryKBTables(ctx context.Context, req *QueryKBTablesRequest) (*QueryKBTablesResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/query/tables", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody QueryKBTablesResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}

	return &respBody, nil
}

func (h *RagClient) QueryKBContext(ctx context.Context, req *QueryKBContextRequest) (*QueryKBContextResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/query/context", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody QueryKBContextResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) DeleteKB(ctx context.Context, req *DeleteKBRequest) (*DeleteKBResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/kb/delete", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody DeleteKBResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) GetKBGraph(ctx context.Context, req *GetKBGraphRequest) (*pb.GetKBGraphResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/kb/graph", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody pb.GetKBGraphResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}

func (h *RagClient) UnlinkKBDocument(ctx context.Context, req *UnlinkKBDocumentRequest) (*UnlinkKBDocumentResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, "POST", h.baseURL+"/documents/delete", bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(request)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var respBody UnlinkKBDocumentResponse
	err = json.NewDecoder(resp.Body).Decode(&respBody)
	if err != nil {
		return nil, err
	}
	return &respBody, nil
}
