import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

first_names = []
for s in snap.get('seniority', []):
    name = s.get('appointment_name') or s.get('source_name') or ''
    parts = name.split()
    first = parts[0] if parts else ''
    first_names.append((first, name, s.get('seniority_order'), s.get('source_pdf_page'), s.get('source_level')))

# Sort by first name
first_names.sort(key=lambda x: x[0])

with open('scratch/all_first_names.txt', 'w', encoding='utf-8') as out:
    for fn, name, order, page, lvl in first_names:
        out.write(f"P{page:02d} O{order:03d} [{lvl}] : '{fn}' full: '{name}'\n")

print(f"Wrote {len(first_names)} names to scratch/all_first_names.txt")
