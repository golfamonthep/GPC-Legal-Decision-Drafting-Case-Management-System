import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

for s in snap.get('seniority', []):
    if s.get('source_pdf_page') == 65:
        print(f"Order {s.get('seniority_order')}: \"{s.get('appointment_name')}\"")
