'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onDataLoaded: (headers: string[], rowData: any[]) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_ROWS = 2000;

const THAI_DIGITS: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

function normalizeThaiDigits(value: string): string {
  return value.replace(/[๐-๙]/g, (digit) => THAI_DIGITS[digit] ?? digit);
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function makeUniqueHeaders(rawHeaders: unknown[]): string[] {
  const seen = new Map<string, number>();

  return rawHeaders.map((value) => {
    const header = normalizeHeader(value);
    if (!header) return '';

    const count = (seen.get(header) ?? 0) + 1;
    seen.set(header, count);
    return count === 1 ? header : `${header} (${count})`;
  });
}

function isValidSequence(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);

  // Some supplied .xlsm files format numeric sequence cells with the custom
  // locale pattern [$-D00041E]0. SheetJS therefore renders values such as 75
  // as "$75" when raw:false. Strip display-only currency/grouping symbols
  // before deciding whether the row is an actual registry record.
  const normalized = normalizeThaiDigits(String(value ?? ''))
    .replace(/[$฿,\s]/g, '')
    .trim();

  return /^\d+$/.test(normalized);
}

export default function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    setError(null);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xlsm')) {
      setError('รองรับเฉพาะไฟล์ .xlsx และ .xlsm เท่านั้น');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('ไฟล์มีขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วลองใหม่');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!(data instanceof ArrayBuffer)) {
          setError('ไม่สามารถอ่านข้อมูลจากไฟล์ Excel ได้');
          return;
        }

        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: false,
        });

        const firstSheetName = workbook.SheetNames.find((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          return Boolean(sheet && sheet['!ref']);
        });

        if (!firstSheetName) {
          setError('ไม่พบแผ่นงานที่มีข้อมูลในไฟล์ Excel');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
          dateNF: 'dd/mm/yyyy',
        }) as unknown[][];

        if (rows.length === 0) {
          setError('ไม่พบข้อมูลในไฟล์ Excel');
          return;
        }

        let headerRowIndex = rows.findIndex((row) => {
          const normalized = row.map(normalizeHeader);
          return normalized.includes('เรื่องดำที่') || normalized.includes('เรื่องแดงที่');
        });

        if (headerRowIndex === -1) {
          headerRowIndex = rows.findIndex((row) => row.some((cell) => normalizeHeader(cell) !== ''));
        }

        if (headerRowIndex === -1) {
          setError('ไม่พบแถวหัวตารางในไฟล์ Excel');
          return;
        }

        const headers = makeUniqueHeaders(rows[headerRowIndex]);
        const validHeaders = headers.filter(Boolean);

        if (validHeaders.length === 0) {
          setError('ไม่พบชื่อคอลัมน์ที่สามารถใช้งานได้');
          return;
        }

        const sequenceHeader = headers.find((header) => header === 'ลำดับ');
        const rowData: Record<string, unknown>[] = [];

        for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
          const row = rows[rowIndex];
          if (row.every((cell) => normalizeHeader(cell) === '')) continue;

          const rowObject: Record<string, unknown> = {};
          headers.forEach((header, columnIndex) => {
            if (header) rowObject[header] = row[columnIndex];
          });

          // The supplied registers contain summary/formula rows below the real records.
          // When a sequence column exists, only rows with an actual numeric sequence are records.
          if (sequenceHeader && !isValidSequence(rowObject[sequenceHeader])) continue;

          const blackNumber = normalizeHeader(rowObject['เรื่องดำที่']);
          if (blackNumber === 'เรื่องดำ' || blackNumber === 'เรื่องแดง' || blackNumber === 'ทั้งหมด') continue;

          rowData.push(rowObject);
        }

        if (rowData.length === 0) {
          setError('ไม่พบแถวข้อมูลคดีในไฟล์ Excel');
          return;
        }

        if (rowData.length > MAX_IMPORT_ROWS) {
          setError(`ไฟล์มีข้อมูล ${rowData.length.toLocaleString('th-TH')} แถว เกินกำหนด ${MAX_IMPORT_ROWS.toLocaleString('th-TH')} แถวต่อครั้ง`);
          return;
        }

        onDataLoaded(validHeaders, rowData);
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel โปรดตรวจสอบรูปแบบไฟล์');
      }
    };

    reader.onerror = () => {
      setError('เกิดข้อผิดพลาดในการอ่านไฟล์');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('excel-upload')?.click()}
      >
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <UploadCloud className={`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2 font-thai">อัปโหลดไฟล์ Excel ทะเบียนคุมเรื่อง</h3>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์<br />
          รองรับ .xlsx และ .xlsm ขนาดไม่เกิน 10 MB
        </p>

        <input
          id="excel-upload"
          type="file"
          className="hidden"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
          onChange={handleFileInput}
        />

        <button type="button" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          เลือกไฟล์ Excel
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
          <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm font-thai">เกิดข้อผิดพลาด</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
