import pypdfium2 as pdfium
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_files = glob.glob(r'C:\Users\polic\Downloads\*.pdf')
for p in pdf_files:
    try:
        doc = pdfium.PdfDocument(p)
        print(f"\nPDF: {p} (pages: {len(doc)})")
        # Check first 3 pages
        has_thai = False
        sample = ""
        for i in range(min(5, len(doc))):
            t = doc[i].get_textpage().get_text_range()
            if any(ord(c) >= 0x0E00 and ord(c) <= 0x0E7F for c in t):
                has_thai = True
                sample = t[:200]
                break
        print(f"  Has Thai text layer: {has_thai}")
        if has_thai:
            print(f"  Sample Thai text:\n{sample}")
    except Exception as e:
        print(f"  Error reading {p}: {e}")
