import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

seniority = snap.get('seniority', [])

issues = []

for idx, s in enumerate(seniority):
    name = s.get('appointment_name') or s.get('source_name') or ''
    order = s.get('seniority_order')
    lvl = s.get('source_level')
    page = s.get('source_pdf_page')
    pos = s.get('source_position')
    
    parts = name.split()
    first = parts[0] if len(parts) > 0 else ''
    last = parts[1] if len(parts) > 1 else ''
    
    flag = False
    if re.search(r'[A-Za-z0-9]', name):
        flag = True
    elif len(parts) < 2:
        flag = True
    elif re.search(r'^[ฯๆ\s]+|[ฯๆ\s]+$', name):
        flag = True
    elif len(first) < 3:
        flag = True
    elif first.startswith('า'):
        flag = True
    elif re.search(r'ฯ|ๆ|ปรรพต|เตรรงค์|กมินทร์|งากร|จิตวัฒน์|ปยบุตร|เขเฮิต|ฮ์รี|ฑทอดทล', name):
        flag = True
        
    if flag:
        issues.append((order, lvl, page, name, pos))

with open('scratch/issues_67.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total issues: {len(issues)}\n")
    for i, it in enumerate(issues, 1):
        out.write(f'{i:02d}. Page {it[2]}, Order {it[0]}, Level: {it[1]} | Current: "{it[3]}" | Pos: {it[4]}\n')

print(f"Wrote {len(issues)} issues to scratch/issues_67.txt")
