package gapi

import (
	"context"
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetUserById(ctx context.Context, user_id uuid.UUID) (*db.GetUserByIDRow, error) {
	// first check if the id exists in redis
	key := fmt.Sprintf("user:%s", user_id.String())

	// Try to get from cache
	val, err := s.redisClient.Get(ctx, key).Result()
	if err == nil {
		// Cache hit
		var cachedUser db.GetUserByIDRow
		err = json.Unmarshal([]byte(val), &cachedUser)
		if err == nil {
			return &cachedUser, nil
		}
		// If unmarshal fails, proceed to get from DB
	}

	// Cache miss or unmarshal error, get from DB
	user, err := s.store.GetUserByID(ctx, user_id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user by id: %v", err)
	}

	userJSON, err := json.Marshal(user)
	if err == nil {
		s.redisClient.Set(ctx, key, userJSON, 5*time.Minute)
	}

	return &user, nil
}
