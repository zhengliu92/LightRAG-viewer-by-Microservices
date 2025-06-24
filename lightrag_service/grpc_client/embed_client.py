import httpx
import asyncio
from typing import List, Dict, Any
import os

EMBED_SERVICE_HOST = os.getenv("EMBED_SERVICE_HOST", "192.168.1.100")
EMBED_SERVICE_PORT = os.getenv("EMBED_SERVICE_PORT", 8888)
EMBED_SERVICE_URL = f"http://{EMBED_SERVICE_HOST}:{EMBED_SERVICE_PORT}"


class AsyncEmbedClient:
    def __init__(self, base_url: str = EMBED_SERVICE_URL):
        self.base_url = base_url.rstrip("/")

    async def embed(
        self, texts: List[str], max_length: int = 8096, batch_size: int = 32
    ) -> List[List[float]]:
        """
        Get embeddings for a list of texts
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/embed",
                json={
                    "texts": texts,
                    "max_length": max_length,
                    "batch_size": batch_size,
                },
                timeout=30.0,  # explicit timeout
            )
            response.raise_for_status()  # automatically raises for status codes >= 400
            return response.json()["data"]

    async def rerank(self, query: str, documents: List[str]) -> List[float]:
        """
        Get reranker scores for query-document pairs
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/rerank",
                json={"query": query, "documents": documents},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()["data"]


embed_client = AsyncEmbedClient()

if __name__ == "__main__":

    async def main():
        embeddings = await embed_client.rerank(
            "what is the meaning of life",
            [
                "Another text",
                "Hello world",
                "The meaning of life is to find the meaning of life",
            ],
        )
        print(embeddings)

    asyncio.run(main())
