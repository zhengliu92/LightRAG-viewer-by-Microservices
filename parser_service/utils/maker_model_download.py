import json
import os

os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from huggingface_hub import snapshot_download

models = [
    "datalab-to/surya_layout",
    "datalab-to/ocr_error_detection",
    "vikp/texify",
    "vikp/surya_rec2",
    "vikp/surya_tablerec",
    "vikp/surya_det3",
]

for model in models:
    model_dir = snapshot_download(
        model,
        local_dir=model,
        endpoint="https://hf-mirror.com",
    )
