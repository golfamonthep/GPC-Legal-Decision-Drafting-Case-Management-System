import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireApiPermission("VIEW_ADMIN_CONSOLE");
    
    // Using transaction to fetch stats without leaking secrets
    const [pendingCount, processingCount, completedCount, failedCount, recentJobs] = await prisma.$transaction([
      prisma.documentIngestionJob.count({ where: { status: 'pending' } }),
      prisma.documentIngestionJob.count({ where: { status: 'processing' } }),
      prisma.documentIngestionJob.count({ where: { status: 'completed' } }),
      prisma.documentIngestionJob.count({ where: { status: 'failed' } }),
      prisma.documentIngestionJob.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          legalSource: { select: { title: true, documentType: true } }
        }
      })
    ]);

    return NextResponse.json({ 
      ok: true, 
      data: {
        counts: {
          pending: pendingCount,
          processing: processingCount,
          completed: completedCount,
          failed: failedCount
        },
        recentJobs
      } 
    });
  } catch (error: any) {
    console.error("[API_ADMIN_JOBS_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal Server Error" },
      { status: error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN" ? 401 : 500 }
    );
  }
}
