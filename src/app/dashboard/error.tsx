"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 text-center mt-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">เกิดข้อผิดพลาดในการโหลดข้อมูลหน้าแดชบอร์ด</h2>
      <p className="text-slate-500 mb-6">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
