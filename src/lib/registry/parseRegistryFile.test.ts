import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
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
  }
});
