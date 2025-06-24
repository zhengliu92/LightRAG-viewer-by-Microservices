package gapi

import (
	"context"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func GetGrpcLogger(grpc_logger *logrus.Logger) func(ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (resp interface{}, err error) {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (resp interface{}, err error) {
		startTime := time.Now()
		result, err := handler(ctx, req)
		duration := time.Since(startTime)

		statusCode := codes.Unknown
		if st, ok := status.FromError(err); ok {
			statusCode = st.Code()
		}

		logger := grpc_logger.Infof
		if err != nil {
			logger = grpc_logger.Errorf
		}
		logger(
			"protocol=%s method=%s status_code=%d status_text=%s duration=%s",
			"grpc", info.FullMethod, int(statusCode), statusCode.String(), duration,
		)

		return result, err
	}

}

type ResponseRecorder struct {
	http.ResponseWriter
	StatusCode int
	Body       []byte
}

func (rec *ResponseRecorder) WriteHeader(statusCode int) {
	rec.StatusCode = statusCode
	rec.ResponseWriter.WriteHeader(statusCode)
}

func (rec *ResponseRecorder) Write(body []byte) (int, error) {
	rec.Body = body
	return rec.ResponseWriter.Write(body)
}

func GetGatewayLogger(handler http.Handler, logrus *logrus.Logger) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		startTime := time.Now()
		rec := &ResponseRecorder{
			ResponseWriter: res,
			StatusCode:     http.StatusOK,
		}
		handler.ServeHTTP(rec, req)
		duration := time.Since(startTime)

		logger := logrus.Infof
		if rec.StatusCode != http.StatusOK {
			logger = logrus.Errorf
		}

		logger(
			"protocol=%s method=%s path=%s status_code=%d status_text=%s duration=%s",
			"http", req.Method, req.RequestURI, rec.StatusCode, http.StatusText(rec.StatusCode), duration,
		)
	})
}
