import json
from wrapper.pdf import ModifiedPdfConverter
from marker.models import create_model_dict
from marker.config.parser import ConfigParser
from marker.output import save_output
from pathlib import Path
from handlers.doc_parse import extract


def test_markdown_parser():
    config = {
        "output_format": "markdown",
        "output_dir": "output",
        "paginate_output": True,
        "force_ocr": True,
    }
    config_parser = ConfigParser(config)

    parser = ModifiedPdfConverter(
        config=config_parser.generate_config_dict(),
        artifact_dict=create_model_dict(),
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
    )
    rendered = parser(str(Path("example/paper5.pdf")))
    Path("output").mkdir(parents=True, exist_ok=True)
    save_output(rendered, str(Path("output")), "paper5")


def test_extract():
    extract("example/output/paper5.json")


if __name__ == "__main__":
    test_extract()
