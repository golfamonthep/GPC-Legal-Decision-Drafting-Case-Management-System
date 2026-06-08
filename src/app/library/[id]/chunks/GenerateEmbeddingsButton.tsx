"use client";

import { useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { generateSourceEmbeddings } from "../../actions/embedding";

export default function GenerateEmbeddingsButton({ sourceId }: { sourceId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!confirm("ยืนยันการสร้าง Embeddings สำหรับข้อมูลนี้หรือไม่?")) return;
    setIsGenerating(true);
    try {
      const res = await generateSourceEmbeddings(sourceId, "user-id-placeholder");
      if (res.success) {
        alert(`สร้าง Embeddings สำเร็จจำนวน ${res.count} chunks`);
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
    >
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
      Generate Embeddings
    </button>
  );
}
