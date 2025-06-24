package test

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/util"
	"log"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

var (
	testDB    *pgxpool.Pool
	testStore db.Store
)

func init() {
	config := util.NewEnvs()
	connPool, err := pgxpool.New(context.Background(), config.POSTGRES_URI)
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}
	testStore = db.NewStore(connPool)
}

func createRandomKBFile(t *testing.T, user db.User) db.KbFile {
	arg := db.CreateKBFileParams{
		Name:    util.RandomString(6),
		Path:    "/test/" + util.RandomString(6) + ".pdf",
		Folder:  "/test",
		Size:    100,
		OwnerID: user.ID,
	}

	kbFile, err := testStore.CreateKBFile(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, kbFile)

	require.Equal(t, arg.Name, kbFile.Name)
	require.Equal(t, arg.Path, kbFile.Path)
	require.Equal(t, arg.Folder, kbFile.Folder)
	require.Equal(t, arg.Size, kbFile.Size)
	require.Equal(t, arg.OwnerID, kbFile.OwnerID)
	require.Equal(t, "pending", kbFile.ParseStatus)

	require.NotZero(t, kbFile.ID)
	require.NotZero(t, kbFile.CreatedAt)
	require.NotZero(t, kbFile.UpdatedAt)

	return kbFile
}

func createRandomUser(t *testing.T) db.User {
	hashedPassword, err := util.HashPassword(util.RandomString(6))
	require.NoError(t, err)

	arg := db.CreateUserParams{
		Username:       util.RandomString(6),
		HashedPassword: hashedPassword,
		Email:          util.RandomEmail(),
		RoleName:       "user",
	}

	user, err := testStore.CreateUser(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, user)

	return user
}

func createRandomKB(t *testing.T, user db.User) db.KnowledgeBase {
	arg := db.CreateKBParams{
		Name:    util.RandomString(6),
		OwnerID: user.ID,
	}

	kb, err := testStore.CreateKB(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, kb)

	return kb
}

func createUserRole(t *testing.T) {
	_, err := testStore.CreateRole(context.Background(), "user")
	// Ignore if role already exists
	if err != nil && !strings.Contains(err.Error(), "duplicate key") {
		require.NoError(t, err)
	}
}

func cleanupDatabase(t *testing.T) {
	// Delete in correct order to respect foreign key constraints
	_, err := testDB.Exec(context.Background(), `
		DELETE FROM kb_file_mapping;
		DELETE FROM user_project_mapping;
		DELETE FROM knowledge_base_project_mapping;
		DELETE FROM project;
		DELETE FROM kb_file;
		DELETE FROM knowledge_base;
		DELETE FROM "user";
		DELETE FROM "role";
	`)
	require.NoError(t, err)
}

func createRandomProject(t *testing.T, user db.User) db.Project {
	arg := db.CreateProjectParams{
		Name:        util.RandomString(6),
		OwnerID:     user.ID,
		Description: util.RandomString(10),
	}
	project, err := testStore.CreateProject(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, project)
	return project
}
