package test

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/util"
	"log"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	config := util.NewEnvs()
	var err error
	testDB, err = pgxpool.New(context.Background(), config.POSTGRES_URI)
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}
	testStore = db.NewStore(testDB)
	// Clean database before running any tests
	cleanupDatabase(&testing.T{})

	// Create required role before running tests
	createUserRole(&testing.T{})

	// Run tests
	code := m.Run()

	// Cleanup after tests
	cleanupDatabase(&testing.T{})

	os.Exit(code)
}

func TestCreateKBFile(t *testing.T) {
	t.Log("Creating random user...")
	user := createRandomUser(t)

	t.Log("Creating KB file...")
	kbFile := createRandomKBFile(t, user)
	t.Logf("Created KB file with ID: %s, Name: %s", kbFile.ID, kbFile.Name)
}

func TestGetKBFile(t *testing.T) {
	user := createRandomUser(t)
	file1 := createRandomKBFile(t, user)

	file2, err := testStore.GetKBFile(context.Background(), file1.ID)
	require.NoError(t, err)
	require.NotEmpty(t, file2)

	require.Equal(t, file1.ID, file2.ID)
	require.Equal(t, file1.Name, file2.Name)
	require.Equal(t, file1.Path, file2.Path)
	require.Equal(t, file1.Folder, file2.Folder)
	require.Equal(t, file1.Size, file2.Size)
	require.Equal(t, file1.OwnerID, file2.OwnerID)
	require.Equal(t, file1.ParseStatus, file2.ParseStatus)
	require.Equal(t, file1.IsParseFinished, file2.IsParseFinished)
	require.Equal(t, file1.ParsePercentage, file2.ParsePercentage)
}

func TestGetFilesByFolder(t *testing.T) {
	user := createRandomUser(t)
	folder := "/test"

	for i := 0; i < 5; i++ {
		createRandomKBFile(t, user)
	}

	arg := db.GetKBFilesByFolderParams{
		Folder:  folder,
		OwnerID: user.ID,
	}

	files, err := testStore.GetKBFilesByFolder(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, files)

	for _, file := range files {
		require.Equal(t, folder, file.Folder)
		require.Equal(t, user.ID, file.OwnerID)
	}
}

func TestGetKBFilesByFolderWithKB(t *testing.T) {
	t.Log("Creating random user...")
	user := createRandomUser(t)
	folder := "/test"

	t.Log("Creating knowledge base...")
	kb := createRandomKB(t, user)
	t.Logf("Created KB with ID: %s, Name: %s", kb.ID, kb.Name)

	// Create files and associate some with KB
	t.Log("Creating files and associating with KB...")
	numFiles := 5
	var files []db.KbFile
	for i := 0; i < numFiles; i++ {
		file := createRandomKBFile(t, user)
		files = append(files, file)

		// Associate every other file with KB
		arg := db.AddFileToKBParams{
			KbID:     kb.ID,
			KbFileID: file.ID,
		}
		err := testStore.AddFileToKB(context.Background(), arg)
		require.NoError(t, err)
		t.Logf("Associated file %s with KB", file.Name)
	}

	// List files by folder
	t.Log("Listing files by folder...")
	arg := db.GetKBFilesWithKBsByFolderParams{
		Folder:  folder,
		OwnerID: user.ID,
	}

	dbFiles, err := testStore.GetKBFilesWithKBsByFolder(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, dbFiles)

	var filesWithKBs []db.KBFileWithKBs
	filesWithKBs, err = db.ParseKBFileWithKBs(&dbFiles)
	require.NoError(t, err)

	require.Equal(t, folder, filesWithKBs[0].Folder)
	require.Equal(t, user.ID, filesWithKBs[0].OwnerID)
	require.Equal(t, kb.ID, filesWithKBs[0].Kbs[0].ID)
	require.Equal(t, kb.Name, filesWithKBs[0].Kbs[0].Name)

}

func TestUpdateKBFile(t *testing.T) {
	user := createRandomUser(t)
	file1 := createRandomKBFile(t, user)

	arg := db.UpdateKBFileParams{
		ID:              file1.ID,
		Name:            pgtype.Text{String: util.RandomString(6), Valid: true},
		ParseStatus:     pgtype.Text{String: "running", Valid: true},
		ParsePercentage: pgtype.Float8{Float64: 50, Valid: true},
		IsParseFinished: pgtype.Bool{Bool: false, Valid: true},
	}

	file2, err := testStore.UpdateKBFile(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, file2)
	require.Equal(t, file1.ID, file2.ID)
	require.Equal(t, arg.Name.String, file2.Name)
	require.Equal(t, arg.ParseStatus.String, file2.ParseStatus)
	require.Equal(t, arg.ParsePercentage.Float64, file2.ParsePercentage)
	require.Equal(t, arg.IsParseFinished.Bool, file2.IsParseFinished)
	require.Equal(t, file1.Path, file2.Path)
	require.Equal(t, file1.Folder, file2.Folder)
	require.Equal(t, file1.OwnerID, file2.OwnerID)
}

func TestGetFileByKBID(t *testing.T) {
	t.Log("Creating random user...")
	user := createRandomUser(t)

	t.Log("Creating knowledge base...")
	kb := createRandomKB(t, user)
	t.Logf("Created KB with ID: %s, Name: %s", kb.ID, kb.Name)

	// Create multiple files
	t.Log("Creating multiple KB files...")
	numFiles := 5
	var files []db.KbFile
	for i := 0; i < numFiles; i++ {
		file := createRandomKBFile(t, user)
		files = append(files, file)

		// Add file to knowledge base
		arg := db.AddFileToKBParams{
			KbID:     kb.ID,
			KbFileID: file.ID,
		}
		err := testStore.AddFileToKB(context.Background(), arg)
		require.NoError(t, err)
	}

	// List files by KB ID
	t.Log("Listing files by KB ID...")
	kbFiles, err := testStore.GetKBFilesByKBID(context.Background(), kb.ID)
	require.NoError(t, err)
	require.Len(t, kbFiles, numFiles)

	result, err := db.ParseKBFileWithKBsByKBID(&kbFiles)
	require.NoError(t, err)
	require.Equal(t, kb.ID, result[0].Kbs[0].ID)
	require.Equal(t, kb.Name, result[0].Kbs[0].Name)
	require.Equal(t, user.ID, result[0].OwnerID)

}

func TestListUserKBs(t *testing.T) {
	t.Log("Creating random user...")
	user := createRandomUser(t)

	// Create multiple knowledge bases
	t.Log("Creating multiple knowledge bases...")
	numKBs := 3
	var kbs []db.KnowledgeBase
	for i := 0; i < numKBs; i++ {
		kb := createRandomKB(t, user)
		kbs = append(kbs, kb)

		// Create and add different numbers of files to each KB
		numFiles := i + 1 // 1, 2, 3 files respectively
		t.Logf("Adding %d files to KB: %s", numFiles, kb.Name)
		for j := 0; j < numFiles; j++ {
			file := createRandomKBFile(t, user)
			arg := db.AddFileToKBParams{
				KbID:     kb.ID,
				KbFileID: file.ID,
			}
			err := testStore.AddFileToKB(context.Background(), arg)
			require.NoError(t, err)
		}
	}

	// List knowledge bases
	t.Log("Listing user knowledge bases...")
	userKBs, err := testStore.GetUserKBs(context.Background(), user.ID)
	require.NoError(t, err)
	require.Len(t, userKBs, numKBs)

	// Verify knowledge bases are ordered by file count (descending)
	var lastCount int64 = 999999
	for i, kb := range userKBs {
		t.Logf("KB %d: %s, File Count: %d", i+1, kb.Name, kb.KbFileCount)
		require.LessOrEqual(t, kb.KbFileCount, lastCount)
		lastCount = kb.KbFileCount
	}
}

func TestListUserKBsNoFiles(t *testing.T) {
	t.Log("Creating random user...")
	user := createRandomUser(t)

	// Create multiple knowledge bases
	t.Log("Creating multiple knowledge bases...")
	numKBs := 3
	var kbs []db.KnowledgeBase
	for i := 0; i < numKBs; i++ {
		kb := createRandomKB(t, user)
		kbs = append(kbs, kb)
	}

	// List knowledge bases
	t.Log("Listing user knowledge bases...")
	userKBs, err := testStore.GetUserKBs(context.Background(), user.ID)
	require.NoError(t, err)
	require.Len(t, userKBs, numKBs)

	// Verify knowledge bases are ordered by file count (descending)
	var lastCount int64 = 999999
	for i, kb := range userKBs {
		t.Logf("KB %d: %s, File Count: %d", i+1, kb.Name, kb.KbFileCount)
		require.LessOrEqual(t, kb.KbFileCount, lastCount)
		lastCount = kb.KbFileCount
	}
}

func TestGetKBWithKBFiles(t *testing.T) {

	t.Log("Creating random user...")
	user := createRandomUser(t)

	t.Log("Creating knowledge base...")
	kb := createRandomKB(t, user)
	t.Logf("Created KB with ID: %s, Name: %s", kb.ID, kb.Name)

	// Create multiple files and associate with KB
	t.Log("Creating and associating files...")
	numFiles := 5
	for i := 0; i < numFiles; i++ {
		file := createRandomKBFile(t, user)
		arg := db.AddFileToKBParams{
			KbID:     kb.ID,
			KbFileID: file.ID,
		}
		err := testStore.AddFileToKB(context.Background(), arg)
		require.NoError(t, err)
		t.Logf("Added file: %s", file.Name)
		if i%2 == 0 {
			up_data_args := db.UpdateKBFileMappingParams{
				KbID:            kb.ID,
				KbFileID:        file.ID,
				BuildStatus:     pgtype.Text{String: "running", Valid: true},
				BuildPercentage: pgtype.Float8{Float64: 50, Valid: true},
				IsBuildFinished: pgtype.Bool{Bool: false, Valid: true},
				IsBuildFailed:   pgtype.Bool{Bool: false, Valid: true},
			}
			_, err = testStore.UpdateKBFileMapping(context.Background(), up_data_args)
			require.NoError(t, err)
			t.Logf("Updated file mapping for file: %s", file.Name)
		}
	}

	// Get KB with files
	t.Log("Getting KB with files...")
	kbWithFiles, err := testStore.GetKBWithKBFilesByKBID(context.Background(), kb.ID)
	require.NoError(t, err)

	// Parse the result
	result, err := db.ParseKBWithKBFiles(&kbWithFiles)
	require.NoError(t, err)

	// Verify KB info
	require.GreaterOrEqual(t, len(result.KbFiles), numFiles)
	require.Equal(t, kb.ID, result.ID)
	require.Equal(t, kb.Name, result.Name)
	require.Equal(t, user.ID, result.OwnerID)
	require.Equal(t, int64(numFiles), result.KbFileCount)
	require.Equal(t, "running", result.KbFiles[0].BuildStatus)
	require.Equal(t, float32(50), result.KbFiles[0].BuildPercentage)
	require.Equal(t, false, result.KbFiles[0].IsBuildFinished)
	// Verify files
	require.Len(t, result.KbFiles, numFiles)
	for _, file := range result.KbFiles {
		require.NotEmpty(t, file.ID)
		require.NotEmpty(t, file.Name)
		require.Equal(t, "/test", file.Folder)
	}
}
