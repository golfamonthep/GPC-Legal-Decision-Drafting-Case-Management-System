import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import fs from 'node:fs';
import path from 'node:path';
import { parseRegistryWorkbook } from './parseRegistryFile';

test('parseRegistryWorkbook accurately parses in-memory synthetic workbook', () => {
  const headers = ['ลำดับ', 'เรื่องดำที่', 'เรื่องแดงที่', 'ผู้ร้องทุกข์', 'เรื่องที่ร้องทุกข์', 'คู่กรณี', 'วันรับ', 'สถานะ'];
  const row1 = [1, '10/67', '5/67', 'นายทดสอบ เอ', 'ร้องทุกข์คำสั่ง', 'บก.อก.', '01/02/2567', 'เสร็จสิ้น'];
  const row2 = [2, '11/67', '', 'พ.ต.ท.ทดสอบ บี', 'แต่งตั้งไม่เป็นธรรม', 'ตร.', '15/02/2567', 'อยู่ระหว่างดำเนินการ'];
  
  const ws = XLSX.utils.aoa_to_sheet([headers, row1, row2]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนคุมทั้งหมด');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const result = parseRegistryWorkbook(buffer, 'ทะเบียนคุม ร้องทุกข์.xlsx');
  assert.equal(result.success, true);
  assert.equal(result.caseType, 'ร้องทุกข์');
  assert.equal(result.totalRows, 2);
  assert.equal(result.rows[0].blackNumber, '10/67');
  assert.equal(result.rows[0].redNumber, '5/67');
  assert.equal(result.rows[0].petitionerName, 'นายทดสอบ เอ');
  assert.equal(result.rows[0].currentStatus, 'เสร็จสิ้น');
  assert.equal(result.rows[1].blackNumber, '11/67');
  assert.equal(result.rows[1].redNumber, null);
  assert.equal(result.rows[1].currentStatus, 'อยู่ระหว่างดำเนินการ');
});

test('parseRegistryWorkbook parses real OneDrive files if available', () => {
  const dir = 'c:/Users/polic/OneDrive/04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์';
  if (!fs.existsSync(dir)) return;

  const complaintFile = path.join(dir, 'ทะเบียนคุม ร้องทุกข์ 1-106.xlsm');
  if (fs.existsSync(complaintFile)) {
    const buf = fs.readFileSync(complaintFile);
    const res = parseRegistryWorkbook(buf, path.basename(complaintFile));
    assert.equal(res.success, true);
    assert.equal(res.caseType, 'ร้องทุกข์');
    assert.ok(res.totalRows >= 106, `Expected at least 106 cases, got ${res.totalRows}`);
    assert.equal(res.rows[0].blackNumber, '56/66');
  }

  const appealFile = path.join(dir, 'ทะเบียนคุม อุทธรณ์ 1-109.xlsm');
  if (fs.existsSync(appealFile)) {
    const buf = fs.readFileSync(appealFile);
    const res = parseRegistryWorkbook(buf, path.basename(appealFile));
    assert.equal(res.success, true);
    assert.equal(res.caseType, 'อุทธรณ์');
    assert.ok(res.totalRows >= 109, `Expected at least 109 cases, got ${res.totalRows}`);
    assert.equal(res.rows[0].blackNumber, '10/66');

    const adminCases = res.rows.filter(r => r.isAdminCourt);
    assert.equal(adminCases.length, 9, `Expected 9 admin court appeal cases, got ${adminCases.length}`);
    assert.ok(adminCases.every(r => r.isOrangeRow), 'All 9 appeal admin court rows should detect orange fill');
  }

  if (fs.existsSync(complaintFile)) {
    const buf = fs.readFileSync(complaintFile);
    const res = parseRegistryWorkbook(buf, path.basename(complaintFile));
    const adminCases = res.rows.filter(r => r.isAdminCourt);
    assert.equal(adminCases.length, 6, `Expected 6 admin court complaint cases, got ${adminCases.length}`);
    const row203 = adminCases.find(r => r.blackNumber === '203/2568');
    assert.ok(row203, 'Expected 203/2568 to be detected via text mention');
    assert.equal(row203.adminCourtSource, 'text');
  }
});

test('parseRegistryWorkbook detects synthetic orange fill and excludes non-admin courts', () => {
  const headers = ['ลำดับ', 'เรื่องดำที่', 'เรื่องแดงที่', 'ผู้ร้องทุกข์', 'การดำเนินการ', 'สถานะ'];
  const rows = [
    headers,
    [1, '1/69', '2/69', 'พ.ต.ท.ส้ม อย่างเดียว', '', 'เสร็จสิ้น'],
    [2, '2/69', '3/69', 'พ.ต.ท.ข้อความ ศาลปกครอง', 'ฟ้องศาลปกครองกลาง', 'เสร็จสิ้น'],
    [3, '3/69', '4/69', 'พ.ต.ท.ศาลแขวง ไม่นับ', 'ฟ้องศาลแขวงปทุมวัน คำสั่งทางปกครอง', 'เสร็จสิ้น'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ทะเบียนคุมทั้งหมด');
  const baseBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  // Inject an orange fill into xl/styles.xml and assign style s="1" to row 2 (B2 & D2)
  const zip = new PizZip(baseBuffer);
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFAC090"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>
  </cellXfs>
</styleSheet>`;
  zip.file('xl/styles.xml', stylesXml);
  const sheetPath = 'xl/worksheets/sheet1.xml';
  const sheetXml = zip.file(sheetPath)!.asText()
    .replace('<c r="B2"', '<c r="B2" s="1"')
    .replace('<c r="D2"', '<c r="D2" s="1"');
  zip.file(sheetPath, sheetXml);

  const styledBuffer = zip.generate({ type: 'nodebuffer' });
  const result = parseRegistryWorkbook(styledBuffer, 'ทะเบียนคุม ร้องทุกข์.xlsx');
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[0].isOrangeRow, true);
  assert.equal(result.rows[0].isAdminCourt, true);
  assert.equal(result.rows[0].adminCourtSource, 'orange');

  assert.equal(result.rows[1].isOrangeRow, false);
  assert.equal(result.rows[1].isAdminCourt, true);
  assert.equal(result.rows[1].adminCourtSource, 'text');

  assert.equal(result.rows[2].isOrangeRow, false);
  assert.equal(result.rows[2].isAdminCourt, false);
  assert.equal(result.rows[2].adminCourtSource, null);
});
