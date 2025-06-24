package rag_server

import (
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"gateway_service/token"
	"gateway_service/util"
	"net/http"
	"strings"
)

func (server *Server) authorizeUser(r *http.Request) (*db.User, error) {
	ctx := r.Context()
	tokenHeader := r.Header.Get(token.AuthorizationHeader)

	fields := strings.Fields(tokenHeader)
	if len(fields) < 2 {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	authType := strings.ToLower(fields[0])
	if authType != token.AuthorizationBearer {
		return nil, fmt.Errorf("unsupported authorization type: %s", authType)
	}

	accessToken := fields[1]

	accessibleRoles := []string{"user"}
	redis_key := fmt.Sprintf("access_token:%s:role:%s", accessToken, util.ListStringToString(accessibleRoles, "_"))
	userJson, err := server.redisClient.Get(ctx, redis_key).Result()
	if err == nil {
		user := db.User{}
		err = json.Unmarshal([]byte(userJson), &user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	payload, err := server.tokenMaker.VerifyToken(accessToken)
	if err != nil {
		return nil, fmt.Errorf("invalid access token: %s", err)
	}

	user, err := server.store.GetUserByUsername(ctx, payload.Username)
	if err != nil {
		return nil, err
	}

	// pop hashed password from user
	user.HashedPassword = ""
	// save to redis
	usrJson, err := json.Marshal(user)
	if err != nil {
		return nil, err
	}

	server.redisClient.Set(ctx, redis_key, string(usrJson), server.config.AccessTokenDuration)
	return &user, nil

}
