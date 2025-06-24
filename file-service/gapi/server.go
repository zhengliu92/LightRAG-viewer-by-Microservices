package gapi

import (
	"context"
	"errors"
	"net"

	"github.com/sirupsen/logrus"
	"github.com/zhengliu92/minio-file-server/crud"
	pb "github.com/zhengliu92/minio-file-server/file_service"
	"github.com/zhengliu92/minio-file-server/util"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Server struct {
	pb.UnimplementedFileServiceServer
	config    *util.Envs
	logger    *logrus.Logger
	minioCrud *crud.MinioCrud
}

// NewServer creates a new gRPC server.
func NewServer(config *util.Envs, logger *logrus.Logger, minioCrud *crud.MinioCrud) (*Server, error) {
	server := &Server{
		config:    config,
		logger:    logger,
		minioCrud: minioCrud,
	}

	return server, nil
}

func RunGrpcServer(
	ctx context.Context,
	waitGroup *errgroup.Group,
	config *util.Envs,
	logger *logrus.Logger,
	minioCrud *crud.MinioCrud,
) {
	server, err := NewServer(config, logger, minioCrud)
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
	pb.RegisterFileServiceServer(grpcServer, server)
	reflection.Register(grpcServer)

	listener, err := net.Listen("tcp", config.GRPC_SERVER_ADDRESS)
	if err != nil {
		logger.Fatalf("cannot listen to address: %v", err)
	}

	waitGroup.Go(func() error {
		logger.Infof("start gRPC server at %s", config.GRPC_SERVER_ADDRESS)
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

// func RunGatewayServer(
// 	ctx context.Context,
// 	waitGroup *errgroup.Group,
// 	config *util.Envs,
// 	logger *logrus.Logger,
// 	minioCrud *crud.MinioCrud,
// ) {
// 	server, err := NewServer(config, logger, minioCrud)
// 	if err != nil {
// 		logger.Fatalf("cannot create server: %v", err)
// 	}

// 	jsonOption := runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
// 		MarshalOptions: protojson.MarshalOptions{
// 			UseProtoNames: true,
// 		},
// 		UnmarshalOptions: protojson.UnmarshalOptions{
// 			DiscardUnknown: true,
// 		},
// 	})

// 	grpcMux := runtime.NewServeMux(jsonOption)

// 	err = pb.RegisterFileServiceHandlerServer(ctx, grpcMux, server)
// 	if err != nil {
// 		logger.Fatalf("cannot register gateway service handler: %v", err)
// 	}

// 	mux := http.NewServeMux()
// 	mux.Handle("/", grpcMux)
// 	http_handler := GetGatewayLogger(mux, logger)

// 	httpServer := &http.Server{
// 		Handler: http_handler,
// 		Addr:    config.HTTP_SERVER_ADDRESS,
// 	}

// 	waitGroup.Go(func() error {

// 		logger.Infof("start HTTP gateway server at %s", httpServer.Addr)

// 		err = httpServer.ListenAndServe()
// 		if err != nil {
// 			if errors.Is(err, http.ErrServerClosed) {
// 				return nil
// 			}
// 			logger.Errorf("HTTP gateway server is stopped: %v", err)

// 			return err
// 		}
// 		return nil
// 	})

// 	waitGroup.Go(func() error {
// 		<-ctx.Done()
// 		logger.Info("Shutting down HTTP gateway server")

// 		err := httpServer.Shutdown(context.Background())
// 		if err != nil {
// 			logger.Errorf("HTTP gateway server is stopped: %v", err)
// 			return err
// 		}

// 		logger.Info("HTTP gateway server is stopped")
// 		return nil
// 	})
// }
