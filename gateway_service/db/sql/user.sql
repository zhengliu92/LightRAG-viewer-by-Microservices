-- name: CreateUser :one
INSERT INTO "user" (email, username, hashed_password, role_name, phone)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByID :one
SELECT id, email, username, is_active, is_email_verified, last_login, created_at, role_name, phone
FROM "user"
WHERE id = $1;

-- name: GetUserByUsername :one
SELECT *
FROM "user"
WHERE username = $1;

-- name: GetUserByEmail :one
SELECT id, email, username, is_active, is_email_verified, last_login, created_at, role_name
FROM "user"
WHERE email = $1;


-- name: DeactivateUser :exec
UPDATE "user"
SET is_active = FALSE, deleted_at = now()
WHERE id = $1;

-- name: ActivateUser :exec
UPDATE "user"
SET is_active = TRUE, deleted_at = '0001-01-01 00:00:00Z'
WHERE id = $1;

-- name: UpdateUser :one
UPDATE "user"
SET
  hashed_password = COALESCE(sqlc.narg(hashed_password), hashed_password),
  password_changed_at = COALESCE(sqlc.narg(password_changed_at), password_changed_at),
  avatar = COALESCE(sqlc.narg(avatar), avatar),
  email = COALESCE(sqlc.narg(email), email),
  phone = COALESCE(sqlc.narg(phone), phone),
  is_email_verified = COALESCE(sqlc.narg(is_email_verified), is_email_verified),
  last_login = COALESCE(sqlc.narg(last_login), last_login),
  role_name = COALESCE(sqlc.narg(role_name), role_name),
  is_active = COALESCE(sqlc.narg(is_active), is_active)
WHERE
  username = sqlc.arg(username)
RETURNING *;


