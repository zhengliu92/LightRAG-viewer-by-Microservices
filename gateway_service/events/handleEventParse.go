package events

import (
	"context"
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"strconv"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgtype"
)

type ParsePayload struct {
	Texts      []FileText   `json:"texts"`
	Figures    []FileFigure `json:"figures"`
	IsFailed   bool         `json:"is_failed"`
	Percent    float64      `json:"percent"`
	Status     string       `json:"status"`
	IsFinished bool         `json:"is_finished"`
	Tables     []FileTable  `json:"tables"`
	FullText   string       `json:"full_text"`
}

type FileText struct {
	Section string `json:"section"`
	Text    string `json:"text"`
	PageNum int    `json:"page_num"`
}

type FileFigure struct {
	Section string `json:"section"`
	ImgPath string `json:"img_path"`
	Caption string `json:"caption"`
	PageNum int    `json:"page_num"`
}

type FileTable struct {
	Section   string `json:"section"`
	TableHTML string `json:"table_html"`
	Caption   string `json:"caption"`
	PageNum   int    `json:"page_num"`
}

var keyLocks sync.Map

func (r *RedisEventProcessor) HandleEventParse(ctx context.Context, key string, payload map[string]string) {
	r.logger.Info("received message from redis: ", key)

	lock, _ := keyLocks.LoadOrStore(key, &sync.Mutex{})
	lock.(*sync.Mutex).Lock()
	defer lock.(*sync.Mutex).Unlock()
	defer keyLocks.Delete(key)

	ownerName, path := strings.Split(key, ":")[1], strings.Split(key, ":")[2]

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		r.logger.Error("error marshalling payload: ", err)
		return
	}

	p, err := unmarshalAllFields(payloadBytes)
	if err != nil {
		r.logger.Error("error unmarshalling payload: ", err)
		return
	}

	kbFile, err := r.dbStore.GetKBFileByOwnerAndPath(ctx, db.GetKBFileByOwnerAndPathParams{
		Username: ownerName,
		Path:     path,
	})
	if err != nil {
		r.logger.Error("error getting kb file: ", err)
		return
	}

	r.dbStore.UpdateKBFile(ctx, db.UpdateKBFileParams{
		ID:              kbFile.ID,
		ParseStatus:     pgtype.Text{String: p.Status, Valid: true},
		ParsePercentage: pgtype.Float8{Float64: p.Percent, Valid: true},
		IsParseFinished: pgtype.Bool{Bool: p.IsFinished, Valid: true},
		IsParseFailed:   pgtype.Bool{Bool: p.IsFailed, Valid: true},
	})

	if p.IsFinished && !p.IsFailed {
		updated := false
		if len(p.Figures) > 0 {
			for _, figure := range p.Figures {
				err = r.dbStore.CreateFileFigures(ctx, db.CreateFileFiguresParams{
					OwnerID:    kbFile.OwnerID,
					KbFileID:   kbFile.ID,
					Section:    figure.Section,
					ImgPath:    figure.ImgPath,
					Caption:    figure.Caption,
					PageNumber: int32(figure.PageNum),
				})
				if err != nil {
					r.logger.Error("error creating file figures: ", err)
				}
				updated = true
			}
		}
		if len(p.Tables) > 0 {
			for _, table := range p.Tables {
				err = r.dbStore.CreateFileTables(ctx, db.CreateFileTablesParams{
					OwnerID:    kbFile.OwnerID,
					Section:    table.Section,
					KbFileID:   kbFile.ID,
					Caption:    table.Caption,
					TableHtml:  table.TableHTML,
					PageNumber: int32(table.PageNum),
				})
				if err != nil {
					r.logger.Error("error creating file tables: ", err)
				}
				updated = true
			}
		}
		if len(p.Texts) > 0 {
			for _, text := range p.Texts {
				err = r.dbStore.CreateFileTexts(ctx, db.CreateFileTextsParams{
					OwnerID:    kbFile.OwnerID,
					KbFileID:   kbFile.ID,
					Section:    text.Section,
					Text:       text.Text,
					PageNumber: int32(text.PageNum),
				})
				if err != nil {
					r.logger.Error("error creating file texts: ", err)
				}
				updated = true
			}
		}
		if len(p.FullText) > 0 {
			err = r.dbStore.CreateFileFullText(ctx, db.CreateFileFullTextParams{
				OwnerID:  kbFile.OwnerID,
				KbFileID: kbFile.ID,
				FullText: p.FullText,
			})
			if err != nil {
				r.logger.Error("error creating file full text: ", err)
			}
			updated = true
		}
		if updated {
			r.dbStore.UpdateKBFile(ctx, db.UpdateKBFileParams{
				ID:              kbFile.ID,
				IsAssetsUpdated: pgtype.Bool{Bool: true, Valid: true},
			})
		}
	}
}

func unmarshalAllFields(payloadBytes []byte) (*ParsePayload, error) {
	var p ParsePayload
	var tempPayload map[string]interface{}
	err := json.Unmarshal(payloadBytes, &tempPayload)
	if err != nil {
		return nil, err
	}

	if figuresStr, ok := tempPayload["figures"].(string); ok {
		var figures []FileFigure
		if err := json.Unmarshal([]byte(figuresStr), &figures); err == nil {
			tempPayload["figures"] = figures
		}
	}

	if tablesStr, ok := tempPayload["tables"].(string); ok {
		var tables []FileTable
		if err := json.Unmarshal([]byte(tablesStr), &tables); err == nil {
			tempPayload["tables"] = tables
		}
	}

	if textsStr, ok := tempPayload["texts"].(string); ok {
		var texts []FileText
		if err := json.Unmarshal([]byte(textsStr), &texts); err == nil {
			tempPayload["texts"] = texts
		}
	}

	if fullTextStr, ok := tempPayload["full_text"].(string); ok {
		tempPayload["full_text"] = fullTextStr
	}

	// Convert string representations of numbers to actual numbers
	if isFailedStr, ok := tempPayload["is_failed"].(string); ok {
		if isFailed, err := strconv.ParseBool(isFailedStr); err == nil {
			tempPayload["is_failed"] = isFailed
		}
	}

	if isFinishedStr, ok := tempPayload["is_finished"].(string); ok {
		if isFinished, err := strconv.ParseBool(isFinishedStr); err == nil {
			tempPayload["is_finished"] = isFinished
		}
	}

	if percentStr, ok := tempPayload["percent"].(string); ok {
		if percent, err := strconv.ParseFloat(percentStr, 64); err == nil {
			tempPayload["percent"] = percent
		}
	}

	modifiedPayloadBytes, err := json.Marshal(tempPayload)
	if err != nil {
		return nil, fmt.Errorf("error marshalling modified payload: %w", err)
	}

	// Unmarshal the modified JSON into the Payload struct
	err = json.Unmarshal(modifiedPayloadBytes, &p)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling modified payload: %w", err)
	}

	return &p, nil
}
