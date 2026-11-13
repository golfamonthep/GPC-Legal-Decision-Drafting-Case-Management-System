import pypdfium2 as pdfium

pdf = pdfium.PdfDocument(r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf')
p = pdf[63] # page 64
img = p.render(scale=2.0).to_pil()
w, h = img.size
crop = img.crop((0, int(h * 0.1), int(w * 0.5), int(h * 0.9)))
crop.save('scratch/crops/page_64_full.png')
print("Saved page_64_full.png")
