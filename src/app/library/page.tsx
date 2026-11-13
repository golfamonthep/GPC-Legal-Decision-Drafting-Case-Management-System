export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/db";
import LibraryClient from "./LibraryClient";
import { requirePermission } from "@/lib/auth/requirePermission";
import { getLawActs, searchPoliceLaws, toArabicNum } from "@/lib/thai-law/search";

function getOfflineFallbackLegalSources(): any[] {
  const acts = getLawActs();
  return acts.map((act) => {
    const { total } = searchPoliceLaws({ actId: act.id, pageSize: 1 });
    const yearMatch = act.title.match(/พ\.ศ\.\s*([๐-๙0-9]{4})/);
    const yearStr = yearMatch ? toArabicNum(yearMatch[1]) : '2567';
    return {
      id: act.id,
      title: act.title,
      type: act.category,
      documentType: act.title.startsWith('กฎ') || act.title.startsWith('หนังสือ') || act.title.startsWith('ระเบียบ')
        ? 'กฎ/ระเบียบ/หนังสือเวียน'
        : act.title.startsWith('ประมวล')
          ? 'ประมวลกฎหมาย'
          : 'พระราชบัญญัติ',
      referenceNumber: act.sysid,
      year: Number(yearStr) || 2567,
      caseType: act.category === 'วินัย อุทธรณ์ ร้องทุกข์' ? 'อุทธรณ์/ร้องทุกข์' : 'ทั่วไป',
      decisionResult: null,
      sourceStatus: 'ใช้งาน',
      issueTags: [act.category, act.source].filter(Boolean),
      url: act.sourceUrl,
      sourceFileUrl: act.sourceUrl,
      ingestionJobs: [{ status: 'COMPLETED' }],
      _count: { documentChunks: total },
    };
  });
}

export default async function LibraryPage() {
  await requirePermission('VIEW_RECORDS_ARCHIVE');
  let legalSources: any[] = [];
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy') && !process.env.DATABASE_URL.includes('[SENSITIVE]')) {
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
      console.warn("[LibraryPage] Database unavailable, using built-in legal corpus snapshot:", e);
      legalSources = [];
    }
  }

  if (!legalSources || legalSources.length === 0) {
    legalSources = getOfflineFallbackLegalSources();
  }

  return <LibraryClient initialResources={legalSources} />;
}
