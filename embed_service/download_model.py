import os

from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="BAAI/bge-m3",
    local_dir="BAAI/bge-m3",
    cache_dir="cache/BAAI/bge-m3",
    endpoint="https://huggingface.co",
)


snapshot_download(
    repo_id="BAAI/bge-reranker-v2-m3",
    local_dir="BAAI/bge-reranker-v2-m3",
    cache_dir="cache/BAAI/bge-reranker-v2-m3",
    endpoint="https://huggingface.co",
)
