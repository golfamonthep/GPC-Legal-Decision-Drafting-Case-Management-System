'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onDataLoaded: (headers: string[], rowData: any[]) => void;
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
    
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xlsm')) {
      setError('รองรับเฉพาะไฟล์ .xlsx และ .xlsm เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays to extract headers safely
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (json.length === 0) {
          setError('ไม่พบข้อมูลในไฟล์ Excel');
          return;
        }

        // Assuming first row is headers
        let headers = json[0].map(h => String(h).trim());
        
        // Remove empty rows at the top if necessary (some excels have title rows)
        // For simplicity, let's assume row 1 is headers. If headers are completely empty, find the first non-empty row.
        let dataStartIndex = 1;
        while (headers.every(h => h === '') && dataStartIndex < json.length) {
           headers = json[dataStartIndex].map(h => String(h).trim());
           dataStartIndex++;
        }

        // Filter out empty headers but keep indices aligned
        const validHeaders = headers.filter(h => h !== '');

        // Now process data rows, convert to objects based on valid headers
        const rowData = [];
        for (let i = dataStartIndex; i < json.length; i++) {
          const row = json[i];
          // Skip completely empty rows
          if (row.every(cell => cell === '')) continue;

          const rowObj: Record<string, any> = {};
          headers.forEach((header, index) => {
            if (header !== '') {
              rowObj[header] = row[index];
            }
          });
          rowData.push(rowObj);
        }

        if (rowData.length === 0) {
          setError('ไม่พบข้อมูลแถวในไฟล์ Excel');
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

    reader.readAsBinaryString(file);
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
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์<br/>
          รองรับเฉพาะไฟล์ .xlsx และ .xlsm
        </p>
        
        <input 
          id="excel-upload"
          type="file" 
          className="hidden" 
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12" 
          onChange={handleFileInput}
        />
        
        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center">
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
