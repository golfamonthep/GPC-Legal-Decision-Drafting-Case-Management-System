import pypdfium2 as pdfium
import os

ONEDRIVE_PDF = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf'
pdf = pdfium.PdfDocument(ONEDRIVE_PDF)

os.makedirs('scratch/crops', exist_ok=True)

# Test rendering page 10 (0-indexed: 9) where order 89 is located
page = pdf[9]
bitmap = page.render(scale=3.0) # 3x high resolution
img = bitmap.to_pil()
print("Page 10 rendered:", img.size)

# The table has 20 rows per page. Order 89 is row 9 on page 10 (order 81 to 95)
# Crop row 9
w, h = img.size
# Let's crop vertical slice for row 9 (order 89)
# Orders on page 10 are 81 to 95 (15 rows)
row_h = h / 22
y1 = int(row_h * 9.5)
y2 = int(row_h * 11.5)
crop = img.crop((0, y1, int(w * 0.45), y2))
crop.save('scratch/crops/order_89.png')
print("Saved scratch/crops/order_89.png")
