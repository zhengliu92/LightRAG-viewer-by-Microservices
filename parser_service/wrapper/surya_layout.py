from typing import List
import numpy as np
import torch
from PIL import Image
from tqdm import tqdm

from .constant import MIN_UPDATE_TIME
from surya.input.slicing import ImageSlicer
from surya.model.layout.config import ID_TO_LABEL
from surya.postprocessing.heatmap import clean_boxes, intersects_other_boxes
from surya.schema import LayoutResult, LayoutBox
from surya.settings import settings
from surya.layout import get_batch_size, prediction_to_polygon, find_pause_items
from marker.schema.groups.page import PageGroup
from marker.builders.layout import LayoutBuilder
from surya.model.layout.encoderdecoder import SuryaLayoutModel
import time
from surya.model.ocr_error.model import DistilBertForSequenceClassification


class ModifiedLayoutBuilder(LayoutBuilder):
    def __init__(
        self,
        layout_model: SuryaLayoutModel,
        ocr_error_model: DistilBertForSequenceClassification,
        config=None,
        callback=None,
    ):
        super().__init__(layout_model, ocr_error_model, config)
        self.callback = callback

    def surya_layout(self, pages: List[PageGroup]) -> List[LayoutResult]:
        processor = self.layout_model.processor
        layout_results = modified_batch_layout_detection(
            [p.lowres_image for p in pages],
            self.layout_model,
            processor,
            batch_size=int(self.get_batch_size()),
            callback=self.callback,
        )
        return layout_results


def modified_batch_layout_detection(
    images: List, model, processor, batch_size=None, top_k=5, callback=None
) -> List[LayoutResult]:
    assert all([isinstance(image, Image.Image) for image in images])
    if batch_size is None:
        batch_size = get_batch_size()

    slicer = ImageSlicer(settings.LAYOUT_SLICE_MIN, settings.LAYOUT_SLICE_SIZE)

    batches = []
    img_counts = [slicer.slice_count(image) for image in images]

    start_idx = 0
    end_idx = 1
    while end_idx < len(img_counts):
        if any(
            [
                sum(img_counts[start_idx:end_idx]) >= batch_size,
                sum(img_counts[start_idx : end_idx + 1]) > batch_size,
            ]
        ):
            batches.append((start_idx, end_idx))
            start_idx = end_idx
        end_idx += 1

    if start_idx < len(img_counts):
        batches.append((start_idx, len(img_counts)))

    results = []
    processed_time = 0
    t_start = time.time()
    i_increment = 15 / len(batches)
    sum_increment = i_increment
    pp = 0
    for start_idx, end_idx in tqdm(batches, desc="Recognizing layout"):
        if processed_time > MIN_UPDATE_TIME:
            t_start = time.time()

        batch_results = []
        batch_images = images[start_idx:end_idx]
        batch_images = [
            image.convert("RGB") for image in batch_images
        ]  # also copies the image
        batch_images, tile_positions = slicer.slice(batch_images)
        current_batch_size = len(batch_images)

        orig_sizes = [image.size for image in batch_images]
        model_inputs = processor(batch_images)

        batch_pixel_values = model_inputs["pixel_values"]
        batch_pixel_values = torch.tensor(
            np.array(batch_pixel_values), dtype=model.dtype
        ).to(model.device)

        pause_token = [model.config.decoder.pause_token_id] * 7
        start_token = [model.config.decoder.bos_token_id] * 7
        batch_decoder_input = [
            [start_token] + [pause_token] * model.config.decoder.pause_token_count
            for _ in range(current_batch_size)
        ]
        batch_decoder_input = torch.tensor(
            np.stack(batch_decoder_input, axis=0), dtype=torch.long, device=model.device
        )
        inference_token_count = batch_decoder_input.shape[1]

        decoder_position_ids = (
            torch.ones_like(
                batch_decoder_input[0, :, 0], dtype=torch.int64, device=model.device
            ).cumsum(0)
            - 1
        )
        model.decoder.model._setup_cache(
            model.config, batch_size, model.device, model.dtype
        )

        batch_predictions = [[] for _ in range(current_batch_size)]

        with torch.inference_mode():
            encoder_hidden_states = model.encoder(pixel_values=batch_pixel_values)[0]

            token_count = 0
            all_done = torch.zeros(
                current_batch_size, dtype=torch.bool, device=model.device
            )

            while token_count < settings.LAYOUT_MAX_BOXES:
                is_prefill = token_count == 0
                return_dict = model.decoder(
                    input_boxes=batch_decoder_input,
                    encoder_hidden_states=encoder_hidden_states,
                    cache_position=decoder_position_ids,
                    use_cache=True,
                    prefill=is_prefill,
                )

                decoder_position_ids = decoder_position_ids[-1:] + 1
                box_logits = return_dict["bbox_logits"][
                    :current_batch_size, -1, :
                ].detach()
                class_logits = return_dict["class_logits"][
                    :current_batch_size, -1, :
                ].detach()

                probs = torch.nn.functional.softmax(class_logits, dim=-1).cpu()
                entropy = torch.special.entr(probs).sum(dim=-1)

                class_preds = class_logits.argmax(-1)
                box_preds = box_logits * model.config.decoder.bbox_size

                done = (class_preds == model.decoder.config.eos_token_id) | (
                    class_preds == model.decoder.config.pad_token_id
                )

                all_done = all_done | done
                if all_done.all():
                    break

                batch_decoder_input = torch.cat(
                    [box_preds.unsqueeze(1), class_preds.unsqueeze(1).unsqueeze(1)],
                    dim=-1,
                )

                for j, (pred, status) in enumerate(zip(batch_decoder_input, all_done)):
                    if not status:
                        last_prediction = (
                            batch_predictions[j][-1]
                            if len(batch_predictions[j]) > 0
                            else None
                        )
                        preds = pred[0].detach().cpu()
                        prediction = {
                            "preds": preds,
                            "token": preds,
                            "entropy": entropy[j].item(),
                            "paused": False,
                            "pause_tokens": 0,
                            "polygon": prediction_to_polygon(
                                preds,
                                orig_sizes[j],
                                model.config.decoder.bbox_size,
                                model.config.decoder.skew_scaler,
                            ),
                            "label": preds[6].item()
                            - model.decoder.config.special_token_count,
                            "class_logits": class_logits[j].detach().cpu(),
                            "orig_size": orig_sizes[j],
                        }
                        prediction["text_label"] = ID_TO_LABEL.get(
                            int(prediction["label"]), None
                        )
                        if last_prediction and last_prediction["paused"]:
                            pause_sequence = find_pause_items(batch_predictions[j])
                            entropies = [p["entropy"] for p in pause_sequence]
                            min_entropy = min(entropies)
                            max_pause_tokens = last_prediction["pause_tokens"]
                            if (
                                len(pause_sequence) < max_pause_tokens
                                and prediction["entropy"] > min_entropy
                            ):
                                # Continue the pause
                                prediction["paused"] = True
                                prediction["pause_tokens"] = last_prediction[
                                    "pause_tokens"
                                ]
                                prediction["token"].fill_(
                                    model.decoder.config.pause_token_id
                                )
                                batch_decoder_input[j, :] = (
                                    model.decoder.config.pause_token_id
                                )
                        elif intersects_other_boxes(
                            prediction["polygon"],
                            [p["polygon"] for p in batch_predictions[j]],
                            thresh=0.4,
                        ):
                            prediction["paused"] = True
                            prediction["pause_tokens"] = 1
                            prediction["token"].fill_(
                                model.decoder.config.pause_token_id
                            )
                            batch_decoder_input[j, :] = (
                                model.decoder.config.pause_token_id
                            )
                        elif all(
                            [
                                prediction["text_label"]
                                in ["PageHeader", "PageFooter"],
                                prediction["polygon"][0][1]
                                < prediction["orig_size"][1] * 0.8,
                                prediction["polygon"][2][1]
                                > prediction["orig_size"][1] * 0.2,
                                prediction["polygon"][0][0]
                                < prediction["orig_size"][0] * 0.8,
                                prediction["polygon"][2][0]
                                > prediction["orig_size"][0] * 0.2,
                            ]
                        ):
                            # Ensure page footers only occur at the bottom of the page, headers only at top
                            prediction["class_logits"][int(preds[6].item())] = 0
                            new_prediction = (
                                prediction["class_logits"].argmax(-1).item()
                            )
                            prediction["label"] = (
                                new_prediction
                                - model.decoder.config.special_token_count
                            )
                            prediction["token"][6] = new_prediction
                            batch_decoder_input[j, -1, 6] = new_prediction

                        prediction["top_k_probs"], prediction["top_k_indices"] = (
                            torch.topk(
                                torch.nn.functional.softmax(
                                    prediction["class_logits"], dim=-1
                                ),
                                k=top_k,
                                dim=-1,
                            )
                        )
                        del prediction["class_logits"]
                        batch_predictions[j].append(prediction)

                token_count += inference_token_count
                inference_token_count = batch_decoder_input.shape[1]
                batch_decoder_input = batch_decoder_input.to(torch.long)

        for j, (pred_dict, orig_size) in enumerate(zip(batch_predictions, orig_sizes)):
            boxes = []
            preds = [
                p
                for p in pred_dict
                if p["token"][6] > model.decoder.config.special_token_count
            ]  # Remove special tokens, like pause
            if len(preds) > 0:
                polygons = [p["polygon"] for p in preds]
                labels = [p["label"] for p in preds]
                top_k_probs = [p["top_k_probs"] for p in preds]
                top_k_indices = [
                    p["top_k_indices"] - model.decoder.config.special_token_count
                    for p in preds
                ]

                for z, (poly, label, top_k_prob, top_k_index) in enumerate(
                    zip(polygons, labels, top_k_probs, top_k_indices)
                ):
                    top_k_dict = {
                        ID_TO_LABEL.get(int(l)): prob.item()
                        for (l, prob) in zip(top_k_index, top_k_prob)
                        if l > 0
                    }
                    l = ID_TO_LABEL[int(label)]
                    lb = LayoutBox(
                        polygon=poly,
                        label=l,
                        position=z,
                        top_k=top_k_dict,
                        confidence=top_k_dict[l],
                    )
                    boxes.append(lb)
            boxes = clean_boxes(boxes)
            result = LayoutResult(
                bboxes=boxes, image_bbox=[0, 0, orig_size[0], orig_size[1]]
            )
            batch_results.append(result)

        assert len(batch_results) == len(tile_positions)
        batch_results = slicer.join(batch_results, tile_positions)
        results.extend(batch_results)
        processed_time = time.time() - t_start
        if callback and processed_time > MIN_UPDATE_TIME:
            pp = callback(incremental_percent=sum_increment, status="解析页面布局中")
            sum_increment = i_increment
        else:
            sum_increment += i_increment

    if callback:
        delta = max(17 - pp, 0)
        callback(incremental_percent=delta, status="解析页面布局完成")

    assert len(results) == len(images)
    return results
