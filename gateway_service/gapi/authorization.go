package gapi

import (
	"context"
	"encoding/json"
	"fmt"
	db "gateway_service/db/sqlc"
	"gateway_service/token"
	"gateway_service/util"
	"strings"

	"google.golang.org/grpc/metadata"
)

func (server *Server) authorizeUser(ctx context.Context, accessibleRoles []string) (*token.Payload, error) {
	accessToken, err := getAccessTokenFromContext(ctx)
	if err != nil {
		return nil, err
	}

	payload, err := server.getPayloadFromAccessToken(*accessToken, accessibleRoles)
	if err != nil {
		return nil, err
	}

	return payload, nil
}

func (server *Server) getPayloadFromAccessToken(accessToken string, accessibleRoles []string) (*token.Payload, error) {
	payload, err := server.tokenMaker.VerifyToken(accessToken)

	if err != nil {
		return nil, fmt.Errorf("invalid access token: %s", err)
	}

	if !hasPermission(payload.Role, accessibleRoles) {
		return nil, fmt.Errorf("permission denied")
	}

	return payload, nil
}

func getAccessTokenFromContext(ctx context.Context) (*string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, fmt.Errorf("missing metadata")
	}

	values := md.Get(token.AuthorizationHeader)
	if len(values) == 0 {
		return nil, fmt.Errorf("missing authorization header")
	}

	authHeader := values[0]
	fields := strings.Fields(authHeader)
	if len(fields) < 2 {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	authType := strings.ToLower(fields[0])
	if authType != token.AuthorizationBearer {
		return nil, fmt.Errorf("unsupported authorization type: %s", authType)
	}

	accessToken := fields[1]
	return &accessToken, nil
}

func (server *Server) authAndGetUser(ctx context.Context, accessibleRoles []string) (*db.User, error) {
	accessToken, err := getAccessTokenFromContext(ctx)
	if err != nil {
		return nil, err
	}
	redis_key := fmt.Sprintf("access_token:%s:role:%s", *accessToken, util.ListStringToString(accessibleRoles, "_"))

	// first check if the access token is in redis
	userJson, err := server.redisClient.Get(ctx, redis_key).Result()
	if err == nil {
		user := db.User{}
		err = json.Unmarshal([]byte(userJson), &user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	payload, err := server.getPayloadFromAccessToken(*accessToken, accessibleRoles)
	if err != nil {
		return nil, err
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

func hasPermission(userRole string, accessibleRoles []string) bool {
	accessibleRoles = append(accessibleRoles, "admin")
	for _, role := range accessibleRoles {
		if userRole == role {
			return true
		}
	}
	return false
}
