package gapi

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	pb "gateway_service/pb"
	"gateway_service/util"
	"gateway_service/val"

	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	violations := validateCreateUserRequest(req)
	if violations != nil {
		return nil, invalidArgumentError(violations)
	}

	hashedPassword, err := util.HashPassword(req.GetPassword())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to hash password: %s", err)
	}

	arg := db.CreateUserTxParams{
		CreateUserParams: db.CreateUserParams{
			Username:       req.GetUsername(),
			HashedPassword: hashedPassword,
			Email:          req.GetEmail(),
			RoleName:       "user",
		},
		AfterCreate: func(user db.User) error {
			server.logger.Info("user created", "user_id", user.ID, "username", user.Username)
			return nil
		},
	}

	txResult, err := server.store.CreateUserTx(ctx, arg)
	if err != nil {
		if db.ErrorCode(err) == db.UniqueViolation {
			return nil, status.Error(codes.AlreadyExists, "username or email already exists")
		}
		return nil, status.Error(codes.Internal, "failed to create user")
	}

	_, err = server.fileService.CreateBucket(ctx, &file_service.CreateBucketRequest{
		BucketName: txResult.User.Username,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create bucket: %s", err)
	}

	_, err = server.store.CreateKB(ctx, db.CreateKBParams{
		Name:    "Default",
		OwnerID: txResult.User.ID,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create knowledge base: %s", err)
	}

	rsp := &pb.CreateUserResponse{
		User: convertUser(txResult.User),
	}
	return rsp, nil
}

func validateCreateUserRequest(req *pb.CreateUserRequest) (violations []*errdetails.BadRequest_FieldViolation) {
	if err := val.ValidateUsername(req.GetUsername()); err != nil {
		violations = append(violations, fieldViolation("username", err))
	}

	if err := val.ValidatePassword(req.GetPassword()); err != nil {
		violations = append(violations, fieldViolation("password", err))
	}

	if err := val.ValidateEmail(req.GetEmail()); err != nil {
		violations = append(violations, fieldViolation("email", err))
	}

	return violations
}
