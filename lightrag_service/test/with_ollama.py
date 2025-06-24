import os

os.environ["NEO4J_URI"] = "neo4j://localhost:7687"
os.environ["NEO4J_USERNAME"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "neo4jpass"


os.environ["OPENAI_API_KEY"] = (
    "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"
)
os.environ["OPENAI_PROJECT_ID"] = "proj_aoST7rdZ9XPpkgCKq73Br5vg"

from lightrag.llm import ollama_model_complete, ollama_embedding, gpt_4o_mini_complete
from lightrag.utils import EmbeddingFunc
from lightrag import LightRAG, QueryParam
from grpc_client import embed_client
from lightrag.utils import EmbeddingFunc

WORKING_DIR = "./paper"


if not os.path.exists(WORKING_DIR):
    os.mkdir(WORKING_DIR)


rag = LightRAG(
    working_dir=WORKING_DIR,
    llm_model_func=ollama_model_complete,
    llm_model_max_async=1,
    llm_model_name="qwen2.5m:7b-instruct-q8_0",
    llm_model_max_token_size=32767,
    embedding_batch_num=32,
    graph_storage="Neo4JStorage",
    llm_model_kwargs={"host": "http://localhost:11434", "options": {"num_ctx": 32767}},
    # Use Ollama embedding function
    embedding_func=EmbeddingFunc(
        embedding_dim=1024,
        max_token_size=8096,
        func=lambda texts: embed_client.embed(texts),
    ),
    addon_params={
        "language": "Chinese",
        "entity_types": ["organization", "person", "geo", "event", "category"],
    },
)

with open("./paper.txt") as f:
    rag.insert(f.read())

print(rag.query(QueryParam(query="What is the main topic of the paper?", topk=5)))
