import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569'

with open(f'{BASE}\\recheck_report.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

for k, v in rep.items():
    if isinstance(v, (int, str, bool)):
        print(f"{k}: {v}")
    elif isinstance(v, list):
        print(f"{k} (len {len(v)}): sample {v[:3]}")
    elif isinstance(v, dict):
        print(f"{k}: keys {list(v.keys())}")
