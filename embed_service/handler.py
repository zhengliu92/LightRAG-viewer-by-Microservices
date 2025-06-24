from typing import List
import numpy as np
from FlagEmbedding import BGEM3FlagModel
from FlagEmbedding import FlagReranker
from queue import Queue
from globals import MODEL_POOL_SIZE, USE_RERANKER
import torch


def get_reranker():
    reranker = FlagReranker(
        "BAAI/bge-reranker-v2-m3",
        use_fp16=True,
    )
    return reranker


def get_embedding():
    model = BGEM3FlagModel(
        "BAAI/bge-m3",
        use_fp16=True,
    )
    return model


class BaseModelManager:
    def __init__(self, model_pool_size: int = MODEL_POOL_SIZE):
        self.model_pool_size = model_pool_size
        self.model_queue = Queue(maxsize=model_pool_size)

    def init_queue(self, get_model_func):
        for _ in range(self.model_pool_size):
            self.model_queue.put(get_model_func())

    def get_model(self):
        return self.model_queue.get()

    def put_model(self, model):
        # Clear CUDA cache before putting model back
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        self.model_queue.put(model)


class EmbeddingModelManager(BaseModelManager):
    def __init__(self):
        super().__init__()

    def init_queue(self):
        super().init_queue(get_embedding)


class RerankerModelManager(BaseModelManager):
    def __init__(self):
        super().__init__()

    def init_queue(self):
        super().init_queue(get_reranker)


embedding_model_manager = EmbeddingModelManager()
embedding_model_manager.init_queue()

reranker_model_manager = RerankerModelManager()
if USE_RERANKER:
    reranker_model_manager.init_queue()


def embed(
    texts: List[str], max_length: int = 8096, batch_size: int = 32
) -> List[np.ndarray]:
    model = embedding_model_manager.get_model()
    try:
        embeddings = model.encode(
            texts,
            max_length=max_length,
            batch_size=batch_size,
        )["dense_vecs"]
    except Exception as e:
        print(f"Error embedding: {e}")
        raise e
    finally:
        embedding_model_manager.put_model(model)
    return embeddings


def rerank(query: str, documents: List[str]) -> List[float]:
    rerank_inputs = [[query, doc] for doc in documents]
    reranker = reranker_model_manager.get_model()
    rerank_scores = reranker.compute_score(
        rerank_inputs,
        normalize=True,
    )
    return rerank_scores
