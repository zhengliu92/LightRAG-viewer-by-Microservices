-- name: CreateRole :one
INSERT INTO "role" (name)
VALUES ($1)
RETURNING *;

-- name: GetRoleByID :one
SELECT id, name, created_at
FROM "role"
WHERE id = $1;

-- name: GetAllRoles :many
SELECT id, name, created_at
FROM "role";


-- name: GetRoleByName :one
SELECT id, name, created_at
FROM "role"
WHERE name = $1;

-- name: UpdateRoleName :exec
UPDATE "role"
SET name = $2
WHERE id = $1;

-- name: DeleteRoleByName :exec
DELETE FROM "role"
WHERE name = $1;

