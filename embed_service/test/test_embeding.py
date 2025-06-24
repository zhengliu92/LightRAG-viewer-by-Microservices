from FlagEmbedding import BGEM3FlagModel
import time
import torch


t_start = time.time()
model = BGEM3FlagModel(
    "BAAI/bge-m3",
    use_fp16=True,
)
t_end = time.time()

print(f"Time taken: {t_end - t_start} seconds")


sentences_1 = ["What is BGE M3?"]

sentences_2 = [
    "BM25 is a bag-of-words retrieval function that ranks a set of documents based on the query terms appearing in each document",
    "BGE M3 is an embedding model supporting dense retrieval, lexical matching and multi-vector interaction.",
]

embeddings_1 = model.encode(
    sentences_1,
    max_length=8096,
)["dense_vecs"]

embeddings_2 = model.encode(
    sentences_2,
    max_length=8096,
)["dense_vecs"]


similarity = embeddings_1 @ embeddings_2.T
print(similarity)
torch.cuda.empty_cache()
