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


def insert_paper(kbfile_id: str):
    callback = partial(hset_build_incremental_progress, kbfile_id)

    hset_build_progress(
        kbfile_id=kbfile_id,
        percent=random.randint(1, 5),
        status="开始构建",
        is_finished=False,
        is_failed=False,
    )

    def _insert():
        try:
            with open("./examples/paper1.txt") as f:
                txt = f.read()
            rag.insert(txt, callback=callback)
            hset_build_progress(
                kbfile_id=kbfile_id,
                percent=100,
                status="构建完成",
                is_finished=True,
                is_failed=False,
            )
        except Exception as e:
            hset_build_progress(
                kbfile_id=kbfile_id,
                percent=100,
                status="构建失败",
                is_finished=True,
                is_failed=True,
            )

    return _insert


def test_build_progress():
    _insert = insert_paper("paper1")
    t = Thread(target=_insert)
    t.start()
    while True:
        ret = hget_build_progress("paper1")
        print(ret)
        time.sleep(1)


def test_query():
    ret = rag.query(
        "请简要描述一下文档的主要内容",
        QueryParam(
            top_k=10,
            mode="mix",
            only_need_context=False,
        ),
    )
    print(ret)


if __name__ == "__main__":
    test_build_progress()
    # test_query()
