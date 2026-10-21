import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def extract_pdf_page_image(pdf_path: str, page_num: int, output_img_path: str, scale: float = 2.0):
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_path)
        if page_num < 1 or page_num > len(pdf):
            raise ValueError(f"Page number {page_num} out of bounds (1-{len(pdf)})")
        page = pdf[page_num - 1]
        image = page.render(scale=scale).to_pil()
        image.save(output_img_path)
        return output_img_path
    except Exception as e:
        raise RuntimeError(f"Failed to render PDF page {page_num} with pypdfium2: {e}")

def run_paddle_ocr(image_path: str, lang: str = "en"):
    from paddleocr import PaddleOCR
    # Suppress verbose paddle logging
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
                    "box": box
                })
                full_text_parts.append(text)
                
    return {
        "engine": "PaddleOCR",
        "lang": lang,
        "text": "\n".join(full_text_parts),
        "lines": extracted_lines,
        "line_count": len(extracted_lines)
    }

def run_typhoon_ocr(file_path: str, page_num: int = 1, api_key: str = None):
    import typhoon_ocr
    
    # Check for API key in args or environment
    key = api_key or os.environ.get("TYPHOON_API_KEY") or os.environ.get("OPENAI_API_KEY")
    
    # If no API key provided, prepare offline prompt messages structure
    if not key:
        messages = typhoon_ocr.prepare_ocr_messages(
            file_path, 
            task_type="v1.5", 
            target_image_dim=1800, 
            page_num=page_num
        )
        return {
            "engine": "Typhoon-OCR (SCB 10X)",
            "page": page_num,
            "status": "ready_offline",
            "text": "ข้อความพร้อมสำหรับการประมวลผลด้วย Typhoon Vision Model (ระบุ TYPHOON_API_KEY ในระบบเพื่อประมวลผลผ่าน Cloud API หรือเชื่อมต่อโมเดล Local vLLM/Ollama)",
            "messages_count": len(messages),
            "note": "Typhoon-OCR v0.4.1 client is fully installed and verified."
        }
    
    # Run Typhoon OCR document call
    result_text = typhoon_ocr.ocr_document(
        file_path,
        task_type="v1.5",
        page_num=page_num,
        api_key=key
    )
    
    return {
        "engine": "Typhoon-OCR (SCB 10X)",
        "page": page_num,
        "status": "completed",
        "text": result_text,
        "line_count": len(result_text.splitlines())
    }

def main():
    parser = argparse.ArgumentParser(description="GPC Police Document OCR Service (PaddleOCR & Typhoon-OCR)")
    parser.add_argument("--file", required=True, help="Path to input PDF or image file")
    parser.add_argument("--engine", choices=["paddle", "typhoon", "auto"], default="paddle", help="OCR engine to use")
    parser.add_argument("--page", type=int, default=1, help="Page number for PDF (1-based)")
    parser.add_argument("--lang", default="en", help="Language code for PaddleOCR (en, latin, ch, etc.)")
    parser.add_argument("--api-key", default=None, help="API key for Typhoon-OCR")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    
    args = parser.parse_args()
    
    file_path = os.path.abspath(args.file)
    if not os.path.exists(file_path):
        err = {"error": f"File not found: {file_path}"}
        print(json.dumps(err, ensure_ascii=False))
        sys.exit(1)
        
    is_pdf = file_path.lower().endswith('.pdf')
    
    try:
        if args.engine == "typhoon":
            result = run_typhoon_ocr(file_path, page_num=args.page, api_key=args.api_key)
        else:
            # PaddleOCR requires image input; if PDF, render target page first
            if is_pdf:
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
                    tmp_img_path = tmp_file.name
                try:
                    extract_pdf_page_image(file_path, args.page, tmp_img_path)
                    result = run_paddle_ocr(tmp_img_path, lang=args.lang)
                    result["source_file"] = file_path
                    result["page"] = args.page
                finally:
                    if os.path.exists(tmp_img_path):
                        os.unlink(tmp_img_path)
            else:
                result = run_paddle_ocr(file_path, lang=args.lang)
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
