from pathlib import Path
import random
import time
from typing import Callable

import torch
from client import fs_client
from client.file_grpc.file_service_py_pb2 import GetFileBytesResponse
from shutil import rmtree

from redis_crud import acquire_lock_with_timeout
from wrapper.pdf import ModifiedPdfConverter
from marker.models import create_model_dict
from marker.config.parser import ConfigParser
from marker.output import save_output
from setting import app_config
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from utils import gpu_infos

from global_vars import REDIS_SEMAPHORE

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def load_model(device: str = "cuda:0"):
    config = {
        "output_format": "json",
        "output_dir": "output",
        "paginate_output": True,
        "force_ocr": True,
    }
    try:
        config_parser = ConfigParser(config)
        model = ModifiedPdfConverter(
            config=config_parser.generate_config_dict(),
            artifact_dict=create_model_dict(device=device),
            processor_list=config_parser.get_processors(),
            renderer=config_parser.get_renderer(),
        )
    except Exception as e:
        torch.cuda.empty_cache()
        logger.error(f"Failed to get model: {e}")
        raise e
    return model


def aquire_gpu(callback: Callable = None):
    gpu_id, free_memory = gpu_infos.get_least_utilized_gpu_and_memory()
    n_retries = 0
    while free_memory < 10:
        gpu_id, free_memory = gpu_infos.get_least_utilized_gpu_and_memory()
        callback(incremental_percent=0, status="GPU资源不足，等待GPU资源释放")
        time.sleep(5)
        n_retries += 1
        if n_retries > 10:
            raise RuntimeError("Timeout waiting for available GPU")

    return gpu_id


def cleanup_resources(token: str = None):
    """Clean up resources used during parsing"""
    try:
        torch.cuda.empty_cache()
        if token:
            REDIS_SEMAPHORE.release(token)
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    after=lambda retry_state: logger.error(
        f"Attempt {retry_state.attempt_number} failed with: {retry_state.outcome.exception()}"
    ),
)
def run_parse(
    file_path: Path,
    callback: Callable,
):
    model = None
    rendered = None
    try:
        token = REDIS_SEMAPHORE.acquire(timeout=60 * 60 * 30)
        if not token:
            raise RuntimeError("Timeout waiting for available model slot")

        gpu_id = aquire_gpu(callback)

        callback(
            incremental_percent=random.randint(1, 3),
            status="模型加载中",
        )

        model = load_model(device=f"cuda:{gpu_id}")
        model.add_callback(callback)
        callback(
            incremental_percent=random.randint(3, 6), status="开始解析", reset=True
        )
        try:
            rendered = model(str(file_path))
        except Exception as e:
            callback(
                incremental_percent=random.randint(1, 3),
                status=str(e),
            )
            raise e
        save_output(rendered, str(file_path.parent), file_path.stem)
    finally:
        del model, rendered
        cleanup_resources(token=token)


def get_parser(
    user_id: str = None,
    doc_id: str = None,
    file_path: str = None,
    bucket_name: str = None,
    file_name: str = None,
    callback: Callable = None,
    **kwargs,
):
    """Get a document parser function.

    Args:
        user_id: User ID for the document
        doc_id: Document ID
        file_path: Optional direct file path
        bucket_name: Storage bucket name
        file_name: File name in the bucket
        parser: DocParse instance
        callback: Progress callback function

    Returns:
        Callable: A function that executes the parsing
    """
    if file_path is None:
        if not all([bucket_name, file_name]):
            raise ValueError(
                "Either file_path or both bucket_name and file_name must be provided"
            )

        file_name_path = Path(file_name)
        file_dir = Path(app_config.temp_dir, user_id, doc_id)
        file_path = Path(file_dir, doc_id + file_name_path.suffix)

        file_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            data: GetFileBytesResponse = fs_client.get_file_bytes(
                bucket_name, file_name
            )
            with open(file_path, "wb") as f:
                f.write(data.content)
        except Exception as e:
            if file_dir.exists():
                rmtree(str(file_dir))
            raise RuntimeError(f"Failed to download file: {str(e)}") from e
    else:
        file_path: Path = Path(file_path)
        file_dir = file_path.parent

    def _parse():
        try:
            json_path = file_dir / file_path.with_suffix(".json").name
            # with acquire_lock_with_timeout(user_id, doc_id):
            run_parse(file_path, callback)
            return json_path

        except Exception as e:
            if file_dir.exists():
                rmtree(str(file_dir))
            raise RuntimeError(f"Document parsing failed: {str(e)}") from e

    return _parse
