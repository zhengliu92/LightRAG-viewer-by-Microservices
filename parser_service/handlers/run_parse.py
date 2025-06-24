import sys

sys.path.append(".")
import argparse
import json
from handlers.doc_process import parse_process


def run_parse():
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--json", type=str, required=True)
    args = arg_parser.parse_args()
    kwargs = json.loads(args.json)
    parse_process(**kwargs)


if __name__ == "__main__":
    run_parse()
