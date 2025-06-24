import os

MODEL_POOL_SIZE = int(os.getenv("MODEL_POOL_SIZE", 1))
MAX_WORKERS = int(os.getenv("MAX_WORKERS", 1))
USE_RERANKER = os.getenv("USE_RERANKER", "false") == "true"
