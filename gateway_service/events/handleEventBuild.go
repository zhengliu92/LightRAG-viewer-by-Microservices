package events

import (
	"context"
	"encoding/json"
	db "gateway_service/db/sqlc"
	"strconv"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type BuildPayload struct {
	Percent    float64 `json:"percent"`
	Status     string  `json:"status"`
	IsFinished bool    `json:"is_finished"`
	IsFailed   bool    `json:"is_failed"`
}

func (r *RedisEventProcessor) HandleEventBuild(ctx context.Context, key string, payload map[string]string) {
	r.logger.Info("received message from redis: ", key)
	lock, _ := keyLocks.LoadOrStore(key, &sync.Mutex{})
	lock.(*sync.Mutex).Lock()
	defer lock.(*sync.Mutex).Unlock()
	defer keyLocks.Delete(key)

	kbID := strings.Split(key, ":")[1]
	kbFileID := strings.Split(key, ":")[2]

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		r.logger.Error("error marshalling payload: ", err)
		return
	}

	buildPayload, err := unmarshalBuildPayload(payloadBytes)
	if err != nil {
		r.logger.Error("error unmarshalling payload: ", err)
		return
	}

	_, err = r.dbStore.UpdateKBFileMapping(ctx, db.UpdateKBFileMappingParams{
		BuildStatus:     pgtype.Text{String: buildPayload.Status, Valid: true},
		BuildPercentage: pgtype.Float8{Float64: buildPayload.Percent, Valid: true},
		IsBuildFinished: pgtype.Bool{Bool: buildPayload.IsFinished, Valid: true},
		IsBuildFailed:   pgtype.Bool{Bool: buildPayload.IsFailed, Valid: true},
		KbID:            uuid.MustParse(kbID),
		KbFileID:        uuid.MustParse(kbFileID),
	})
	if err != nil {
		r.logger.Error("error updating kb file: ", err)
		return
	}

}

func unmarshalBuildPayload(payloadBytes []byte) (*BuildPayload, error) {
	var p BuildPayload
	var tempPayload map[string]interface{}
	err := json.Unmarshal(payloadBytes, &tempPayload)
	if err != nil {
		return nil, err
	}

	if status, ok := tempPayload["status"].(string); ok {
		p.Status = status
	}

	if percent, ok := tempPayload["percent"].(string); ok {
		if percent, err := strconv.ParseFloat(percent, 64); err == nil {
			p.Percent = percent
		}
	}

	if isFinished, ok := tempPayload["is_finished"].(string); ok {
		if isFinished, err := strconv.ParseBool(isFinished); err == nil {
			p.IsFinished = isFinished
		}
	}

	if isFailed, ok := tempPayload["is_failed"].(string); ok {
		if isFailed, err := strconv.ParseBool(isFailed); err == nil {
			p.IsFailed = isFailed
		}
	}

	return &p, nil
}
