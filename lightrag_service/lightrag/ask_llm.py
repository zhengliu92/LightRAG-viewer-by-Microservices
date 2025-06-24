import json
from typing import List, Dict, Any
import aiohttp
from .utils import logger
from openai import (
    APIConnectionError,
    RateLimitError,
    APITimeoutError,
)
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from .utils import encode_string_by_tiktoken
import re
from model_config import LLM
from dotenv import load_dotenv
import os

load_dotenv()


def remove_tag(text, tag):
    return re.sub(f"<{tag}>(.*?)</{tag}>", "", text, flags=re.DOTALL).strip()


def handle_stream(base_url, headers, payload):
    async def inner():
        async with aiohttp.ClientSession() as session:
            async with session.post(
                base_url,
                headers=headers,
                json=payload,
                timeout=300,
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(
                        f"API request failed with status {response.status}: {error_text}"
                    )
                async for line in response.content:
                    line = line.decode("utf-8").strip()
                    if not line or not line.startswith("data: "):
                        continue
                    try:
                        data = json.loads(line[6:])
                        content = (
                            data.get("choices", [{}])[0].get("delta", {}).get("content")
                        )
                        if content:
                            yield content
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        continue

    return inner()


async def handle_response(base_url, headers, payload, use_reason_model):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            base_url,
            headers=headers,
            json=payload,
            timeout=300,
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(
                    f"API request failed with status {response.status}: {error_text}"
                )

            result = await response.json()
            try:
                content = result["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"Failed to parse response: {result}")
                raise e
            content = remove_tag(content, "think") if use_reason_model else content
            return content


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type(
        (RateLimitError, APIConnectionError, APITimeoutError)
    ),
)
async def ask_llm(
    prompt: str,
    system_prompt: str = None,
    api_provider: str = "siliconflow",
    history_messages: List[Dict[str, Any]] = [],
    stream: bool = False,
    temperature: float = 0.1,
    model_name: str = "ds_v3_pro",
    use_reason_model: bool = False,
    **kwargs,
):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    MC = LLM[api_provider][model_name]
    messages.extend(history_messages)
    messages.append({"role": "user", "content": prompt})
    messages_str = json.dumps(messages)
    token_size = len(encode_string_by_tiktoken(messages_str))
    if token_size > MC.context_size:
        raise ValueError(f"搜索结果过多，尝试更换询问条件，或减少最大引用数量")

    payload = {
        "model": MC.model_name,
        "messages": messages,
        "stream": stream,
        "temperature": temperature,
    }

    api_key = os.getenv("API_KEY")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if stream:
        return handle_stream(MC.base_url, headers, payload)
    else:
        return await handle_response(MC.base_url, headers, payload, use_reason_model)
