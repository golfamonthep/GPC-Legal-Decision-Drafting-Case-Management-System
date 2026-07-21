import Link from "next/link";
import { FileSpreadsheet, Scale, UploadCloud, FolderOpen } from "lucide-react";
import { requirePermission } from "@/lib/auth/requirePermission";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requirePermission("IMPORT_REGISTRY");

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <UploadCloud className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">นำเข้าทะเบียนคดี</h1>
          <p className="mt-1 text-sm text-slate-500">
            เลือกประเภททะเบียนก่อนอัปโหลด เพื่อให้ข้อมูลร้องทุกข์และอุทธรณ์แยกจากกันอย่างถูกต้อง
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Link
          href="/registry/import?type=grievance"
          className="group rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <FileSpreadsheet className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">ทะเบียนที่ 1</div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 group-hover:text-blue-800">
                เรื่องร้องทุกข์
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                สำหรับไฟล์ทะเบียนคุมร้องทุกข์ ระบบจะกำหนดประเภททุกแถวเป็น “ร้องทุกข์” และจับคู่หัวข้อ เช่น ผู้ร้องทุกข์ เรื่องที่ร้องทุกข์ คู่กรณี นิติกร และสถานะ
              </p>
              <span className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                อัปโหลดทะเบียนร้องทุกข์ →
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/registry/import?type=appeal"
          className="group rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
              <Scale className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">ทะเบียนที่ 2</div>
              <h2 className="mt-1 text-xl font-bold text-slate-900 group-hover:text-violet-800">
                เรื่องอุทธรณ์
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                สำหรับไฟล์ทะเบียนคุมอุทธรณ์ ระบบจะกำหนดประเภททุกแถวเป็น “อุทธรณ์” และจับคู่หัวข้อ เช่น ผู้อุทธรณ์ คำสั่งที่อุทธรณ์ คู่กรณี นิติกร และกำหนดเวลา 240 วัน
              </p>
              <span className="mt-5 inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                อัปโหลดทะเบียนอุทธรณ์ →
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 h-5 w-5 text-slate-500" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">เอกสารในสำนวนคดี</h3>
              <p className="mt-1 text-sm text-slate-500">เลือกคดีจากรายการคดีเพื่อดูหรือเชื่อมโยงเอกสารในสำนวน</p>
            </div>
          </div>
          <Link
            href="/cases"
            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ไปหน้ารายการคดี
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ให้นำเข้าไฟล์ร้องทุกข์และอุทธรณ์แยกครั้งกัน ห้ามรวมสองทะเบียนไว้ในการอัปโหลดครั้งเดียว
      </div>
    </div>
  );
}
