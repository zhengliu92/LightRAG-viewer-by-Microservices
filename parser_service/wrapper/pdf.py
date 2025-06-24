from marker.converters.pdf import PdfConverter
from marker.providers.pdf import PdfProvider
from .document import ModifiedDocumentBuilder
from .surya_layout import ModifiedLayoutBuilder
from .ocr_builder import ModifiedOcrBuilder
from marker.builders.structure import StructureBuilder
from typing import Any, Dict, List
import inspect


class ModifiedPdfConverter(PdfConverter):
    def __init__(
        self,
        artifact_dict: Dict[str, Any],
        processor_list: List[str] | None = None,
        renderer: str | None = None,
        config=None,
        callback=None,
    ):
        super().__init__(artifact_dict, processor_list, renderer, config)
        self.callback = callback

    def add_callback(self, callback):
        self.callback = callback

    def resolve_dependencies(self, cls):
        init_signature = inspect.signature(cls.__init__)
        parameters = init_signature.parameters

        resolved_kwargs = {}
        for param_name, param in parameters.items():
            if param_name == "self":
                continue
            elif param_name == "config":
                resolved_kwargs[param_name] = self.config
            elif param.name in self.artifact_dict:
                resolved_kwargs[param_name] = self.artifact_dict[param_name]
            elif param.default != inspect.Parameter.empty:
                if param_name == "callback":
                    resolved_kwargs[param_name] = self.callback
                else:
                    resolved_kwargs[param_name] = param.default

            else:
                raise ValueError(
                    f"Cannot resolve dependency for parameter: {param_name}"
                )

        return cls(**resolved_kwargs)

    def __call__(self, filepath: str):
        pdf_provider = PdfProvider(filepath, self.config)
        layout_builder = self.resolve_dependencies(ModifiedLayoutBuilder)
        ocr_builder = self.resolve_dependencies(ModifiedOcrBuilder)
        document = ModifiedDocumentBuilder(self.config)(
            pdf_provider, layout_builder, ocr_builder
        )
        StructureBuilder(self.config)(document)

        for processor_cls in self.processor_list:
            processor = self.resolve_dependencies(processor_cls)
            processor(document)

        renderer = self.resolve_dependencies(self.renderer)
        return renderer(document)
