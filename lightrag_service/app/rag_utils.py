from enum import Enum
from functools import partial
from grpc_client import embed_client
from lightrag import LightRAG
import lightrag.llm as llm
from lightrag.utils import EmbeddingFunc
from .models import BaseRequest
from dataclasses import dataclass
from lightrag.ask_llm import ask_llm
import dotenv, os

dotenv.load_dotenv()


@dataclass
class EmbedMaxTokenSizeEnum(Enum):
    openai = 8191
    bge_m3 = 8096


class EmbedDimEnum(Enum):
    openai = 1536
    bge_m3 = 1024


def get_rag(proj_path: str, req: BaseRequest):
    # api_key_decrypted = ""
    # if req.api_key:
    #     api_key_decrypted = (
    #         decrypt_str(req.api_key) if req.decode_api_key else req.api_key
    #     )
    # else:
    #     raise ValueError("api_key is required")

    # api_project_decrypted = None
    # if req.project_id:
    #     api_project_decrypted = (
    #         decrypt_str(req.project_id) if req.decode_api_key else req.project_id
    #     )

    # Configure LLM function with decrypted credentials

    if req.api_provider == "openai":
        api_key_decrypted = os.getenv("OPENAI_API_KEY")
        api_project_decrypted = os.getenv("OPENAI_PROJECT_ID")
        model_name = "gpt-4o-mini"
    else:
        api_key_decrypted = os.getenv("API_KEY")
        api_project_decrypted = ""
        model_name = "ds_v3_pro"

    history_messages = req.history_messages[-req.max_memory :]

    if req.embed_model == "bge-m3":
        embed_max_token_size = EmbedMaxTokenSizeEnum.bge_m3.value
        embed_dim = EmbedDimEnum.bge_m3.value
        embed_func = partial(embed_client.embed, max_length=embed_max_token_size)
    else:
        embed_max_token_size = EmbedMaxTokenSizeEnum.openai.value
        embed_dim = EmbedDimEnum.openai.value
        embed_func = partial(
            llm.openai_embedding,
            model=req.embed_model,
            api_key=api_key_decrypted,
            project=api_project_decrypted,
        )

    if req.api_provider == "openai":
        llm_model = llm.gpt_4o_mini_complete
    else:
        llm_model = partial(ask_llm, model_name=model_name)

    if req.chunk_token_size > embed_max_token_size:
        raise ValueError(f"try to decrease chunk_token_size")

    llm_func = partial(
        llm_model,
        api_key=api_key_decrypted,
        project=api_project_decrypted,
        history_messages=history_messages,
        temperature=req.temperature,
    )

    # Configure embedding function
    embedding_func = EmbeddingFunc(
        embedding_dim=embed_dim,
        max_token_size=embed_max_token_size,
        concurrent_limit=16,
        func=embed_func,
    )

    return LightRAG(
        working_dir=str(proj_path),
        chunk_token_size=req.chunk_token_size,
        chunk_overlap_token_size=req.chunk_overlap_token_size,
        llm_model_func=llm_func,
        embedding_func=embedding_func,
        llm_model_max_async=10,
        addon_params={"example_number": 2},
    )
