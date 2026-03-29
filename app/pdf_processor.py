import re
import logging
import pdfplumber

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        logger.info(f"総ページ数: {len(pdf.pages)}")
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                lines = page_text.split("\n")[1:]  # ヘッダー行を除去
                text += "\n".join(lines) + "\n\n"
    return text


def clean_text_for_speech(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\n", "")

    replacements = {
        "　": " ",
        "・": "、",
        "…": "。",
        "⋯": "。",
        "～": "から",
        "〜": "から",
        "→": "へ",
        "←": "へ",
        "×": "かける",
        "÷": "わる",
        "±": "プラスマイナス",
        "≒": "ほぼ",
        "≠": "ノットイコール",
        "※": "注",
        "【": "「",
        "】": "」",
        "『": "「",
        "』": "」",
        "\u201c": "「",
        "\u201d": "」",
        "\u2018": "、",
        "\u2019": "、",
        "'": "、",
        "−": "マイナス",
        "―": "。",
        "──": "。",
        "━": "。",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"https?://[\w/:%#\$&\?\(\)~\.=\+\-]+", "", text)
    text = re.sub(r"[\w\-\._]+@[\w\-\._]+\.[A-Za-z]+", "", text)

    allowed_pattern = re.compile(
        r"[ぁ-んァ-ヶー一-龠々〆ヵヶ"
        r"a-zA-Z0-9"
        r"、。，．,\.!！?？"
        r"「」『』（）()\[\]"
        r"\s"
        r"ー〜～・]+"
    )
    text = "".join(allowed_pattern.findall(text))

    text = re.sub(r"[(（]\s*[)）]", "", text)
    text = re.sub(r"[「『]\s*[」』]", "", text)
    text = re.sub(r"\[\s*\]", "", text)
    text = re.sub(r"[、，,]{2,}", "、", text)
    text = re.sub(r"[。．.]{2,}", "。", text)
    text = re.sub(r"[!！]{2,}", "！", text)
    text = re.sub(r"[?？]{2,}", "？", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()

    if len(text) < 3:
        return ""

    text = re.sub(r"。", "。\n", text)
    return text
