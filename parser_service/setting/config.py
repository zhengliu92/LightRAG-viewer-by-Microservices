import os
import redis
from dataclasses import dataclass


class RedisConfig:
    def __init__(self):
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = os.getenv("REDIS_PORT", 6379)
        self.redis_db = os.getenv("REDIS_DB", 0)
        self.redis_max_connections = int(os.getenv("REDIS_MAX_CONNECTIONS", 10))


class AppConfig:
    def __init__(self):
        self.app_path = os.getenv(
            "APP_PATH", os.path.dirname(os.path.dirname(__file__))
        )
        self.config_path = os.path.join(self.app_path, "magic-pdf.json")
        self.temp_dir = os.path.join(self.app_path, "temp")
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir, exist_ok=True)
        os.environ["MINERU_TOOLS_CONFIG_JSON"] = self.config_path


@dataclass
class Config(RedisConfig, AppConfig):
    def __init__(self):
        RedisConfig.__init__(self)
        AppConfig.__init__(self)


app_config = Config()

pool = redis.ConnectionPool(
    host=app_config.redis_host,  # Redis server host
    port=app_config.redis_port,  # Redis server
    db=app_config.redis_db,  # Redis server db
    max_connections=app_config.redis_max_connections,
    decode_responses=True,  # Automatically decode responses to strings
)

redis_client = redis.Redis(connection_pool=pool)
