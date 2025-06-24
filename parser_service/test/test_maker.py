from queue import Queue
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.config.parser import ConfigParser
from marker.output import save_output, text_from_rendered
from threading import Thread
from pathlib import Path
from shutil import rmtree


def test_all():
    def init_model():
        config = {
            "output_format": "json",
            "output_dir": "output",
            "paginate_output": True,
            "force_ocr": True,
        }
        config_parser = ConfigParser(config)

        return PdfConverter(
            config=config_parser.generate_config_dict(),
            artifact_dict=create_model_dict(),
            processor_list=config_parser.get_processors(),
            renderer=config_parser.get_renderer(),
        )

    MODEL_POOL_SIZE = 2
    model_pool = Queue()

    def initialize_model_pool():
        for _ in range(MODEL_POOL_SIZE):
            model = init_model()
            model_pool.put(model)

    initialize_model_pool()

    def get_model_from_pool():
        return model_pool.get()

    def return_model_to_pool(model):
        model_pool.put(model)

    def parse_paper(id):
        print(f"Parsing paper {id}")
        try:
            Path(f"output/paper{id}").mkdir(parents=True, exist_ok=True)
            model = get_model_from_pool()
            print(f"running for paper {id}")
            rendered = model(f"example/paper{id}.pdf")
            text, _, images = text_from_rendered(rendered)
            save_output(rendered, f"output/paper{id}", f"paper{id}")
            print(f"finished for paper {id}")
        except Exception as e:
            print(f"Error parsing paper {id}: {e}")
            raise e
        finally:
            return_model_to_pool(model)

    threads = []
    for i in [1, 3]:
        thread = Thread(target=parse_paper, args=(i,))
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()
