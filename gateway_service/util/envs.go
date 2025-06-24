package util

import (
	"os"
	"reflect"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
)

type Envs struct {
	TokenSymmetricKey      string        `mapstructure:"TOKEN_SYMMETRIC_KEY"`
	AccessTokenDuration    time.Duration `mapstructure:"ACCESS_TOKEN_DURATION"`
	RefreshTokenDuration   time.Duration `mapstructure:"REFRESH_TOKEN_DURATION"`
	POSTGRES_URI           string        `mapstructure:"POSTGRES_URI"`
	MIGRATION_URL          string        `mapstructure:"MIGRATION_URL"`
	GRPCServerAddress      string        `mapstructure:"GRPC_SERVER_ADDRESS"`
	HTTPServerAddress      string        `mapstructure:"HTTP_SERVER_ADDRESS"`
	POSTGRES_PORT          string        `mapstructure:"POSTGRES_PORT"`
	POSTGRES_USER          string        `mapstructure:"POSTGRES_USER"`
	POSTGRES_PASSWORD      string        `mapstructure:"POSTGRES_PASSWORD"`
	POSTGRES_DB            string        `mapstructure:"POSTGRES_DB"`
	POSTGRES_HOST          string        `mapstructure:"POSTGRES_HOST"`
	FILE_SERVICE_PORT      string        `mapstructure:"FILE_SERVICE_PORT"`
	FILE_SERVICE_HOST      string        `mapstructure:"FILE_SERVICE_HOST"`
	FILE_SERVICE_ADDRESS   string        `mapstructure:"FILE_SERVICE_ADDRESS"`
	PARSER_SERVICE_PORT    string        `mapstructure:"PARSER_SERVICE_PORT"`
	PARSER_SERVICE_HOST    string        `mapstructure:"PARSER_SERVICE_HOST"`
	PARSER_SERVICE_ADDRESS string        `mapstructure:"PARSER_SERVICE_ADDRESS"`
	REDIS_HOST             string        `mapstructure:"REDIS_HOST"`
	REDIS_PORT             string        `mapstructure:"REDIS_PORT"`
	REDIS_PASSWORD         string        `mapstructure:"REDIS_PASSWORD"`
	REDIS_DB               int           `mapstructure:"REDIS_DB"`
	RAG_SERVER_ADDRESS     string        `mapstructure:"RAG_SERVER_ADDRESS"`
	RAG_CLIENT_PORT        string        `mapstructure:"RAG_CLIENT_PORT"`
	RAG_CLIENT_HOST        string        `mapstructure:"RAG_CLIENT_HOST"`
	RAG_CLIENT_ADDRESS     string        `mapstructure:"RAG_CLIENT_ADDRESS"`
	ParseTimeout           time.Duration `mapstructure:"PARSE_TIMEOUT"`
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
	e.TokenSymmetricKey = "2af51f6d674e90fbee396097e7cdf74a"
	e.AccessTokenDuration, _ = time.ParseDuration(loadEnv("AccessTokenDuration", "15m"))
	e.RefreshTokenDuration, _ = time.ParseDuration(loadEnv("RefreshTokenDuration", "24h"))
	e.HTTPServerAddress = loadEnv("HTTP_SERVER_ADDRESS", "0.0.0.0:8090")
	e.POSTGRES_PORT = loadEnv("POSTGRES_PORT", "5432")
	e.POSTGRES_USER = loadEnv("POSTGRES_USER", "postgres")
	e.POSTGRES_PASSWORD = loadEnv("POSTGRES_PASSWORD", "secretpass")
	e.POSTGRES_DB = loadEnv("POSTGRES_DB", "papergraph")
	e.POSTGRES_HOST = loadEnv("POSTGRES_HOST", "localhost")
	e.POSTGRES_URI = "postgresql://" + e.POSTGRES_USER + ":" + e.POSTGRES_PASSWORD + "@" + e.POSTGRES_HOST + ":" + e.POSTGRES_PORT + "/" + e.POSTGRES_DB + "?sslmode=disable"
	e.FILE_SERVICE_PORT = loadEnv("FILE_SERVICE_PORT", "50051")
	e.FILE_SERVICE_HOST = loadEnv("FILE_SERVICE_HOST", "localhost")
	e.PARSER_SERVICE_PORT = loadEnv("PARSER_SERVICE_PORT", "50052")
	e.PARSER_SERVICE_HOST = loadEnv("PARSER_SERVICE_HOST", "localhost")
	e.FILE_SERVICE_ADDRESS = e.FILE_SERVICE_HOST + ":" + e.FILE_SERVICE_PORT
	e.PARSER_SERVICE_ADDRESS = e.PARSER_SERVICE_HOST + ":" + e.PARSER_SERVICE_PORT
	e.REDIS_HOST = loadEnv("REDIS_HOST", "localhost")
	e.REDIS_PORT = loadEnv("REDIS_PORT", "6379")
	e.REDIS_PASSWORD = loadEnv("REDIS_PASSWORD", "")
	e.REDIS_DB, _ = strconv.Atoi(loadEnv("REDIS_DB", "0"))
	e.RAG_CLIENT_PORT = loadEnv("RAG_CLIENT_PORT", "8200")
	e.RAG_CLIENT_HOST = loadEnv("RAG_CLIENT_HOST", "localhost")
	e.RAG_CLIENT_ADDRESS = "http://" + e.RAG_CLIENT_HOST + ":" + e.RAG_CLIENT_PORT
	e.RAG_SERVER_ADDRESS = loadEnv("RAG_SERVER_ADDRESS", "0.0.0.0:8091")
	e.MIGRATION_URL = loadEnv("MIGRATION_URL", "file://db/schema")
	e.ParseTimeout, _ = time.ParseDuration(loadEnv("PARSE_TIMEOUT", "24h"))
}

func PrintEnvs(envs *Envs, logger *logrus.Logger) {
	v := reflect.ValueOf(envs).Elem()
	for i := 0; i < v.NumField(); i++ {
		field_name := v.Type().Field(i).Name
		if field_name == "TokenSymmetricKey" {
			continue
		}
		field_value := v.Field(i).Interface()
		logger.Infof("%s: %v", field_name, field_value)
	}
}
