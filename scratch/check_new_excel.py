import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

f_path = r'C:\Users\polic\Downloads\วิเคราะห์การเลื่อนตำแหน่งตำรวจ-2569_ปรับฐานอาวุโสใหม่.xlsx'
wb = openpyxl.load_workbook(f_path, data_only=True)
print("Sheets in ปรับฐานอาวุโสใหม่:", wb.sheetnames)

for s in wb.sheetnames:
    ws = wb[s]
    print(f"\nSheet: {s} ({ws.max_row} rows, {ws.max_column} cols)")
    for r in range(1, min(6, ws.max_row+1)):
        row_vals = [ws.cell(row=r, column=c).value for c in range(1, min(12, ws.max_column+1))]
        print(f"  Row {r}: {row_vals}")
