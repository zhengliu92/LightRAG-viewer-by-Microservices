from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IsObjectExistsRequest(_message.Message):
    __slots__ = ("bucket_name", "object_name")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    OBJECT_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    object_name: str
    def __init__(self, bucket_name: _Optional[str] = ..., object_name: _Optional[str] = ...) -> None: ...

class IsObjectExistsResponse(_message.Message):
    __slots__ = ("exists",)
    EXISTS_FIELD_NUMBER: _ClassVar[int]
    exists: bool
    def __init__(self, exists: bool = ...) -> None: ...

class BucketExistsRequest(_message.Message):
    __slots__ = ("bucket_name",)
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    def __init__(self, bucket_name: _Optional[str] = ...) -> None: ...

class BucketExistsResponse(_message.Message):
    __slots__ = ("exists", "message")
    EXISTS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    exists: bool
    message: str
    def __init__(self, exists: bool = ..., message: _Optional[str] = ...) -> None: ...

class NewFolderInBucketRequest(_message.Message):
    __slots__ = ("bucket_name", "folder_name")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FOLDER_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    folder_name: str
    def __init__(self, bucket_name: _Optional[str] = ..., folder_name: _Optional[str] = ...) -> None: ...

class NewFolderInBucketResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class Base64UploadFilesRequest(_message.Message):
    __slots__ = ("bucket_name", "files")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    files: _containers.RepeatedCompositeFieldContainer[File]
    def __init__(self, bucket_name: _Optional[str] = ..., files: _Optional[_Iterable[_Union[File, _Mapping]]] = ...) -> None: ...

class Base64UploadFilesResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class File(_message.Message):
    __slots__ = ("name", "content")
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    name: str
    content: bytes
    def __init__(self, name: _Optional[str] = ..., content: _Optional[bytes] = ...) -> None: ...

class ObjectInfo(_message.Message):
    __slots__ = ("name", "size", "last_modified")
    NAME_FIELD_NUMBER: _ClassVar[int]
    SIZE_FIELD_NUMBER: _ClassVar[int]
    LAST_MODIFIED_FIELD_NUMBER: _ClassVar[int]
    name: str
    size: int
    last_modified: str
    def __init__(self, name: _Optional[str] = ..., size: _Optional[int] = ..., last_modified: _Optional[str] = ...) -> None: ...

class CreateBucketRequest(_message.Message):
    __slots__ = ("bucket_name",)
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    def __init__(self, bucket_name: _Optional[str] = ...) -> None: ...

class CreateBucketResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class SaveStringToFileRequest(_message.Message):
    __slots__ = ("bucket_name", "file_name", "content")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_name: str
    content: str
    def __init__(self, bucket_name: _Optional[str] = ..., file_name: _Optional[str] = ..., content: _Optional[str] = ...) -> None: ...

class SaveStringToFileResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class ListBucketFilesRequest(_message.Message):
    __slots__ = ("bucket_name", "folder_name", "omit_regexes")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FOLDER_NAME_FIELD_NUMBER: _ClassVar[int]
    OMIT_REGEXES_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    folder_name: str
    omit_regexes: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, bucket_name: _Optional[str] = ..., folder_name: _Optional[str] = ..., omit_regexes: _Optional[_Iterable[str]] = ...) -> None: ...

class ListBucketFilesResponse(_message.Message):
    __slots__ = ("message", "files", "folder_name")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    FOLDER_NAME_FIELD_NUMBER: _ClassVar[int]
    message: str
    files: _containers.RepeatedCompositeFieldContainer[ObjectInfo]
    folder_name: str
    def __init__(self, message: _Optional[str] = ..., files: _Optional[_Iterable[_Union[ObjectInfo, _Mapping]]] = ..., folder_name: _Optional[str] = ...) -> None: ...

class DeleteBucketRequest(_message.Message):
    __slots__ = ("bucket_name",)
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    def __init__(self, bucket_name: _Optional[str] = ...) -> None: ...

class DeleteBucketResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class GetFileBytesRequest(_message.Message):
    __slots__ = ("bucket_name", "file_name")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_name: str
    def __init__(self, bucket_name: _Optional[str] = ..., file_name: _Optional[str] = ...) -> None: ...

class GetFileBytesResponse(_message.Message):
    __slots__ = ("file_name", "content_type", "content")
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    CONTENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    file_name: str
    content_type: str
    content: bytes
    def __init__(self, file_name: _Optional[str] = ..., content_type: _Optional[str] = ..., content: _Optional[bytes] = ...) -> None: ...

class DeleteFilesRequest(_message.Message):
    __slots__ = ("bucket_name", "file_names")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAMES_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, bucket_name: _Optional[str] = ..., file_names: _Optional[_Iterable[str]] = ...) -> None: ...

class DeleteFilesResponse(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class GetFilesUrlRequest(_message.Message):
    __slots__ = ("bucket_name", "file_names")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAMES_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_names: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, bucket_name: _Optional[str] = ..., file_names: _Optional[_Iterable[str]] = ...) -> None: ...

class GetFilesUrlResponse(_message.Message):
    __slots__ = ("message", "urls")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    URLS_FIELD_NUMBER: _ClassVar[int]
    message: str
    urls: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, message: _Optional[str] = ..., urls: _Optional[_Iterable[str]] = ...) -> None: ...

class UploadChunkRequest(_message.Message):
    __slots__ = ("bucket_name", "file_name", "chunk_index", "chunk_data")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    CHUNK_INDEX_FIELD_NUMBER: _ClassVar[int]
    CHUNK_DATA_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_name: str
    chunk_index: int
    chunk_data: bytes
    def __init__(self, bucket_name: _Optional[str] = ..., file_name: _Optional[str] = ..., chunk_index: _Optional[int] = ..., chunk_data: _Optional[bytes] = ...) -> None: ...

class UploadChunkResponse(_message.Message):
    __slots__ = ("message", "success", "chunk_name")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    CHUNK_NAME_FIELD_NUMBER: _ClassVar[int]
    message: str
    success: bool
    chunk_name: str
    def __init__(self, message: _Optional[str] = ..., success: bool = ..., chunk_name: _Optional[str] = ...) -> None: ...

class CompleteUploadRequest(_message.Message):
    __slots__ = ("bucket_name", "file_name", "total_chunks")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    TOTAL_CHUNKS_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_name: str
    total_chunks: int
    def __init__(self, bucket_name: _Optional[str] = ..., file_name: _Optional[str] = ..., total_chunks: _Optional[int] = ...) -> None: ...

class CompleteUploadResponse(_message.Message):
    __slots__ = ("message", "success")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    message: str
    success: bool
    def __init__(self, message: _Optional[str] = ..., success: bool = ...) -> None: ...

class GetFileTextRequest(_message.Message):
    __slots__ = ("bucket_name", "file_name")
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    bucket_name: str
    file_name: str
    def __init__(self, bucket_name: _Optional[str] = ..., file_name: _Optional[str] = ...) -> None: ...

class GetFileTextResponse(_message.Message):
    __slots__ = ("message", "content")
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    message: str
    content: str
    def __init__(self, message: _Optional[str] = ..., content: _Optional[str] = ...) -> None: ...
