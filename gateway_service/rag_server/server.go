package rag_server

import (
	"context"
	"fmt"
	db "gateway_service/db/sqlc"
	"gateway_service/token"
	"gateway_service/util"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

type Server struct {
	server      *http.Server
	config      *util.Envs
	logger      *logrus.Logger
	tokenMaker  token.Maker
	store       db.Store
	redisClient *redis.Client
}

func NewServer(
	config *util.Envs,
	logger *logrus.Logger,
	tokenMaker token.Maker,
	store db.Store,
	redisClient *redis.Client,
) *Server {
	server := &Server{
		config:      config,
		logger:      logger,
		tokenMaker:  tokenMaker,
		store:       store,
		redisClient: redisClient,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/query/stream", server.handleQueryStream)

	server.server = &http.Server{
		Addr:    config.RAG_SERVER_ADDRESS,
		Handler: CORSMiddleware(mux),
	}

	return server
}

func (s *Server) Run(ctx context.Context, addr string, waitGroup *errgroup.Group) error {
	waitGroup.Go(func() error {
		s.logger.Infof("starting RAG proxy server at %s", addr)

		// Create a channel to listen for context cancellation
		serverErr := make(chan error, 1)

		// Start server in a goroutine
		go func() {
			if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				serverErr <- fmt.Errorf("failed to start RAG proxy server: %w", err)
			}
			close(serverErr)
		}()

		// Wait for either context cancellation or server error
		select {
		case err := <-serverErr:
			if err != nil {
				s.logger.Errorf("%v", err)
				return err
			}
			return nil

		case <-ctx.Done():
			s.logger.Info("shutting down RAG proxy server gracefully")
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			if err := s.server.Shutdown(shutdownCtx); err != nil {
				s.logger.Errorf("failed to shutdown RAG proxy server gracefully: %v", err)
				return fmt.Errorf("failed to shutdown RAG proxy server gracefully: %w", err)
			}
			return nil
		}

	})
	return nil
}
