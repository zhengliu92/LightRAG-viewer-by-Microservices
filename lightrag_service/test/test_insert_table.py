from dataclasses import field
import os

os.environ["NEO4J_URI"] = "neo4j://localhost:7687"
os.environ["NEO4J_USERNAME"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "neo4jpass"
import random

OPENAI_API_KEY = ""
OPENAI_PROJECT_ID = ""

from handle_redis.redis_crud import (
    hset_build_progress,
    hset_build_incremental_progress,
    hget_build_progress,
)
from lightrag.utils import EmbeddingFunc
from lightrag import LightRAG, QueryParam
from lightrag.llm import gpt_4o_mini_complete, openai_embedding
from functools import partial
import asyncio
import time

WORKING_DIR = "./paper"
from threading import Thread

if not os.path.exists(WORKING_DIR):
    os.mkdir(WORKING_DIR)

time_start = time.time()
rag = LightRAG(
    working_dir=WORKING_DIR,
    llm_model_max_async=10,
    llm_model_max_token_size=32768,
    embedding_batch_num=32,
    chunk_token_size=2400,
    chunk_overlap_token_size=100,
    addon_params={"example_number": 3},
    llm_model_func=partial(
        gpt_4o_mini_complete,
        api_key=OPENAI_API_KEY,
        project=OPENAI_PROJECT_ID,
    ),
    embedding_func=EmbeddingFunc(
        embedding_dim=1536,
        max_token_size=8192,
        concurrent_limit=16,
        func=partial(
            openai_embedding,
            api_key=OPENAI_API_KEY,
            project=OPENAI_PROJECT_ID,
        ),
    ),
)

time_end = time.time()
print(f"time cost for loading : {time_end - time_start}")


if __name__ == "__main__":
    rag.insert_table(
        [
            TableType(
                table_id="table-1",
                caption="This is a test table1",
                table_html="This is a test table1",
            ),
            TableType(
                table_id="table-2",
                caption="This is a test table2",
                table_html="This is a test table2",
            ),
        ]
    )

    print(rag.query_table("This is a test table1"))
