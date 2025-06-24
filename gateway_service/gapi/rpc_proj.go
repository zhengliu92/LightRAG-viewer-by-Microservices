package gapi

import (
	"context"
	db "gateway_service/db/sqlc"
	pb "gateway_service/pb"
	"gateway_service/util"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) CreateProject(ctx context.Context, req *pb.CreateProjectRequest) (*pb.CreateProjectResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	project, err := server.store.CreateProject(ctx, db.CreateProjectParams{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     user.ID,
	})

	if err != nil {
		return nil, err
	}

	server.store.AddUserToProject(ctx, db.AddUserToProjectParams{
		ProjectID: project.ID,
		UserID:    user.ID,
	})

	return &pb.CreateProjectResponse{
		Message: "Project created successfully",
	}, nil
}
func (server *Server) ListProjects(ctx context.Context, req *pb.ListProjectsRequest) (*pb.ListProjectsResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	projects, err := server.store.ListProjects(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	pb_projects, err := convertDbProjectToPb(&projects)
	if err != nil {
		return nil, err
	}

	return &pb.ListProjectsResponse{
		Projects: pb_projects,
	}, nil
}
func (server *Server) AddUserToProject(ctx context.Context, req *pb.AddUserToProjectRequest) (*pb.AddUserToProjectResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	project, err := server.store.GetProjectByID(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}

	if project.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "您没有权限添加用户到此项目")
	}

	server.store.AddUserToProject(ctx, db.AddUserToProjectParams{
		ProjectID: uuid.MustParse(req.ProjectId),
		UserID:    uuid.MustParse(req.UserId),
	})

	return &pb.AddUserToProjectResponse{
		Message: "User added to project successfully",
	}, nil
}

func (server *Server) RemoveUserFromProject(ctx context.Context, req *pb.RemoveUserFromProjectRequest) (*pb.RemoveUserFromProjectResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	if user.ID != uuid.MustParse(req.UserId) {
		project, err := server.store.GetProjectByID(ctx, uuid.MustParse(req.ProjectId))
		if err != nil {
			return nil, err
		}
		if project.OwnerID != user.ID {
			return nil, status.Error(codes.PermissionDenied, "您无权移除除了自身以外的用户")
		}
	}

	server.store.RemoveUserFromProject(ctx, db.RemoveUserFromProjectParams{
		ProjectID: uuid.MustParse(req.ProjectId),
		UserID:    uuid.MustParse(req.UserId),
	})

	return &pb.RemoveUserFromProjectResponse{
		Message: "User removed from project successfully",
	}, nil
}

func (server *Server) AddKBToProject(ctx context.Context, req *pb.AddKBToProjectRequest) (*pb.AddKBToProjectResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	server.store.AddKBToProject(ctx, db.AddKBToProjectParams{
		ProjectID:       uuid.MustParse(req.ProjectId),
		KnowledgeBaseID: uuid.MustParse(req.KbId),
	})

	return &pb.AddKBToProjectResponse{
		Message: "KB added to project successfully",
	}, nil
}

func (server *Server) RemoveKBFromProject(ctx context.Context, req *pb.RemoveKBFromProjectRequest) (*pb.RemoveKBFromProjectResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	server.store.RemoveKBFromProject(ctx, db.RemoveKBFromProjectParams{
		ProjectID:       uuid.MustParse(req.ProjectId),
		KnowledgeBaseID: uuid.MustParse(req.KbId),
	})

	return &pb.RemoveKBFromProjectResponse{
		Message: "KB removed from project successfully",
	}, nil
}

func (server *Server) GetUserProjectsWithKBs(ctx context.Context, req *pb.GetUserProjectsWithKBsRequest) (*pb.GetUserProjectsWithKBsResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.User})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	projects, err := server.store.GetUserProjectsWithKBs(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	pb_projects, err := ConvertUserProjectsWithKBs(&projects)
	if err != nil {
		return nil, err
	}

	return &pb.GetUserProjectsWithKBsResponse{
		Projects: pb_projects,
	}, nil
}

func (server *Server) ListUsersWithProjects(ctx context.Context, req *pb.ListUsersWithProjectsRequest) (*pb.ListUsersWithProjectsResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}

	usersWithProjects, err := server.store.ListUsersWithProjects(ctx)
	if err != nil {
		return nil, err
	}
	pb_usersWithProjects, err := ConvertUsersWithProjects(usersWithProjects)
	if err != nil {
		return nil, err
	}
	return &pb.ListUsersWithProjectsResponse{
		UsersWithProjects: pb_usersWithProjects,
	}, nil
}

func (server *Server) GetProjectWithUsersAndKBs(ctx context.Context, req *pb.GetProjectWithUsersAndKBsRequest) (*pb.GetProjectWithUsersAndKBsResponse, error) {
	_, err := server.authorizeUser(ctx, []string{util.Admin})

	if err != nil {
		return nil, unauthenticatedError(err)
	}
	project, err := server.store.GetProjectWithUsersAndKBs(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}
	pb_project, err := ConvertProjectWithUsersAndKBsToPb(&project)
	if err != nil {
		return nil, err
	}
	return &pb.GetProjectWithUsersAndKBsResponse{Project: pb_project}, nil
}

func (server *Server) DeleteProject(ctx context.Context, req *pb.DeleteProjectRequest) (*pb.DeleteProjectResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	proj, err := server.store.GetProjectByID(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}

	if proj.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "您没有权限删除此项目")
	}

	kb_count, err := server.store.CountKBsInProject(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}

	if kb_count > 0 {
		return nil, status.Error(codes.PermissionDenied, "项目中还有知识库，请先删除知识库")
	}

	err = server.store.DeleteProject(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}
	return &pb.DeleteProjectResponse{
		Message: "Project deleted successfully",
	}, nil
}

func (server *Server) RenameProject(ctx context.Context, req *pb.RenameProjectRequest) (*pb.RenameProjectResponse, error) {
	user, err := server.authAndGetUser(ctx, []string{util.Admin})
	if err != nil {
		return nil, unauthenticatedError(err)
	}
	proj, err := server.store.GetProjectByID(ctx, uuid.MustParse(req.ProjectId))
	if err != nil {
		return nil, err
	}

	if proj.OwnerID != user.ID {
		return nil, status.Error(codes.PermissionDenied, "您没有权限重命名此项目")
	}

	err = server.store.RenameProject(ctx, db.RenameProjectParams{
		ID:   uuid.MustParse(req.ProjectId),
		Name: req.NewName,
	})
	if err != nil {
		return nil, err
	}
	return &pb.RenameProjectResponse{
		Message: "Project renamed successfully",
	}, nil
}
