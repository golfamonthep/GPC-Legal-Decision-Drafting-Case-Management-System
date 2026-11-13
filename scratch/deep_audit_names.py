import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

seniority = snap.get('seniority', [])

issues = []

# Thai consonant pattern: should have at least 1 consonant in first name, 1 in surname
# Thai vowel pattern: shouldn't have trailing tone marks without consonant, etc.

for idx, s in enumerate(seniority):
    name = s.get('appointment_name') or s.get('source_name') or ''
    order = s.get('seniority_order')
    lvl = s.get('source_level')
    page = s.get('source_pdf_page')
    pos = s.get('source_position')
    
    parts = name.split()
    first = parts[0] if len(parts) > 0 else ''
    last = parts[1] if len(parts) > 1 else ''
    
    reasons = []
    # 1. Non-Thai characters
    if re.search(r'[A-Za-z0-9]', name):
        reasons.append(f"non_thai: {re.findall(r'[A-Za-z0-9]+', name)}")
    # 2. Missing first name or surname
    if len(parts) < 2:
        reasons.append("missing_surname_or_first")
    # 3. Leading / trailing symbols
    if re.search(r'^[ฯๆ\s]+|[ฯๆ\s]+$', name):
        reasons.append("symbol_boundary")
    # 4. Unusual characters in first name (e.g. 1-2 char first name or strange start)
    if len(first) < 3:
        reasons.append(f"short_first: '{first}'")
    # 5. Characters like 'า' at start of name (e.g. าถษภา, าโัฐศักดิ์, ายภจ์)
    if first.startswith('า'):
        reasons.append(f"starts_with_sara_aa: '{first}'")
    # 6. Rare/odd prefixes like 'ฯๆ', 'ฯ1', 'งจกร'
    if re.search(r'ฯ|ๆ|ปรรพต|เตรรงค์|กมินทร์|งากร|จิตวัฒน์|ปยบุตร|เขเฮิต|ฮ์รี|ฑทอดทล', name):
        reasons.append(f"known_ocr_anomaly: '{name}'")
        
    if reasons:
        issues.append({
            'index': idx,
            'order': order,
            'level': lvl,
            'page': page,
            'name': name,
            'pos': pos,
            'reasons': reasons
        })

print(f"Total records audited: {len(seniority)}")
print(f"Total records with issues: {len(issues)}")
for it in issues:
    print(f"p.{it['page']} | {it['level']} | ลำดับ {it['order']}: '{it['name']}' -> {it['reasons']} (pos: {it['pos']})")
