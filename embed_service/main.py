import os

from globals import MAX_WORKERS

os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from handler import embed, rerank
import time
from datetime import datetime
import uvicorn
import logging

app = FastAPI(title="Embedding Service")
logger = logging.getLogger(__name__)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    request_from = request.client.host
    method = request.method
    path = request.url.path
    logger.info(
        f"{current_time} | From: {request_from} | Method: {method} | Path: {path} | Time: {process_time:.4f}s"
    )
    return response


class EmbeddingRequest(BaseModel):
    texts: List[str]
    max_length: Optional[int] = 8096
    batch_size: Optional[int] = 16


class RerankerRequest(BaseModel):
    query: str
    documents: List[str]


class EmbeddingResponse(BaseModel):
    data: List[List[float]]
    code: Optional[int] = 200
    status: Optional[str] = "success"
    message: Optional[str] = None


class RerankerResponse(BaseModel):
    data: List[float]
    code: Optional[int] = 200
    status: Optional[str] = "success"
    message: Optional[str] = None


@app.post("/embed", response_model=EmbeddingResponse)
async def embedding(request: EmbeddingRequest):
    if not request.texts:
        return EmbeddingResponse(data=[])
    try:
        embeddings = embed(
            texts=request.texts,
            max_length=request.max_length,
            batch_size=request.batch_size,
        )
        return EmbeddingResponse(data=embeddings.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rerank", response_model=RerankerResponse)
async def reranking(request: RerankerRequest):
    if not request.documents:
        return RerankerResponse(data=[])
    try:
        scores = rerank(query=request.query, documents=request.documents)
        return RerankerResponse(data=scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8888, workers=MAX_WORKERS)
