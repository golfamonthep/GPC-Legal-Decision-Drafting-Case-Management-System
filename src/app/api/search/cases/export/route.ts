import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { searchCases } from "@/lib/search/caseSearch";
import { getCurrentUser } from "@/lib/auth/currentUser";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiPermission("EXPORT_SEARCH_RESULTS");
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const preset = searchParams.get("preset") || "";

    const result = await searchCases({
      keyword,
      type,
      status,
      preset,
      page: 1,
      pageSize: 5000, // Hard limit for export
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "ADVANCED_SEARCH_EXPORTED",
          entityType: "SearchExport",
          entityId: "cases-csv",
          afterValue: JSON.stringify({ keyword, type, status, preset, count: result.items.length }),
        },
      });
    }

    // Prepare CSV data
    const headers = [
      "ลำดับ",
      "เรื่องดำ",
      "เรื่องแดง",
      "ประเภท",
      "ผู้ร้องทุกข์/ผู้อุทธรณ์",
      "คู่กรณี",
      "เรื่อง",
      "สถานะ",
      "นิติกร",
      "วันที่รับเรื่อง",
      "เกินกำหนด",
      "ข้อมูลไม่ครบ"
    ];

    const rows = result.items.map((c: any, index: number) => [
      index + 1,
      c.blackNumber || "-",
      c.redNumber || "-",
      c.type || "-",
      `"${(c.petitionerName || "").replace(/"/g, '""')}"`,
      `"${(c.respondentName || "").replace(/"/g, '""')}"`,
      `"${(c.subject || "").replace(/"/g, '""')}"`,
      c.currentStatus || "-",
      `"${(c.legalOfficerName || c.owner?.name || "-").replace(/"/g, '""')}"`,
      c.receivedDate ? c.receivedDate.toISOString().split('T')[0] : "-",
      c.flags?.isOverdue ? "ใช่" : "ไม่",
      c.flags?.missingImportantFields.length > 0 ? "ใช่" : "ไม่"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(","))
    ].join("\n");

    // Prepend BOM for Excel UTF-8 support
    const bom = "\uFEFF";

    return new Response(bom + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="search_results_export.csv"',
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ส่งออกข้อมูล" }, { status: 403 });
    }
    return NextResponse.json({ error: "ไม่สามารถส่งออกข้อมูลได้" }, { status: 500 });
  }
}
