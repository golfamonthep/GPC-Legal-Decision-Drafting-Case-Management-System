import pypdfium2 as pdfium
import json
import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

ONEDRIVE_JSONL = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\บัญชีอาวุโสทั้งหมด.jsonl'
ONEDRIVE_PDF = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569\แหล่งข้อมูล\02-police-seniority.pdf'
SNAPSHOT_PATH = r'C:\Users\polic\.codex\worktrees\ai-harness\APP\src\data\analysis\appointments-2569-snapshot.json'

# 1. Read JSONL
with open(ONEDRIVE_JSONL, 'r', encoding='utf-8') as f:
    jsonl_records = [json.loads(line) for line in f if line.strip()]

print(f"Loaded {len(jsonl_records)} records from JSONL")

# 2. Extract dates from 02-police-seniority.pdf
pdf = pdfium.PdfDocument(ONEDRIVE_PDF)
page_date_rows = {}

# Group records by page
page_records = {}
for r in jsonl_records:
    p = r.get('หน้า PDF อาวุโส')
    if p not in page_records:
        page_records[p] = []
    page_records[p].append(r)

for p in sorted(page_records.keys()):
    if p > len(pdf):
        continue
    page = pdf[p - 1]
    text = page.get_textpage().get_text_range()
    date_matches = list(re.finditer(r'\b\d{1,2}/\d{1,2}/\d{4}\b', text))
    row_clusters = []
    for m in date_matches:
        rect = page.get_textpage().get_charbox(m.start())
        y = (rect[1] + rect[3]) / 2
        matched = False
        for c in row_clusters:
            if abs(c[0][1] - y) <= 5.0:
                c.append((rect[0], y, m.group()))
                matched = True
                break
        if not matched:
            row_clusters.append([(rect[0], y, m.group())])
    
    # Sort clusters descending by y (top to bottom)
    row_clusters.sort(key=lambda c: sum(item[1] for item in c)/len(c), reverse=True)
    
    # In each cluster, sort dates ascending by x (left to right)
    sorted_cluster_dates = []
    for c in row_clusters:
        sorted_dates = [item[2] for item in sorted(c, key=lambda item: item[0])]
        sorted_cluster_dates.append(sorted_dates)
    page_date_rows[p] = sorted_cluster_dates

# Page 19 (Construction General): Verified from image scratch_page19
page_date_rows[19] = [['4/11/2566', '15/03/2562', '5/02/2557', '16/02/2553', '1/06/2547', '3/10/2538', '17/09/2513']]

# Page 61 (Water Marine Sub-General): Verified from existing record
page_date_rows[61] = [['1/12/2564', '7/06/2560', '16/02/2553', '16/03/2543', '1/03/2533', '27/12/2510']]

print("Date extraction completed.")

# 3. Read existing snapshot
with open(SNAPSHOT_PATH, 'r', encoding='utf-8') as f:
    snapshot = json.load(f)

# Index existing verified seniority records by normalized source_name and appointment_name
existing_by_name = {}
for s in snapshot.get('seniority', []):
    name_clean = s.get('source_name', '').strip()
    if name_clean:
        existing_by_name[name_clean] = s
    app_name = s.get('appointment_name', '').strip()
    if app_name:
        existing_by_name[app_name] = s

# Compute account total suitable populations
account_totals = {}
for r in jsonl_records:
    lvl = r['ระดับในบัญชีอาวุโส']
    acc = r['สาย/บัญชีต้นทาง']
    key = (lvl, acc)
    account_totals[key] = account_totals.get(key, 0) + 1

DIRECT_MAP = {
    '1รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
    '33005 ศิรบญภาคย์': 'สิริณัฐ ศิรบุญภาคย์',
    '51549 จิกิตศิลปิน': 'ธำรง วิจิตศิลปิน',
    '591 แบ่งเครื่อง': 'ธรา แปงเครื่อง',
    '5998 ธีระจรรยาภรณ์': 'ธงชัย ธีระจรรยาภรณ์',
    'A159 อำพรรทอง': 'ธีรพงษ์ อำพรรทอง',
    'ALN รักษาสวรรณ': 'ยศเอก รักษาสุวรรณ',
    'ALN รักษาสุวรรณ': 'ยศเอก รักษาสุวรรณ',
    'ANNA ABU': 'อรรถพล อนุสิทธิ์',
    'ARNT เอกสิงหชัย': 'ศิริ เอกสิงหชัย',
    'ATR ชาวศรีทอง': 'ดำรงศักดิ์ ชาวศรีทอง',
    'AUN เสถียรพงศ์': 'สุเทพ เสถียรพงศ์',
    'AUNT อรณนารา': 'สุนทร อรุณนารา',
    'AWA คำพานิช': 'อำนาจ คำพานิช',
    'BNI ช่วยศรี': 'บุญเลิศ ช่วยศรี',
    'BUN อะนันทวรรณ': 'เอนก อะนันทวรรณ',
    'DANS ทองทิพย์': 'เดชา ทองทิพย์',
    'DUN บตรอินทร์': 'ดนัย บุตรอินทร์',
    'Fons ทองนาเพียง': 'ธีระพงษ์ ทองนาเพียง',
    'HAY อาภาวศิน': 'นิเวศน์ อาภาวศิน',
    'Insane วัชรเสวิ': 'ไกรวิทย์ วัชรเสวี',
    'LOAN มารศรี': 'มานพ มารศรี',
    'NS ปานดำ': 'ฤทธิ์ ปานดำ',
    'Naan แอร่มหล้า': 'พัลลภ แอร่มหล้า',
    'SAUNT สุนทรโชติ': 'สุทธิพงศ์ สุนทรโชติ',
    'SHUT ธรรเมศรานนท์': 'ชูสิทธิ์ ธรรเมศรานนท์',
    'SINT ชิ้นทอง': 'อาทร ชิ้นทอง',
    'SU พวงมณี': 'ธนู พวงมณี',
    'SUT แก่นจันทร์': 'ยุทธนา แก่นจันทร์',
    'Suna รัตนประทีป': 'สุรเชษฐ์ รัตนประทีป',
    'Suwa ลีลาประภาภรณ์': 'กัมพล ลีลาประภาภรณ์',
    'TUN อนุเอกจิตร': 'ธัชพล อนุเอกจิตร',
    'URS เทศขัน': 'มนตรี เทศขัน',
    'USUI ชงัดเวช': 'ณฐมณฑ์ ชงัดเวช',
    'Was ตันประเสริฐ': 'พิสิฐ ตันประเสริฐ',
    'YATE เหล่าอารยะ': 'โชคชัย เหล่าอารยะ',
    'YE กวินเดชาธร': 'อุทัย กวินเดชาธร',
    'a5 ภษาชีวะ': 'ชูศักดิ์ พฤกษาชีวะ',
    'le การปลก': 'นิมิต การปลูก',
    'nan วาลีประโคน': 'วิโรจน์ วาลีประโคน',
    'ning ไชยสถิตย์': 'สานิตย์ ไชยสถิตย์',
    'uals วงษ์กล้าหาญ': 'สุทธิพงษ์ วงษ์กล้าหาญ',
    'un จันทร์ศร': 'เอนก จันทร์ศร',
    'ก4พวัฒน์ อารยางกร': 'ณพวัฒน์ อารยางกูร',
    'กริกกมล แย้มประยร': 'เกริกกมล แย้มประยูร',
    'กอฎตธาพล  ยี่สาคร': 'กฤตธาพล ยี่สาคร',
    'กิงกาญจน์ กฤษณสุวรรณ': 'กิ่งกาญจน์ กฤษณสุวรรณ',
    'ขชนะ จงโชคดี': 'ชนะ จงโชคดี',
    'ขนกนาถ สุวรรณรัตน์': 'ชนกนาถ สุวรรณรัตน์',
    'ขอดขวัญ อภิกลซาติกิจ': 'ยอดขวัญ อภิกุลชาติกิจ',
    'จนตนา วชิรกิติกล': 'จินตนา วชิรกิติกุล',
    'จมพภ อรพงศา': 'จุมพฏ อุรุพงศา',
    'จมพร พกหอม': 'ชุมพร พุกหอม',
    'จรภพ ภริเดช': 'จิรภพ ภูริเดช',
    'จราย วิสตรานกล': 'จิรายุ วิสูตรานุกูล',
    'จวรรณี บรณวัฒนาโชค': 'สุวรรณี บูรณวัฒนาโชค',
    'จันติ ชัยนิรามัย': 'สันติ ชัยนิรามัย',
    'จารวัตร เวชศิลป์': 'จารุวัตร เวชศิลป์',
    'จิกิตศิลปิน': 'ธำรง วิจิตศิลปิน',
    'ฉลิมเกียรติ รวีภควัต': 'เฉลิมเกียรติ รวีภควัต',
    'ชยวัจน์ สีบุญเรื่อง': 'ชยวัจน์ สีบุญเรือง',
    'ชัยต์พจน สวรรณรักษ์': 'ชัยต์พจน์ สุวรรณรักษ์',
    'ชาวลิต พัฒนสิริกล': 'เชาวลิต พัฒนสิริกุล',
    'ชำนาญ เอี่ยมศิริกลมิตร': 'ชำนาญ เอี่ยมศิริกุลมิตร',
    'ฏา ภจพนธ์ พยอมใหม่': 'ณัฏฐพนธ์ พยอมใหม่',
    'ฑทอดทล สร้อยสุขพาพันธ์': 'เทอดทูล สร้อยสุขพาพันธ์',
    'ณรงค์ฤทธิ์ ด่านสวรรณ์': 'ณรงค์ฤทธิ์ ด่านสุวรรณ์',
    'ณ์ธวฒิ NANA': 'ณัฐวุฒิ ภาคภูมิ',
    'ทธิชัย สงค์อนุกล': 'สุทธิชัย สงค์อนุกูล',
    'ทวีศักดิ์ จรรยาพน': 'ทวีศักดิ์ จรรยาพูน',
    'ทองศูนย์ DUA': 'ทองศูนย์ อุ่นวงค์',
    'ทัดดาว โฉมลักษณ์': 'ทัดดาว โถมลักษณ์',
    'ทิพย์ฆัมพร เกษโกมล': 'ทิพย์อัมพร เกษโกมล',
    'ธรจิต ซิงนวรรณ์': 'สุรจิต ชิงนวรรณ์',
    'ธี เสน่ห์ลักษณา': 'สุธี เสน่ห์ลักษณา',
    'ธี เอี่ยมเจริณยิ่ง': 'สุธี เอี่ยมเจริญยิ่ง',
    'ธีระจรรยาภรณ์': 'ธงชัย ธีระจรรยาภรณ์',
    'นันทชัย กศลศิลป์วฒิ': 'นันทชัย กุศลศิลป์วุฒิ',
    'นันทวฒิ สวรรณละออง': 'นันทวุฒิ สุวรรณละออง',
    'นาถ นันทรัตพันธ์': 'นาถ นันทรัตน์พันธุ์',
    'นเรนทร์ สันติกลานนท์': 'นเรนทร์ สันติกุลานนท์',
    'บณฑริกา สุวรรณเวโช': 'บุณฑริกา สุวรรณเวโช',
    'บัญชา ชีวะอิสระกล': 'บัญชา ชีวะอิสระกุล',
    'บันเจิด จิตาภิวัฒนกล': 'บันเจิด ฐิตาภิวัฒนกุล',
    'บุญจวรรณ วุฒิวรวงศ์': 'เบญจวรรณ วุฒิวรวงศ์',
    'บุณฑล บัวจีบ': 'มณฑล บัวจีบ',
    'บูมิตต์ อุตมา': 'นิมิตต์ อุตมา',
    'ปญจมาพร ซาตะคุณ': 'ปัญจมาพร ชาตะคุณ',
    'ปญญวัชร ภาษีผล': 'ปัญญวัชร ภาษีผล',
    'ปพัฒน์ วสธวัช': 'นภพัฒน์ วสุธวัช',
    'ปภัช ปณันพัทธ์ชา': 'ณปภัช ปณันพัทธ์ชา',
    'ปยบุตร ไพิบูลย์': 'ปิยบุตร ไพบูลย์',
    'ปยะวัฒน์ เฉลิมศรี': 'ปิยะวัฒน์ เฉลิมศรี',
    'ปรรพต เดชมา': 'บรรพต เดชมา',
    'ปิตภพ โตเหมือน': 'ชิตภพ โตเหมือน',
    'ผูเวศ สิงห์วงษ์': 'นิเวศ สิงห์วงษ์',
    'พงศกร จิตโชติ': 'พงศกร ฐิตโชติ',
    'พล Ane': 'สุพล ค้ำชู',
    'พัสวี วนานวัธ': 'พัสวี วนานุวัธ',
    'พิทักษ์ อทัยธรรม': 'พิทักษ์ อุทัยธรรม',
    'พุศวีร์ Sean': 'พศวีร์ เรืองภู่',
    'พโรจน์ สขรวยธนโชติ': 'ไพโรจน์ สุขรวยธนโชติ',
    'ภาณพงศ์ ชอบเพื่อน': 'ภาณุพงศ์ ชอบเพื่อน',
    'มชัย สีเจริญ': 'มีชัย สีเจริญ',
    'มณัติ คำปาละ': 'สมบัติ คำปาละ',
    'มานพ NUBIA': 'มานพ ภุชงค์',
    'รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
    'รัชนี ชาญสไชย': 'รัชนี ชาญสุไชย',
    'รัตน์ สาเรือง': 'สุรัตน์ สาเรือง',
    'รีรัตน์ จารหทัย': 'สุรีรัตน์ จารุหทัย',
    'วนพล ศรีโสภา': 'ธนพล ศรีโสภา',
    'วนาวรรณ มาเซโด': 'ธนาวรรณ มาเชโด',
    'วมล พิทักษ์บรพา': 'วิมล พิทักษ์บูรพา',
    'วรพจน์ ดิษยบตร': 'วรพจน์ ดิษยบุตร',
    'วรรมโรจน์ ปญญโชติ': 'ธรรมโรจน์ ปุญญโชติ',
    'วส เทพชาตรี': 'วสุ เทพชาตรี',
    'วสุทธิ์ พันธ์ฤทธิ์': 'ธีรสุทธิ์ พันธ์ฤทธิ์',
    'วัครพร ดีประเสริฐวิทย์': 'อัครพร ดีประเสริฐวิทย์',
    'วัญญ์จิตา ศรีภา': 'กัญญ์ฐิตา ศรีภา',
    'วัญลักษณ์ of': 'ธัญลักษณ์ ธุดี',
    'วัสพล ตันตะราวงศา': 'อัสพล ตันตะราวงศา',
    'วิตติพงศ์ เศรษฐไกรสิงห์': 'กิตติพงศ์ เศรษฐไกรสิงห์',
    'ว่งโรจน์ ฐากรปณยสิริ': 'รุ่งโรจน์ ฐากูรปุณยสิริ',
    'ศิรบญภาคย์': 'สิริณัฐ ศิรบุญภาคย์',
    'ศิรบุญภาคย์': 'สิริณัฐ ศิรบุญภาคย์',
    'สถืยร uaa': 'เสถียร บุญค้ำ',
    'สยาม บญสม': 'สยาม บุญสม',
    'สรพล เปรมบตร': 'สรพล เปรมบุตร',
    'สวินท์ หรรษมนตร์': 'สุวินท์ หรรษมนตร์',
    'สาวพักตร์ วงศ์ทองคำ': 'เสาวพักตร์ วงศ์ทองคำ',
    'หทัยรัตน์ ลาวัณย์รัตนากล': 'หทัยรัตน์ ลาวัณย์รัตนากุล',
    'หพัฒน์ หอมจันทร์': 'สหพัฒน์ หอมจันทร์',
    'อกสิทธิ์ หงส์แก้ว': 'เอกสิทธิ์ หงส์แก้ว',
    'อทธิพล นาคคำ': 'อิทธิพล นาคคำ',
    'อทธิพล อิทธิสารรณชัย': 'อิทธิพล อิทธิสารรณชัย',
    'อนชัย ณ วัชรเจริญ': 'อนุชัย ณ วัชรเจริญ',
    'อนุสรณ์ พัฒนถาบตร': 'อนุสรณ์ พัฒนถาบุตร',
    'อบูซา รมยะนบันทน์': 'อนุชา รมยะนันทน์',
    'อารญา โถวรุงเรือง': 'อารญา โถวะรุ่งเรือง',
    'ฮิทธิพงษ์ ศรีเลอจันทร์': 'สิทธิพงษ์ ศรีเลอจันทร์',
    'ฮ์รีศักดิ์ พรหมบุญ': 'ศรีศักดิ์ พรหมบุญ',
    'ฯธี เอี่ยมเจริณยิ่ง': 'สุธี เอี่ยมเจริญยิ่ง',
    'ฯพล Ane': 'สุพล ค้ำชู',
    'ฯมิทธิ สวรรณสขโรจน์': 'สมิทธิ สุวรรณสุขโรจน์',
    'ฯๆวัฒน์ แสงนุ่ม': 'สุวัฒน์ แสงนุ่ม',
    'างกรานต์ สันหกรณ์': 'สงกรานต์ สันหกรณ์',
    'างชัย เนตรสขาวัฒน์': 'ธงชัย เนตรสขาวัฒน์',
    'างชัย เนตรสุขาวัฒน์': 'ธงชัย เนตรสขาวัฒน์',
    'างฐณวิทย์ สิทธาภิรมย์': 'ณัฏฐวิทย์ สิทธาภิรมย์',
    'าจฐ บัณฑรัตน์': 'วิจิตร บัณฑรัตน์',
    'าญชล อินทราราม': 'กาญจน์ชล อินทราราม',
    'าฏตภาส กิตติรัฐธกรณ์': 'กฤตภาส กิตติรัฐกรณ์',
    'าฏฤษภา ตันติไพบลย์วงศ์': 'กฤษฎา ตันติไพบูลย์วงศ์',
    'าฏฤษภา ตันติไพิบูลย์วงศ์': 'กฤษฎา ตันติไพบูลย์วงศ์',
    'าฑธิรงค์ โชติกลาง': 'ฤทธิรงค์ โชติกลาง',
    'าตติ แสงศิริวฒิ': 'กิตติ แสงศิริวุฒิ',
    'าติพงษ์ คล้ายแก้ว': 'กิติพงษ์ คล้ายแก้ว',
    'าถตยา เลาประสพวัฒนา': 'กฤตยา เลาประสพวัฒนา',
    'าถฤษภากรณ์ กลิ่นเกษร': 'กฤษฎากรณ์ กลิ่นเกษร',
    'าถษภา สรเชษฐพงษ์': 'กฤษฎา สุรเชษฐพงษ์',
    'าทธิชัย ชางคำ': 'ฤทธิชัย ช่างคำ',
    'าธิชา วงศาโรจน์': 'สุธิชา วงศาโรจน์',
    'านพล บินทปัญญา': 'ธนพล บินทปัญญา',
    'านศักดิ์ ศักดาวัชรานนท์': 'อนุศักดิ์ ศักดาวัชรานนท์',
    'านอมศักดิ์ รู้ยืนยง': 'ถนอมศักดิ์ รู้ยืนยง',
    'านเดช ตันติอาภา': 'มานเดช ตันติอาภา',
    'าพิไชย ลื่มศิวะวงศ์': 'สุพิไชย ลิ่มศิวะวงศ์',
    'ามล นุ่มหอม': 'กมล นุ่มหอม',
    'ามสัน สขมาก': 'รามสูรย์ สุขมาก',
    'ายภจ์ จันทร์ถาวร': 'สายภพ จันทร์ถาวร',
    'ารกมล หยงสตาร์': 'กรกมล หยงสตาร์',
    'ารธวัช สวัสดิ์โรจน์': 'วรธวัช สวัสดิ์โรจน์',
    'ารพัฒน์ หอมหวล': 'กรพัฒน์ หอมหวล',
    'ารรถพล วนาเดช': 'อรรถพล วนาเดช',
    'ารรมนูญ บุญเรือง': 'ธรรมนูญ บุญเรือง',
    'ารวิชญ์ วิจิตรพรกล': 'สรวิชญ์ วิจิตรพรกุล',
    'าราวัฒน์ ศักดิ์ศรีวัฒนา': 'จิราวัฒน์ ศักดิ์ศรีวัฒนา',
    'าฤติชาติ กำจรปรีชา': 'กฤติชาติ กำจรปรีชา',
    'าฤศ จันทร์สว่าง': 'กฤษ จันทร์สว่าง',
    'าฤษดา ศรีอิสาณ': 'กฤษดา ศรีอิสาณ',
    'าลเซษจ์ บางพราน': 'กุลเชษฐ์ บางพราน',
    'าล้าหาญณ โชคพิพัฒน์ไพบลย์': 'กล้าหาญ โชคพิพัฒน์ไพบูลย์',
    'าล้าหาญณ โชคพิพัฒน์ไพิบูลย์': 'กล้าหาญ โชคพิพัฒน์ไพบูลย์',
    'าวัช มลศาสตรสาทร': 'ชูวัช มนต์ศาสตร์สาทร',
    'าวินศักดิ์ พีรยศธนนนท์': 'กวินศักดิ์ พีรยศธนนนท์',
    'าศล ป้องบุญจันทร์': 'กุศล ป้องบุญจันทร์',
    'าสินธ์ ธำรงศรีสข': 'กสินธุ์ ธำรงศรีสุข',
    'าสินธ์ ธำรงศรีสุข': 'กสินธุ์ ธำรงศรีสุข',
    'าองกฤษภา กิตติถิระพงษ์': 'กฤษฎา กิตติถิระพงษ์',
    'าานต์พิชชา สุทธิสัตยารักษ์': 'กานต์พิชชา สุทธิสัตยารักษ์',
    'าาวร มีขำ': 'ถาวร มีขำ',
    'าิตติพงศ์ พันธ์ศรี': 'กิตติพงศ์ พันธ์ศรี',
    'าโธพงษ์ ปิตะบุตร': 'ณัฐพงษ์ ปิตะบุตร',
    'าโัฐศักดิ์ เชาวนาศัย': 'ณัฐศักดิ์ เชาวนาศัย',
    'เขเฮิต บุญทวี': 'โฆษิต บุญทวี',
    'เชคชัย งามวงศ์': 'โชคชัย งามวงศ์',
    'เพโรจน์ ค้มภัย': 'ไพโรจน์ คุ้มภัย',
    'เมวดี ไชยเวช': 'สมวดี ไชยเวช',
    'แบ่งเครื่อง': 'ธรา แปงเครื่อง',
    'ไว ๆพร วสนาท': 'สุภาพร วสนาท',
    'ๆธี เสน่ห์ลักษณา': 'สุธี เสน่ห์ลักษณา',
    'ๆรพันธ์ มันคงดี': 'ธีรพันธ์ มั่นคงดี',
}

def clean_thai_name(raw):
    if not raw:
        return ''
    s = raw.strip()
    if s in DIRECT_MAP:
        return DIRECT_MAP[s]
    s = re.sub(r'^[0-9ฯๆ1\s]+', '', s)
    s = re.sub(r'^า[โถ]\s*', '', s)
    s = re.sub(r'^ก4\s*', '', s)
    s = re.sub(r'บตร\b', 'บุตร', s)
    s = re.sub(r'สวรรณ', 'สุวรรณ', s)
    s = re.sub(r'ค้มภัย', 'คุ้มภัย', s)
    s = re.sub(r'พกหอม', 'พุกหอม', s)
    s = re.sub(r'จมพร', 'ชุมพร', s)
    s = re.sub(r'สพรรณ', 'สุพรรณ', s)
    s = re.sub(r'บญ', 'บุญ', s)
    s = re.sub(r'สข', 'สุข', s)
    s = re.sub(r'มสิกล', 'มุสิกูล', s)
    s = re.sub(r'กาวิกล', 'กาวิกูล', s)
    s = re.sub(r'วสทธิ์', 'วสุทธิ์', s)
    s = re.sub(r'สริย', 'สุริย', s)
    s = re.sub(r'พบลย์', 'พิบูลย์', s)
    s = re.sub(r'บำรง', 'บำรุง', s)
    s = re.sub(r'บตราช', 'บุตรราช', s)
    return s.strip()

# 4. Build enriched seniority list
enriched_seniority = []
matched_existing_count = 0
new_roster_count = 0

for idx, r in enumerate(jsonl_records):
    raw_name = r.get('ชื่อ–นามสกุล (ดูสถานะ OCR)', '').strip()
    cleaned_name = clean_thai_name(raw_name)
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()
    
    lvl = r['ระดับในบัญชีอาวุโส']
    acc = r['สาย/บัญชีต้นทาง']
    order = int(r['ลำดับเดิม'])
    page = int(r['หน้า PDF อาวุโส'])
    total_pop = account_totals.get((lvl, acc), 1)
    
    # Check if this officer is already in verified snapshot
    existing = existing_by_name.get(raw_name) or existing_by_name.get(cleaned_name)
    
    # Get dates for this row on this page
    # Find which row index on this page this record is
    page_recs = page_records.get(page, [])
    row_in_page = -1
    for r_idx, pr in enumerate(page_recs):
        if pr.get('source_row') == r.get('source_row'):
            row_in_page = r_idx
            break
    if row_in_page == -1:
        row_in_page = 0
    
    dates_for_row = []
    p_dates = page_date_rows.get(page, [])
    if 0 <= row_in_page < len(p_dates):
        dates_for_row = p_dates[row_in_page]
    
    current_pos_date = dates_for_row[0] if len(dates_for_row) > 0 else None
    prev_pos_date = dates_for_row[1] if len(dates_for_row) > 1 else None
    birth_date = dates_for_row[-1] if len(dates_for_row) > 0 else None
    
    if existing:
        matched_existing_count += 1
        # Merge, prioritizing verified data from existing record and applying canonical name cleaning
        final_name = clean_thai_name(cleaned_name) or clean_thai_name(existing.get('appointment_name') or existing.get('source_name') or '')
        entry = {
            "id": existing.get('id', f"seniority-{r.get('source_row', idx+1)}"),
            "workbook_row": existing.get('workbook_row', r.get('source_row', idx+1)),
            "appointment_name": final_name,
            "source_name": final_name,
            "seniority_order": order,
            "source_pdf_page": page,
            "total_suitable_population": total_pop,
            "source_level": lvl,
            "source_account": acc,
            "source_position": existing.get('source_position') or r.get('ตำแหน่งในบัญชี (OCR)'),
            "verification_status": existing.get('verification_status', 'VISUAL_SENIORITY_PDF_VERIFIED'),
            "source_pdf": "seniority_2569_round4_2026-08-07_CURRENT.pdf",
            "seniority_display": f"ลำดับที่ {order} จากทั้งหมด {total_pop}",
            "previous_order": existing.get('previous_order', order),
            "current_position_date": existing.get('current_position_date') or current_pos_date,
            "previous_position_date": existing.get('previous_position_date') or prev_pos_date,
            "birth_date": existing.get('birth_date') or birth_date,
            "rank_dates": existing.get('rank_dates') if (existing.get('rank_dates') and len(existing['rank_dates']) >= 2) else dates_for_row,
            "promotion_outcome": r.get('ผลเทียบประกาศแต่งตั้ง'),
            "new_level": r.get('ระดับที่ได้เลื่อน'),
            "new_position": r.get('ตำแหน่งใหม่'),
            "appointment_item_no": r.get('ข้อแต่งตั้ง')
        }
    else:
        new_roster_count += 1
        entry = {
            "id": f"seniority-roster-{r.get('source_row', idx+1)}",
            "workbook_row": r.get('source_row', idx+1),
            "appointment_name": cleaned_name,
            "source_name": cleaned_name,
            "seniority_order": order,
            "source_pdf_page": page,
            "total_suitable_population": total_pop,
            "source_level": lvl,
            "source_account": acc,
            "source_position": r.get('ตำแหน่งในบัญชี (OCR)'),
            "verification_status": "ROSTER_SENIORITY_ALL",
            "source_pdf": "seniority_2569_round4_2026-08-07_CURRENT.pdf",
            "seniority_display": f"ลำดับที่ {order} จากทั้งหมด {total_pop}",
            "previous_order": order,
            "current_position_date": current_pos_date,
            "previous_position_date": prev_pos_date,
            "birth_date": birth_date,
            "rank_dates": dates_for_row,
            "promotion_outcome": r.get('ผลเทียบประกาศแต่งตั้ง'),
            "new_level": r.get('ระดับที่ได้เลื่อน'),
            "new_position": r.get('ตำแหน่งใหม่'),
            "appointment_item_no": r.get('ข้อแต่งตั้ง')
        }
    enriched_seniority.append(entry)

print(f"Total enriched seniority entries: {len(enriched_seniority)}")
print(f"Verified existing matched: {matched_existing_count}")
print(f"New roster added: {new_roster_count}")

# Check birth date presence
has_birth_date = sum(1 for e in enriched_seniority if e.get('birth_date'))
has_current_date = sum(1 for e in enriched_seniority if e.get('current_position_date'))
print(f"Entries with birth_date: {has_birth_date} / {len(enriched_seniority)}")
print(f"Entries with current_position_date: {has_current_date} / {len(enriched_seniority)}")

# 5. Update accounts list in snapshot with exact counts
accounts_map = {}
for (lvl, acc), total in account_totals.items():
    accounts_map[(lvl, acc)] = {
        "source_level": lvl,
        "source_account": acc,
        "total_suitable_population": total,
        "source_pdf": "seniority_2569_round4_2026-08-07_CURRENT.pdf",
        "verification_status": "ROSTER_SENIORITY_ALL"
    }

# Update snapshot
snapshot['seniority'] = enriched_seniority
snapshot['accounts'] = list(accounts_map.values())

with open(SNAPSHOT_PATH, 'w', encoding='utf-8') as f:
    json.dump(snapshot, f, ensure_ascii=False, indent=2)

print(f"Saved enriched snapshot to {SNAPSHOT_PATH}")

MAIN_APP_SNAPSHOT = r'C:\APP\src\data\analysis\appointments-2569-snapshot.json'
if os.path.exists(os.path.dirname(MAIN_APP_SNAPSHOT)):
    with open(MAIN_APP_SNAPSHOT, 'w', encoding='utf-8') as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)
    print(f"Saved enriched snapshot to {MAIN_APP_SNAPSHOT}")
