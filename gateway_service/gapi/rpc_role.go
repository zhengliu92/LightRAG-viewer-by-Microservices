package gapi

import (
	"context"
	"fmt"
	pb "gateway_service/pb"
	"gateway_service/util"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) CreateRole(ctx context.Context, req *pb.CreateRoleRequest) (*pb.CreateRoleResponse, error) {

	role, err := server.store.CreateRole(ctx, req.GetRoleName())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create role: %s", err)
	}

	rsp := &pb.CreateRoleResponse{
		Role: &pb.Role{
			RoleName:  role.Name,
			CreatedAt: timestamppb.New(role.CreatedAt),
		},
	}
	return rsp, nil
}

func (server *Server) DeleteRole(ctx context.Context, req *pb.DeleteRoleRequest) (*pb.DeleteRoleResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	err = server.store.DeleteRoleByName(ctx, req.GetRoleName())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete role: %s", err)
	}

	rsp := &pb.DeleteRoleResponse{
		Message: fmt.Sprintf("role %s deleted", req.GetRoleName()),
	}
	return rsp, nil
}

func (server *Server) GetAllRoles(ctx context.Context, req *pb.GetAllRolesRequest) (*pb.GetAllRolesResponse, error) {
	roles, err := server.store.GetAllRoles(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get all roles: %s", err)
	}

	pb_roles := make([]*pb.Role, len(roles))
	for i, role := range roles {
		pb_roles[i] = &pb.Role{
			RoleName:  role.Name,
			CreatedAt: timestamppb.New(role.CreatedAt),
		}
	}

	rsp := &pb.GetAllRolesResponse{
		Roles: pb_roles,
	}
	return rsp, nil
}
