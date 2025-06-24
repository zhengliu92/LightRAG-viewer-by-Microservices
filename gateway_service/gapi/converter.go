package gapi

import (
	"encoding/json"
	db "gateway_service/db/sqlc"
	pb "gateway_service/pb"
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"
)

func convertUser(user db.User) *pb.User {
	return &pb.User{
		Id:              user.ID.String(),
		Username:        user.Username,
		Email:           user.Email,
		RoleName:        user.RoleName,
		IsActive:        user.IsActive,
		IsEmailVerified: user.IsEmailVerified,
		Phone:           user.Phone.String,
		Avatar:          user.Avatar,
		CreatedAt:       timestamppb.New(user.CreatedAt),
		LastLogin:       timestamppb.New(user.LastLogin),
	}
}

func ConvertUserProjectsWithKBs(projects *[]db.GetUserProjectsWithKBsRow) ([]*pb.ProjectWithKBs, error) {
	pb_projects := make([]*pb.ProjectWithKBs, 0)
	for _, p := range *projects {
		pb_kbs, err := convertKbToPb(p.Kbs)
		if err != nil {
			return nil, err
		}
		pb_projects = append(pb_projects, &pb.ProjectWithKBs{
			Id:          p.ID.String(),
			Name:        p.Name,
			Description: p.Description,
			OwnerId:     p.OwnerID.String(),
			CreatedAt:   timestamppb.New(p.CreatedAt),
			Kbs:         pb_kbs,
		})
	}
	return pb_projects, nil
}

func ConvertProjectWithUsersAndKBsToPb(project *db.GetProjectWithUsersAndKBsRow) (*pb.ProjectWithUsersAndKBs, error) {
	pb_kbs, err := convertKbToPb(project.Kbs)
	if err != nil {
		return nil, err
	}
	pb_users, err := convertUserToPb(project.Users)
	if err != nil {
		return nil, err
	}
	return &pb.ProjectWithUsersAndKBs{
		Id:          project.ID.String(),
		Name:        project.Name,
		Description: project.Description,
		OwnerId:     project.OwnerID.String(),
		CreatedAt:   timestamppb.New(project.CreatedAt),
		Kbs:         pb_kbs,
		Users:       pb_users,
	}, nil
}

func convertKbToPb(kb interface{}) ([]*pb.KB, error) {
	rawKBs := make([]map[string]interface{}, 0)
	bytes, err := json.Marshal(kb)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(bytes, &rawKBs)
	if err != nil {
		return nil, err
	}

	pb_kb := make([]*pb.KB, 0)
	for _, rawKB := range rawKBs {
		KbFileCount := int64(rawKB["kb_file_count"].(float64))
		KbFileBuildFinishedCount := int64(rawKB["kb_file_build_finished_count"].(float64))
		createdAtStr := rawKB["created_at"].(string)
		createdAtTime, err := time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			return nil, err
		}
		updatedAtStr := rawKB["updated_at"].(string)
		updatedAtTime, err := time.Parse(time.RFC3339, updatedAtStr)
		if err != nil {
			return nil, err
		}
		CreatedAt := timestamppb.New(createdAtTime)
		UpdatedAt := timestamppb.New(updatedAtTime)
		pb_kb = append(pb_kb, &pb.KB{
			Id:                       rawKB["id"].(string),
			Name:                     rawKB["name"].(string),
			OwnerId:                  rawKB["owner_id"].(string),
			KbFileCount:              &KbFileCount,
			KbFileBuildFinishedCount: &KbFileBuildFinishedCount,
			CreatedAt:                CreatedAt,
			UpdatedAt:                UpdatedAt,
		})
	}
	return pb_kb, nil
}

func convertUserToPb(users interface{}) ([]*pb.User, error) {
	rawUsers := make([]map[string]interface{}, 0)
	bytes, err := json.Marshal(users)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(bytes, &rawUsers)
	if err != nil {
		return nil, err
	}
	pb_users := make([]*pb.User, 0)
	for _, user := range rawUsers {
		createdAtStr := user["created_at"].(string)
		createdAtTime, err := time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			return nil, err
		}
		lastLoginStr := user["last_login"].(string)
		lastLoginTime, err := time.Parse(time.RFC3339, lastLoginStr)
		if err != nil {
			return nil, err
		}
		// check if phone is null
		var phone string
		if phoneVal, ok := user["phone"]; ok && phoneVal != nil {
			phone = phoneVal.(string)
		}

		pb_users = append(pb_users, &pb.User{
			Id:              user["id"].(string),
			Username:        user["username"].(string),
			Email:           user["email"].(string),
			RoleName:        user["role_name"].(string),
			IsActive:        user["is_active"].(bool),
			IsEmailVerified: user["is_email_verified"].(bool),
			Avatar:          user["avatar"].(string),
			Phone:           phone,
			CreatedAt:       timestamppb.New(createdAtTime),
			LastLogin:       timestamppb.New(lastLoginTime),
		})
	}
	return pb_users, nil
}

func ConvertUsersWithProjects(usersWithProjects []db.ListUsersWithProjectsRow) ([]*pb.UserWithProjects, error) {
	pb_usersWithProjects := make([]*pb.UserWithProjects, 0)
	for _, userWithProjects := range usersWithProjects {
		projects, err := convertProjectToPb(userWithProjects.Projects)
		if err != nil {
			return nil, err
		}
		pb_usersWithProjects = append(pb_usersWithProjects, &pb.UserWithProjects{
			Id:              userWithProjects.ID.String(),
			Email:           userWithProjects.Email,
			Username:        userWithProjects.Username,
			IsActive:        userWithProjects.IsActive,
			RoleName:        userWithProjects.RoleName,
			Avatar:          userWithProjects.Avatar,
			IsEmailVerified: userWithProjects.IsEmailVerified,
			LastLogin:       timestamppb.New(userWithProjects.LastLogin),
			CreatedAt:       timestamppb.New(userWithProjects.CreatedAt),
			Phone:           userWithProjects.Phone.String,
			Projects:        projects,
		})
	}
	return pb_usersWithProjects, nil
}

func convertProjectToPb(projects interface{}) ([]*pb.Project, error) {
	rawProjects := make([]map[string]interface{}, 0)
	bytes, err := json.Marshal(projects)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(bytes, &rawProjects)
	if err != nil {
		return nil, err
	}
	pb_projects := make([]*pb.Project, 0)
	for _, project := range rawProjects {
		createdAtStr := project["created_at"].(string)
		createdAtTime, err := time.Parse(time.RFC3339, createdAtStr)
		if err != nil {
			return nil, err
		}
		pb_projects = append(pb_projects, &pb.Project{
			Id:          project["id"].(string),
			Name:        project["name"].(string),
			Description: project["description"].(string),
			OwnerId:     project["owner_id"].(string),
			CreatedAt:   timestamppb.New(createdAtTime),
		})
	}
	return pb_projects, nil
}

func convertDbProjectToPb(projects *[]db.ListProjectsRow) ([]*pb.Project, error) {
	pb_projects := make([]*pb.Project, len(*projects))
	for i, project := range *projects {
		pb_projects[i] = &pb.Project{
			Id:          project.ID.String(),
			Name:        project.Name,
			Description: project.Description,
			OwnerId:     project.OwnerID.String(),
			CreatedAt:   timestamppb.New(project.CreatedAt),
			IsMember:    &project.IsMember,
			IsOwner:     &project.IsOwner,
		}
	}
	return pb_projects, nil
}
