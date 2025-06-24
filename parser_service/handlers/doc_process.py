import json
import logging
from pathlib import Path
from shutil import rmtree
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from contextlib import contextmanager

from client import fs_client
from redis_crud import hset_parser_progress, hset_parser_incremental_progress
from functools import partial
import random
from protos.parser_service_pb2 import ParseDocumentRequest
from handlers.doc_parse import get_parser
from handlers.json_extractor import extract

# Configure logging
logger = logging.getLogger(__name__)


# Constants for status messages
class ParserStatus:
    QUEUING = "queuing"
    PARSING = "解析中"
    PARSING_FAILED = "解析失败"
    EXTRACTING_TEXT = "提取文本中"
    EXTRACTION_FAILED = "提取文本失败"
    UPLOADING_IMAGES = "上传图片中"
    UPLOAD_FAILED = "上传图片失败"
    COMPLETED = "解析完成"


class ParserError(Exception):
    """Base exception for parser-related errors"""

    pass


@dataclass
class ParseResult:
    texts: List[dict]
    figures: List[dict]
    tables: List[dict]
    full_text: str


class DocumentParser:
    def __init__(
        self,
        request: Dict[str, Any],
        file_path: Optional[str] = None,
    ):
        self.user_id = request.get("user_id", None)
        self.doc_id = request.get("doc_id", None)
        self.bucket_name = request.get("bucket_name", None)
        self.file_name = request.get("doc_path", None)
        self.file_path = file_path
        self.event_name = "parse"

        self._validate_inputs()

        self.progress_setter = partial(
            hset_parser_progress,
            self.event_name,
            self.bucket_name,
            self.file_name,
        )

        self.incremental_setter = partial(
            hset_parser_incremental_progress,
            self.event_name,
            self.bucket_name,
            self.file_name,
        )

    def _validate_inputs(self) -> None:
        if all(
            [self.file_path is None, self.bucket_name is None, self.file_name is None]
        ):
            raise ParserError(
                "file_path, bucket_name, and file_name cannot be all None"
            )
        if all([self.bucket_name is None, self.file_name is None]):
            raise ParserError("bucket_name and file_name cannot be both None")

    @contextmanager
    def _cleanup_context(self, result_json_path: Path):
        try:
            yield
        finally:
            if result_json_path.parent.exists():
                logger.info(
                    f"Cleaning up temporary directory: {result_json_path.parent}"
                )
                rmtree(str(result_json_path.parent))

    def _initialize_progress(self) -> None:
        self.progress_setter(
            status=ParserStatus.QUEUING,
            is_failed=0,
            percent=1,
            is_finished=0,
            texts=json.dumps([]),
            figures=json.dumps([]),
            tables=json.dumps([]),
            full_text="",
        )

    def _handle_parsing(self) -> Path:
        parser = get_parser(
            user_id=self.user_id,
            doc_id=self.doc_id,
            file_path=self.file_path,
            bucket_name=self.bucket_name,
            file_name=self.file_name,
            callback=self.incremental_setter,
        )

        try:
            return parser()
        except Exception as e:
            logger.error(f"Parsing failed: {str(e)}", exc_info=True)
            self.progress_setter(
                status=f"{ParserStatus.PARSING_FAILED}: {str(e)}",
                is_failed=1,
                percent=100,
                is_finished=1,
            )
            raise ParserError(f"Document parsing failed: {str(e)}") from e

    def _process_assets(self, block: Dict, assets_path: List[str]) -> None:
        if not assets_path:
            return

        uploader = fs_client.base64_upload_files(
            self.bucket_name,
            str(Path(self.file_name).parent),
        )

        try:
            file_names_map = uploader(assets_path)
            for figure in block["figures"]:
                if figure["img_path"] in file_names_map:
                    figure["img_path"] = file_names_map[figure["img_path"]]
        except Exception as e:
            logger.error(f"Failed to upload images: {str(e)}", exc_info=True)
            self.progress_setter(
                status=f"{ParserStatus.UPLOAD_FAILED}: {str(e)}",
                is_failed=1,
                percent=100,
                is_finished=1,
            )
            raise ParserError(f"Failed to upload images: {str(e)}") from e

    def parse(self) -> ParseResult:
        """Main method to handle the document parsing process"""
        self._initialize_progress()

        result_json_path = self._handle_parsing()

        with self._cleanup_context(result_json_path):
            try:
                block, assets_path, full_text = extract(result_json_path)
            except Exception as e:
                logger.error(f"Text extraction failed: {str(e)}", exc_info=True)
                self.progress_setter(
                    status=ParserStatus.EXTRACTION_FAILED,
                    is_failed=1,
                    percent=100,
                    is_finished=1,
                )
                raise ParserError(f"Text extraction failed: {str(e)}") from e

            self.incremental_setter(
                incremental_percent=random.randint(5, 10),
                status=ParserStatus.EXTRACTING_TEXT,
            )

            self._process_assets(block, assets_path)

            self.progress_setter(
                status=ParserStatus.COMPLETED,
                is_failed=0,
                percent=100,
                is_finished=1,
                texts=json.dumps(block["texts"]),
                figures=json.dumps(block["figures"]),
                tables=json.dumps(block["tables"]),
                full_text=full_text,
            )

            return ParseResult(
                texts=block["texts"],
                figures=block["figures"],
                tables=block["tables"],
                full_text=full_text,
            )


def parse_process(
    request: ParseDocumentRequest = None,
    file_path: str = None,
    **kwargs,
) -> None:
    """Legacy wrapper function for backward compatibility"""
    document_parser = DocumentParser(request, file_path)
    document_parser.parse()
