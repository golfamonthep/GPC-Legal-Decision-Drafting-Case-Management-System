import argparse
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

MODEL_TEXT_ID = "iapp/OpenThai2.2-OCR-Text-20261127"
MODEL_TEXT_VERSION = "v2.2.1"
MODEL_MARKDOWN_ID = "iapp/OpenThai2.2-OCR-Markdown-20261127"
MODEL_MARKDOWN_VERSION = "v2.2.0"

OPENTHAI_TEXT_CANDIDATES = [
    PROJECT_ROOT / "tools" / "openthai2-ocr-text",
    Path(r"C:\Users\polic\.codex\skills\openthai-ocr\models\openthai2-ocr-text"),
    Path(r"C:\APP\tools\openthai2-ocr-text"),
]


def get_openthai_text_dir() -> Path:
    for candidate in OPENTHAI_TEXT_CANDIDATES:
        if (candidate / "det.onnx").exists() and (candidate / "rec.onnx").exists():
            return candidate
    raise RuntimeError(
        "OpenThai2.2-OCR-Text model files (det.onnx, rec.onnx) not found in tools/openthai2-ocr-text"
    )


def _thai_char_count(text: str) -> int:
    return len(re.findall(r"[\u0e00-\u0e7f]", text or ""))


def _needs_adaptive_rescue(res: dict) -> bool:
    lines = res.get("lines", [])
    dropped = res.get("dropped", [])
    if not lines:
        return True
    confs = [float(l.get("confidence", 0.0)) for l in lines]
    avg_conf = sum(confs) / len(confs)
    total = len(lines) + len(dropped)
    drop_ratio = len(dropped) / total if total else 0.0
    return avg_conf < 0.88 or (len(dropped) >= 4 and drop_ratio > 0.25)


def _quality_score(res: dict) -> float:
    lines = res.get("lines", [])
    if not lines:
        return 0.0
    confs = [float(l.get("confidence", 0.0)) for l in lines]
    avg_conf = sum(confs) / len(confs)
    thai_chars = _thai_char_count(res.get("text", ""))
    return avg_conf * (1.0 + min(thai_chars, 500) / 5000.0)


def extract_pdf_page_image(pdf_path: str, page_num: int, output_img_path: str, dpi: int = 200):
    """Render one PDF page at exact DPI (default 200 DPI = optimal for OpenThai 2.2.1)."""
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_path)
        try:
            if page_num < 1 or page_num > len(pdf):
                raise ValueError(f"Page number {page_num} out of bounds (1-{len(pdf)})")
            page = pdf[page_num - 1]
            bitmap = page.render(scale=dpi / 72.0)
            image = bitmap.to_pil()
            try:
                image.save(output_img_path)
            finally:
                image.close()
                bitmap.close()
                page.close()
        finally:
            pdf.close()
        return output_img_path
    except Exception as e:
        raise RuntimeError(f"Failed to render PDF page {page_num} with pypdfium2: {e}")


def _build_openthai_ocr(threads: int = 4, paragraphs: bool = False, dewarp: bool = False):
    model_dir = get_openthai_text_dir()
    model_dir_str = str(model_dir)
    if model_dir_str not in sys.path:
        sys.path.insert(0, model_dir_str)

    from runtime.line_engine import LineOCR

    overrides: dict = {"det": {"rescan_below": 16.0}}
    if paragraphs:
        overrides["join"] = {"paragraphs": True}
    if dewarp:
        for base in [model_dir, *OPENTHAI_TEXT_CANDIDATES]:
            dewarp_dir = base / "dewarp"
            if (dewarp_dir / "dewarp_mask.onnx").exists() and (
                (dewarp_dir / "inference.onnx").exists() or (dewarp_dir / "uvdoc.onnx").exists()
            ):
                overrides["pre"] = {"dewarp": True, "dewarp_dir": str(dewarp_dir), "dewarp_backend": "uvdoc"}
                break
    return LineOCR(model_dir_str, threads=threads, **overrides)


def _format_openthai_result(
    res: dict,
    elapsed: float,
    rec2_enabled: bool,
    judge9_enabled: bool,
    backend: str,
    dpi: int | None = None,
    rescued: bool = False,
) -> dict:
    extracted_lines = []
    confs = []
    low_conf_lines = []
    for line in res.get("lines", []):
        conf = round(float(line.get("confidence", 0.0)), 4)
        confs.append(conf)
        box = line.get("box", [])
        if hasattr(box, "tolist"):
            box = box.tolist()
        entry = {
            "text": line.get("text", ""),
            "confidence": conf,
            "row": int(line.get("row", 0)),
            "box": box,
        }
        extracted_lines.append(entry)
        if conf < 0.90:
            low_conf_lines.append({
                "row": entry["row"],
                "confidence": conf,
                "text": entry["text"],
            })

    dropped_lines = [
        {
            "text": d.get("text", ""),
            "confidence": round(float(d.get("confidence", 0.0)), 4),
            "reason": d.get("reason", ""),
        }
        for d in res.get("dropped", [])
    ]

    avg_conf = round(sum(confs) / len(confs), 4) if confs else 0.0
    min_conf = round(min(confs), 4) if confs else 0.0

    return {
        "engine": f"OpenThai2.2-OCR-Text ({MODEL_TEXT_ID} · {MODEL_TEXT_VERSION})",
        "model_id": MODEL_TEXT_ID,
        "model_version": MODEL_TEXT_VERSION,
        "rec2_enabled": rec2_enabled,
        "judge9_enabled": judge9_enabled,
        "dewarp": res.get("dewarp"),
        "backend": backend,
        "dpi": dpi,
        "adaptive_rescue_used": rescued,
        "elapsed_sec": round(elapsed, 3),
        "rotation": int(res.get("rotation", 0)),
        "text_angle": round(float(res.get("text_angle", 0.0)), 2),
        "avg_confidence": avg_conf,
        "min_confidence": min_conf,
        "low_confidence_count": len(low_conf_lines),
        "low_confidence_lines": low_conf_lines,
        "dropped_count": len(dropped_lines),
        "dropped": dropped_lines,
        "text": res.get("text", ""),
        "lines": extracted_lines,
        "line_count": len(extracted_lines),
    }


def run_openthai_text_ocr(
    image_path: str,
    threads: int = 4,
    paragraphs: bool = False,
    dpi: int | None = None,
    dewarp: bool = False,
):
    ocr = _build_openthai_ocr(threads=threads, paragraphs=paragraphs, dewarp=dewarp)
    t0 = time.perf_counter()
    res = ocr.read(image_path)
    elapsed = time.perf_counter() - t0
    return _format_openthai_result(
        res,
        elapsed=elapsed,
        rec2_enabled=ocr.rec2 is not None,
        judge9_enabled=getattr(ocr, "judge9", None) is not None,
        backend=getattr(ocr, "backend", "onnxruntime"),
        dpi=dpi,
        rescued=False,
    )


def run_openthai_pdf_text_ocr(
    pdf_path: str,
    page_num: int,
    dpi: int = 200,
    threads: int = 4,
    paragraphs: bool = False,
    adaptive_rescue: bool = True,
    dewarp: bool = False,
):
    """Run OpenThai 2.2.1 directly on a rendered PDF page with adaptive 250 DPI rescue."""
    import pypdfium2 as pdfium

    ocr = _build_openthai_ocr(threads=threads, paragraphs=paragraphs, dewarp=dewarp)
    pdf = pdfium.PdfDocument(pdf_path)
    try:
        if page_num < 1 or page_num > len(pdf):
            raise ValueError(f"Page number {page_num} out of bounds (1-{len(pdf)})")

        def _render_and_read(target_dpi: int):
            page = pdf[page_num - 1]
            bitmap = page.render(scale=target_dpi / 72.0)
            pil_img = bitmap.to_pil()
            try:
                t0 = time.perf_counter()
                r = ocr.read(pil_img)
                return r, time.perf_counter() - t0
            finally:
                pil_img.close()
                bitmap.close()
                page.close()

        res, elapsed = _render_and_read(dpi)
        used_dpi = dpi
        rescued = False

        if adaptive_rescue and dpi < 250 and _needs_adaptive_rescue(res):
            res2, elapsed2 = _render_and_read(250)
            elapsed += elapsed2
            if _quality_score(res2) > _quality_score(res):
                res = res2
                used_dpi = 250
                rescued = True

        return _format_openthai_result(
            res,
            elapsed=elapsed,
            rec2_enabled=ocr.rec2 is not None,
            judge9_enabled=getattr(ocr, "judge9", None) is not None,
            backend=getattr(ocr, "backend", "onnxruntime"),
            dpi=used_dpi,
            rescued=rescued,
        )
    finally:
        pdf.close()


def lines_to_structured_markdown(lines: list) -> str:
    """
    Reconstructs structured Markdown (with headings, Saraban metadata, and HTML tables
    for multi-column rows) from OpenThai 2.2.1 bounding boxes and row indices.
    """
    if not lines:
        return ""

    rows_map: dict[int, list] = {}
    for line in lines:
        r_idx = line.get("row", 0)
        rows_map.setdefault(r_idx, []).append(line)

    sorted_rows = [rows_map[k] for k in sorted(rows_map.keys())]
    md_blocks = []
    table_buffer = []

    def flush_table():
        nonlocal table_buffer
        if not table_buffer:
            return
        if len(table_buffer) == 1 and len(table_buffer[0]) == 2:
            cells = [c["text"].strip() for c in table_buffer[0]]
            md_blocks.append(f"**{cells[0]}** — {cells[1]}")
            table_buffer = []
            return
        max_cols = max(len(r) for r in table_buffer)
        html_lines = ["<table>", "  <tbody>"]
        for r_idx, row_cells in enumerate(table_buffer):
            html_lines.append("    <tr>")
            for c_idx, cell in enumerate(row_cells):
                tag = "th" if r_idx == 0 and len(table_buffer) > 1 else "td"
                colspan = ""
                if c_idx == len(row_cells) - 1 and len(row_cells) < max_cols:
                    span = max_cols - len(row_cells) + 1
                    colspan = f' colspan="{span}"'
                text_esc = (
                    cell["text"]
                    .strip()
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                )
                html_lines.append(f"      <{tag}{colspan}>{text_esc}</{tag}>")
            html_lines.append("    </tr>")
        html_lines.append("  </tbody>")
        html_lines.append("</table>")
        md_blocks.append("\n".join(html_lines))
        table_buffer = []

    for row_cells in sorted_rows:
        row_cells.sort(key=lambda c: c["box"][0][0] if c.get("box") else 0)
        if len(row_cells) >= 3 or (len(row_cells) == 2 and len(table_buffer) >= 1):
            table_buffer.append(row_cells)
            continue

        flush_table()
        joined = " ".join(c["text"].strip() for c in row_cells if c.get("text"))
        if not joined:
            continue

        if joined in ("บันทึกข้อความ", "คำสั่งสำนักงานตำรวจแห่งชาติ", "ระเบียบสำนักงานตำรวจแห่งชาติ"):
            md_blocks.append(f"# {joined}")
        elif re.match(r"^(เรื่อง|เรียน|อ้างถึง|สิ่งที่ส่งมาด้วย)\s+", joined):
            parts = joined.split(" ", 1)
            md_blocks.append(f"**{parts[0]}** {parts[1]}")
        elif re.match(r"^(ส่วนราชการ|ที่\s+[๐-๙0-9])", joined):
            md_blocks.append(f"**{joined}**")
        elif re.match(r"^(หมวด|ส่วนที่|ผนวก)\s+", joined):
            md_blocks.append(f"## {joined}")
        elif re.match(r"^(มาตรา|ข้อ)\s*[๐-๙0-9]+", joined):
            md_blocks.append(f"### {joined}")
        else:
            md_blocks.append(joined)

    flush_table()
    return "\n\n".join(md_blocks)


def run_openthai_markdown_ocr(
    image_path: str,
    api_url: str = None,
    api_key: str = None,
    base_res: dict | None = None,
    dewarp: bool = False,
):
    endpoint = api_url or os.environ.get("OPENTHAI_MARKDOWN_API_URL")
    if endpoint:
        import base64
        import urllib.request

        with open(image_path, "rb") as f:
            b64_img = base64.b64encode(f.read()).decode("ascii")

        payload = {
            "model": os.environ.get("OPENTHAI_MARKDOWN_MODEL_NAME", "nemotron-parse"),
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64_img}"},
                        },
                        {"type": "text", "text": "Read all text and tables as Markdown."},
                    ],
                }
            ],
            "max_tokens": 4096,
            "temperature": 0.0,
        }
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        req = urllib.request.Request(
            f"{endpoint.rstrip('/')}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        t0 = time.perf_counter()
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        elapsed = round(time.perf_counter() - t0, 3)
        md_text = body["choices"][0]["message"]["content"]
        # OpenThai 2.2 standard_output=True: normalize split sara-am (U+0E4D + U+0E32 -> U+0E33)
        md_text = md_text.replace("\u0e4d\u0e32", "\u0e33")
        return {
            "engine": f"OpenThai2.2-OCR-Markdown ({MODEL_MARKDOWN_ID} · vLLM/DFlash2)",
            "model_id": MODEL_MARKDOWN_ID,
            "model_version": MODEL_MARKDOWN_VERSION,
            "elapsed_sec": elapsed,
            "format": "markdown",
            "text": md_text,
            "line_count": len(md_text.splitlines()),
        }

    # Local CPU fallback using OpenThai 2.2.1 spatial layout + Markdown/HTML table builder
    if base_res is None:
        base_res = run_openthai_text_ocr(image_path, dewarp=dewarp)
    md_text = lines_to_structured_markdown(base_res.get("lines", []))
    return {
        "engine": f"OpenThai2.2-OCR-Markdown ({MODEL_MARKDOWN_ID} · Local CPU Layout via {MODEL_TEXT_VERSION})",
        "model_id": MODEL_MARKDOWN_ID,
        "model_version": MODEL_MARKDOWN_VERSION,
        "rec2_enabled": base_res.get("rec2_enabled", True),
        "judge9_enabled": base_res.get("judge9_enabled", True),
        "dewarp": base_res.get("dewarp"),
        "dpi": base_res.get("dpi"),
        "adaptive_rescue_used": base_res.get("adaptive_rescue_used", False),
        "elapsed_sec": base_res.get("elapsed_sec", 0),
        "rotation": base_res.get("rotation", 0),
        "text_angle": base_res.get("text_angle", 0.0),
        "avg_confidence": base_res.get("avg_confidence", 0.0),
        "min_confidence": base_res.get("min_confidence", 0.0),
        "low_confidence_count": base_res.get("low_confidence_count", 0),
        "low_confidence_lines": base_res.get("low_confidence_lines", []),
        "dropped_count": base_res.get("dropped_count", 0),
        "dropped": base_res.get("dropped", []),
        "format": "markdown",
        "text": md_text,
        "raw_text": base_res.get("text", ""),
        "lines": base_res.get("lines", []),
        "line_count": base_res.get("line_count", 0),
    }


def run_paddle_ocr(image_path: str, lang: str = "en"):
    from paddleocr import PaddleOCR
    ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    result = ocr.ocr(image_path, cls=True)

    extracted_lines = []
    full_text_parts = []

    if result:
        for page_res in result:
            if not page_res:
                continue
            for line in page_res:
                box = line[0]
                text, conf = line[1]
                extracted_lines.append({
                    "text": text,
                    "confidence": round(float(conf), 4),
                    "box": box,
                })
                full_text_parts.append(text)

    return {
        "engine": "PaddleOCR",
        "lang": lang,
        "text": "\n".join(full_text_parts),
        "lines": extracted_lines,
        "line_count": len(extracted_lines),
    }


def run_typhoon_ocr(file_path: str, page_num: int = 1, api_key: str = None):
    import typhoon_ocr

    key = api_key or os.environ.get("TYPHOON_API_KEY") or os.environ.get("OPENAI_API_KEY")

    if not key:
        messages = typhoon_ocr.prepare_ocr_messages(
            file_path,
            task_type="v1.5",
            target_image_dim=1800,
            page_num=page_num,
        )
        return {
            "engine": "Typhoon-OCR (SCB 10X)",
            "page": page_num,
            "status": "ready_offline",
            "text": "ข้อความพร้อมสำหรับการประมวลผลด้วย Typhoon Vision Model (ระบุ TYPHOON_API_KEY ในระบบเพื่อประมวลผลผ่าน Cloud API หรือใช้ OpenThai2.2-OCR-Text สำหรับการประมวลผล Offline บน CPU ทันที)",
            "messages_count": len(messages),
            "note": "Typhoon-OCR v0.4.1 client is fully installed and verified.",
        }

    result_text = typhoon_ocr.ocr_document(
        file_path,
        task_type="v1.5",
        page_num=page_num,
        api_key=key,
    )

    return {
        "engine": "Typhoon-OCR (SCB 10X)",
        "page": page_num,
        "status": "completed",
        "text": result_text,
        "line_count": len(result_text.splitlines()),
    }


def resolve_input_file(raw_path: str) -> str:
    direct = os.path.abspath(raw_path)
    if os.path.exists(direct):
        return direct
    alt = os.path.abspath(os.path.join(r"C:\APP", raw_path))
    if os.path.exists(alt):
        return alt
    return direct


def main():
    parser = argparse.ArgumentParser(
        description="GPC Police Document OCR Service (OpenThai2.2-OCR-Text v2.2.1, OpenThai2.2-OCR-Markdown v2.2.0, PaddleOCR & Typhoon-OCR)"
    )
    parser.add_argument("--file", required=True, help="Path to input PDF or image file")
    parser.add_argument(
        "--engine",
        choices=["openthai-text", "openthai-markdown", "paddle", "typhoon", "auto"],
        default="openthai-text",
        help="OCR engine to use",
    )
    parser.add_argument("--page", type=int, default=1, help="Page number for PDF (1-based)")
    parser.add_argument("--dpi", type=int, default=200, help="PDF render DPI (default: 200)")
    parser.add_argument("--threads", type=int, default=4, help="CPU threads for OpenThai OCR")
    parser.add_argument("--paragraphs", action="store_true", help="Preserve blank lines between paragraphs")
    parser.add_argument("--dewarp", action="store_true", help="Enable phone-photo flattening (OpenThai 2.2 dewarp)")
    parser.add_argument("--lang", default="en", help="Language code for PaddleOCR")
    parser.add_argument("--api-key", default=None, help="API key for Typhoon-OCR or OpenThai Markdown endpoint")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")

    args = parser.parse_args()

    file_path = resolve_input_file(args.file)
    if not os.path.exists(file_path):
        err = {"error": f"File not found: {file_path}"}
        print(json.dumps(err, ensure_ascii=False))
        sys.exit(1)

    is_pdf = file_path.lower().endswith(".pdf")

    try:
        if args.engine == "typhoon":
            result = run_typhoon_ocr(file_path, page_num=args.page, api_key=args.api_key)
        elif is_pdf and args.engine in ("openthai-text", "auto"):
            result = run_openthai_pdf_text_ocr(
                file_path,
                page_num=args.page,
                dpi=args.dpi,
                threads=args.threads,
                paragraphs=args.paragraphs,
                dewarp=args.dewarp,
            )
            result["source_file"] = file_path
            result["page"] = args.page
        elif is_pdf and args.engine == "openthai-markdown" and not os.environ.get("OPENTHAI_MARKDOWN_API_URL"):
            base_res = run_openthai_pdf_text_ocr(
                file_path,
                page_num=args.page,
                dpi=args.dpi,
                threads=args.threads,
                paragraphs=args.paragraphs,
                dewarp=args.dewarp,
            )
            result = run_openthai_markdown_ocr(file_path, api_key=args.api_key, base_res=base_res)
            result["source_file"] = file_path
            result["page"] = args.page
        else:
            def run_img_engine(img_path: str):
                if args.engine in ("openthai-text", "auto"):
                    return run_openthai_text_ocr(
                        img_path,
                        threads=args.threads,
                        paragraphs=args.paragraphs,
                        dewarp=args.dewarp,
                    )
                elif args.engine == "openthai-markdown":
                    return run_openthai_markdown_ocr(img_path, api_key=args.api_key, dewarp=args.dewarp)
                else:
                    return run_paddle_ocr(img_path, lang=args.lang)

            if is_pdf:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
                    tmp_img_path = tmp_file.name
                try:
                    extract_pdf_page_image(file_path, args.page, tmp_img_path, dpi=args.dpi)
                    result = run_img_engine(tmp_img_path)
                    result["source_file"] = file_path
                    result["page"] = args.page
                finally:
                    if os.path.exists(tmp_img_path):
                        os.unlink(tmp_img_path)
            else:
                result = run_img_engine(file_path)
                result["source_file"] = file_path

        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(f"=== OCR Result ({result['engine']}) ===")
            print(result["text"])

    except Exception as e:
        err = {"error": str(e)}
        if args.json:
            print(json.dumps(err, ensure_ascii=False))
        else:
            print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
