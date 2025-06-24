-- name: CreateSession :one
INSERT INTO session (
  id,
  username,
  refresh_token,
  user_agent,
  client_ip,
  is_blocked,
  expires_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: ClearCurrentExpiredSessions :exec
DELETE FROM session
WHERE expires_at < now() AND is_blocked = false;


-- name: DeleteSession :exec
DELETE FROM session
WHERE id = $1;


-- name: GetSession :one
SELECT * FROM session
WHERE id = $1 LIMIT 1;
