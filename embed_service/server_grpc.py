import grpc
from concurrent import futures
from protos import embedService_pb2_grpc
from protos.embedService_pb2 import (
    EmbeddingResponse,
    RerankerResponse,
    FloatArray,
    EmbeddingRequest,
    RerankerRequest,
)
from handler import embed, rerank
import os
from grpc import StatusCode  # Add this import at the top

MAX_WORKERS = int(os.getenv("MAX_WORKERS", 5))


class EmbeddingServicer(embedService_pb2_grpc.EmbeddingServiceServicer):
    def Embedding(self, request: EmbeddingRequest, context):
        try:
            embeddings = embed(
                texts=request.texts,
                max_length=(
                    request.max_length if request.HasField("max_length") else 8096
                ),
                batch_size=request.batch_size if request.HasField("batch_size") else 32,
            )

            # Convert numpy arrays to FloatArray messages
            embedding_messages = [FloatArray(values=emb.tolist()) for emb in embeddings]

            return EmbeddingResponse(
                data=embedding_messages,
                code=StatusCode.OK.value[0],
                status="success",
                message="",
            )
        except Exception as e:
            return EmbeddingResponse(
                data=[],
                code=StatusCode.INTERNAL.value[0],
                status="error",
                message=str(e),
            )

    def Reranker(self, request: RerankerRequest, context):
        try:
            scores = rerank(query=request.query, documents=request.documents)
            score_messages = [FloatArray(values=[score]) for score in scores]

            return RerankerResponse(
                data=score_messages,
                code=StatusCode.OK.value[0],
                status="success",
                message="",
            )

        except Exception as e:
            return RerankerResponse(
                data=[],
                code=StatusCode.INTERNAL.value[0],
                status="error",
                message=str(e),
            )


def serve(port=50051):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    embedService_pb2_grpc.add_EmbeddingServiceServicer_to_server(
        EmbeddingServicer(), server
    )
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"Server started on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    server_port = os.getenv("SERVER_PORT", "50051")
    serve(server_port)
