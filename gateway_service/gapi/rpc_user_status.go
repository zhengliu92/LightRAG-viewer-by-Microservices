package gapi

import (
	"context"
	"errors"
	db "gateway_service/db/sqlc"
	pb "gateway_service/pb"
	"gateway_service/util"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) GetUserMe(ctx context.Context, req *pb.MeRequest) (*pb.MeResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	return &pb.MeResponse{
		User: convertUser(*user),
	}, nil
}

func (server *Server) GetUserByID(ctx context.Context, req *pb.GetUserByIDRequest) (*pb.GetUserByIDResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	user, err := server.GetUserById(ctx, uuid.MustParse(req.Id))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to find user")
	}

	return &pb.GetUserByIDResponse{
		User: &pb.User{
			Username: user.Username,
			RoleName: user.RoleName,
			Email:    user.Email,
			Phone:    user.Phone.String,
		},
	}, nil
}

func (server *Server) ActivateUser(ctx context.Context, req *pb.ActivateUserRequest) (*pb.ActivateUserResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	user_id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error parsing user id")
	}
	user, err := server.GetUserById(ctx, user_id)
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to find user")
	}

	if user.IsActive {
		return &pb.ActivateUserResponse{
			Message: "User activated",
		}, nil
	}

	err = server.store.ActivateUser(ctx, user_id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to activate user")
	}

	return &pb.ActivateUserResponse{
		Message: "User activated",
	}, nil
}

func (server *Server) DeactivateUser(ctx context.Context, req *pb.DeactivateUserRequest) (*pb.DeactivateUserResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	user_id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Error parsing user id")
	}
	user, err := server.GetUserById(ctx, user_id)
	if err != nil {
		if errors.Is(err, db.ErrRecordNotFound) {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to find user")
	}

	if !user.IsActive {
		return &pb.DeactivateUserResponse{
			Message: "User deactivated",
		}, nil
	}

	err = server.store.DeactivateUser(ctx, user_id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to deactivate user")
	}

	return &pb.DeactivateUserResponse{
		Message: "User deactivated",
	}, nil
}
