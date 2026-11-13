import pypdfium2 as pdfium
import os
import json

ONEDRIVE_PDF = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf'
pdf = pdfium.PdfDocument(ONEDRIVE_PDF)

os.makedirs('scratch/crops', exist_ok=True)

# Load the 67 issues from deep_audit
with open('scratch/all_78_detailed.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Rendering crops for {len(items)} items...")

# Cache rendered pages
rendered_pages = {}

for it in items:
    page_no = it['page'] # 1-indexed
    order = it['order']
    name = it['name']
    
    if page_no not in rendered_pages:
        if page_no <= len(pdf):
            page = pdf[page_no - 1]
            # Render at scale 2.5
            rendered_pages[page_no] = page.render(scale=2.5).to_pil()
    
    img = rendered_pages.get(page_no)
    if not img:
        continue
        
    w, h = img.size
    # In general each page has header (top ~12%) and footer (~5%)
    # Table has up to 20 rows
    # Row index within page (0 to 19)
    # Order within page is roughly (order - 1) % 20
    row_idx = (order - 1) % 20
    
    # Calculate y bounds
    header_offset = h * 0.13
    table_height = h * 0.82
    row_h = table_height / 20.0
    
    y1 = max(0, int(header_offset + row_idx * row_h - 10))
    y2 = min(h, int(header_offset + (row_idx + 1) * row_h + 10))
    
    # Crop from left 0 to 45% of width (contains order, rank, name, position)
    crop = img.crop((0, y1, int(w * 0.45), y2))
    safe_name = f"p{page_no}_order{order}.png"
    crop.save(f"scratch/crops/{safe_name}")

print("All crops saved to scratch/crops/")
