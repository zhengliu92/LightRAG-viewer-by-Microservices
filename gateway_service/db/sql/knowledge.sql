-- name: CreateKB :one
INSERT INTO "knowledge_base" (name, owner_id)
VALUES ($1, $2)
RETURNING *;

-- name: ChangeKBName :one
UPDATE "knowledge_base"
SET name = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: GetKB :one
SELECT * FROM "knowledge_base"
WHERE id = $1; 


-- name: DeleteKB :exec
DELETE FROM "knowledge_base"
WHERE id = $1;

-- name: GetUserKBs :many
SELECT "knowledge_base"."id",
        "knowledge_base"."name",
        "knowledge_base"."owner_id",
        "knowledge_base"."created_at",
        "knowledge_base"."updated_at",
        COUNT(kb_file_mapping.kb_file_id) AS kb_file_count,
        SUM(CASE WHEN kb_file_mapping.is_build_finished = true AND kb_file_mapping.is_build_failed = false THEN 1 ELSE 0 END) AS kb_file_build_finished_count
FROM "knowledge_base"
LEFT JOIN kb_file_mapping ON knowledge_base.id = kb_file_mapping.kb_id
LEFT JOIN knowledge_base_project_mapping ON knowledge_base.id = knowledge_base_project_mapping.knowledge_base_id
WHERE knowledge_base.owner_id = $1
AND knowledge_base_project_mapping.project_id IS NULL
GROUP BY knowledge_base.id
ORDER BY kb_file_count DESC;



-- name: CreateKBFile :one
INSERT INTO "kb_file" (
    name,
    path,
    folder,
    size,
    owner_id
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: UpdateKBFile :one
UPDATE "kb_file"
SET
  name = COALESCE(sqlc.narg(name), name),
  path = COALESCE(sqlc.narg(path), path),
  folder = COALESCE(sqlc.narg(folder), folder), 
  owner_id = COALESCE(sqlc.narg(owner_id), owner_id),
  parse_status = COALESCE(sqlc.narg(parse_status), parse_status),
  parse_percentage = COALESCE(sqlc.narg(parse_percentage), parse_percentage),
  is_parse_finished = COALESCE(sqlc.narg(is_parse_finished), is_parse_finished),
  is_assets_updated = COALESCE(sqlc.narg(is_assets_updated), is_assets_updated),
  is_parse_failed = COALESCE(sqlc.narg(is_parse_failed), is_parse_failed),
  updated_at = now()
WHERE id = sqlc.arg(id)
RETURNING *;


-- name: GetKBFileByOwnerAndPath :one
SELECT * FROM "kb_file"
JOIN "user" ON "kb_file".owner_id = "user".id
WHERE "user".username = $1 AND "kb_file".path = $2
LIMIT 1;




-- name: GetKBFile :one
SELECT * FROM "kb_file"
WHERE id = $1;


-- name: GetKBFilesByKBID :many
SELECT 
    kb_file.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', kb.id,
                'name', kb.name
            )
        ) FILTER (WHERE kb.id IS NOT NULL),
        '[]'
    ) as kbs
FROM "kb_file"
LEFT JOIN kb_file_mapping kbm ON kb_file.id = kbm.kb_file_id
LEFT JOIN knowledge_base kb ON kbm.kb_id = kb.id
WHERE kbm.kb_id = $1
GROUP BY kb_file.id;


-- name: GetKBFilesByFolder :many
SELECT * FROM "kb_file"
WHERE folder = $1 AND owner_id = $2;


-- name: GetKBFilesWithKBsByFolder :many
SELECT 
    kb_file.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', knowledge_base.id,
                'name', knowledge_base.name
            )
        ) FILTER (WHERE knowledge_base.id IS NOT NULL),
        '[]'
    ) as kbs
FROM "kb_file"
LEFT JOIN kb_file_mapping kbm ON kb_file.id = kbm.kb_file_id
LEFT JOIN knowledge_base ON kbm.kb_id = knowledge_base.id
WHERE kb_file.folder = $1 AND kb_file.owner_id = $2
GROUP BY kb_file.id;



-- name: GetKBWithKBFilesByKBID :one
SELECT 
    knowledge_base.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', kb_file.id,
                'name', kb_file.name,
                'path', kb_file.path,
                'owner_id', kb_file.owner_id,
                'folder', kb_file.folder,
                'size', kb_file.size,
                'created_at', kb_file.created_at,
                'updated_at', kb_file.updated_at,
                'parse_status', kb_file.parse_status,
                'parse_percentage', kb_file.parse_percentage,
                'is_parse_finished', kb_file.is_parse_finished,
                'is_parse_failed', kb_file.is_parse_failed,
                'build_status', kbm.build_status,
                'build_percentage', kbm.build_percentage,
                'is_build_finished', kbm.is_build_finished,
                'is_build_failed', kbm.is_build_failed
            )
        ) FILTER (WHERE kb_file.id IS NOT NULL),
        '[]'
    ) as kb_files,
    COUNT(kb_file.id) as kb_file_count
FROM "knowledge_base"
LEFT JOIN kb_file_mapping kbm ON knowledge_base.id = kbm.kb_id
LEFT JOIN kb_file ON kbm.kb_file_id = kb_file.id
WHERE knowledge_base.id = $1
GROUP BY knowledge_base.id;



-- name: GetKBFilesByOwner :many
SELECT * FROM "kb_file"
WHERE owner_id = $1;


-- name: DeleteKBFile :exec
DELETE FROM "kb_file"
WHERE id = $1;


-- name: GetKBFileMapping :one
SELECT * FROM "kb_file_mapping"
WHERE kb_id = $1 AND kb_file_id = $2;


-- name: UpdateKBFileMapping :one
UPDATE "kb_file_mapping"
SET 
    build_status = COALESCE(sqlc.narg(build_status), build_status),
    build_percentage = COALESCE(sqlc.narg(build_percentage), build_percentage),
    is_build_finished = COALESCE(sqlc.narg(is_build_finished), is_build_finished),
    is_build_failed = COALESCE(sqlc.narg(is_build_failed), is_build_failed)
WHERE kb_id = sqlc.arg(kb_id) AND kb_file_id = sqlc.arg(kb_file_id)
RETURNING *;




-- name: AddFileToKB :exec
INSERT INTO kb_file_mapping (kb_id, kb_file_id)
VALUES ($1, $2);


-- name: RemoveFileFromKB :exec
DELETE FROM kb_file_mapping
WHERE kb_id = $1 AND kb_file_id = $2;




-- name: DeleteKBFileByPathAndOwnerID :exec
DELETE FROM "kb_file"
WHERE path = $1 AND owner_id = $2;

-- name: UpsertRagConfig :exec
INSERT INTO "rag_config" (owner_id, kb_id, chunk_token_size, chunk_overlap_token_size, embed_model)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (owner_id, kb_id) DO UPDATE SET chunk_token_size = $3, chunk_overlap_token_size = $4, embed_model = $5;

-- name: GetRagConfigByKBID :one
SELECT 
    "rag_config".*,
    "knowledge_base".name as kb_name
FROM "rag_config"
LEFT JOIN "knowledge_base" ON "rag_config".kb_id = "knowledge_base".id
WHERE "knowledge_base".id = $1;


-- name: GetNumValidKBFilesByKBID :one
SELECT COUNT(*) FROM "kb_file_mapping"
WHERE kb_id = $1 AND is_build_failed = false AND is_build_finished = true;



