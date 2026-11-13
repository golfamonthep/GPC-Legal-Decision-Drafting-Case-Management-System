import pypdfium2 as pdfium
import os

pdf = pdfium.PdfDocument(r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf')

pages_to_crop = [6, 8, 13, 16, 17, 22, 23, 25, 27, 28, 30, 31, 32, 33, 34, 35, 41, 42, 45, 46, 47, 48, 49, 51, 52, 53, 54, 62, 63, 65]

for p_no in pages_to_crop:
    p = pdf[p_no - 1]
    img = p.render(scale=2.0).to_pil()
    w, h = img.size
    crop = img.crop((0, int(h * 0.08), int(w * 0.5), int(h * 0.95)))
    crop.save(f'scratch/crops/page_{p_no}_full.png')

print("All full pages cropped.")
