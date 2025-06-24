from marker.builders.ocr import OcrBuilder
from ftfy import fix_text
from marker.providers import ProviderOutput, ProviderPageLines
from marker.providers.pdf import PdfProvider
from marker.schema import BlockTypes
from marker.schema.document import Document
from marker.schema.polygon import PolygonBox
from marker.schema.registry import get_block_class
from marker.schema.text.line import Line
from marker.schema.text.span import Span
from typing import List
from PIL import Image
from surya.model.detection.model import EfficientViTForSemanticSegmentation
from surya.model.recognition.encoderdecoder import OCREncoderDecoderModel
from surya.detection import batch_text_detection
from surya.input.processing import (
    slice_polys_from_image,
    convert_if_not_rgb,
)
from surya.postprocessing.text import sort_text_lines
from surya.schema import TextLine, OCRResult
from typing import List
from PIL import Image

from .modified_ocr_recognition import modified_batch_recognition


class ModifiedOcrBuilder(OcrBuilder):
    def __init__(
        self,
        detection_model: EfficientViTForSemanticSegmentation,
        recognition_model: OCREncoderDecoderModel,
        config=None,
        callback=None,
    ):
        super().__init__(detection_model, recognition_model, config)
        self.callback = callback

    def ocr_extraction(
        self, document: Document, provider: PdfProvider
    ) -> ProviderPageLines:
        page_list = [
            page for page in document.pages if page.text_extraction_method == "surya"
        ]
        recognition_results = modified_run_ocr(
            images=[page.lowres_image for page in page_list],
            langs=[self.languages] * len(page_list),
            det_model=self.detection_model,
            det_processor=self.detection_model.processor,
            rec_model=self.recognition_model,
            rec_processor=self.recognition_model.processor,
            detection_batch_size=int(self.get_detection_batch_size()),
            recognition_batch_size=int(self.get_recognition_batch_size()),
            highres_images=[page.highres_image for page in page_list],
            callback=self.callback,
        )

        page_lines = {}

        SpanClass: Span = get_block_class(BlockTypes.Span)
        LineClass: Line = get_block_class(BlockTypes.Line)

        for page_id, recognition_result in zip(
            (page.page_id for page in page_list), recognition_results
        ):
            page_lines.setdefault(page_id, [])

            page_size = provider.get_page_bbox(page_id).size

            for ocr_line_idx, ocr_line in enumerate(recognition_result.text_lines):
                image_polygon = PolygonBox.from_bbox(recognition_result.image_bbox)
                polygon = PolygonBox.from_bbox(ocr_line.bbox).rescale(
                    image_polygon.size, page_size
                )

                line = LineClass(
                    polygon=polygon,
                    page_id=page_id,
                )
                spans = [
                    SpanClass(
                        text=fix_text(ocr_line.text) + "\n",
                        formats=["plain"],
                        page_id=page_id,
                        polygon=polygon,
                        minimum_position=0,
                        maximum_position=0,
                        font="Unknown",
                        font_weight=0,
                        font_size=0,
                    )
                ]

                page_lines[page_id].append(ProviderOutput(line=line, spans=spans))

        return page_lines


def modified_run_ocr(
    images: List[Image.Image],
    langs: List[List[str] | None],
    det_model,
    det_processor,
    rec_model,
    rec_processor,
    detection_batch_size=None,
    recognition_batch_size=None,
    highres_images: List[Image.Image] | None = None,
    callback=None,
) -> List[OCRResult]:
    images = convert_if_not_rgb(images)
    highres_images = (
        convert_if_not_rgb(highres_images)
        if highres_images is not None
        else [None] * len(images)
    )
    det_predictions = batch_text_detection(
        images, det_model, det_processor, batch_size=detection_batch_size
    )

    all_slices = []
    slice_map = []
    all_langs = []

    for idx, (det_pred, image, highres_image, lang) in enumerate(
        zip(det_predictions, images, highres_images, langs)
    ):
        polygons = [p.polygon for p in det_pred.bboxes]
        if highres_image:
            width_scaler = highres_image.size[0] / image.size[0]
            height_scaler = highres_image.size[1] / image.size[1]
            scaled_polygons = [
                [[int(p[0] * width_scaler), int(p[1] * height_scaler)] for p in polygon]
                for polygon in polygons
            ]
            slices = slice_polys_from_image(highres_image, scaled_polygons)
        else:
            slices = slice_polys_from_image(image, polygons)
        slice_map.append(len(slices))
        all_langs.extend([lang] * len(slices))
        all_slices.extend(slices)

    rec_predictions, confidence_scores = modified_batch_recognition(
        all_slices,
        all_langs,
        rec_model,
        rec_processor,
        batch_size=recognition_batch_size,
        callback=callback,
    )

    predictions_by_image = []
    slice_start = 0
    for idx, (image, det_pred, lang) in enumerate(zip(images, det_predictions, langs)):
        slice_end = slice_start + slice_map[idx]
        image_lines = rec_predictions[slice_start:slice_end]
        line_confidences = confidence_scores[slice_start:slice_end]
        slice_start = slice_end

        assert len(image_lines) == len(det_pred.bboxes)

        lines = []
        for text_line, confidence, bbox in zip(
            image_lines, line_confidences, det_pred.bboxes
        ):
            lines.append(
                TextLine(
                    text=text_line,
                    polygon=bbox.polygon,
                    bbox=bbox.bbox,
                    confidence=confidence,
                )
            )

        lines = sort_text_lines(lines)

        predictions_by_image.append(
            OCRResult(text_lines=lines, languages=lang, image_bbox=det_pred.image_bbox)
        )

    return predictions_by_image
