from functools import partial
from lightrag.utils import EmbeddingFunc
import lightrag.llm as llm
import asyncio

OPENAI_API_KEY = ""
OPENAI_PROJECT_ID = ""


async def test_embedding():
    embedding_func = EmbeddingFunc(
        embedding_dim=1536,
        max_token_size=8192,
        concurrent_limit=16,
        func=partial(
            llm.openai_embedding,
            api_key=OPENAI_API_KEY,
            project=OPENAI_PROJECT_ID,
        ),
    )

    print(await embedding_func("hello"))


async def test_embedding_batch():
    embedding_func = EmbeddingFunc(
        embedding_dim=1536,
        max_token_size=8192,
        concurrent_limit=16,
        func=partial(
            llm.openai_embedding,
            api_key=OPENAI_API_KEY,
            project=OPENAI_PROJECT_ID,
        ),
    )


if __name__ == "__main__":
    asyncio.run(test_embedding())
