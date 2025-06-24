-- name: CreateProject :one
INSERT INTO "project" (name, owner_id, description)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetProjectByID :one
SELECT * FROM "project"
WHERE "id" = $1;

-- name: ListProjects :many
SELECT 
    "project".*,
    EXISTS (
        SELECT 1 
        FROM "user_project_mapping" 
        WHERE "user_project_mapping"."project_id" = "project"."id" 
        AND "user_project_mapping"."user_id" = $1
    ) AS is_member,
    "project"."owner_id" = $1 AS is_owner
FROM "project";

-- name: IsUserInProject :one
SELECT EXISTS (SELECT 1 FROM "user_project_mapping" WHERE "user_id" = $1 AND "project_id" = $2);

-- name: ListJoinedProjects :many
SELECT * FROM "project"
WHERE "id" IN (SELECT "project_id" FROM "user_project_mapping" WHERE "user_id" = $1);

-- name: AddUserToProject :exec
INSERT INTO "user_project_mapping" (user_id, project_id)
VALUES ($1, $2)
ON CONFLICT (user_id, project_id) DO NOTHING;

-- name: RemoveUserFromProject :exec
DELETE FROM "user_project_mapping"
WHERE user_id = $1 AND project_id = $2;

-- name: GetUserProjectsWithKBs :many
SELECT 
    "project".*, 
    COALESCE(
        (SELECT jsonb_agg(kb_info) 
         FROM (
             SELECT 
                 kb.id,
                 kb.name,
                 kb.owner_id,
                 kb.created_at,
                 kb.updated_at,
                 COUNT(DISTINCT kb_file_mapping.kb_file_id) AS kb_file_count,
                 SUM(CASE 
                     WHEN kb_file_mapping.is_build_finished = true 
                        AND kb_file_mapping.is_build_failed = false 
                     THEN 1 
                     ELSE 0 
                 END) AS kb_file_build_finished_count
             FROM "knowledge_base" AS "kb"
             LEFT JOIN "knowledge_base_project_mapping" 
                 ON "kb"."id" = "knowledge_base_project_mapping"."knowledge_base_id"
             LEFT JOIN "kb_file_mapping" 
                 ON "kb"."id" = "kb_file_mapping"."kb_id"
             WHERE "knowledge_base_project_mapping"."project_id" = "project"."id"
             GROUP BY kb.id
             HAVING kb.id IS NOT NULL
         ) AS kb_info),
        '[]'
    ) AS kbs,
    COUNT("user_project_mapping"."user_id") AS num_users
FROM "project"
LEFT JOIN "user_project_mapping" 
    ON "project"."id" = "user_project_mapping"."project_id"
WHERE "user_project_mapping"."user_id" = $1
GROUP BY "project"."id";

-- name: AddKBToProject :exec
INSERT INTO "knowledge_base_project_mapping" (knowledge_base_id, project_id)
VALUES ($1, $2);

-- name: RemoveKBFromProject :exec
DELETE FROM "knowledge_base_project_mapping"
WHERE knowledge_base_id = $1 AND project_id = $2;

-- name: ListUsersWithProjects :many
SELECT  
    "user".*,
    COALESCE(
        (SELECT jsonb_agg(project_info) 
         FROM (
             SELECT 
                 "project".id,
                 "project".name,
                 "project".owner_id,
                 "project".description,
                 "project".created_at
             FROM "project"
             LEFT JOIN "user_project_mapping" ON "project"."id" = "user_project_mapping"."project_id"
             WHERE "user_project_mapping"."user_id" = "user"."id"
         ) AS project_info),
        '[]'
    ) AS projects
FROM "user" 
GROUP BY "user"."id"
ORDER BY "user"."id";

-- name: GetProjectWithUsersAndKBs :one
SELECT 
    "project".*, 
    COALESCE(
        (SELECT jsonb_agg(user_info) 
         FROM (
             SELECT 
                 "user".id,
                 "user".email,
                 "user".username,
                 "user".role_name,
                 "user".is_active,
                 "user".is_email_verified,
                 "user".avatar,
                 "user".phone,
                 "user".created_at,
                 "user".last_login
             FROM "user"
             LEFT JOIN "user_project_mapping" ON "user"."id" = "user_project_mapping"."user_id"
             WHERE "user_project_mapping"."project_id" = "project"."id"
             GROUP BY "user"."id"
             HAVING "user"."id" IS NOT NULL
         ) AS user_info),
        '[]'
    ) AS users,
    COALESCE(
        (SELECT jsonb_agg(kb_info) 
         FROM (
             SELECT 
                 "kb".id,
                 "kb".name,
                 "kb".owner_id,
                 COUNT(DISTINCT "kb_file_mapping"."kb_file_id") AS kb_file_count,
                 SUM(CASE 
                     WHEN "kb_file_mapping"."is_build_finished" = true 
                        AND "kb_file_mapping"."is_build_failed" = false 
                     THEN 1 
                     ELSE 0 
                 END) AS kb_file_build_finished_count,
                 "kb".created_at,
                 "kb".updated_at
             FROM "knowledge_base" AS "kb"
             LEFT JOIN "knowledge_base_project_mapping" ON "kb"."id" = "knowledge_base_project_mapping"."knowledge_base_id" 
             LEFT JOIN "kb_file_mapping" ON "kb"."id" = "kb_file_mapping"."kb_id"
             WHERE "knowledge_base_project_mapping"."project_id" = "project"."id"
             GROUP BY "kb"."id"
             HAVING "kb"."id" IS NOT NULL
         ) AS kb_info),
        '[]'
    ) AS kbs
FROM "project"
WHERE "project"."id" = $1;


-- name: IsKbAccessibleByUserID :one
SELECT EXISTS (
    SELECT 1 
    FROM (
        -- Check if user has access through project mapping
        SELECT 1 
        FROM "user_project_mapping" upm
        JOIN "knowledge_base_project_mapping" kbpm 
            ON upm.project_id = kbpm.project_id
        WHERE upm.user_id = $1 
            AND kbpm.knowledge_base_id = $2

        UNION

        -- Check if user is the owner of the knowledge base
        SELECT 1
        FROM "knowledge_base"  
        WHERE "knowledge_base"."id" = $2 AND "knowledge_base"."owner_id" = $1

    ) access_check
) AS is_accessible;


-- name: CountKBsInProject :one
SELECT COUNT(*) FROM "knowledge_base_project_mapping" WHERE "project_id" = $1;


-- name: DeleteProject :exec
DELETE FROM "project"
WHERE "id" = $1
  AND NOT EXISTS (
    SELECT 1 FROM "knowledge_base_project_mapping"
    WHERE "project_id" = $1
  );


-- name: RenameProject :exec
UPDATE "project"
SET "name" = $2
WHERE "id" = $1;