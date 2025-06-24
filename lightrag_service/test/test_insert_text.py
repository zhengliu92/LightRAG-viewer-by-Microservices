from lightrag.lightrag import LightRAG
from lightrag.utils import EmbeddingFunc
from lightrag import LightRAG, QueryParam
from lightrag.llm import gpt_4o_mini_complete, openai_embedding
from functools import partial
import time

OPENAI_API_KEY = ""
OPENAI_PROJECT_ID = ""

WORKING_DIR = "./example"


def test_insert_text():
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
    with open("example/paper1.txt", "r") as f:
        text1 = f.read()
    with open("example/paper2.txt", "r") as f:
        text2 = f.read()

    rag.insert(text1)
    rag.insert(text2)


if __name__ == "__main__":
    test_insert_text()
