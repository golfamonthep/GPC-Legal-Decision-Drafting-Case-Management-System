import pypdfium2 as pdfium
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')

candidates = [
    r'C:\Users\polic\Downloads\ประกาศลำดับอาวุโสข้าราชการตำรวจ-11112567.pdf',
    r'C:\Users\polic\Downloads\ประกาศลำดับอาวุโสข้าราชการตำรวจ-2.pdf',
    r'C:\Users\polic\Downloads\บัญชีประกาศอาวุโสข้าราชการตำรวจ-วาระเดือ.pdf',
    r'C:\Users\polic\Downloads\ประกาศลำดับอาวุโสข้าราชการตำรวจระดับ-รอง-.pdf',
    r'C:\Users\polic\Downloads\ประกาศลำดับอาวุโสข้าราชการตำรวจ-2566.pdf',
    r'C:\Users\polic\Downloads\ประกาศลำดับอาวุโสข้าราชการตำรวจดำรงตำแห.pdf',
]

for c in candidates:
    try:
        doc = pdfium.PdfDocument(c)
        print(f"\nFile: {c}")
        print(f"  Pages: {len(doc)}")
        for p_no in range(min(3, len(doc))):
            t = doc[p_no].get_textpage().get_text_range()
            thai_chars = sum(1 for ch in t if '\u0e00' <= ch <= '\u0e7f')
            print(f"  Page {p_no+1}: text len {len(t)}, Thai chars {thai_chars}")
            if thai_chars > 20:
                print(f"    Sample: {t[:150].strip()}")
    except Exception as e:
        print(f"  Error reading {c}: {e}")
