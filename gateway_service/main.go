package main

import (
	"context"
	"fmt"
	db_init "gateway_service/db/on_startup"
	db "gateway_service/db/sqlc"
	"gateway_service/events"
	"gateway_service/file_service"
	"gateway_service/gapi"
	"gateway_service/parser_service"
	"gateway_service/rag_client"
	"gateway_service/rag_server"
	"gateway_service/token"
	"gateway_service/util"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var interruptSignals = []os.Signal{
	os.Interrupt,
	syscall.SIGTERM,
	syscall.SIGINT,
}

func main() {
	config := util.NewEnvs()
	logger := util.NewLogger()
	util.PrintEnvs(config, logger)
	err := runDBMigration(config, logger)
	if err != nil {
		logger.Fatalf("cannot run db migration: %v", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), interruptSignals...)
	defer stop()
	connPool, err := pgxpool.New(ctx, config.POSTGRES_URI)
	if err != nil {
		log.Fatalf("cannot create connection pool: %v", err)
	}
	store := db.NewStore(connPool)

	redis_client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", config.REDIS_HOST, config.REDIS_PORT),
		Password: config.REDIS_PASSWORD,
		DB:       config.REDIS_DB,
	})
	_, err = redis_client.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("cannot connect to Redis: %v", err)
	}
	redis_event_processor := events.NewRedisEventProcessor(redis_client, store, config, logger)
	go redis_event_processor.SubscribeToRedisEvents(ctx)
	grpc_options := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(50 * 1024 * 1024)),
	}
	conn_file, err := grpc.NewClient(config.FILE_SERVICE_ADDRESS, grpc_options...)
	if err != nil {
		log.Fatalf("cannot create connection to file service: %v", err)
	}
	defer conn_file.Close()
	conn_parser, err := grpc.NewClient(config.PARSER_SERVICE_ADDRESS, grpc_options...)
	if err != nil {
		log.Fatalf("cannot create connection to parser service: %v", err)
	}
	defer conn_parser.Close()

	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		log.Fatalf("cannot create token maker: %v", err)
	}

	file_client := file_service.NewFileServiceClient(conn_file)
	parser_client := parser_service.NewParserServiceClient(conn_parser)
	db_init.InitDB(store, logger, file_client)
	waitGroup, ctx := errgroup.WithContext(ctx)
	new_rag_client := rag_client.NewRagClient(config.RAG_CLIENT_ADDRESS, logger)
	gapi_server, err := gapi.NewServer(config, store, logger, file_client, parser_client, new_rag_client, tokenMaker, redis_client)
	if err != nil {
		logger.Fatalf("cannot create server: %v", err)
	}
	gapi.RunGatewayServer(ctx, waitGroup, config, logger, gapi_server)
	rag_server := rag_server.NewServer(config, logger, tokenMaker, store, redis_client)
	rag_server.Run(ctx, config.RAG_SERVER_ADDRESS, waitGroup)
	err = waitGroup.Wait()
	if err != nil {
		logger.Fatal("error from waitGroup")
	}

}

func runDBMigration(config *util.Envs, logger *logrus.Logger) error {
	dbSource := config.POSTGRES_URI
	migration, err := migrate.New(config.MIGRATION_URL, dbSource)
	if err != nil {
		return err
	}
	err = migration.Up()
	if err != nil && err != migrate.ErrNoChange {
		return err
	}
	if err == migrate.ErrNoChange {
		logger.Info("No migration needed as the database is up to date")
	}
	logger.Info("Migration completed")
	return nil
}
