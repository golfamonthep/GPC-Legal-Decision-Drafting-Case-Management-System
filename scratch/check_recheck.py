import sys
import csv
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE = r'C:\Users\polic\OneDrive\00 ธุรการ\09 ฐานข้อมูลวิเคราะห์ คำวินิจฉัย\ฐานข้อมูลเรื่องร้องทุกข์ วาระ 2569\ข้อมูลระดับนายพล\ตำรวจ-2569'

try:
    with open(f'{BASE}\\รีเชคจากประกาศอาวุโส.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i in range(10):
            print("CSV line:", next(reader))
except Exception as e:
    print("Error reading CSV:", e)

try:
    with open(f'{BASE}\\recheck_report.json', 'r', encoding='utf-8') as f:
        rep = json.load(f)
        print("recheck_report keys:", list(rep.keys()) if isinstance(rep, dict) else len(rep))
        if isinstance(rep, dict):
            for k in list(rep.keys())[:5]:
                print(f"  {k}: {str(rep[k])[:100]}")
except Exception as e:
    print("Error reading recheck_report.json:", e)
