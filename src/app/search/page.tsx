import { requirePermission } from "@/lib/auth/requirePermission";
import { searchCases } from "@/lib/search/caseSearch";
import { getCurrentUser } from "@/lib/auth/currentUser";
import prisma from "@/lib/db";
import Link from "next/link";
import { Search, Filter, AlertTriangle, FileText, CheckCircle, Download, ExternalLink, Lightbulb } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdvancedSearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  await requirePermission("ADVANCED_CASE_SEARCH");
  const user = await getCurrentUser();

  const keyword = searchParams.keyword || "";
  const type = searchParams.type || "";
  const status = searchParams.status || "";
  const preset = searchParams.preset || "";
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 25;

  const result = await searchCases({
    keyword,
    type,
    status,
    preset,
    page,
    pageSize,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  // Log audit
  if (user) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADVANCED_SEARCH_PERFORMED",
        entityType: "Search",
        entityId: "advanced-search",
        beforeValue: null,
        afterValue: JSON.stringify({ keyword, type, status, preset, page }),
      },
    });
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            ค้นหาขั้นสูง (Advanced Search)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ค้นหาข้อมูลคดีทั้งหมดในระบบ พร้อมตัวกรองและการประเมินความเสี่ยง
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <Link
            href="/case-intelligence"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 shadow-sm ring-1 ring-inset ring-amber-300 hover:bg-amber-100"
          >
            <Lightbulb className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            ข้อมูลเชิงลึก (Intelligence)
          </Link>
          <a 
            href={`/api/search/cases/export?${new URLSearchParams({ keyword, type, status, preset }).toString()}`}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Download className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            ส่งออก CSV
          </a>
        </div>
      </div>

      <div className="mt-8 bg-white shadow sm:rounded-lg border border-slate-200">
        <div className="px-4 py-5 sm:p-6">
          <form className="space-y-4" method="GET" action="/search">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="keyword" className="block text-sm font-medium leading-6 text-slate-900">
                  คำสำคัญ (Keyword)
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="keyword"
                    id="keyword"
                    defaultValue={keyword}
                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="เลขคดี, ชื่อคู่กรณี, เรื่อง..."
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="type" className="block text-sm font-medium leading-6 text-slate-900">
                  ประเภท
                </label>
                <div className="mt-2">
                  <select
                    id="type"
                    name="type"
                    defaultValue={type}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="ร้องทุกข์">ร้องทุกข์</option>
                    <option value="อุทธรณ์">อุทธรณ์</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="preset" className="block text-sm font-medium leading-6 text-slate-900">
                  ตัวกรองด่วน (Presets)
                </label>
                <div className="mt-2">
                  <select
                    id="preset"
                    name="preset"
                    defaultValue={preset}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">-- ไม่ใช้ตัวกรองด่วน --</option>
                    <option value="unfinished">สำนวนที่ยังไม่เสร็จ</option>
                    <option value="no_officer">สำนวนยังไม่มีนิติกร</option>
                    <option value="has_red_unfinished">มีเลขแดงแต่ยังไม่เสร็จสิ้น</option>
                    <option value="completed_no_red">เสร็จสิ้นแต่ไม่มีเลขแดง</option>
                    <option value="has_draft">สำนวนที่มีร่างคำวินิจฉัย</option>
                    <option value="no_documents">สำนวนที่ไม่มีเอกสาร</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Link href="/search" className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none">
                ล้างข้อมูล
              </Link>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Search className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                ค้นหา
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                      หมายเลขคดี
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      คู่กรณี / เรื่อง
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      สถานะ
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      ผู้รับผิดชอบ
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      แจ้งเตือน
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">เปิด</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {result.items.map((caseItem: any) => (
                    <tr key={caseItem.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                            ดำ: {caseItem.blackNumber}
                          </span>
                          {caseItem.redNumber && caseItem.redNumber !== '-' ? (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              แดง: {caseItem.redNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 pl-1">- ไม่มีเลขแดง -</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm text-slate-500 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {caseItem.petitionerName} <span className="text-slate-400 mx-1">vs</span> {caseItem.respondentName}
                        </div>
                        <div className="truncate text-xs mt-1 text-slate-500" title={caseItem.subject}>
                          {caseItem.subject}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {caseItem.currentStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div className="flex flex-col">
                          <span className="text-xs">นิติกร: {caseItem.legalOfficerName || "-"}</span>
                          <span className="text-xs">กก.: {caseItem.owner?.name || "-"}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 flex flex-col gap-1 items-start">
                        {caseItem.flags?.isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3 w-3" /> เกินกำหนด
                          </span>
                        )}
                        {caseItem.flags?.missingImportantFields?.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700" title={caseItem.flags.missingImportantFields.join(", ")}>
                            <AlertTriangle className="h-3 w-3" /> ข้อมูลไม่ครบ
                          </span>
                        )}
                        {caseItem.flags?.hasInconsistentStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                            <AlertTriangle className="h-3 w-3" /> ขัดแย้ง
                          </span>
                        )}
                        {!caseItem.flags?.isOverdue && !caseItem.flags?.missingImportantFields?.length && !caseItem.flags?.hasInconsistentStatus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" /> ปกติ
                          </span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link href={`/cases/${caseItem.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                          เปิด <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {result.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        ไม่พบข้อมูลคดีที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 shadow sm:rounded-lg">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                แสดงผล <span className="font-medium">{(result.page - 1) * result.pageSize + 1}</span> ถึง <span className="font-medium">{Math.min(result.page * result.pageSize, result.total)}</span> จากทั้งหมด <span className="font-medium">{result.total}</span> รายการ
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {Array.from({ length: result.totalPages }).map((_, i) => {
                  const p = i + 1;
                  // Simple URL builder
                  const qs = new URLSearchParams({
                    ...(keyword ? { keyword } : {}),
                    ...(type ? { type } : {}),
                    ...(preset ? { preset } : {}),
                    ...(status ? { status } : {}),
                    page: p.toString()
                  }).toString();
                  
                  return (
                    <Link
                      key={p}
                      href={`/search?${qs}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        p === result.page
                          ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                      } ${i === 0 ? "rounded-l-md" : ""} ${i === result.totalPages - 1 ? "rounded-r-md" : ""}`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
