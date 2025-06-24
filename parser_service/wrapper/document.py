from marker.builders.document import DocumentBuilder
from marker.providers.pdf import PdfProvider
from .surya_layout import ModifiedLayoutBuilder
from .ocr_builder import ModifiedOcrBuilder


class ModifiedDocumentBuilder(DocumentBuilder):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def __call__(
        self,
        provider: PdfProvider,
        layout_builder: ModifiedLayoutBuilder,
        ocr_builder: ModifiedOcrBuilder,
    ):
        document = self.build_document(provider)
        layout_builder(document, provider)
        ocr_builder(document, provider)
        return document
