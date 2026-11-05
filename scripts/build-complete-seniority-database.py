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
    'สรพล เปรมบตร': 'สรพล เปรมบุตร',
    'ปยะวัฒน์ เฉลิมศรี': 'ปิยะวัฒน์ เฉลิมศรี',
    'ชัยต์พจน สวรรณรักษ์': 'ชัยต์พจน์ สุวรรณรักษ์',
    'สวินท์ หรรษมนตร์': 'สุวินท์ หรรษมนตร์',
    'าโัฐศักดิ์ เชาวนาศัย': 'ณัฐศักดิ์ เชาวนาศัย',
    'ายภจ์ จันทร์ถาวร': 'สายภพ จันทร์ถาวร',
    'ว่งโรจน์ ฐากรปณยสิริ': 'รุ่งโรจน์ ฐากูรปุณยสิริ',
    'ภาณพงศ์ ชอบเพื่อน': 'ภาณุพงศ์ ชอบเพื่อน',
    'นันทวฒิ สวรรณละออง': 'นันทวุฒิ สุวรรณละออง',
    'ามสัน สขมาก': 'รามสูรย์ สุขมาก',
    'าญชล อินทราราม': 'กาญจน์ชล อินทราราม',
    'อนุสรณ์ พัฒนถาบตร': 'อนุสรณ์ พัฒนถาบุตร',
    'ณรงค์ฤทธิ์ ด่านสวรรณ์': 'ณรงค์ฤทธิ์ ด่านสุวรรณ์',
    'เพโรจน์ ค้มภัย': 'ไพโรจน์ คุ้มภัย',
    'วรพจน์ ดิษยบตร': 'วรพจน์ ดิษยบุตร',
    'ฯมิทธิ สวรรณสขโรจน์': 'สมิทธิ สุวรรณสุขโรจน์',
    'จมพร พกหอม': 'ชุมพร พุกหอม',
    'ก4พวัฒน์ อารยางกร': 'ณพวัฒน์ อารยางกูร',
    'วนพล ศรีโสภา': 'ธนพล ศรีโสภา',
    'าถษภา สรเชษฐพงษ์': 'กฤษฎา สุรเชษฐพงษ์',
    'อทธิพล อิทธิสารรณชัย': 'อิทธิพล อิทธิสารรณชัย',
    '1รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
    'รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
    'สยาม บญสม': 'สยาม บุญสม',
    'อทธิพล นาคคำ': 'อิทธิพล นาคคำ',
    'พิทักษ์ อทัยธรรม': 'พิทักษ์ อุทัยธรรม',
    'กอฎตธาพล  ยี่สาคร': 'กฤตธาพล ยี่สาคร',
    'Was ตันประเสริฐ': 'พิสิฐ ตันประเสริฐ',
    'จันติ ชัยนิรามัย': 'สันติ ชัยนิรามัย',
    'ธรจิต ซิงนวรรณ์': 'สุรจิต ชิงนวรรณ์',
    'วมล พิทักษ์บรพา': 'วิมล พิทักษ์บูรพา',
    'พโรจน์ สขรวยธนโชติ': 'ไพโรจน์ สุขรวยธนโชติ',
    'เชคชัย งามวงศ์': 'โชคชัย งามวงศ์',
}

def clean_thai_name(raw):
    if not raw:
        return ''
    s = raw.strip()
    if s in DIRECT_MAP:
        return DIRECT_MAP[s]
    s = re.sub(r'^[0-9ฯ1]\s*', '', s)
    s = re.sub(r'^า[โถ]\s*', '', s)
    s = re.sub(r'^ก4\s*', '', s)
    s = re.sub(r'บตร\b', 'บุตร', s)
    s = re.sub(r'สวรรณ', 'สุวรรณ', s)
    s = re.sub(r'ค้มภัย', 'คุ้มภัย', s)
    s = re.sub(r'พกหอม', 'พุกหอม', s)
    s = re.sub(r'จมพร', 'ชุมพร', s)
    s = re.sub(r'สพรรณ', 'สุพรรณ', s)
    s = re.sub(r'บญสม', 'บุญสม', s)
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
        # Merge, prioritizing verified data from existing record
        entry = {
            "id": existing.get('id', f"seniority-{r.get('source_row', idx+1)}"),
            "workbook_row": existing.get('workbook_row', r.get('source_row', idx+1)),
            "appointment_name": existing.get('appointment_name', cleaned_name),
            "source_name": existing.get('source_name', cleaned_name),
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
