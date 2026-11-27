import json
import os
import re
import sys
import pypdfium2 as pdfium

PDF_PATH = r"C:\APP\data\police-appointments-2569\CURRENT\2-รายการแก้ไขและต้นฉบับ\police_act_2565.pdf"
OUT_PATH = os.path.join(
    r"C:\Users\polic\.codex\worktrees\ai-harness\APP",
    "scratch",
    "police-act-2565-verified.json",
)

THAI_TO_ARABIC = str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789")
ARABIC_TO_THAI = str.maketrans("0123456789", "๐๑๒๓๔๕๖๗๘๙")


def clean_page_text(raw: str) -> str:
    # Normalize line endings and non-breaking spaces
    raw = raw.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")
    out_lines = []
    for ln in raw.split("\n"):
        s = ln.strip()
        # Strip Royal Gazette header / page-number lines
        if re.match(r"^หนา\s+[๐-๙0-9]+", s):
            continue
        if re.match(r"^หน้า\s+[๐-๙0-9]+", s):
            continue
        if "ราชกิจจานุเบกษา" in s and ("เลม" in s or "เล่ม" in s) and "ตอนที่" in s:
            continue
        out_lines.append(ln.rstrip())
    text = "\n".join(out_lines)
    # Fix broken sara-am: [ก-ฮ][วรรณยุกต์]? + whitespace + า  -> + ำ
    text = re.sub(
        r"([\u0e01-\u0e2e][\u0e48-\u0e4b]?)[ \t]+\u0e32",
        lambda m: m.group(1) + "\u0e33",
        text,
    )
    # Join Royal Gazette PDF line-breaks between "มาตรา" and its Thai section number
    text = re.sub(r"(?m)^[ \t]*มาตรา[ \t]*\n[ \t]*([๐-๙]+)", r"มาตรา \1", text)
    # Fix accidental double spaces inside Thai prose while keeping newlines
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text


def main():
    pdf = pdfium.PdfDocument(PDF_PATH)
    pages = [clean_page_text(pdf[i].get_textpage().get_text_range()) for i in range(len(pdf))]
    full = "\n".join(pages)

    # Find section starts sequentially from 1..181
    # Note: In Royal Gazette PDF, pypdfium2 sometimes omits newline before มาตรา (e.g. "การจัดสรรมาตรา ๕๐").
    # Distinguish real section headers from inline citations ("ตามมาตรา X", "มาตรา X วรรค", "มาตรา X (๑)").
    prev_citation_re = re.compile(
        r"(?:ตาม|แห่ง|ใน|หรือ|และ|ถึง|ของ|โดย|จาก|เว้นแต่|ภายใต้|นอกจาก|ว่าด้วย|ประกอบ|ระบุใน|บัญญัติใน|กำหนดใน|บังคับตาม|ความใน|อำนาจตาม)[ \t]*$"
    )
    next_citation_re = re.compile(r"^[ \t]*(?:วรรค|อนุมาตรา|หรือ|และ|ถึง|แห่ง|\(|/)")

    broad = re.compile(r"มาตรา[ \t]+([๐-๙]+)(?=[ \t\n])")
    seq = []
    expected = 1
    for m in broad.finditer(full):
        n = int(m.group(1).translate(THAI_TO_ARABIC))
        if n != expected:
            continue
        before = full[max(0, m.start() - 25):m.start()]
        after = full[m.end():min(len(full), m.end() + 25)]
        if prev_citation_re.search(before):
            continue
        if next_citation_re.match(after):
            continue
        seq.append((n, m.start(), m.group(1)))
        expected += 1

    if len(seq) < 181:
        # Print diagnostic around expected section
        print(f"ERROR: Only matched {len(seq)} sequential sections; stuck at {expected}", file=sys.stderr)
        thai_exp = str(expected).translate(ARABIC_TO_THAI)
        idx = full.find(thai_exp)
        print("Snippet around expected:", repr(full[max(0, idx - 120):idx + 200]), file=sys.stderr)
        sys.exit(1)

    act_meta = {
        "id": "police-act-2565",
        "sysid": "police-act-2565",
        "title": "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. 2565 (ฉบับปัจจุบัน)",
        "category": "วินัย อุทธรณ์ ร้องทุกข์",
        "source": "ราชกิจจานุเบกษา เล่ม ๑๓๙ ตอนที่ ๖๔ ก (๑๖ ตุลาคม ๒๕๖๕)",
        "sourceUrl": "http://www.ratchakitcha.soc.go.th/DATA/PDF/2565/A/064/T_0001.PDF",
    }

    sections = []
    for idx, (n, start, thai_num) in enumerate(seq):
        end = seq[idx + 1][1] if idx + 1 < len(seq) else len(full)
        chunk = full[start:end].strip()

        # Trim trailing chapter/part headings that belong to the NEXT section
        # e.g., if the last lines of chunk are "หมวด X ..." or "ส่วนที่ X ..." before next มาตรา
        if idx + 1 < len(seq):
            chunk = re.sub(
                r"\n+(?:หมวด\s+[๐-๙0-9]+[^\n]*(?:\n[^\n]{1,120})?|ส่วนที่\s+[๐-๙0-9]+[^\n]*(?:\n[^\n]{1,120})?|บทเฉพาะกาล)\s*$",
                "",
                chunk,
            ).strip()

        # Clean up excessive blank lines
        chunk = re.sub(r"\n{3,}", "\n\n", chunk)

        # Ensure no remaining broken sara-am or page noise
        broken = re.findall(r"[\u0e01-\u0e2e\u0e48-\u0e4b][ \t]+\u0e32", chunk)
        if broken:
            print(f"WARN: broken sara-am in sec {n}: {broken[:5]}", file=sys.stderr)

        excerpt_src = re.sub(r"\s+", " ", chunk)
        excerpt = excerpt_src[:220] + ("..." if len(excerpt_src) > 220 else "")

        sections.append(
            {
                "id": f"police-act-2565-sec-{n}",
                "actId": act_meta["id"],
                "actTitle": act_meta["title"],
                "category": act_meta["category"],
                "sectionNum": thai_num,
                "sectionNumArabic": str(n),
                "sectionLabel": f"มาตรา {thai_num}",
                "type": "section",
                "excerpt": excerpt,
                "content": chunk,
                "notes": "ตัวบทฉบับราชกิจจานุเบกษา เล่ม ๑๓๙ ตอนที่ ๖๔ ก (๑๖ ตุลาคม ๒๕๖๕) สกัดและตรวจแก้สระอำครบ ๑๘๑ มาตรา",
                "source": act_meta["source"],
                "sourceUrl": act_meta["sourceUrl"],
            }
        )

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"act": act_meta, "sections": sections}, f, ensure_ascii=False, indent=2)

    print(f"SUCCESS: Extracted {len(sections)} clean sections of police-act-2565 -> {OUT_PATH}")


if __name__ == "__main__":
    main()
