package db

import (
	"encoding/json"

	"github.com/google/uuid"
)

type KnowledgeBaseInfo struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type KBFileWithKBs struct {
	GetKBFilesWithKBsByFolderRow
	Kbs []KnowledgeBaseInfo `json:"kbs"`
}

type KBFileWithKBsByKBID struct {
	GetKBFilesByKBIDRow
	Kbs []KnowledgeBaseInfo `json:"kbs"`
}

type KBFileWithKBMapping struct {
	KbFile
	BuildStatus     string  `json:"build_status"`
	BuildPercentage float32 `json:"build_percentage"`
	IsBuildFinished bool    `json:"is_build_finished"`
	IsBuildFailed   bool    `json:"is_build_failed"`
}

type KBWithKBFiles struct {
	GetKBWithKBFilesByKBIDRow
	KbFiles []KBFileWithKBMapping `json:"kb_files"`
}

func ParseKBFileWithKBs(data *[]GetKBFilesWithKBsByFolderRow) ([]KBFileWithKBs, error) {
	var files []KBFileWithKBs
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return []KBFileWithKBs{}, err
	}
	err = json.Unmarshal(jsonBytes, &files)
	return files, err
}

func ParseKBFileWithKBsByKBID(data *[]GetKBFilesByKBIDRow) ([]KBFileWithKBsByKBID, error) {
	var files []KBFileWithKBsByKBID
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return []KBFileWithKBsByKBID{}, err
	}
	err = json.Unmarshal(jsonBytes, &files)
	return files, err
}

func ParseKBWithKBFiles(data *GetKBWithKBFilesByKBIDRow) (KBWithKBFiles, error) {
	var kb KBWithKBFiles
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return KBWithKBFiles{}, err
	}
	err = json.Unmarshal(jsonBytes, &kb)
	return kb, err
}
