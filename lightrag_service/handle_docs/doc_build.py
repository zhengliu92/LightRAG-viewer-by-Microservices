import argparse
import json
from app.document_processor import process_doc
from app.models import InsertDocsRequest
from handle_redis.redis_config import redis_client


def doc_build():
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--json", type=str, required=True)
    arg_parser.add_argument("--proj_path", type=str, required=True)
    arg_parser.add_argument("--redis_key", type=str, required=True)
    args = arg_parser.parse_args()
    kwargs = json.loads(args.json)
    req = InsertDocsRequest(**kwargs)
    process_doc(args.proj_path, req)
    redis_client.delete(args.redis_key)


if __name__ == "__main__":
    doc_build()
