package gapi

import (
	"context"
	"errors"
	db "gateway_service/db/sqlc"
	pb "gateway_service/pb"
	"gateway_service/util"
	"gateway_service/val"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.LoginUserResponse, error) {
	violations := validateLoginUserRequest(req)
	if violations != nil {
		return nil, invalidArgumentError(violations)
	}

	user, err := server.store.GetUserByUsername(ctx, req.GetUsername())
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to find user")
	}
	if user.IsActive == false {
		return nil, status.Errorf(codes.PermissionDenied, "user is not active")
	}

	err = util.CheckPassword(req.Password, user.HashedPassword)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "incorrect password")
	}

	accessToken, accessPayload, err := server.tokenMaker.CreateToken(
		user.Username,
		user.RoleName,
		server.config.AccessTokenDuration,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create access token")
	}

	refreshToken, refreshPayload, err := server.tokenMaker.CreateToken(
		user.Username,
		user.RoleName,
		server.config.RefreshTokenDuration,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create refresh token")
	}

	mtdt := server.extractMetadata(ctx)
	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		ID:           refreshPayload.ID,
		Username:     user.Username,
		RefreshToken: refreshToken,
		UserAgent:    mtdt.UserAgent,
		ClientIp:     mtdt.ClientIP,
		IsBlocked:    false,
		ExpiresAt:    refreshPayload.ExpiredAt,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session")
	}

	// update login time
	_, err = server.store.UpdateUser(ctx, db.UpdateUserParams{
		Username:  user.Username,
		LastLogin: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})

	rsp := &pb.LoginUserResponse{
		User:                  convertUser(user),
		SessionId:             session.ID.String(),
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		AccessTokenExpiresAt:  timestamppb.New(accessPayload.ExpiredAt),
		RefreshTokenExpiresAt: timestamppb.New(refreshPayload.ExpiredAt),
	}
	return rsp, nil
}

func (server *Server) LogoutUser(ctx context.Context, req *pb.LogoutUserRequest) (*pb.LogoutUserResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	u, err := uuid.Parse(req.GetSessionId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid session id")
	}

	err = server.store.DeleteSession(ctx, u)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete session")
	}

	return &pb.LogoutUserResponse{
		Message: "logout success",
	}, nil
}

func (server *Server) RenewAccessToken(ctx context.Context, req *pb.RenewAccessTokenRequest) (*pb.RenewAccessTokenResponse, error) {
	refreshPayload, err := server.tokenMaker.VerifyToken(req.RefreshToken)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid refresh token")
	}
	session, err := server.store.GetSession(ctx, refreshPayload.ID)
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "session not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to find session")
	}

	if session.IsBlocked {
		return nil, status.Errorf(codes.PermissionDenied, "session is blocked")
	}

	if session.Username != refreshPayload.Username {
		return nil, status.Errorf(codes.PermissionDenied, "username mismatch")
	}
	if time.Now().After(session.ExpiresAt) {
		return nil, status.Errorf(codes.PermissionDenied, "session expired")
	}

	accessToken, accessPayload, err := server.tokenMaker.CreateToken(
		refreshPayload.Username,
		refreshPayload.Role,
		server.config.AccessTokenDuration,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create access token")
	}

	rsp := &pb.RenewAccessTokenResponse{
		AccessToken:          accessToken,
		AccessTokenExpiresAt: timestamppb.New(accessPayload.ExpiredAt),
	}
	return rsp, nil
}

func validateLoginUserRequest(req *pb.LoginUserRequest) (violations []*errdetails.BadRequest_FieldViolation) {
	if err := val.ValidateUsername(req.GetUsername()); err != nil {
		violations = append(violations, fieldViolation("username", err))
	}

	if err := val.ValidatePassword(req.GetPassword()); err != nil {
		violations = append(violations, fieldViolation("password", err))
	}

	return violations
}
