package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/zhengliu92/minio-file-server/crud"
	"github.com/zhengliu92/minio-file-server/gapi"
	"github.com/zhengliu92/minio-file-server/util"
	"golang.org/x/sync/errgroup"
)

var interruptSignals = []os.Signal{
	os.Interrupt,
	syscall.SIGTERM,
	syscall.SIGINT,
}

func main() {
	config := util.NewEnvs()
	logger := util.NewLogger()
	ctx, stop := signal.NotifyContext(context.Background(), interruptSignals...)
	defer stop()
	minio_crud := crud.NewMinioCrud(
		logger,
		config,
	)
	waitGroup, ctx := errgroup.WithContext(ctx)
	gapi.RunGrpcServer(ctx, waitGroup, config, logger, minio_crud)
	// gapi.RunGatewayServer(ctx, waitGroup, config, logger, minio_crud)
	err := waitGroup.Wait()
	if err != nil {
		logger.Fatal("error from waitGroup")
	}
}
