from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class FloatArray(_message.Message):
    __slots__ = ("values",)
    VALUES_FIELD_NUMBER: _ClassVar[int]
    values: _containers.RepeatedScalarFieldContainer[float]
    def __init__(self, values: _Optional[_Iterable[float]] = ...) -> None: ...

class TextArray(_message.Message):
    __slots__ = ("texts",)
    TEXTS_FIELD_NUMBER: _ClassVar[int]
    texts: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, texts: _Optional[_Iterable[str]] = ...) -> None: ...

class EmbeddingRequest(_message.Message):
    __slots__ = ("texts", "max_length", "batch_size")
    TEXTS_FIELD_NUMBER: _ClassVar[int]
    MAX_LENGTH_FIELD_NUMBER: _ClassVar[int]
    BATCH_SIZE_FIELD_NUMBER: _ClassVar[int]
    texts: _containers.RepeatedScalarFieldContainer[str]
    max_length: int
    batch_size: int
    def __init__(self, texts: _Optional[_Iterable[str]] = ..., max_length: _Optional[int] = ..., batch_size: _Optional[int] = ...) -> None: ...

class EmbeddingResponse(_message.Message):
    __slots__ = ("data", "code", "status", "message")
    DATA_FIELD_NUMBER: _ClassVar[int]
    CODE_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    data: _containers.RepeatedCompositeFieldContainer[FloatArray]
    code: int
    status: str
    message: str
    def __init__(self, data: _Optional[_Iterable[_Union[FloatArray, _Mapping]]] = ..., code: _Optional[int] = ..., status: _Optional[str] = ..., message: _Optional[str] = ...) -> None: ...

class RerankerRequest(_message.Message):
    __slots__ = ("query", "documents")
    QUERY_FIELD_NUMBER: _ClassVar[int]
    DOCUMENTS_FIELD_NUMBER: _ClassVar[int]
    query: str
    documents: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, query: _Optional[str] = ..., documents: _Optional[_Iterable[str]] = ...) -> None: ...

class RerankerResponse(_message.Message):
    __slots__ = ("data", "code", "status", "message")
    DATA_FIELD_NUMBER: _ClassVar[int]
    CODE_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    data: _containers.RepeatedCompositeFieldContainer[FloatArray]
    code: int
    status: str
    message: str
    def __init__(self, data: _Optional[_Iterable[_Union[FloatArray, _Mapping]]] = ..., code: _Optional[int] = ..., status: _Optional[str] = ..., message: _Optional[str] = ...) -> None: ...
