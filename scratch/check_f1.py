import pypdfium2 as pdfium

f1 = r'C:\Users\polic\OneDrive\00 ธุรการ\06 ข้อมูลการแต่งตั้งฯ และที่เกี่ยวข้อง\ประกาศลำดับอาวุโสข้าราชการตำรวจระดับ ผบช. และ จตร. ลงมาถึง รอง ผบก. วาระประจำปี 2569 ครั้งที่ 4 ลง 7 ส.ค.69'
pdf1 = pdfium.PdfDocument(f1)
print("f1 pages:", len(pdf1))

for p_idx in [0, 1, 2, 3, 28]:
    if p_idx < len(pdf1):
        p = pdf1[p_idx]
        t = p.get_textpage().get_text_range()
        print(f"Page {p_idx+1} text length: {len(t)}")
        print(f"Sample text on page {p_idx+1}:\n{t[:300]}")
