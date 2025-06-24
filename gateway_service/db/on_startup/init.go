package db

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	"gateway_service/util"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/sirupsen/logrus"
)

type User struct {
	Username string
	Email    string
	RoleName string
	Phone    string
}

func InitDB(s db.Store, logger *logrus.Logger, fileService file_service.FileServiceClient) error {
	logger.Info("initializing roles...")
	users := []User{
		{Username: "admin", Email: "admin@xuancai.com", RoleName: "admin", Phone: "1234567890"},
		{Username: "atom", Email: "atom@xuancai.com", RoleName: "user"},
		{Username: "metal", Email: "metal@xuancai.com", RoleName: "user", Phone: "1234567890"},
		{Username: "quark", Email: "quark@xuancai.com", RoleName: "user"},
		{Username: "boson", Email: "boson@xuancai.com", RoleName: "user"},
		{Username: "polymer", Email: "polymer@xuancai.com", RoleName: "user", Phone: "1234567890"},
		{Username: "chemical", Email: "chemical@xuancai.com", RoleName: "user", Phone: "1234567890"},
		{Username: "photon", Email: "photon@xuancai.com", RoleName: "user"},
		{Username: "proton", Email: "proton@xuancai.com", RoleName: "user"},
		// {Username: "fermion", Email: "fermion@xuancai.com", RoleName: "admin"},
		// {Username: "element", Email: "element@xuancai.com", RoleName: "admin"},
		// {Username: "mineral", Email: "mineral@xuancai.com", RoleName: "admin", Phone: "1234567890"},
		// {Username: "physical", Email: "physical@xuancai.com", RoleName: "admin"},
		// {Username: "compound", Email: "compound@xuancai.com", RoleName: "admin"},
		// {Username: "molecule", Email: "molecule@xuancai.com", RoleName: "admin"},
		// {Username: "electron", Email: "electron@xuancai.com", RoleName: "admin"},
		// {Username: "neutron", Email: "neutron@xuancai.com", RoleName: "admin", Phone: "1234567890"},
		// {Username: "user", Email: "user@xuancai.com", RoleName: "user"},
	}
	ctx := context.Background()
	if _, err := s.CreateRole(ctx, "admin"); err != nil {
		// check if role already exists
		if db.ErrorCode(err) == db.UniqueViolation {
			logger.Warn("role admin already exists")
		} else {
			return err
		}
	}
	if _, err := s.CreateRole(ctx, "user"); err != nil {
		if db.ErrorCode(err) == db.UniqueViolation {
			logger.Warn("role user already exists")
		} else {
			return err
		}
	}
	logger.Info("roles initialized")
	logger.Info("initializing User...")

	for _, user := range users {
		hashedPassword, err := util.HashPassword("xckj1234")
		if err != nil {
			return err
		}
		_, err = s.CreateUser(ctx, db.CreateUserParams{
			Username:       user.Username,
			Email:          user.Email,
			HashedPassword: hashedPassword,
			RoleName:       user.RoleName,
			Phone:          pgtype.Text{String: user.Phone, Valid: true},
		})
		if err != nil {
			if db.ErrorCode(err) == db.UniqueViolation {
				logger.Warnf("user %s already exists", user.Username)
			} else {
				return err
			}
		}
	}
	for _, user := range users {
		_, err := fileService.CreateBucket(ctx, &file_service.CreateBucketRequest{
			BucketName: user.Username,
		})
		if err != nil {
			logger.Errorf("failed to create bucket for user %s: %v", user.Username, err)
			return err
		}
	}

	return nil
}
