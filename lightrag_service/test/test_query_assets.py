from fastapi.testclient import TestClient
from main import create_app


def test_query_tables():
    client = TestClient(create_app())
    response = client.post(
        "/query/tables",
        json={
            "query": "test",
            "username": "admin",
            "kb_id": "acd",
            "api_key": "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",
            "project_id": "proj_aoST7rdZ9XPpkgCKq73Br5vg",
            "decode_api_key": False,
        },
    )
    assert response.status_code == 200
    print(response.json())


def test_query_figures():
    client = TestClient(create_app())
    response = client.post(
        "/query/figures",
        json={
            "query": "test",
            "username": "admin",
            "kb_id": "acd",
            "api_key": "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",
            "project_id": "proj_aoST7rdZ9XPpkgCKq73Br5vg",
            "decode_api_key": False,
        },
    )
    assert response.status_code == 200
    print(response.json())


if __name__ == "__main__":
    test_query_figures()
