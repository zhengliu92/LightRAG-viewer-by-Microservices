import pytest
from fastapi.testclient import TestClient
from main import app
import numpy as np
from unittest.mock import patch

client = TestClient(app)

# Test data
sample_texts = ["Hello world", "Test document"]
sample_embeddings = np.random.rand(2, 384).tolist()  # Assuming 384-dim embeddings
sample_query = "test query"
sample_documents = ["document 1", "document 2"]
sample_scores = [0.8, 0.3]

@pytest.fixture
def mock_embed():
    with patch('server_http.embed') as mock:
        mock.return_value = np.array(sample_embeddings)
        yield mock

@pytest.fixture
def mock_rerank():
    with patch('server_http.rerank') as mock:
        mock.return_value = sample_scores
        yield mock

def test_embedding_endpoint_success(mock_embed):
    response = client.post(
        "/embed",
        json={
            "texts": sample_texts,
            "max_length": 512,
            "batch_size": 4
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == len(sample_texts)
    assert data["status"] == "success"
    mock_embed.assert_called_once()

def test_embedding_endpoint_empty_texts():
    response = client.post(
        "/embed",
        json={
            "texts": [],
            "max_length": 512,
            "batch_size": 4
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0

def test_reranking_endpoint_success(mock_rerank):
    response = client.post(
        "/rerank",
        json={
            "query": sample_query,
            "documents": sample_documents
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == len(sample_documents)
    assert data["status"] == "success"
    mock_rerank.assert_called_once()

def test_reranking_endpoint_empty_documents(mock_rerank):
    response = client.post(
        "/rerank",
        json={
            "query": sample_query,
            "documents": []
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0

@pytest.mark.parametrize("endpoint", ["/embed", "/rerank"])
def test_invalid_json(endpoint):
    response = client.post(endpoint, json=None)
    assert response.status_code == 422

def test_embedding_error_handling(mock_embed):
    mock_embed.side_effect = Exception("Test error")
    response = client.post(
        "/embed",
        json={
            "texts": sample_texts,
            "max_length": 512,
            "batch_size": 4
        }
    )
    
    assert response.status_code == 500
    assert "Test error" in response.json()["detail"]

def test_reranking_error_handling(mock_rerank):
    mock_rerank.side_effect = Exception("Test error")
    response = client.post(
        "/rerank",
        json={
            "query": sample_query,
            "documents": sample_documents
        }
    )
    
    assert response.status_code == 500
    assert "Test error" in response.json()["detail"]

if __name__ == "__main__":
    pytest.main()