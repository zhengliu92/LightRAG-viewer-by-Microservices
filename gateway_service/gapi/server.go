package gapi

import (
	db "gateway_service/db/sqlc"
	"gateway_service/file_service"
	"gateway_service/parser_service"
	pb "gateway_service/pb"
	"gateway_service/rag_client"

	"context"
	"errors"
	"gateway_service/token"
	"gateway_service/util"
	"net"
	"net/http"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"google.golang.org/protobuf/encoding/protojson"
)

type Server struct {
	pb.UnimplementedGatewayServiceServer
	config       *util.Envs
	store        db.Store
	tokenMaker   token.Maker
	logger       *logrus.Logger
	fileService  file_service.FileServiceClient
	parserClient parser_service.ParserServiceClient
	ragClient    *rag_client.RagClient
	redisClient  *redis.Client
}

// NewServer creates a new gRPC server.
func NewServer(
	config *util.Envs,
	store db.Store,
	logger *logrus.Logger,
	file_client file_service.FileServiceClient,
	parser_client parser_service.ParserServiceClient,
	rag_client *rag_client.RagClient,
	tokenMaker token.Maker,
	redis_client *redis.Client,
) (*Server, error) {

	server := &Server{
		config:       config,
		store:        store,
		tokenMaker:   tokenMaker,
		logger:       logger,
		fileService:  file_client,
		parserClient: parser_client,
		ragClient:    rag_client,
		redisClient:  redis_client,
	}

	return server, nil
}

func RunGrpcServer(
	ctx context.Context,
	waitGroup *errgroup.Group,
	config *util.Envs,
	store db.Store,
	logger *logrus.Logger,
	file_client file_service.FileServiceClient,
	parser_client parser_service.ParserServiceClient,
	rag_client *rag_client.RagClient,
	tokenMaker token.Maker,
	redis_client *redis.Client,
) {
	server, err := NewServer(
		config,
		store,
		logger,
		file_client,
		parser_client,
		rag_client,
		tokenMaker,
		redis_client,
	)

	if err != nil {
		logger.Fatalf("cannot create server: %v", err)
	}

	new_grpc_logger := GetGrpcLogger(logger)
	gprcLogger := grpc.UnaryInterceptor(new_grpc_logger)
	opts := []grpc.ServerOption{
		gprcLogger,
		grpc.MaxRecvMsgSize(50 * 1024 * 1024),
		grpc.MaxSendMsgSize(50 * 1024 * 1024),
	}
	grpcServer := grpc.NewServer(opts...)
	pb.RegisterGatewayServiceServer(grpcServer, server)
	reflection.Register(grpcServer)

	listener, err := net.Listen("tcp", config.GRPCServerAddress)
	if err != nil {
		logger.Fatalf("cannot listen to address: %v", err)
	}

	waitGroup.Go(func() error {
		logger.Infof("start gRPC server at %s", config.GRPCServerAddress)
		err = grpcServer.Serve(listener)
		if err != nil {
			if errors.Is(err, grpc.ErrServerStopped) {
				return nil
			}
			logger.Errorf("gRPC server is stopped: %v", err)
			return err
		}
		return nil
	})

	waitGroup.Go(func() error {
		<-ctx.Done()
		logger.Info("Shutting down gRPC server")
		grpcServer.GracefulStop()
		logger.Info("gRPC server is stopped")
		return nil
	})
}

func RunGatewayServer(
	ctx context.Context,
	waitGroup *errgroup.Group,
	config *util.Envs,
	logger *logrus.Logger,
	server *Server,

) {
	jsonOption := runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
		MarshalOptions: protojson.MarshalOptions{
			UseProtoNames: true,
		},
		UnmarshalOptions: protojson.UnmarshalOptions{
			DiscardUnknown: true,
		},
	})

	grpcMux := runtime.NewServeMux(jsonOption,
		runtime.WithIncomingHeaderMatcher(runtime.DefaultHeaderMatcher),
	)

	err := pb.RegisterGatewayServiceHandlerServer(ctx, grpcMux, server)
	if err != nil {
		logger.Fatalf("cannot register gateway service handler: %v", err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", grpcMux)
	corsHandler := corsMiddleware(mux)

	http_handler := GetGatewayLogger(corsHandler, logger)

	httpServer := &http.Server{
		Handler: http_handler,
		Addr:    config.HTTPServerAddress,
	}

	waitGroup.Go(func() error {

		logger.Infof("start HTTP gateway server at %s", httpServer.Addr)

		err = httpServer.ListenAndServe()
		if err != nil {
			if errors.Is(err, http.ErrServerClosed) {
				return nil
			}
			logger.Errorf("HTTP gateway server is stopped: %v", err)

			return err
		}
		return nil
	})

	waitGroup.Go(func() error {
		<-ctx.Done()
		logger.Info("Shutting down HTTP gateway server")

		err := httpServer.Shutdown(context.Background())
		if err != nil {
			logger.Errorf("HTTP gateway server is stopped: %v", err)
			return err
		}

		logger.Info("HTTP gateway server is stopped")
		return nil
	})
}

func corsMiddleware(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // Allow all headers

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler.ServeHTTP(w, r)
	})
}
