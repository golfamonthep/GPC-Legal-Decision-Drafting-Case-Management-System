import pypdfium2 as pdfium
import re

pdf = pdfium.PdfDocument(r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf')

# Let's inspect page 6
p = pdf[5] # page 6
tp = p.get_textpage()
text = tp.get_text_range()

# Find all numbers followed by rank or dates
matches = list(re.finditer(r'^\s*(\d{1,3})\s+(?:พล\.ต\.[ตทอ]|พ\.ต\.อ\.|ว่าที่|[^\n\r]+)', text, re.M))
print(f"Page 6 matches: {len(matches)}")
for m in matches[:10]:
    print(m.group().strip())
