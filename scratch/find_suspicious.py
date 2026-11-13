import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

suspicious = []
for s in snap.get('seniority', []):
    name = s.get('appointment_name') or s.get('source_name') or ''
    parts = name.split()
    first = parts[0] if parts else ''
    order = s.get('seniority_order')
    page = s.get('source_pdf_page')
    lvl = s.get('source_level')
    
    reasons = []
    if re.search(r'[A-Za-z0-9]', name):
        reasons.append('Latin/digit')
    if len(parts) < 2:
        reasons.append('No surname')
    if len(first) < 3:
        reasons.append('Very short first')
    if re.search(r'^[ะาำิีึืฺุู์ๆฯ]', first):
        reasons.append('Starts with vowel/tone')
    if re.search(r'ฯ|ๆ', name):
        reasons.append('Contains ฯ/ๆ')
    if re.search(r'^[บปรวมวยดตถทนพลส][า-ู]?\b', first) and len(first) <= 2:
        reasons.append('Short prefix')
    # Specific known OCR corruption patterns
    if any(k in name for k in ['ปรรพต', 'เตรรงค์', 'กมินทร์', 'งากร', 'จิตวัฒน์', 'ปยบุตร', 'เขเฮิต', 'ฮ์รี', 'ฑทอดทล', 'หพัฒน์', 'ปพัฒน์', 'เมวดี', 'มชัย', 'วัญญ์', 'วสุทธิ์', 'รัตน์ สาเรือง']):
        reasons.append('Known OCR pattern')
        
    if reasons:
        suspicious.append((page, order, lvl, name, ", ".join(reasons)))

with open('scratch/suspicious_names.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total suspicious: {len(suspicious)}\n")
    for page, order, lvl, name, r in suspicious:
        out.write(f"P{page:02d} O{order:03d} [{lvl}] : \"{name}\" ({r})\n")

print(f"Total suspicious: {len(suspicious)}")
