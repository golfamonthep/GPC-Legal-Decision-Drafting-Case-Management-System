import json
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

with open(r'src/data/analysis/appointments-2569-snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

unique_firsts = {}
for s in snap.get('seniority', []):
    name = s.get('appointment_name') or s.get('source_name') or ''
    parts = name.split()
    first = parts[0] if parts else ''
    if first not in unique_firsts:
        unique_firsts[first] = []
    unique_firsts[first].append((s.get('source_pdf_page'), s.get('seniority_order'), name))

with open('scratch/unique_first_names.txt', 'w', encoding='utf-8') as out:
    for fn in sorted(unique_firsts.keys()):
        examples = unique_firsts[fn]
        ex_str = ", ".join([f"P{p} O{o} ({n})" for p, o, n in examples[:3]])
        out.write(f"'{fn}' (count: {len(examples)}) -> {ex_str}\n")

print(f"Total unique first names: {len(unique_firsts)}")
