import prisma from "@/lib/db";
import { Case, CaseEvent } from "@/generated/prisma";
import { isClosedOrRedCase } from "@/lib/caseStatus";

export async function getDashboardStats() {
  const totalCases = await prisma.case.count();
  const grievanceCases = await prisma.case.count({ where: { type: "ร้องทุกข์" } });
  const appealCases = await prisma.case.count({ where: { type: "อุทธรณ์" } });
  const draftCompletions = await prisma.decisionDraft.count({ where: { status: "approved" } });

  return {
    totalCases,
    grievanceCases,
    appealCases,
    draftCompletions,
  };
}

export async function getCasesByStatus() {
  const counts = await prisma.case.groupBy({
    by: ['currentStatus'],
    _count: {
      id: true,
    },
  });
  return counts.map(c => ({ status: c.currentStatus, count: c._count.id }));
}

export async function getCasesByOwnerCommissioner() {
  const cases = await prisma.case.findMany({
    include: { owner: true },
    where: { ownerId: { not: null } }
  });

  const ownerCounts: Record<string, number> = {};
  cases.forEach(c => {
    if (c.owner?.name) {
      ownerCounts[c.owner.name] = (ownerCounts[c.owner.name] || 0) + 1;
    }
  });

  return Object.entries(ownerCounts).map(([name, count]) => ({ name, count }));
}

export async function getOverdueCases() {
  const now = new Date();
  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { dueDate30: { lt: now } },
        { dueDate60: { lt: now } },
        { dueDate90: { lt: now } },
        { dueDate120: { lt: now } },
        { dueDate240: { lt: now } },
      ],
      currentStatus: { notIn: ["ปิดคดี", "วินิจฉัยแล้วเสร็จ", "เสร็จสิ้น", "ยุติเรื่อง", "จำหน่ายเรื่อง", "ปิดเรื่อง", "แล้วเสร็จ"] } // Exclude closed cases
    },
    include: {
      owner: true,
      legalOfficer: true
    }
  });

  return cases.filter((c: any) => !isClosedOrRedCase(c));
}

export async function getDueSoonCases(days: number) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  const cases = await prisma.case.findMany({
    where: {
      OR: [
        { dueDate30: { gt: now, lte: futureDate } },
        { dueDate60: { gt: now, lte: futureDate } },
        { dueDate90: { gt: now, lte: futureDate } },
        { dueDate120: { gt: now, lte: futureDate } },
        { dueDate240: { gt: now, lte: futureDate } },
      ],
      currentStatus: { notIn: ["ปิดคดี", "วินิจฉัยแล้วเสร็จ", "เสร็จสิ้น", "ยุติเรื่อง", "จำหน่ายเรื่อง", "ปิดเรื่อง", "แล้วเสร็จ"] }
    },
    include: {
      owner: true,
      legalOfficer: true
    }
  });

  return cases.filter((c: any) => !isClosedOrRedCase(c));
}

export async function getRecentCaseEvents() {
  return prisma.caseEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5,
    include: { case: true }
  });
}
