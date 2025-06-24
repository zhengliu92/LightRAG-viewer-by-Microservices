package test

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/gapi"
	"gateway_service/util"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"
)

func TestProjectAddUser(t *testing.T) {
	user := createRandomUser(t)
	project := createRandomProject(t, user)
	arg := db.AddUserToProjectParams{
		UserID:    user.ID,
		ProjectID: project.ID,
	}
	err := testStore.AddUserToProject(context.Background(), arg)
	require.NoError(t, err)

}

func TestGetUserProjectsWithKBs(t *testing.T) {
	user := createRandomUser(t)
	new_projects := make([]db.Project, 0)
	for i := 0; i < 10; i++ {
		project := createRandomProject(t, user)
		new_projects = append(new_projects, project)
		arg := db.AddUserToProjectParams{
			UserID:    user.ID,
			ProjectID: project.ID,
		}
		err := testStore.AddUserToProject(context.Background(), arg)
		require.NoError(t, err)
	}

	kbs := make([]db.KnowledgeBase, 0)
	for i := 0; i < 6; i++ {
		kbArg := db.CreateKBParams{
			Name:    util.RandomString(6),
			OwnerID: user.ID,
		}

		kb, err := testStore.CreateKB(context.Background(), kbArg)
		require.NoError(t, err)
		require.NotEmpty(t, kb)
		kbs = append(kbs, kb)
	}

	kbfiles := make([]db.KbFile, 0)
	for i := 0; i < 6; i++ {
		arg := db.CreateKBFileParams{
			Name:    util.RandomString(6),
			Path:    "/test/" + util.RandomString(6) + ".pdf",
			Folder:  "/test",
			Size:    100,
			OwnerID: user.ID,
		}
		kbfile, err := testStore.CreateKBFile(context.Background(), arg)
		require.NoError(t, err)
		require.NotEmpty(t, kbfile)
		kbfiles = append(kbfiles, kbfile)
	}
	// add kbfiles to kbs
	for i, kb := range kbs {
		if i%2 == 1 {
			continue
		}
		for k, kbfile := range kbfiles {
			err := testStore.AddFileToKB(context.Background(), db.AddFileToKBParams{
				KbID:     kb.ID,
				KbFileID: kbfile.ID,
			})
			require.NoError(t, err)
			if k%2 == 0 {
				continue
			}
			kbFileMappingArg := db.UpdateKBFileMappingParams{
				KbID:            kb.ID,
				KbFileID:        kbfile.ID,
				BuildStatus:     pgtype.Text{String: "finished", Valid: true},
				BuildPercentage: pgtype.Float8{Float64: 100, Valid: true},
				IsBuildFinished: pgtype.Bool{Bool: true, Valid: true},
				IsBuildFailed:   pgtype.Bool{Bool: false, Valid: true},
			}
			_, err = testStore.UpdateKBFileMapping(context.Background(), kbFileMappingArg)
			require.NoError(t, err)
		}
	}

	for i, project := range new_projects {
		if i%2 == 0 {
			continue
		}
		for _, kb := range kbs {
			kbProjectArg := db.AddKBToProjectParams{
				KnowledgeBaseID: kb.ID,
				ProjectID:       project.ID,
			}
			err := testStore.AddKBToProject(context.Background(), kbProjectArg)
			require.NoError(t, err)
		}
	}

	projects, err := testStore.GetUserProjectsWithKBs(context.Background(), user.ID)
	require.NoError(t, err)
	require.NotEmpty(t, projects)
	require.Equal(t, len(projects), len(new_projects))
	pb_projects, err := gapi.ConvertUserProjectsWithKBs(&projects)
	require.NoError(t, err)
	require.NotEmpty(t, pb_projects)
	require.Equal(t, len(pb_projects), len(new_projects))

	usersWithProjects, err := testStore.ListUsersWithProjects(context.Background())
	require.NoError(t, err)
	require.NotEmpty(t, usersWithProjects)
	pb_usersWithProjects, err := gapi.ConvertUsersWithProjects(usersWithProjects)
	require.NoError(t, err)
	require.NotEmpty(t, pb_usersWithProjects)
}
