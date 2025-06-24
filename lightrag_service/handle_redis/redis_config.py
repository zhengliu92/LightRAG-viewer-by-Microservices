import os
import redis


class RedisConfig:
    def __init__(self):
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = os.getenv("REDIS_PORT", 6379)
        self.redis_db = os.getenv("REDIS_DB", 0)
        self.redis_max_connections = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))


redis_config = RedisConfig()

pool = redis.ConnectionPool(
    host=redis_config.redis_host,  # Redis server host
    port=redis_config.redis_port,  # Redis server
    db=redis_config.redis_db,  # Redis server db
    max_connections=redis_config.redis_max_connections,
    decode_responses=True,  # Automatically decode responses to strings
)

redis_client = redis.Redis(connection_pool=pool)
