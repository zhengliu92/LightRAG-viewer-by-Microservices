import base64
import json
from pathlib import Path
import re
from bs4 import BeautifulSoup
from hashlib import md5
from datetime import datetime
from typing import Dict, List, Tuple, Any

# Constants
FIELDS_TO_REMOVE = [
    "references",
    "reference",
    "notes and references",
    "参考文献",
    "致谢",
    "conflicts of interest",
    "acknowledgement",
    "acknowledgements",
    "author contributions",
    "conflict of interest",
    "funding",
    "data availability statement",
    "correspondence",
    "funding information",
    "orcid",
]


def remove_special_chars(text: str) -> str:
    # remove special chars but keep chinese, space, and punctuation
    return re.sub(
        r"[^a-zA-Z0-9\u4e00-\u9fa5\s\.\,\!\？\；\：\，\。\！\？\；\：\-\(\)\[\]\{\}\<\>\/\+\*\=\~\`\^\&\|\#\@]",
        " ",
        text,
    ).strip()


def gen_hash(text: str) -> str:
    text += str(datetime.now().timestamp())
    text_utf_8 = text.encode("utf-8")
    return md5(text_utf_8).hexdigest()


def extract_sections(pages: List[dict]) -> Dict[str, str]:
    sections = {}
    for page in pages:
        for block in page["children"]:
            if block["block_type"] == "SectionHeader":
                content = block["html"]
                if content == "":
                    continue
                section_name = BeautifulSoup(content, "html.parser").get_text()
                if section_name.lower() in FIELDS_TO_REMOVE:
                    continue
                sections[block["id"]] = remove_special_chars(section_name)

    sections = {k: v for k, v in sections.items() if len(v) < 50}
    sections["unknown"] = "Unknown Field"
    return sections


def get_section_key(section_hierarchy: Dict, sections: Dict[str, str]) -> str:
    section_hierarchy_keys = list(section_hierarchy.values())
    section_hierarchy_keys = [k for k in section_hierarchy_keys if k in sections]
    return section_hierarchy_keys[-1] if section_hierarchy_keys else "unknown"


def extract_texts(pages: List[dict], sections: Dict[str, str]) -> Dict[str, List[dict]]:
    texts = {}
    for page_num, page in enumerate(pages):
        for block in page["children"]:
            if block["block_type"] not in ["Text", "TextInlineMath"]:
                continue

            content = block["html"]
            if content == "":
                continue

            key = get_section_key(block["section_hierarchy"], sections)
            text = remove_special_chars(
                BeautifulSoup(content, "html.parser").get_text()
            )

            if key == "unknown" and len(text) < 500:
                continue

            if key not in texts:
                texts[key] = []
            texts[key].append({"text": text, "page_num": page_num + 1})

    return texts


def save_image(img_data: str, img_dir: Path, img_id: str) -> str:
    img_id = img_id.replace("/", "_")
    img_hash = gen_hash(img_id)
    img_path = img_dir / f"{img_hash}.png"
    with open(img_path, "wb") as f:
        f.write(base64.b64decode(img_data))
    return str(img_path)


def extract_figures(
    pages: List[dict], sections: Dict[str, str], img_dir: Path
) -> Tuple[Dict[str, List[dict]], List[str]]:
    figures = {}
    assets_path = []

    for page_num, page in enumerate(pages):
        for block in page["children"]:
            if block["block_type"] != "FigureGroup":
                continue

            key = get_section_key(block["section_hierarchy"], sections)
            img_path = ""
            img_id = ""

            for child in block["children"]:
                if child["block_type"] == "Figure":
                    for img_id, img in child["images"].items():
                        img_path = save_image(img, img_dir, img_id)
                        assets_path.append(img_path)

                elif child["block_type"] == "Caption" and img_path:
                    content = child["html"]
                    if key not in figures:
                        figures[key] = []
                    figures[key].append(
                        {
                            "caption": remove_special_chars(
                                BeautifulSoup(content, "html.parser").get_text()
                            ),
                            "img_path": img_path,
                            "page_num": page_num + 1,
                        }
                    )

    return figures, assets_path


def extract_tables(
    pages: List[dict], sections: Dict[str, str]
) -> Dict[str, List[dict]]:
    tables = {}

    for page_num, page in enumerate(pages):
        for block in page["children"]:
            if block["block_type"] != "TableGroup":
                continue

            key = get_section_key(block["section_hierarchy"], sections)
            if key not in tables:
                tables[key] = []

            table_caption = ""
            table_html = ""

            for child in block["children"]:
                if child["block_type"] == "Caption":
                    table_caption = remove_special_chars(
                        BeautifulSoup(child["html"], "html.parser").get_text()
                    )
                elif child["block_type"] == "Table":
                    table_html = child["html"]

            tables[key].append(
                {
                    "caption": table_caption,
                    "table_html": table_html,
                    "page_num": page_num + 1,
                }
            )

    return tables


def format_output(
    texts: Dict[str, List[dict]],
    figures: Dict[str, List[dict]],
    tables: Dict[str, List[dict]],
    sections: Dict[str, str],
) -> Tuple[Dict[str, List[dict]], str]:
    block = {"texts": [], "figures": [], "tables": []}
    full_text = ""

    # Format texts
    text_sorted = sorted(texts.items(), key=lambda x: [*sections.keys()].index(x[0]))
    for k, v in text_sorted:
        if k in sections:
            text = "\n\n".join([text["text"] for text in v])
            block["texts"].append(
                {
                    "section": sections[k],
                    "text": text,
                    "page_num": v[0]["page_num"],
                }
            )
            full_text += f"<TEXT in {sections[k]}>\n{text}\n\n"

    # Format figures
    for k, section_figures in figures.items():
        if k in sections:
            for figure in section_figures:
                block["figures"].append({"section": sections[k], **figure})
                full_text += f"<Figure in {sections[k]}>\n{figure['caption']}\n\n"

    # Format tables
    for k, section_tables in tables.items():
        if k in sections:
            for table in section_tables:
                block["tables"].append({"section": sections[k], **table})
                full_text += f"<Tables in {sections[k]}>\n{table['caption']}\n\n"

    return block, full_text


def extract(file_path: str) -> Tuple[Dict[str, List[dict]], List[str], str]:
    # Read input file
    with open(file_path, "r") as f:
        text = json.load(f)

    # Setup image directory
    img_dir = Path(file_path).parent / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    pages = text["children"]

    # Extract components
    sections = extract_sections(pages)
    texts = extract_texts(pages, sections)
    figures, assets_path = extract_figures(pages, sections, img_dir)
    tables = extract_tables(pages, sections)

    # Format final output
    block, full_text = format_output(texts, figures, tables, sections)

    return block, assets_path, full_text
