from dataclasses import dataclass


@dataclass
class ModelConfig:
    base_url: str = "https://api.deepinfra.com/v1/openai/chat/completions"
    model_name: str = "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"
    context_size: int = 131072


ds_v3 = ModelConfig(
    base_url="https://api.siliconflow.cn/v1/chat/completions",
    model_name="deepseek-ai/DeepSeek-V3",
    context_size=64 * 1024,
)


ds_v3_pro = ModelConfig(
    base_url="https://api.siliconflow.cn/v1/chat/completions",
    model_name="Pro/deepseek-ai/DeepSeek-V3",
    context_size=64 * 1024,
)


gpt_4o = ModelConfig(
    base_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o",
    context_size=128 * 1024,
)


gpt_4o_mini = ModelConfig(
    base_url="https://api.openai.com/v1/chat/completions",
    model_name="gpt-4o-mini",
    context_size=128 * 1024,
)

LLM = {
    "siliconflow": {
        "ds_v3": ds_v3,
        "ds_v3_pro": ds_v3_pro,
    },
    "openai": {
        "gpt_4o": gpt_4o,
        "gpt_4o_mini": gpt_4o_mini,
    },
}
