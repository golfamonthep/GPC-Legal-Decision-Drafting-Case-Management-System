import Link from "next/link";
import { FileSpreadsheet, FolderOpen, UploadCloud } from "lucide-react";
import { requirePermission } from "@/lib/auth/requirePermission";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requirePermission("VIEW_CASES");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <UploadCloud className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">อัปโหลดข้อมูลและเอกสาร</h1>
            <p className="mt-1 text-sm text-slate-500">
              เลือกประเภทงานที่ต้องการดำเนินการ
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/registry/import"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                นำเข้าทะเบียนคดีจาก Excel
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                อัปโหลดไฟล์ .xlsx หรือ .xlsm จับคู่คอลัมน์ ตรวจสอบตัวอย่าง และนำเข้ารายการคดีเข้าสู่ระบบ
              </p>
              <span className="mt-4 inline-flex text-sm font-medium text-blue-600">
                ไปหน้าทำรายการ →
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/cases"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-violet-50 p-3 text-violet-600">
              <FolderOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                จัดการเอกสารในสำนวนคดี
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                เลือกคดีจากรายการคดี แล้วเปิดหน้ารายละเอียดเพื่อดูหรือเชื่อมโยงเอกสารในสำนวน
              </p>
              <span className="mt-4 inline-flex text-sm font-medium text-blue-600">
                เลือกรายการคดี →
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        การอัปโหลดไฟล์เอกสารเข้าสำนวนโดยตรงอยู่ระหว่างการเชื่อมต่อพื้นที่จัดเก็บไฟล์ถาวร ปัจจุบันสามารถนำเข้าทะเบียน Excel และเชื่อมโยงเอกสารจากหน้ารายละเอียดคดีได้
      </div>
    </div>
  );
}
