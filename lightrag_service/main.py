import json
from subprocess import Popen
from fastapi import FastAPI, HTTPException
import starlette.status as status
from pathlib import Path
import uvicorn
from app.document_processor import stop_process_doc
from handle_redis.redis_crud import hset_build_progress
from lightrag import QueryParam
from app.models import (
    InsertDocsRequest,
    QueryContextRequest,
    QueryRequest,
    GetGraphDataRequest,
    GraphDataResponse,
    ListDocsRequest,
    BaseResponse,
    DeleteKBRequest,
    QueryAssetsRequest,
    DeleteDocRequest,
    StopInsertDocsRequest,
)
from app.rag_utils import get_rag
from sse_starlette.sse import EventSourceResponse
import json
from shutil import rmtree
from handle_redis.redis_config import redis_client
from viewer.graph_to_json import graph_to_json
import signal
import os
import subprocess
from typing import List


def clear_redis_cache():
    redis_keys: list[str] = redis_client.keys("*")
    del_key_start = ["kb_processing_lock", "build", "process"]
    for key in redis_keys:
        if any(key.startswith(prefix) for prefix in del_key_start):
            redis_client.delete(key)


PYTHON_PATH = os.getenv("PYTHON_PATH", "python")


def create_app():
    app = FastAPI(
        title="LightRAG API",
        description="API for querying text using LightRAG with OpenAI integration",
    )

    @app.post("/documents/insert", response_model=BaseResponse)
    async def insert_documents(
        req: InsertDocsRequest,
    ):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            proj_path.mkdir(parents=True, exist_ok=True)
        redis_key = ":".join(
            [
                "process",
                "insert_documents",
                req.kb_id,
                req.kbfile.kbfile_id,
            ]
        )
        if redis_client.get(redis_key):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="文档构建已开始",
            )
        try:
            p = Popen(
                [
                    PYTHON_PATH,
                    "handle_docs/doc_build.py",
                    "--json",
                    req.model_dump_json(),
                    "--proj_path",
                    str(proj_path),
                    "--redis_key",
                    redis_key,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            redis_client.set(redis_key, p.pid, ex=60 * 60)

            return BaseResponse(message="文档开始构建")

        except Exception:
            hset_build_progress(
                kbfile_id=req.kbfile.kbfile_id,
                kb_id=req.kbfile.kb_id,
                percent=100,
                status=f"构建失败: token数量超过限制",
                is_finished=True,
                is_failed=True,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str("token数量超过限制"),
            )

    @app.post("/documents/stop_insert", response_model=BaseResponse)
    async def stop_insert_documents(req: StopInsertDocsRequest):
        try:
            stop_process_doc(req.kb_id, req.kb_file_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

        redis_key = ":".join(
            [
                "process",
                "insert_documents",
                req.kb_id,
                req.kb_file_id,
            ]
        )
        pid = redis_client.get(redis_key)
        if not pid:
            return BaseResponse(message="文档构建已停止")

        # force stop the process
        try:
            os.kill(int(pid), signal.SIGKILL)
        except ProcessLookupError as e:
            return BaseResponse(message="文档构建已停止")
        except Exception as e:
            return BaseResponse(message=str(e))

        redis_client.delete(redis_key)

        return BaseResponse(message="文档构建已停止")

    @app.post("/query/stream")
    async def query_text_stream(req: QueryRequest):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            raise HTTPException(
                status_code=404,
                detail="the kb does not exist",
            )
        rag = get_rag(proj_path, req)
        try:
            response = await rag.aquery(
                req.query,
                req.kb_id,
                param=QueryParam(
                    stream=True,
                    only_need_context=False,
                    mode=req.query_mode,
                    top_k=req.top_n,
                ),
            )

            async def stream_generator():
                if isinstance(response, str):
                    yield json.dumps({"chunk": response})
                else:
                    async for chunk in response:
                        yield json.dumps({"chunk": chunk})

            return EventSourceResponse(stream_generator())
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/query/tables")
    async def query_tables(req: QueryAssetsRequest):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            raise HTTPException(
                status_code=404,
                detail="the kb does not exist",
            )
        rag = get_rag(proj_path, req)
        try:
            tables = await rag.aquery_table(
                req.query,
                req.top_n,
                req.threshold,
            )
            return {"tables": tables}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/query/figures")
    async def query_figures(req: QueryAssetsRequest):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            raise HTTPException(
                status_code=404,
                detail="the kb does not exist",
            )

        rag = get_rag(proj_path, req)
        try:
            figures = await rag.aquery_figure(
                req.query,
                req.top_n,
                req.threshold,
            )
            return {"figures": figures}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/query/context")
    async def query_context(req: QueryContextRequest):
        data = redis_client.get(f"context:{req.kb_id}:{req.query}")
        if not data:
            raise HTTPException(
                status_code=404,
                detail="未找到引用信息",
            )
        results = json.loads(data)
        entities_context: List[str] = results["entities_context"]
        relations_context: List[str] = results["relations_context"]
        text_units_context: List[str] = results["text_units_context"]
        results = {
            "entities_context": entities_context,
            "relations_context": relations_context,
            "text_units_context": text_units_context,
        }
        return results

    @app.post("/kb/graph", response_model=GraphDataResponse)
    async def graph_data(req: GetGraphDataRequest):
        data = graph_to_json(req.kb_id)
        if not data:
            raise HTTPException(
                status_code=404,
                detail="the kb does not contain graph data",
            )
        return GraphDataResponse(**data)

    @app.post("/documents/list")
    async def list_documents(req: ListDocsRequest):
        raise NotImplementedError

    @app.post("/kb/delete")
    async def delete_kb(req: DeleteKBRequest):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            return BaseResponse(message="the kb does not exist")
        rmtree(proj_path)
        return BaseResponse(message="the kb has been deleted")

    @app.post("/documents/delete")
    async def delete_document(req: DeleteDocRequest):
        proj_path = Path("store") / req.kb_id
        if not proj_path.exists():
            raise HTTPException(
                status_code=404,
                detail="the kb does not exist",
            )
        rag = get_rag(proj_path, req)
        await rag.adelete_by_doc_id(req.kbfile_id)
        return BaseResponse(message="the document has been deleted")

    return app


app = create_app()
if __name__ == "__main__":
    clear_redis_cache()
    workers = int(os.getenv("MAX_WORKERS", 1))
    uvicorn.run("main:app", host="0.0.0.0", port=8200, workers=workers)
