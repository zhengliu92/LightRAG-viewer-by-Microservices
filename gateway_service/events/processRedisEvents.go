package events

import (
	"context"
	db "gateway_service/db/sqlc"
	"gateway_service/util"
	"strings"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
)

type RedisEventProcessor struct {
	redisClient *redis.Client
	dbStore     db.Store
	config      *util.Envs
	logger      *logrus.Logger
}

func NewRedisEventProcessor(redisClient *redis.Client, dbStore db.Store, config *util.Envs, logger *logrus.Logger) *RedisEventProcessor {
	return &RedisEventProcessor{redisClient: redisClient, dbStore: dbStore, config: config, logger: logger}
}

func (r *RedisEventProcessor) SubscribeToRedisEvents(ctx context.Context) {
	subscriber := r.redisClient.PSubscribe(ctx, "__keyspace@0__:*")
	defer subscriber.Close()
	r.logger.Info("subscribed to redis events")
	for {
		msg, err := subscriber.ReceiveMessage(ctx)
		if err != nil {
			if err == context.Canceled {
				r.logger.Info("context canceled, stopping redis subscription")
				return
			}
			r.logger.Error("error receiving message from redis: ", err)
			continue
		}
		r.ProcessRedisEvents(ctx, msg.Channel, msg.Payload)
	}
}

func (r *RedisEventProcessor) ProcessRedisEvents(ctx context.Context, channel, eventType string) {
	// Split the keyspace notification channel name
	parts := strings.Split(channel, "__keyspace@0__:")
	if len(parts) < 2 {
		r.logger.Error("invalid channel format")
		return
	}

	key := parts[1]

	if eventType == "hset" {
		// Assuming you want to log all fields and values of the hash
		fields, err := r.redisClient.HGetAll(ctx, key).Result()
		if err != nil {
			r.logger.Error("error getting hash fields from redis: ", err)
			return
		}
		eventName := strings.Split(key, ":")[0]
		if eventName == "parse" {
			go r.HandleEventParse(ctx, key, fields)
		}
		if eventName == "build" {
			go r.HandleEventBuild(ctx, key, fields)
		}
	}
}
