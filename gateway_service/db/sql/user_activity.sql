-- name: CreateUserActivity :exec
INSERT INTO "user_activity" (user_id, activity_type, details)
VALUES ($1, $2, $3);

-- name: GetUserActivitiesByUserID :many
SELECT id, user_id, activity_type, details, created_at
FROM "user_activity"
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetActivitiesByType :many
SELECT id, user_id, activity_type, details, created_at
FROM "user_activity"
WHERE activity_type = $1
ORDER BY created_at DESC;

-- name: DeleteUserActivity :exec
DELETE FROM "user_activity"
WHERE id = $1;
