import pypdfium2 as pdfium
import os

pdf = pdfium.PdfDocument(r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf')

pages_to_crop = [36, 37, 38, 40, 43]
os.makedirs('scratch/crops', exist_ok=True)

for p_no in pages_to_crop:
    p = pdf[p_no - 1]
    img = p.render(scale=2.0).to_pil()
    w, h = img.size
    crop = img.crop((0, int(h * 0.08), int(w * 0.5), int(h * 0.95)))
    crop.save(f'scratch/crops/page_{p_no}_full.png')
    # also save to C:\APP\scratch\crops
    crop.save(f'C:/APP/scratch/crops/page_{p_no}_full.png')

print("Remaining pages cropped.")
