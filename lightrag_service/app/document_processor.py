import random
from functools import partial
import time
from app.rag_utils import get_rag
from lightrag import LightRAG
from .models import KBFileText, KBFigure, KBTable
from typing import List, Optional
from handle_redis.redis_crud import (
    hset_build_progress,
    hset_build_incremental_progress,
    hget_build_progress,
)
from handle_redis.redis_config import redis_client
from handle_redis.redis_lock import acquire_lock_with_timeout, release_lock
from app.models import InsertDocsRequest


def process_insert_file_text(
    rag: LightRAG,
    kbfiletext: KBFileText,
    callback: callable,
    kbfile_id: Optional[str] = None,
):
    callback(
        incremental_percent=random.randint(1, 2),
        status="开始处理文本",
    )
    rag.insert(kbfiletext.file_content, callback=callback, kbfile_id=kbfile_id)


def process_insert_figures(
    rag: LightRAG,
    kb_id: str,
    kbfile_id: str,
    figures: List[KBFigure],
    callback: callable,
):
    if not figures:
        return

    status = hget_build_progress(kb_id, kbfile_id)
    callback(
        incremental_percent=max(75 - float(status["percent"]), 1),
        status="开始处理图表",
    )
    len_figures = len(figures)
    for figure in figures:
        rag.insert_figure(figure)
        callback(
            incremental_percent=10 / len_figures,
            status="正在处理图表",
        )


def process_insert_tables(
    rag: LightRAG,
    kb_id: str,
    kbfile_id: str,
    tables: List[KBTable],
    callback: callable,
):
    if not tables:
        return

    status = hget_build_progress(kb_id, kbfile_id)
    callback(
        incremental_percent=max(90 - float(status["percent"]), 1),
        status="开始处理表格",
    )
    len_tables = len(tables)
    for table in tables:
        rag.insert_table(table)
        callback(
            incremental_percent=7 / len_tables,
            status="正在处理表格",
        )


def stop_process_doc(kb_id: str, kbfile_id: str):
    r = release_lock(redis_client, kb_id, kbfile_id)
    if r:
        hset_build_progress(
            kb_id=kb_id,
            kbfile_id=kbfile_id,
            percent=0,
            status="pending",
            is_finished=False,
            is_failed=False,
        )
    else:
        raise Exception("Failed to release lock")


def process_doc(
    proj_path: str,
    req: InsertDocsRequest,
):
    kbfile = req.kbfile
    time.sleep(random.randint(100, 300) / 1000)
    hset_build_progress(
        kb_id=kbfile.kb_id,
        kbfile_id=kbfile.kbfile_id,
        percent=1,
        status="queuing",
        is_finished=False,
        is_failed=False,
    )

    callback = partial(
        hset_build_incremental_progress,
        kb_id=kbfile.kb_id,
        kbfile_id=kbfile.kbfile_id,
    )

    def _process():
        try:
            rag = get_rag(proj_path, req)
            process_insert_file_text(rag, kbfile.file_text, callback, kbfile.kbfile_id)
            process_insert_figures(
                rag, kbfile.kb_id, kbfile.kbfile_id, kbfile.figures, callback
            )
            process_insert_tables(
                rag, kbfile.kb_id, kbfile.kbfile_id, kbfile.tables, callback
            )
            hset_build_progress(
                kbfile_id=kbfile.kbfile_id,
                kb_id=kbfile.kb_id,
                percent=100,
                status="构建完成",
                is_finished=True,
                is_failed=False,
            )
        except Exception as e:
            hset_build_progress(
                kbfile_id=kbfile.kbfile_id,
                kb_id=kbfile.kb_id,
                percent=100,
                status=f"构建失败: {e}",
                is_finished=True,
                is_failed=True,
            )

    with acquire_lock_with_timeout(
        redis_client,
        kbfile.kb_id,
        kbfile.kbfile_id,
        timeout=60 * 60 * 24,
    ):
        _process()
