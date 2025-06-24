import os
from shutil import rmtree
import grpc
from concurrent import futures
from protos.parser_service_pb2 import (
    ParseDocumentRequest,
    ParseDocumentResponse,
)
from protos.parser_service_pb2_grpc import (
    ParserServiceServicer,
    add_ParserServiceServicer_to_server,
)
from grpc_reflection.v1alpha import reflection
from global_vars import MAX_WORKERS
from setting.config import redis_client, app_config
from typing import List
from subprocess import Popen
import json


def clear_redis_cache():
    redis_keys: List[str] = redis_client.keys("*")
    del_key_start = ["parser_lock", "parse", "semaphore"]
    for key in redis_keys:
        if any(key.startswith(prefix) for prefix in del_key_start):
            redis_client.delete(key)


def clean_temp_files():
    rmtree(app_config.temp_dir)
    os.makedirs(app_config.temp_dir, exist_ok=True)


def init_app():
    clear_redis_cache()
    clean_temp_files()


class ParserService(ParserServiceServicer):
    def ParseDocument(self, request: ParseDocumentRequest, context):
        req_dict = {
            "request": {
                "user_id": request.user_id,
                "doc_id": request.doc_id,
                "bucket_name": request.bucket_name,
                "doc_path": request.doc_path,
            }
        }
        req_json = json.dumps(req_dict)
        p = Popen(
            [
                "python",
                "handlers/run_parse.py",
                "--json",
                req_json,
            ],
        )
        return ParseDocumentResponse(message="Document started parsing")


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    parser_service = ParserService()
    add_ParserServiceServicer_to_server(parser_service, server)
    SERVICE_NAMES = (
        "parser_service.ParserService",
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)
    server.add_insecure_port("[::]:50052")
    server.start()
    print("Server started on port 50052")
    server.wait_for_termination()


if __name__ == "__main__":
    init_app()
    serve()
