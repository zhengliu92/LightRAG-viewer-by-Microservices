from subprocess import Popen
import json
import subprocess
import time


def test_popen():
    kwargs = {"proj_path": "test", "req": "test"}
    # no print
    p = Popen(
        ["python", "handle_docs/doc_build.py", "--json", json.dumps(kwargs)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    print(p.pid)


if __name__ == "__main__":
    test_popen()
