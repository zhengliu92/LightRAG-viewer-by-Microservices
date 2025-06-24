from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class DocText(_message.Message):
    __slots__ = ("text", "section", "page_num")
    TEXT_FIELD_NUMBER: _ClassVar[int]
    SECTION_FIELD_NUMBER: _ClassVar[int]
    PAGE_NUM_FIELD_NUMBER: _ClassVar[int]
    text: str
    section: str
    page_num: int
    def __init__(self, text: _Optional[str] = ..., section: _Optional[str] = ..., page_num: _Optional[int] = ...) -> None: ...

class Figure(_message.Message):
    __slots__ = ("section", "caption", "page_num", "img_path")
    SECTION_FIELD_NUMBER: _ClassVar[int]
    CAPTION_FIELD_NUMBER: _ClassVar[int]
    PAGE_NUM_FIELD_NUMBER: _ClassVar[int]
    IMG_PATH_FIELD_NUMBER: _ClassVar[int]
    section: str
    caption: str
    page_num: int
    img_path: str
    def __init__(self, section: _Optional[str] = ..., caption: _Optional[str] = ..., page_num: _Optional[int] = ..., img_path: _Optional[str] = ...) -> None: ...

class Table(_message.Message):
    __slots__ = ("section", "caption", "page_num", "table_html")
    SECTION_FIELD_NUMBER: _ClassVar[int]
    CAPTION_FIELD_NUMBER: _ClassVar[int]
    PAGE_NUM_FIELD_NUMBER: _ClassVar[int]
    TABLE_HTML_FIELD_NUMBER: _ClassVar[int]
    section: str
    caption: str
    page_num: int
    table_html: str
    def __init__(self, section: _Optional[str] = ..., caption: _Optional[str] = ..., page_num: _Optional[int] = ..., table_html: _Optional[str] = ...) -> None: ...

class ParseDocumentRequest(_message.Message):
    __slots__ = ("user_id", "doc_id", "bucket_name", "doc_path")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    DOC_ID_FIELD_NUMBER: _ClassVar[int]
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    DOC_PATH_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    doc_id: str
    bucket_name: str
    doc_path: str
    def __init__(self, user_id: _Optional[str] = ..., doc_id: _Optional[str] = ..., bucket_name: _Optional[str] = ..., doc_path: _Optional[str] = ...) -> None: ...

class ParseDocumentResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class GetParseStatusRequest(_message.Message):
    __slots__ = ("bucket_name", "doc_path")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    DOC_PATH_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    doc_path: str
    def __init__(self, bucket_name: _Optional[str] = ..., doc_path: _Optional[str] = ...) -> None: ...

class GetParseStatusResponse(_message.Message):
    __slots__ = ("status", "percent", "is_finished", "is_failed", "texts", "figures", "tables")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PERCENT_FIELD_NUMBER: _ClassVar[int]
    IS_FINISHED_FIELD_NUMBER: _ClassVar[int]
    IS_FAILED_FIELD_NUMBER: _ClassVar[int]
    TEXTS_FIELD_NUMBER: _ClassVar[int]
    FIGURES_FIELD_NUMBER: _ClassVar[int]
    TABLES_FIELD_NUMBER: _ClassVar[int]
    status: str
    percent: float
    is_finished: bool
    is_failed: bool
    texts: _containers.RepeatedCompositeFieldContainer[DocText]
    figures: _containers.RepeatedCompositeFieldContainer[Figure]
    tables: _containers.RepeatedCompositeFieldContainer[Table]
    def __init__(self, status: _Optional[str] = ..., percent: _Optional[float] = ..., is_finished: bool = ..., is_failed: bool = ..., texts: _Optional[_Iterable[_Union[DocText, _Mapping]]] = ..., figures: _Optional[_Iterable[_Union[Figure, _Mapping]]] = ..., tables: _Optional[_Iterable[_Union[Table, _Mapping]]] = ...) -> None: ...

class StopParseRequest(_message.Message):
    __slots__ = ("bucket_name", "doc_path")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    DOC_PATH_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    doc_path: str
    def __init__(self, bucket_name: _Optional[str] = ..., doc_path: _Optional[str] = ...) -> None: ...

class StopParseResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...
