import { requirePermission } from "@/lib/auth/requirePermission";
import { getCurrentUser } from "@/lib/auth/currentUser";
import prisma from "@/lib/db";
import { Lightbulb, AlertTriangle, Users, Database, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { evaluateDataQuality } from "@/lib/search/dataQuality";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CaseIntelligencePage() {
  await requirePermission("ADVANCED_CASE_SEARCH");
  const user = await getCurrentUser();

  // Audit Log
  if (user) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CASE_INTELLIGENCE_VIEWED",
        entityType: "Search",
        entityId: "case-intelligence",
      },
    });
  }

  // Fetch all active cases to analyze (with limits to avoid overload, e.g. recent 500)
  // In a real huge app we'd do agg queries, but Prisma doesn't support complex JS logic in DB
  const cases = await prisma.case.findMany({
    take: 1000,
    orderBy: { updatedAt: 'desc' },
    include: {
      legalOfficer: { select: { name: true } }
    }
  });

  const enhancedCases = cases.map((c: any) => ({
    ...c,
    flags: evaluateDataQuality(c)
  }));

  // Insights Data Calculation
  const missingFieldsCounts: Record<string, number> = {};
  let inconsistentStatusCount = 0;
  let oldActiveCount = 0;
  let missingRedCompletedCount = 0;
  const workloadByOfficer: Record<string, number> = {};

  enhancedCases.forEach((c: any) => {
    // Missing Fields
    c.flags.missingImportantFields.forEach((field: string) => {
      missingFieldsCounts[field] = (missingFieldsCounts[field] || 0) + 1;
    });

    // Inconsistent Status
    if (c.flags.hasInconsistentStatus) {
      inconsistentStatusCount++;
    }

    // Completed but no red
    if (c.flags.isCompleted && !c.flags.hasRedCaseNumber) {
      missingRedCompletedCount++;
    }

    // Old Active
    if (c.flags.isOldActiveCase) {
      oldActiveCount++;
    }

    // Workload (only active cases)
    if (!c.flags.isCompleted) {
      const officer = c.legalOfficer?.name || c.legalOfficerName || "ไม่ระบุ";
      workloadByOfficer[officer] = (workloadByOfficer[officer] || 0) + 1;
    }
  });

  const topMissingFields = Object.entries(missingFieldsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topWorkload = Object.entries(workloadByOfficer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/search" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          กลับไปหน้าค้นหาขั้นสูง
        </Link>
      </div>

      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            ข้อมูลเชิงลึกและคุณภาพข้อมูล (Case Intelligence)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            วิเคราะห์ความครบถ้วนของข้อมูล การกระจายงาน และตรวจพบความผิดปกติของสำนวนแบบอัตโนมัติ
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quality Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">จุดที่ข้อมูลมักไม่ครบถ้วน</dt>
                  <dd>
                    <ul className="mt-3 space-y-2">
                      {topMissingFields.length > 0 ? (
                        topMissingFields.map(([field, count]) => (
                          <li key={field} className="flex justify-between text-sm">
                            <span className="text-slate-700">{field}</span>
                            <span className="font-medium text-slate-900">{count} คดี</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500">ข้อมูลครบถ้วนดีเยี่ยม</li>
                      )}
                    </ul>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-3">
            <div className="text-xs text-slate-500">วิเคราะห์จาก {enhancedCases.length} คดีล่าสุด</div>
          </div>
        </div>

        {/* Workload Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">ภาระงาน (คดีที่ยังไม่เสร็จ)</dt>
                  <dd>
                    <ul className="mt-3 space-y-2">
                      {topWorkload.map(([officer, count]) => (
                        <li key={officer} className="flex justify-between text-sm">
                          <span className="text-slate-700 truncate mr-2" title={officer}>{officer}</span>
                          <span className="font-medium text-slate-900">{count} คดี</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-3">
            <Link href="/search?preset=unfinished" className="text-sm font-medium text-blue-700 hover:text-blue-900">
              ดูสำนวนที่ยังไม่เสร็จทั้งหมด
            </Link>
          </div>
        </div>

        {/* Anomalies Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-slate-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">ความผิดปกติที่ต้องตรวจสอบ</dt>
                  <dd>
                    <ul className="mt-3 space-y-3">
                      <li className="flex justify-between text-sm items-center">
                        <span className="text-slate-700">สถานะขัดแย้ง</span>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {inconsistentStatusCount}
                        </span>
                      </li>
                      <li className="flex justify-between text-sm items-center">
                        <span className="text-slate-700">คดีเสร็จแต่ไม่มีเลขแดง</span>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {missingRedCompletedCount}
                        </span>
                      </li>
                      <li className="flex justify-between text-sm items-center">
                        <span className="text-slate-700">คดีค้างเก่านานกว่า 1 ปี</span>
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                          {oldActiveCount}
                        </span>
                      </li>
                    </ul>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-3 flex gap-4">
            <Link href="/search?preset=completed_no_red" className="text-sm font-medium text-blue-700 hover:text-blue-900">
              ตรวจคดีไม่มีเลขแดง
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-blue-800 mb-2">เกี่ยวกับระบบวิเคราะห์ความใกล้เคียง (Similar Cases)</h3>
        <p className="text-sm text-blue-700 leading-relaxed mb-4">
          การตรวจหาคดีที่คล้ายคลึงกันเชิงลึก (AI Similarity) ปัจจุบันทำงานร่วมกับระบบคลังความรู้กฎหมาย (RAG) 
          ข้อมูลที่มีการเชื่อมโยงและจัดทำดัชนี (Embeddings) เรียบร้อยแล้วจะถูกใช้ในการค้นหา 
          <br /><br />
          <strong>ข้อควรระวัง:</strong> ผลความใกล้เคียงเป็นเพียงตัวช่วยค้นหา ไม่ใช่แนววินิจฉัยหรือข้อยุติทางกฎหมาย 
          นิติกรและคณะกรรมการฯ ต้องตรวจสอบเอกสารฉบับเต็มและพิจารณาตามข้อเท็จจริงของแต่ละคดี
        </p>
      </div>
    </div>
  );
}
