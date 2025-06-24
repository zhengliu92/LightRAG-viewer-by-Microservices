import asyncio
from lightrag.ask_llm import ask_llm
import time

with open("example/context.txt", "r") as f:
    prompt = f.read()

# prompt = "hi, how are you?"

# model_name, api_provider = "gpt_4o", "openai"
model_name, api_provider = "ds_v3_pro", "siliconflow"


async def test_chat():
    time_start = time.time()
    response = await ask_llm(
        system_prompt="You are a helpful assistant",
        prompt=prompt,
        model_name=model_name,
        api_provider=api_provider,
        use_reason_model=False,
    )
    time_end = time.time()
    print(f"time cost for non-stream : {time_end - time_start}")
    print(response)


async def test_chat_stream():
    time_start = time.time()
    response = await ask_llm(
        system_prompt="You are a helpful assistant",
        prompt=prompt,
        stream=True,
        model_name=model_name,
        api_provider=api_provider,
        use_reason_model=False,
    )
    ret = ""
    async for chunk in response:
        ret += chunk
        print(chunk)
    time_end = time.time()
    print(f"time cost for stream : {time_end - time_start}")


if __name__ == "__main__":
    asyncio.run(test_chat_stream())
