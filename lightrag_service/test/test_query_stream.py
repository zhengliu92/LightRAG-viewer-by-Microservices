import json

import requests


def test_query_stream_success():

    request_data = {
        "username": "admin",
        "kb_id": "acd",
        "query": "这篇文章的主要发现是什么",
        "api_key": "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",
        "project_id": "proj_aoST7rdZ9XPpkgCKq73Br5vg",
        "history_messages": [],
        "decode_api_key": False,
    }
    json_data = json.dumps(request_data)

    response = requests.post(
        "http://192.168.1.100:8200/query/stream",
        data=json_data,
        stream=True,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    for chunk in response.iter_lines(decode_unicode=True):
        if chunk:
            print(chunk, end="\n", flush=True)  # Print chunks as they arrive


if __name__ == "__main__":
    test_query_stream_success()
