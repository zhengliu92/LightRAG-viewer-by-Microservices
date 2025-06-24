-- name: CreateFileFigures :exec
INSERT INTO "file_figures" (owner_id, section, kb_file_id, img_path, caption, page_number)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: CreateFileTables :exec
INSERT INTO "file_tables" (owner_id, section, kb_file_id, table_html, page_number, caption)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: CreateFileFullText :exec
INSERT INTO "file_full_text" (owner_id, kb_file_id, full_text)
VALUES ($1, $2, $3);

-- name: CreateFileTexts :exec
INSERT INTO "file_texts" (owner_id, section, kb_file_id, text, page_number)
VALUES ($1, $2, $3, $4, $5);

-- name: GetFileTextsByKBFileID :many
SELECT * FROM "file_texts" WHERE kb_file_id = $1;

-- name: GetFileTablesByKBFileID :many
SELECT * FROM "file_tables" WHERE kb_file_id = $1;

-- name: GetFileFiguresByKBFileID :many
SELECT * FROM "file_figures" WHERE kb_file_id = $1;

-- name: GetFileFigureByID :one
SELECT * FROM "file_figures" WHERE id = $1;

-- name: GetFileFullTextByID :one
SELECT * FROM "file_full_text" WHERE id = $1;

-- name: GetFileFullTextByKBFileID :one
SELECT * FROM "file_full_text" WHERE kb_file_id = $1;
