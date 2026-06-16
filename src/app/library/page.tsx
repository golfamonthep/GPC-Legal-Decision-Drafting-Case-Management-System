export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/db";
import { AlertTriangle } from "lucide-react";
import LibraryClient from "./LibraryClient";
import { requirePermission } from "@/lib/auth/requirePermission";

import { LegalSource } from "@/generated/prisma";

export default async function LibraryPage() {
  await requirePermission('VIEW_RECORDS_ARCHIVE');
  let legalSources: LegalSource[] = [];
  try {
    legalSources = await prisma.legalSource.findMany({
      orderBy: { date: 'desc' },
      include: {
        ingestionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { documentChunks: true }
        }
      }
    });
  } catch (e) {
    console.error("Failed to fetch legal sources, falling back to empty array", e);
    if (process.env.NODE_ENV === 'production') {
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
             <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
             <h2 className="text-lg font-bold mb-2">ข้อผิดพลาดฐานข้อมูล</h2>
             <p>ไม่สามารถเชื่อมต่อฐานข้อมูล Production ได้ กรุณาตรวจสอบ DATABASE_URL ใน Vercel Environment Variables</p>
          </div>
        </div>
      );
    }
  }

  return <LibraryClient initialResources={legalSources as any} />;
}
