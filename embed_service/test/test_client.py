import grpc
from protos import embedService_pb2_grpc
from protos.embedService_pb2 import EmbeddingRequest, RerankerRequest
from grpc import StatusCode


class EmbeddingClient:
    def __init__(self, host="localhost", port="50055"):
        channel = grpc.insecure_channel(f"{host}:{port}")
        self.stub = embedService_pb2_grpc.EmbeddingServiceStub(channel)

    def get_embeddings(self, texts, max_length=8096, batch_size=32):

        request = EmbeddingRequest(
            texts=texts, max_length=max_length, batch_size=batch_size
        )
        response = self.stub.Embedding(request)
        # Convert FloatArray messages back to lists
        if response.code == StatusCode.OK.value[0]:
            return [list(emb.values) for emb in response.data]
        else:
            raise Exception(response.message)

    def get_reranker_scores(self, query, documents):
        request = RerankerRequest(query=query, documents=documents)
        response = self.stub.Reranker(request)
        # Convert FloatArray messages back to single scores
        if response.code == StatusCode.OK.value[0]:
            return [score.values[0] for score in response.data]
        else:
            raise Exception(response.message)


# Example usage
if __name__ == "__main__":
    client = EmbeddingClient()

    # Example embedding request
    texts = ["Hello world", "This is a test"]
    embeddings = client.get_embeddings(texts, batch_size=1)
    print("Embeddings:", len(embeddings))
    print("Embedding dims:", len(embeddings[0]))

    # Example reranking request
    query = "What is the capital of France?"
    documents = ["Paris is the capital of France.", "London is the capital of England."]
    scores = client.get_reranker_scores(query, documents)
    print("Reranking scores:", scores)
