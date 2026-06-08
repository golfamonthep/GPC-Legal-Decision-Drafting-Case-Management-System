import React from "react";
import { 
  Server, 
  FileText, 
  Search,
  BadgeCheck
} from "lucide-react";

export default function RAGDashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 ThaiFont">ระบบฐานข้อมูล RAG (Retrieval-Augmented Generation)</h1>
        <p className="text-gray-500 mt-2 ThaiFont">จัดการการนำเข้าข้อมูล การจัดแบ่งชิ้นส่วนข้อความ (Chunking) และทดสอบการค้นหา</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Ingestion Jobs Panel */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center ThaiFont">
              <Server className="w-5 h-5 mr-2 text-blue-600" />
              สถานะการนำเข้าข้อมูล (Ingestion Jobs)
            </h2>
            <button className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition-colors ThaiFont">
              นำเข้าเอกสารใหม่
            </button>
          </div>
          <div className="border border-gray-100 rounded bg-gray-50 p-4 text-center text-gray-500 text-sm ThaiFont">
            (ยังไม่มีข้อมูล Ingestion Job)
          </div>
        </div>

        {/* Document Chunks Panel */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center ThaiFont">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              ชิ้นส่วนเอกสาร (Document Chunks)
            </h2>
            <button className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 transition-colors ThaiFont">
              ดูชิ้นส่วนทั้งหมด
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="border border-gray-100 rounded bg-gray-50 p-3">
              <div className="text-2xl font-bold text-gray-700">0</div>
              <div className="text-xs text-gray-500 mt-1 ThaiFont">ชิ้นส่วนทั้งหมด</div>
            </div>
            <div className="border border-green-100 rounded bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-xs text-green-600 mt-1 ThaiFont">มี Embedding แล้ว</div>
            </div>
            <div className="border border-orange-100 rounded bg-orange-50 p-3">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-xs text-orange-600 mt-1 ThaiFont">รอทำ Embedding</div>
            </div>
          </div>
          <div className="border border-red-100 rounded bg-red-50 p-2 text-center text-red-500 text-sm ThaiFont">
            สถานะ: 0 ชิ้นส่วนที่ทำ Embedding ไม่สำเร็จ
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Retrieval Test Panel */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4 ThaiFont">
            <Search className="w-5 h-5 mr-2 text-purple-600" />
            ทดสอบการสืบค้น (Retrieval Test Panel)
          </h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="พิมพ์คำถามหรือคีย์เวิร์ดทางกฎหมาย..." 
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ThaiFont"
              disabled
            />
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors opacity-50 cursor-not-allowed ThaiFont">
              ค้นหา
            </button>
          </div>
          <div className="h-32 border border-gray-100 rounded bg-gray-50 flex items-center justify-center text-gray-400 text-sm ThaiFont">
            ผลการค้นหาจะแสดงที่นี่
          </div>
        </div>

        {/* Citation Test Panel */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4 ThaiFont">
            <BadgeCheck className="w-5 h-5 mr-2 text-orange-600" />
            ทดสอบการอ้างอิง (Citation Test Panel)
          </h2>
          <div className="h-40 border border-gray-100 rounded bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-gray-500 text-sm mb-2 ThaiFont">ระบบจะจำลองคำตอบ AI พร้อมการอ้างอิง (Grounded Answer) เมื่อเชื่อมต่อ LLM แล้ว</p>
            <p className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded ThaiFont">Strict Rule: No Source = No Answer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
