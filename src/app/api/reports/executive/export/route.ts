import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { getExecutiveReportData, ReportFilterType } from "@/lib/reports/executiveReport";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("EXPORT_EXECUTIVE_REPORT");
    
    const searchParams = req.nextUrl.searchParams;
    const filterType = (searchParams.get("filter") as ReportFilterType) || "all";

    const data = await getExecutiveReportData({ type: filterType });

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXECUTIVE_REPORT_EXPORTED",
        entityType: "REPORT",
        entityId: filterType,
        afterValue: "Exported CSV summary",
      }
    });

    // Generate CSV Content
    let csv = "\uFEFF"; // BOM for Excel Thai support
    csv += "รายงานผู้บริหาร (Executive Report)\n";
    csv += `พิมพ์วันที่, ${new Date().toLocaleString('th-TH')}\n`;
    csv += `ตัวกรอง, ${filterType}\n\n`;

    csv += "ภาพรวม\n";
    csv += `สำนวนทั้งหมด, ${data.overview.totalCases}\n`;
    csv += `อยู่ระหว่างดำเนินการ, ${data.overview.inProgress}\n`;
    csv += `เสร็จสิ้น, ${data.overview.completed}\n`;
    csv += `เกินกำหนด, ${data.overview.overdue}\n`;
    csv += `ครบกำหนดภายใน 30 วัน, ${data.overview.dueSoon}\n`;
    csv += `ออกเลขแดงแล้ว, ${data.overview.redNumbered}\n`;
    csv += `ยังไม่มีนิติกร, ${data.overview.unassignedLegalOfficer}\n`;
    csv += `ไม่มีสถานะ, ${data.overview.noStatus}\n\n`;

    csv += "แยกตามประเภท\n";
    for (const [type, count] of Object.entries(data.caseTypes)) {
      csv += `${type}, ${count}\n`;
    }
    csv += "\n";

    csv += "แยกตามสถานะ\n";
    for (const [status, count] of Object.entries(data.statuses)) {
      csv += `${status}, ${count}\n`;
    }
    csv += "\n";

    csv += "ภาระงานนิติกร (Top 10)\n";
    csv += "นิติกร,รวม,ดำเนินการ,เกินกำหนด,เสร็จสิ้น\n";
    const loSorted = Object.entries(data.workloadByLegalOfficer)
      .sort((a, b) => b[1].inProgress - a[1].inProgress)
      .slice(0, 10);
    for (const [name, wl] of loSorted) {
      csv += `${name},${wl.total},${wl.inProgress},${wl.overdue},${wl.completed}\n`;
    }
    csv += "\n";

    csv += "คุณภาพข้อมูล\n";
    csv += `ไม่มีเลขดำ, ${data.dataQuality.noBlackNumber}\n`;
    csv += `ไม่มีเลขแดง, ${data.dataQuality.noRedNumber}\n`;
    csv += `ไม่มีผู้ร้อง, ${data.dataQuality.noPetitioner}\n`;
    csv += `ไม่มีผู้ถูกร้อง, ${data.dataQuality.noRespondent}\n`;
    csv += `มีเลขแดงแต่สถานะไม่เสร็จสิ้น, ${data.dataQuality.redNumberButNotCompleted}\n\n`;

    csv += "การใช้งานระบบ\n";
    csv += `AI Draft Generations, ${data.aiUsage.draftGenerations}\n`;
    csv += `DOCX Exports, ${data.docxExport.total}\n`;
    csv += `Permission Denied, ${data.securitySignals.permissionDenied}\n`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="executive_report_${new Date().getTime()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export Executive Report Error:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงรายงานผู้บริหาร" }, { status: 403 });
    }
    return NextResponse.json({ error: "ไม่สามารถส่งออกรายงานได้" }, { status: 500 });
  }
}
