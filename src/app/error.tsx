'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  const isDatabaseError = error.message?.includes('invalid') || 
                          error.message?.includes('database') || 
                          error.message?.includes('Prisma') ||
                          error.message?.includes('connection');

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-8 max-w-lg w-full flex flex-col items-center text-center shadow-sm">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-4">ข้อผิดพลาดฐานข้อมูล</h2>
        <p className="mb-6">
          {isDatabaseError 
            ? 'ไม่สามารถเชื่อมต่อฐานข้อมูล Production ได้ กรุณาตรวจสอบ DATABASE_URL ใน Vercel Environment Variables'
            : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ'}
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
}
