from pathlib import Path
from marker.models import create_model_dict
from wrapper.pdf import ModifiedPdfConverter
from marker.config.parser import ConfigParser


def test_markdown_parser():
    config = {
        "output_format": "json",
        "output_dir": "example/output",
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
    # Path("example/output").mkdir(parents=True, exist_ok=True)
    # save_output(rendered, str(Path("example/output")), "paper5")


if __name__ == "__main__":
    test_markdown_parser()
