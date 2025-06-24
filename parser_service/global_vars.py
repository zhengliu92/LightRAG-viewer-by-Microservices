import os
from redis_crud import RedisSemaphore
from setting.config import redis_client

MAX_WORKERS = int(os.getenv("MAX_WORKERS", 5))
MAX_CONCURRENT_MODELS = int(os.getenv("MAX_CONCURRENT_MODELS", 1))
REDIS_SEMAPHORE = RedisSemaphore(redis_client, "parse", MAX_CONCURRENT_MODELS)
