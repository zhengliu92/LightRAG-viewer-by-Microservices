package util

import (
	"os"

	"github.com/sirupsen/logrus"
)

type Envs struct {
	MINIO_ACCESS_KEY    string `mapstructure:"MINIO_ACCESS_KEY"`
	MINIO_SECRET_KEY    string `mapstructure:"MINIO_SECRET_KEY"`
	MINIO_API_PORT      string `mapstructure:"MINIO_API_PORT"`
	MINIO_HOST          string `mapstructure:"MINIO_HOST"`
	HTTP_SERVER_ADDRESS string `mapstructure:"HTTP_SERVER_ADDRESS"`
	GRPC_SERVER_ADDRESS string `mapstructure:"GRPC_SERVER_ADDRESS"`
}

func loadEnv(envName, envDefault string) string {
	env := os.Getenv(envName)
	if env == "" {
		env = envDefault
	}
	return env
}

func NewEnvs() *Envs {
	env := &Envs{}
	env.Init()
	return env
}

func (e *Envs) Init() {
	e.MINIO_ACCESS_KEY = loadEnv("MINIO_ACCESS_KEY", "minioadmin")
	e.MINIO_SECRET_KEY = loadEnv("MINIO_SECRET_KEY", "minioapass")
	e.MINIO_API_PORT = loadEnv("MINIO_API_PORT", "9001")
	e.MINIO_HOST = loadEnv("MINIO_HOST", "localhost")
	e.HTTP_SERVER_ADDRESS = loadEnv("HTTP_SERVER_ADDRESS", "0.0.0.0:8080")
	e.GRPC_SERVER_ADDRESS = loadEnv("GRPC_SERVER_ADDRESS", "0.0.0.0:50051")
}

func (e *Envs) PrintAll(logger *logrus.Logger) {
	logger.Printf("MINIO_API_PORT: %s\n", e.MINIO_API_PORT)
	logger.Printf("MINIO_HOST: %s\n", e.MINIO_HOST)
	logger.Printf("HTTP_SERVER_ADDRESS: %s\n", e.HTTP_SERVER_ADDRESS)
	logger.Printf("GRPC_SERVER_ADDRESS: %s\n", e.GRPC_SERVER_ADDRESS)
}
