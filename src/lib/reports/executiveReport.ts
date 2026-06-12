import prisma from "@/lib/db";
import { isClosedOrRedCase } from "@/lib/caseStatus";
import {
  getFiscalYearStart,
  getFiscalYearEnd,
  getThisMonthStart,
  getThisMonthEnd,
  getThisQuarterStart,
  getThisQuarterEnd,
} from "@/lib/date/fiscalYear";

export type ReportFilterType = "all" | "this_month" | "this_quarter" | "this_fiscal_year" | "custom";

export interface ReportFilter {
  type: ReportFilterType;
  startDate?: Date;
  endDate?: Date;
}

export async function getExecutiveReportData(filter: ReportFilter) {
  let dateFilter = {};
  const now = new Date();

  if (filter.type === "this_month") {
    dateFilter = { gte: getThisMonthStart(now), lte: getThisMonthEnd(now) };
  } else if (filter.type === "this_quarter") {
    dateFilter = { gte: getThisQuarterStart(now), lte: getThisQuarterEnd(now) };
  } else if (filter.type === "this_fiscal_year") {
    dateFilter = { gte: getFiscalYearStart(now), lte: getFiscalYearEnd(now) };
  } else if (filter.type === "custom" && filter.startDate && filter.endDate) {
    dateFilter = { gte: filter.startDate, lte: filter.endDate };
  }

  const whereClause: any = {};
  if (Object.keys(dateFilter).length > 0) {
    whereClause.createdAt = dateFilter;
  }

  // Fetch all cases in the period for memory aggregation. 
  // We do memory aggregation because overdue logic relies on `isClosedOrRedCase` which is in JS.
  const cases = await prisma.case.findMany({
    where: whereClause,
    include: {
      owner: { select: { name: true } },
      legalOfficer: { select: { name: true } },
    },
  });

  const totalCases = cases.length;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;
  let dueSoon = 0;
  let redNumbered = 0;
  let unassignedLegalOfficer = 0;
  let noStatus = 0;

  const caseTypes: Record<string, number> = { ร้องทุกข์: 0, อุทธรณ์: 0, "อื่น ๆ / ไม่ระบุ": 0 };
  const statuses: Record<string, number> = {};
  const deadlineRisks = { overdue: 0, d30: 0, d60: 0, d90: 0, d120: 0, d240: 0 };
  
  const workloadByLegalOfficer: Record<string, { total: number, inProgress: number, overdue: number, completed: number, noRedNumber: number }> = {};
  const workloadByOwner: Record<string, { total: number, inProgress: number, overdue: number, completed: number }> = {};
  const completionTrends: Record<string, { received: number, completed: number, redNumbered: number }> = {};
  
  const dataQuality = {
    noBlackNumber: 0,
    noRedNumber: 0,
    noPetitioner: 0,
    noRespondent: 0,
    noLegalOfficer: 0,
    noReceivedDate: 0,
    nonStandardStatus: 0,
    redNumberButNotCompleted: 0,
    completedButNoRedNumber: 0,
  };

  const currentDate = new Date();

  cases.forEach((c: any) => {
    // Basic KPIs
    const isClosed = isClosedOrRedCase(c);
    if (isClosed) {
      completed++;
    } else {
      inProgress++;
    }

    if (c.redNumber && c.redNumber.trim() !== "" && c.redNumber !== "-") {
      redNumbered++;
    }

    if (!c.legalOfficerId && !c.legalOfficerName) {
      unassignedLegalOfficer++;
      dataQuality.noLegalOfficer++;
    }

    if (!c.currentStatus || c.currentStatus.trim() === "") {
      noStatus++;
      dataQuality.nonStandardStatus++;
    }

    // Type Breakdown
    const type = c.type === "ร้องทุกข์" || c.type === "อุทธรณ์" ? c.type : "อื่น ๆ / ไม่ระบุ";
    caseTypes[type]++;

    // Status Breakdown
    const statusStr = c.currentStatus || "ไม่ระบุ";
    statuses[statusStr] = (statuses[statusStr] || 0) + 1;

    // Deadline Risk
    let isCaseOverdue = false;
    if (!isClosed) {
      let minDueDays: number | null = null;
      const dueDates = [c.dueDate30, c.dueDate60, c.dueDate90, c.dueDate120, c.dueDate240];
      for (const d of dueDates) {
        if (d) {
          const diffTime = d.getTime() - currentDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (minDueDays === null || diffDays < minDueDays) {
            minDueDays = diffDays;
          }
        }
      }

      if (minDueDays !== null) {
        if (minDueDays < 0) {
          overdue++;
          deadlineRisks.overdue++;
          isCaseOverdue = true;
        } else if (minDueDays <= 30) {
          dueSoon++;
          deadlineRisks.d30++;
        } else if (minDueDays <= 60) {
          deadlineRisks.d60++;
        } else if (minDueDays <= 90) {
          deadlineRisks.d90++;
        } else if (minDueDays <= 120) {
          deadlineRisks.d120++;
        } else if (minDueDays <= 240) {
          deadlineRisks.d240++;
        }
      }
    }

    // Workload by Legal Officer
    const loName = c.legalOfficer?.name || c.legalOfficerName || "ไม่ระบุ";
    if (!workloadByLegalOfficer[loName]) {
      workloadByLegalOfficer[loName] = { total: 0, inProgress: 0, overdue: 0, completed: 0, noRedNumber: 0 };
    }
    workloadByLegalOfficer[loName].total++;
    if (isClosed) workloadByLegalOfficer[loName].completed++;
    else workloadByLegalOfficer[loName].inProgress++;
    if (isCaseOverdue) workloadByLegalOfficer[loName].overdue++;
    if (!c.redNumber || c.redNumber === "-") workloadByLegalOfficer[loName].noRedNumber++;

    // Workload by Owner
    const ownerName = c.owner?.name || "ไม่ระบุ";
    if (!workloadByOwner[ownerName]) {
      workloadByOwner[ownerName] = { total: 0, inProgress: 0, overdue: 0, completed: 0 };
    }
    workloadByOwner[ownerName].total++;
    if (isClosed) workloadByOwner[ownerName].completed++;
    else workloadByOwner[ownerName].inProgress++;
    if (isCaseOverdue) workloadByOwner[ownerName].overdue++;

    // Completion Trends (Monthly by Created At/Received Date)
    const trendDate = c.receivedDate || c.createdAt;
    const monthKey = `${trendDate.getFullYear()}-${String(trendDate.getMonth() + 1).padStart(2, "0")}`;
    if (!completionTrends[monthKey]) {
      completionTrends[monthKey] = { received: 0, completed: 0, redNumbered: 0 };
    }
    completionTrends[monthKey].received++;
    if (isClosed) completionTrends[monthKey].completed++;
    if (c.redNumber && c.redNumber !== "-") completionTrends[monthKey].redNumbered++;

    // Data Quality
    if (!c.blackNumber || c.blackNumber === "-") dataQuality.noBlackNumber++;
    if (!c.redNumber || c.redNumber === "-") dataQuality.noRedNumber++;
    if (!c.petitionerName || c.petitionerName === "-") dataQuality.noPetitioner++;
    if (!c.respondentName || c.respondentName === "-") dataQuality.noRespondent++;
    if (!c.receivedDate) dataQuality.noReceivedDate++;
    
    if (c.redNumber && c.redNumber !== "-" && !isClosed) dataQuality.redNumberButNotCompleted++;
    if (isClosed && (!c.redNumber || c.redNumber === "-")) dataQuality.completedButNoRedNumber++;
  });

  // AI Usage
  const aiQueryCount = await prisma.aiQueryLog.count({ where: Object.keys(dateFilter).length ? { timestamp: dateFilter } : {} });
  const draftAiLogs = await prisma.draftSectionAiLog.count({ where: Object.keys(dateFilter).length ? { timestamp: dateFilter } : {} });

  // Audit Logs for DOCX exports & Security Signals
  const audits = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
    where: Object.keys(dateFilter).length ? { timestamp: dateFilter } : {}
  });

  const auditMap = Object.fromEntries(audits.map((a: any) => [a.action, a._count]));
  const docxExports = auditMap['CASE_DOCX_EXPORTED'] || 0;
  const permissionDenied = auditMap['PERMISSION_DENIED'] || 0;
  const failedLogins = auditMap['LOGIN_FAILED'] || 0;

  const usersCount = await prisma.user.groupBy({
    by: ['status'],
    _count: true
  });
  let disabledOrPendingUsers = 0;
  usersCount.forEach((u: any) => {
    if (u.status === 'PENDING' || u.status === 'DISABLED') disabledOrPendingUsers += u._count;
  });

  return {
    overview: {
      totalCases,
      inProgress,
      completed,
      overdue,
      dueSoon,
      redNumbered,
      unassignedLegalOfficer,
      noStatus,
    },
    caseTypes,
    statuses,
    deadlineRisks,
    workloadByLegalOfficer,
    workloadByOwner,
    completionTrends,
    dataQuality,
    aiUsage: {
      totalQueries: aiQueryCount,
      draftGenerations: draftAiLogs,
    },
    docxExport: {
      total: docxExports,
    },
    securitySignals: {
      permissionDenied,
      failedLogins,
      disabledOrPendingUsers,
    }
  };
}
