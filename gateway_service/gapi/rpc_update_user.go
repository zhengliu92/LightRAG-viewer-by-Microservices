package gapi

import (
	"context"
	"errors"
	db "gateway_service/db/sqlc"
	pb "gateway_service/pb"
	"gateway_service/util"
	"gateway_service/val"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UpdateUserResponse, error) {
	payloadUser, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	violations := validateUpdateUserRequest(req)
	if violations != nil {
		return nil, invalidArgumentError(violations)
	}

	arg := db.UpdateUserParams{
		Username: req.GetUsername(),
		Email: pgtype.Text{
			String: req.GetEmail(),
			Valid:  req.Email != nil,
		},
		IsEmailVerified: pgtype.Bool{
			Bool:  false,
			Valid: req.Email != nil,
		},
		Avatar: pgtype.Text{
			String: req.GetAvatar(),
			Valid:  req.Avatar != nil,
		},
		Phone: pgtype.Text{
			String: req.GetPhone(),
			Valid:  req.Phone != nil,
		},
	}
	if payloadUser.RoleName == util.Admin {
		arg.RoleName = pgtype.Text{
			String: req.GetRoleName(),
			Valid:  req.RoleName != nil,
		}
		arg.IsActive = pgtype.Bool{
			Bool:  req.GetIsActive(),
			Valid: req.IsActive != nil,
		}
	} else {
		if req.RoleName != nil {
			return nil, status.Errorf(codes.PermissionDenied, "only admin can update user role")
		}
		if payloadUser.Username != req.GetUsername() {
			return nil, status.Errorf(codes.PermissionDenied, "cannot update other user's info")
		}
	}

	if req.Password != nil {
		hashedPassword, err := util.HashPassword(req.GetPassword())
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to hash password: %s", err)
		}

		arg.HashedPassword = pgtype.Text{
			String: hashedPassword,
			Valid:  true,
		}

		arg.PasswordChangedAt = pgtype.Timestamptz{
			Time:  time.Now(),
			Valid: true,
		}
	}

	user, err := server.store.UpdateUser(ctx, arg)

	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to update user: %s", err)
	}

	rsp := &pb.UpdateUserResponse{
		User: convertUser(user),
	}
	return rsp, nil
}

func validateUpdateUserRequest(req *pb.UpdateUserRequest) (violations []*errdetails.BadRequest_FieldViolation) {
	if err := val.ValidateUsername(req.GetUsername()); err != nil {
		violations = append(violations, fieldViolation("username", err))
	}
	if req.RoleName != nil {
		if err := val.ValidateRoleName(req.GetRoleName()); err != nil {
			violations = append(violations, fieldViolation("role_name", err))
		}
	}
	if req.Phone != nil {
		if err := val.ValidatePhone(req.GetPhone()); err != nil {
			violations = append(violations, fieldViolation("phone", err))
		}
	}

	if req.Password != nil {
		if err := val.ValidatePassword(req.GetPassword()); err != nil {
			violations = append(violations, fieldViolation("password", err))
		}
	}

	if req.FullName != nil {
		if err := val.ValidateFullName(req.GetFullName()); err != nil {
			violations = append(violations, fieldViolation("full_name", err))
		}
	}

	if req.Email != nil {
		if err := val.ValidateEmail(req.GetEmail()); err != nil {
			violations = append(violations, fieldViolation("email", err))
		}
	}

	return violations
}
