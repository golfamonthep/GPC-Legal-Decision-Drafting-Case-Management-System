import {
  getFiscalYearEnd,
  getFiscalYearStart,
  getThisMonthEnd,
  getThisMonthStart,
  getThisQuarterEnd,
  getThisQuarterStart,
} from "@/lib/date/fiscalYear";
import { hasRedCaseNumber, hasRegistryCompletionText, isClosedCaseStatus } from "@/lib/caseStatus";
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

export function isCaseClosed(record: Pick<DashboardCaseRecord, "currentStatus" | "redNumber" | "registryRedText">) {
  return hasRegistryCompletionText(record.registryRedText) || isClosedCaseStatus(record.currentStatus) || hasRedCaseNumber(record.redNumber);
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

/** Registry year, never inferred from received/updated dates. */
export function getBlackNumberYear(blackNumber: string): string {
  const normalized = blackNumber.replace(/[๐-๙]/g, (digit) => String(digit.charCodeAt(0) - 0x0e50)).trim();
  const match = normalized.match(/\/\s*(\d{2}|25\d{2})\s*$/);
  if (!match) return "ไม่ระบุปีในเลขดำ";
  const year = match[1].length === 2 ? 2500 + Number(match[1]) : Number(match[1]);
  return `พ.ศ. ${year}`;
}

function countBacklogGroups(values: string[], sortByYear = false) {
  const groups = new Map<string, number>();
  for (const value of values) groups.set(value, (groups.get(value) ?? 0) + 1);
  return [...groups].map(([label, count]) => ({ label, count })).sort((a, b) =>
    sortByYear
      ? (a.label === "ไม่ระบุปีในเลขดำ" ? 1 : b.label === "ไม่ระบุปีในเลขดำ" ? -1 : a.label.localeCompare(b.label, "th"))
      : b.count - a.count || a.label.localeCompare(b.label, "th"));
}

export function deriveDashboardSnapshot(
  payload: DashboardSourcePayload,
  filters: DashboardFilters,
  permissions: DashboardPermissions,
  now = new Date(),
): DashboardSnapshot {
  const records = filterCases(payload.cases, filters, now);
  const active = records.filter((record) => !isCaseClosed(record));
  // Snapshot of current registry responsibility, not historic assignment or productivity.
  const performanceMap = new Map<string, { total: number; completed: number; pending: number; unassigned: boolean }>();
  for (const record of records) {
    const officer = record.legalOfficerName?.trim() || record.legalOfficer?.name?.trim();
    const name = permissions.canViewCaseDetails ? officer || "ยังไม่ระบุนิติกร" : "จำกัดตามสิทธิ์";
    const value = performanceMap.get(name) ?? { total: 0, completed: 0, pending: 0, unassigned: !officer };
    value.total += 1;
    if (isCaseClosed(record)) value.completed += 1;
    else value.pending += 1;
    // Restricted DTO is one aggregate, never exposes officer-level ranks/counts.
    if (!permissions.canViewCaseDetails) value.unassigned = false;
    performanceMap.set(name, value);
  }
  let previousTotal = -1;
  let previousRank = 0;
  const officerPerformance = [...performanceMap].map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => Number(a.unassigned) - Number(b.unassigned) || b.total - a.total || a.name.localeCompare(b.name, "th"))
    .map((value, index) => {
      const rank = value.unassigned || !permissions.canViewCaseDetails ? null
        : value.total === previousTotal ? previousRank : index + 1;
      if (rank !== null) { previousTotal = value.total; previousRank = rank; }
      return { ...value, rank, completionPercent: value.completed / value.total * 100 };
    });
  const backlogCases = active.map((record) => ({
    id: record.id,
    blackNumber: record.blackNumber,
    year: getBlackNumberYear(record.blackNumber),
    officer: permissions.canViewCaseDetails
      ? record.legalOfficerName?.trim() || record.legalOfficer?.name?.trim() || "ยังไม่ระบุนิติกร"
      : "จำกัดตามสิทธิ์",
    proceeding: permissions.canViewCaseDetails
      ? record.proceedingNote?.trim() || "ยังไม่บันทึกการดำเนินการ"
      : "จำกัดตามสิทธิ์",
    subject: permissions.canViewCaseDetails ? record.subject : "ข้อมูลจำกัดตามสิทธิ์",
  })).sort((a, b) => a.year.localeCompare(b.year, "th") || a.blackNumber.localeCompare(b.blackNumber, "th", { numeric: true }));
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

  const closedWithoutRedNumber = records.filter((record) => isClosedCaseStatus(record.currentStatus) && !hasRedCaseNumber(record.redNumber) && !hasRegistryCompletionText(record.registryRedText)).length;
  const redNumberWithOpenStatus = records.filter((record) => (hasRedCaseNumber(record.redNumber) || hasRegistryCompletionText(record.registryRedText)) && !isClosedCaseStatus(record.currentStatus)).length;
  const criticalDataQuality = records.filter((record) =>
    (isClosedCaseStatus(record.currentStatus) && !hasRedCaseNumber(record.redNumber) && !hasRegistryCompletionText(record.registryRedText)) ||
    ((hasRedCaseNumber(record.redNumber) || hasRegistryCompletionText(record.registryRedText)) && !isClosedCaseStatus(record.currentStatus)),
  ).length;

  const dataFreshness = records.reduce<Date | null>((latest, record) =>
    !latest || record.updatedAt > latest ? record.updatedAt : latest, null);

  return {
    generatedAt: now.toISOString(),
    dataFreshness: dataFreshness?.toISOString() ?? null,
    totalCases: records.length,
    officerPerformance,
    backlog: {
      byYear: countBacklogGroups(backlogCases.map((record) => record.year), true),
      byOfficer: countBacklogGroups(backlogCases.map((record) => record.officer)),
      byProceeding: countBacklogGroups(backlogCases.map((record) => record.proceeding)),
      cases: backlogCases,
    },
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
