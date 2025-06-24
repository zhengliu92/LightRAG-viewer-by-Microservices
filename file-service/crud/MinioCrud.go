package crud

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/sirupsen/logrus"
	"github.com/zhengliu92/minio-file-server/util"
)

type MinioCrud struct {
	Client *minio.Client
	logger *logrus.Logger
	config *util.Envs
}

func (m *MinioCrud) BucketExists(bucketName string) (bool, error) {
	exists, err := m.Client.BucketExists(context.Background(), bucketName)
	if err != nil {
		return false, err
	}
	return exists, nil
}

func NewMinioCrud(logger *logrus.Logger, config *util.Envs) *MinioCrud {
	minio_crud := &MinioCrud{
		logger: logger,
		config: config,
	}
	minio_endpoint := config.MINIO_HOST + ":" + config.MINIO_API_PORT
	minioClient, err := minio.New(minio_endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.MINIO_ACCESS_KEY, config.MINIO_SECRET_KEY, ""),
		Secure: false,
	})
	if err != nil {
		logger.Fatalf("Could not connect to Minio: %v", err)
	}
	logger.Infof("Connected to Minio at %s", minio_endpoint)
	minio_crud.Client = minioClient
	return minio_crud
}

func (m *MinioCrud) CreateBucketIfNotExists(bucketName string) error {
	minioClient := m.Client
	err := minioClient.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
	if err != nil {
		exists, errBucketExists := minioClient.BucketExists(context.Background(), bucketName)
		if errBucketExists != nil || !exists {
			m.logger.Fatalf("Could not create bucket: %v", err)
		}
	}
	m.logger.Infof("Bucket %s is created", bucketName)
	return nil
}

func (m *MinioCrud) GetObjectBytes(bucketName string, objectName string) ([]byte, error) {
	minioClient := m.Client

	object, err := minioClient.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, err
	}
	defer object.Close()

	objectBytes, err := io.ReadAll(object)
	if err != nil {
		return nil, err
	}

	return objectBytes, nil
}

func (m *MinioCrud) GetObjectURL(bucketName string, objectName string) (string, error) {
	minioClient := m.Client
	// check if the object exists
	_, err := minioClient.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return "", fmt.Errorf("object %s does not exist in bucket %s", objectName, bucketName)
	}
	reqParams := make(url.Values)
	reqParams.Set("response-content-disposition", "attachment; filename="+objectName)
	presignedURL, err := minioClient.PresignedGetObject(context.Background(), bucketName, objectName, time.Second*24*60*60, reqParams)
	if err != nil {
		return "", err
	}

	return presignedURL.String(), nil
}

type ObjectInfo struct {
	Name         string
	Size         int64
	LastModified time.Time
}

func (m *MinioCrud) HasFile(bucketName string, objectName string) (bool, error) {
	minioClient := m.Client
	_, err := minioClient.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return false, err
	}
	return true, nil
}

func (m *MinioCrud) ListObjects(bucketName string, folderName *string, omitRegexes []string) ([]ObjectInfo, error) {
	minioClient := m.Client
	objects := []ObjectInfo{}

	var objectCh <-chan minio.ObjectInfo
	if folderName != nil && *folderName != "" {
		prefix := *folderName
		options := minio.ListObjectsOptions{
			Prefix:    prefix,
			Recursive: false,
		}
		objectCh = minioClient.ListObjects(context.Background(), bucketName, options)
	} else {
		objectCh = minioClient.ListObjects(context.Background(), bucketName, minio.ListObjectsOptions{})
	}

	compiledRegexes := make([]*regexp.Regexp, 0, len(omitRegexes))
	for _, pattern := range omitRegexes {
		r, err := regexp.Compile(pattern)
		if err != nil {
			return nil, fmt.Errorf("invalid regex pattern %q: %v", pattern, err)
		}
		compiledRegexes = append(compiledRegexes, r)
	}

	matchRegex := func(name string) bool {
		for _, regex := range compiledRegexes {
			if regex.MatchString(name) {
				return true
			}
		}
		return false
	}

	for object := range objectCh {
		if object.Err != nil {
			return objects, object.Err
		}
		var name_no_prefix string
		if folderName != nil && *folderName != "" {
			name_no_prefix = object.Key[len(*folderName):]
		} else {
			name_no_prefix = object.Key
		}
		if name_no_prefix == "" {
			continue
		}
		if len(omitRegexes) > 0 {
			if matchRegex(name_no_prefix) {
				continue
			}
		}
		objects = append(objects, ObjectInfo{
			Name:         name_no_prefix,
			Size:         object.Size,
			LastModified: object.LastModified,
		})
	}
	return objects, nil
}

func (m *MinioCrud) RemoveObject(bucketName string, objectName string) error {
	minioClient := m.Client
	// check if the object exists
	_, err := minioClient.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return fmt.Errorf("object %s does not exist", objectName)
	}
	objectIsDir := strings.HasSuffix(objectName, "/")
	if objectIsDir {
		objects, err := m.ListObjects(bucketName, &objectName, nil)
		if err != nil {
			return err
		}
		for _, object := range objects {
			objectName := fmt.Sprintf("%s%s", objectName, object.Name)
			err := m.RemoveObject(bucketName, objectName)
			if err != nil {
				return err
			}
		}
	}
	err = minioClient.RemoveObject(context.Background(), bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (m *MinioCrud) ListBuckets() ([]string, error) {
	minioClient := m.Client
	buckets := []string{}
	bucketCh, err := minioClient.ListBuckets(context.Background())
	if err != nil {
		return buckets, err
	}
	for _, bucket := range bucketCh {
		buckets = append(buckets, bucket.Name)
	}
	return buckets, nil
}

func (m *MinioCrud) ClearBucket(bucketName string) error {
	objects, err := m.ListObjects(bucketName, nil, nil)
	if err != nil {
		return err
	}
	for _, object := range objects {
		err := m.RemoveObject(bucketName, object.Name)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *MinioCrud) DeleteBucket(bucketName string) error {
	minioClient := m.Client
	err := minioClient.RemoveBucket(context.Background(), bucketName)
	if err != nil {
		return err
	}
	return nil
}

func (m *MinioCrud) ClearAndDeleteBucket(bucketName string) error {
	err := m.ClearBucket(bucketName)
	if err != nil {
		return err
	}
	err = m.DeleteBucket(bucketName)
	if err != nil {
		return err
	}
	return nil
}

func (m *MinioCrud) NewFolderInBucket(bucketName string, folder_name string) error {
	folder_name = folder_name + "/"
	has_file, _ := m.HasFile(bucketName, folder_name)
	if has_file {
		return nil
	}
	_, err := m.Client.PutObject(context.Background(), bucketName, folder_name, nil, 0, minio.PutObjectOptions{})
	if err != nil {
		return err
	}
	return nil
}
