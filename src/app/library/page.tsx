export const dynamic = 'force-dynamic';
export const revalidate = 0;

import prisma from "@/lib/db";
import LibraryClient from "./LibraryClient";
import { requirePermission } from "@/lib/auth/requirePermission";
import { getLawActs, getLawStats, searchPoliceLaws, toArabicNum } from "@/lib/thai-law/search";

function getOfflineFallbackLegalSources(): any[] {
  const acts = getLawActs();
  return acts.map((act) => {
    const { total } = searchPoliceLaws({ actId: act.id, pageSize: 1 });
    const yearMatch = act.title.match(/พ\.ศ\.\s*([๐-๙0-9]{4})/) || act.title.match(/\/([๐-๙0-9]{4})/);
    const yearStr = yearMatch ? toArabicNum(yearMatch[1]) : '2569';
    return {
      id: act.id,
      title: act.title,
      type: act.category,
      documentType:
        act.title.startsWith('คำสั่ง')
          ? 'คำสั่ง ตร.'
          : act.title.startsWith('กฎ') || act.title.startsWith('หนังสือ') || act.title.startsWith('บันทึก') || act.title.startsWith('ระเบียบ')
            ? 'กฎ/ระเบียบ/หนังสือเวียน'
            : act.title.startsWith('ประมวล')
              ? 'ประมวลกฎหมาย'
              : 'พระราชบัญญัติ',
      referenceNumber: act.sysid,
      year: Number(yearStr) || 2569,
      caseType:
        act.gpcScope === 'appeal_discipline'
          ? 'อุทธรณ์ (วินัย/ออกจากราชการ)'
          : act.gpcScope === 'grievance_appointment'
            ? 'ร้องทุกข์ (แต่งตั้ง/บริหารบุคคล)'
            : 'ทั่วไป',
      decisionResult: null,
      sourceStatus: act.isRepealed ? 'ยกเลิกแล้ว' : 'ใช้งาน',
      issueTags: [act.category, act.source].filter(Boolean),
      url: act.sourceUrl || `/library?act=${act.id}`,
      sourceFileUrl: act.sourceUrl || `/library?act=${act.id}`,
      ingestionJobs: [{ status: 'COMPLETED' }],
      _count: { documentChunks: total },
    };
  });
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ act?: string; tab?: string; q?: string }>;
}) {
  await requirePermission('VIEW_RECORDS_ARCHIVE');
  const params = searchParams ? await searchParams : {};
  const lawStats = getLawStats();

  let legalSources: any[] = [];
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy') && !process.env.DATABASE_URL.includes('[SENSITIVE]')) {
    try {
      // A hanging DB must not freeze the menu: fall back after 4s.
      legalSources = await Promise.race([
        prisma.legalSource.findMany({
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
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 4000)),
      ]);
    } catch (e) {
      console.warn("[LibraryPage] Database unavailable, using built-in legal corpus snapshot:", e);
      legalSources = [];
    }
  }

  if (!legalSources || legalSources.length === 0) {
    legalSources = getOfflineFallbackLegalSources();
  }

  return (
    <LibraryClient
      initialResources={legalSources}
      lawStats={lawStats}
      initialActId={params.act || null}
      initialTab={(params.tab as 'catalog' | 'regulations' | 'ocr' | 'archive') || 'catalog'}
      initialQuery={params.q || ''}
    />
  );
}
