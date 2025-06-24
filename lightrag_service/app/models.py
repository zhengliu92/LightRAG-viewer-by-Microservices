from typing import List, Optional, Literal
from pydantic import BaseModel, Field

from viewer.graph_to_json import Edge, Node


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str
    id: str


class KBFileText(BaseModel):
    kbfile_id: str
    file_content: str


class KBFigure(BaseModel):
    kbfile_id: str
    img_id: str
    caption: str


class KBTable(BaseModel):
    table_id: str
    kbfile_id: str
    caption: str
    table_html: str


class KBFile(BaseModel):
    kb_id: str
    kbfile_id: str
    file_text: KBFileText
    figures: List[KBFigure]
    tables: List[KBTable]


class BaseRequest(BaseModel):
    kb_id: str
    api_key: str
    project_id: Optional[str] = Field(default=None)
    api_provider: Literal["openai", "deepseek_v3"] = Field(default="deepseek_v3")
    embed_model: Literal["text-embedding-3-small", "bge-m3"] = Field(default="bge-m3")
    decode_api_key: bool = Field(default=True)
    chunk_token_size: int = Field(default=1200)
    chunk_overlap_token_size: int = Field(default=120)
    history_messages: List[Message] = Field(default=[])
    temperature: float = Field(default=0.1)
    threshold: float = Field(default=0.5)
    top_n: int = Field(default=15)
    max_memory: int = Field(default=5)
    query_mode: Literal["hybrid", "global", "local"] = Field(default="hybrid")


class InsertDocsRequest(BaseRequest):
    kbfile: KBFile


class StopInsertDocsRequest(BaseModel):
    kb_id: str
    kb_file_id: str


class QueryRequest(BaseRequest):
    query: str


class QueryAssetsRequest(BaseRequest):
    query: str


class QueryContextRequest(BaseModel):
    query: str
    kb_id: str


class GetGraphDataRequest(BaseModel):
    kb_id: str


class GraphDataResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class ListDocsRequest(BaseModel):
    kb_id: str


class DeleteDocRequest(BaseRequest):
    kbfile_id: str
    api_key: str = Field(default="xxxxxx")


class DeleteKBRequest(BaseModel):
    kb_id: str


class BaseResponse(BaseModel):
    message: str


class TableResponse(BaseModel):
    id: str
    score: float
    content: str
    table_html: str


class FigureResponse(BaseModel):
    id: str
    content: str
    score: float
