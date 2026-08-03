import {
  getFiscalYearEnd,
  getFiscalYearStart,
  getThisMonthEnd,
  getThisMonthStart,
  getThisQuarterEnd,
  getThisQuarterStart,
} from "@/lib/date/fiscalYear";
import { hasRedCaseNumber, isClosedCaseStatus } from "@/lib/caseStatus";
import type {
  DashboardCaseRecord,
  DashboardFilters,
  DashboardPermissions,
  DashboardSnapshot,
  DashboardSourcePayload,
} from "./types";

const DAY_MS = 86_400_000;
const VALID_TYPES: Record<Exclude<DashboardFilters["type"], "all">, string> = {
  complaint: "ร้องทุกข์",
  appeal: "อุทธรณ์",
};

export function parseDashboardFilters(input: {
  period?: string;
  type?: string;
}): DashboardFilters {
  const period = ["all", "month", "quarter", "fiscal-year"].includes(input.period ?? "")
    ? (input.period as DashboardFilters["period"])
    : "all";
  const type = ["all", "complaint", "appeal"].includes(input.type ?? "")
    ? (input.type as DashboardFilters["type"])
    : "all";
  return { period, type };
}

export function getDashboardDateRange(period: DashboardFilters["period"], now: Date) {
  if (period === "month") return { gte: getThisMonthStart(now), lte: getThisMonthEnd(now) };
  if (period === "quarter") return { gte: getThisQuarterStart(now), lte: getThisQuarterEnd(now) };
  if (period === "fiscal-year") return { gte: getFiscalYearStart(now), lte: getFiscalYearEnd(now) };
  return null;
}

export function getNearestDueDate(record: DashboardCaseRecord, now: Date): Date | null {
  const dates = [
    record.dueDate30,
    record.dueDate60,
    record.dueDate90,
    record.dueDate120,
    record.dueDate240,
  ].filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())));
  if (!dates.length) return null;

  const future = dates.filter((date) => date.getTime() >= now.getTime()).sort((a, b) => a.getTime() - b.getTime());
  if (future.length) return future[0];
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

export function getDaysUntilDue(record: DashboardCaseRecord, now: Date): number | null {
  const dueDate = getNearestDueDate(record, now);
  return dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS) : null;
}

export function isCaseClosed(record: Pick<DashboardCaseRecord, "currentStatus" | "redNumber">) {
  return isClosedCaseStatus(record.currentStatus) || hasRedCaseNumber(record.redNumber);
}

function statusGroup(record: DashboardCaseRecord) {
  if (isCaseClosed(record)) return "เสร็จสิ้น/มีเลขแดง";
  const status = record.currentStatus.trim().replace(/\s+/g, " ");
  if (!status) return "ยังไม่ระบุสถานะ";
  if (status.includes("ประชุม")) return "รอ/อยู่ระหว่างประชุม";
  if (status.includes("ร่าง") || status.includes("วินิจฉัย")) return "จัดทำคำวินิจฉัย";
  return "อยู่ระหว่างดำเนินการ";
}

function monthSeries(now: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
      count: 0,
    };
  });
}

function filterCases(records: DashboardCaseRecord[], filters: DashboardFilters, now: Date) {
  const range = getDashboardDateRange(filters.period, now);
  const type = filters.type === "all" ? null : VALID_TYPES[filters.type];
  return records.filter((record) => {
    if (type && record.type !== type) return false;
    if (!range) return true;
    return Boolean(record.receivedDate && record.receivedDate >= range.gte && record.receivedDate <= range.lte);
  });
}

export function deriveDashboardSnapshot(
  payload: DashboardSourcePayload,
  filters: DashboardFilters,
  permissions: DashboardPermissions,
  now = new Date(),
): DashboardSnapshot {
  const records = filterCases(payload.cases, filters, now);
  const active = records.filter((record) => !isCaseClosed(record));
  const enriched = active.map((record) => ({ record, days: getDaysUntilDue(record, now), due: getNearestDueDate(record, now) }));
  const trend = monthSeries(now);
  const trendMap = new Map(trend.map((item) => [item.key, item]));

  for (const record of records) {
    if (!record.receivedDate) continue;
    const key = `${record.receivedDate.getFullYear()}-${String(record.receivedDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = trendMap.get(key);
    if (bucket) bucket.count += 1;
  }

  const statusCounts = new Map<string, number>();
  records.forEach((record) => statusCounts.set(statusGroup(record), (statusCounts.get(statusGroup(record)) ?? 0) + 1));
  const statusDistribution = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({ label, count, tone: (index === 0 ? "teal" : index === 1 ? "blue" : "slate") as "teal" | "blue" | "slate" }));

  const officerMap = new Map<string, { active: number; overdue: number; dueSoon: number }>();
  for (const { record, days } of enriched) {
    const name = record.legalOfficer?.name || record.legalOfficerName || "ยังไม่มอบหมาย";
    const value = officerMap.get(name) ?? { active: 0, overdue: 0, dueSoon: 0 };
    value.active += 1;
    if (days !== null && days < 0) value.overdue += 1;
    if (days !== null && days >= 0 && days <= 7) value.dueSoon += 1;
    officerMap.set(name, value);
  }
  const workload = [...officerMap.entries()]
    .sort((a, b) => b[1].active - a[1].active)
    .slice(0, 10)
    .map(([name, value], index) => ({
      name: permissions.canViewCaseDetails || name === "ยังไม่มอบหมาย" ? name : `นิติกร ${index + 1}`,
      ...value,
    }));

  const closedWithoutRedNumber = records.filter((record) => isClosedCaseStatus(record.currentStatus) && !hasRedCaseNumber(record.redNumber)).length;
  const redNumberWithOpenStatus = records.filter((record) => hasRedCaseNumber(record.redNumber) && !isClosedCaseStatus(record.currentStatus)).length;
  const criticalDataQuality = records.filter((record) =>
    (isClosedCaseStatus(record.currentStatus) && !hasRedCaseNumber(record.redNumber)) ||
    (hasRedCaseNumber(record.redNumber) && !isClosedCaseStatus(record.currentStatus)),
  ).length;

  const dataFreshness = records.reduce<Date | null>((latest, record) =>
    !latest || record.updatedAt > latest ? record.updatedAt : latest, null);

  return {
    generatedAt: now.toISOString(),
    dataFreshness: dataFreshness?.toISOString() ?? null,
    totalCases: records.length,
    kpis: {
      active: active.length,
      overdue: enriched.filter(({ days }) => days !== null && days < 0).length,
      dueWithin7Days: enriched.filter(({ days }) => days !== null && days >= 0 && days <= 7).length,
      unassigned: active.filter((record) => !record.legalOfficerId && !record.legalOfficerName && !record.legalOfficer?.name).length,
      criticalDataQuality,
    },
    trend,
    statusDistribution,
    deadlineRisk: [
      { label: "เกินกำหนด", count: enriched.filter(({ days }) => days !== null && days < 0).length, tone: "red" },
      { label: "ภายใน 7 วัน", count: enriched.filter(({ days }) => days !== null && days >= 0 && days <= 7).length, tone: "amber" },
      { label: "8–30 วัน", count: enriched.filter(({ days }) => days !== null && days > 7 && days <= 30).length, tone: "teal" },
      { label: "มากกว่า 30 วัน", count: enriched.filter(({ days }) => days !== null && days > 30).length, tone: "slate" },
      { label: "ไม่มีวันครบกำหนด", count: enriched.filter(({ days }) => days === null).length, tone: "slate" },
    ],
    workload,
    urgentCases: enriched
      .filter(({ days }) => days !== null && days <= 7)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
      .slice(0, 12)
      .map(({ record, days, due }) => ({
        id: record.id,
        blackNumber: record.blackNumber,
        type: record.type,
        subject: permissions.canViewCaseDetails ? record.subject : "ข้อมูลคดีจำกัดตามสิทธิ์",
        status: record.currentStatus || "ยังไม่ระบุ",
        legalOfficer: permissions.canViewCaseDetails
          ? record.legalOfficer?.name || record.legalOfficerName || "ยังไม่มอบหมาย"
          : record.legalOfficerId || record.legalOfficerName ? "มอบหมายแล้ว" : "ยังไม่มอบหมาย",
        dueDate: due!.toISOString(),
        daysUntilDue: days!,
      })),
    dataQuality: {
      missingReceivedDate: records.filter((record) => !record.receivedDate).length,
      unknownType: records.filter((record) => !Object.values(VALID_TYPES).includes(record.type)).length,
      closedWithoutRedNumber,
      redNumberWithOpenStatus,
      noDueDate: enriched.filter(({ due }) => !due).length,
    },
    activities: payload.activities.slice(0, 8).map((activity) => ({
      id: activity.id,
      blackNumber: activity.blackNumber,
      type: activity.type,
      action: activity.action,
      actor: permissions.canViewCaseDetails ? activity.actor : "ผู้ใช้งานภายใน",
      timestamp: activity.timestamp.toISOString(),
    })),
    meetings: payload.meetings.slice(0, 6).map((meeting) => ({
      ...meeting,
      meetingDate: meeting.meetingDate.toISOString(),
    })),
  };
}
