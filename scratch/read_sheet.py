import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

f_path = r'C:\Users\polic\Downloads\วิเคราะห์การเลื่อนตำแหน่งตำรวจ-2569_ปรับฐานอาวุโสใหม่.xlsx'
wb = openpyxl.load_workbook(f_path, data_only=True)
ws = wb['บัญชีอาวุโสทั้งหมด']

print("Max rows:", ws.max_row)
headers = [ws.cell(row=5, column=c).value for c in range(1, ws.max_column+1)]
print("Headers row 5:", headers)

for r in range(6, 25):
    row_vals = [ws.cell(row=r, column=c).value for c in range(1, len(headers)+1)]
    print(f"Row {r}: {row_vals}")
