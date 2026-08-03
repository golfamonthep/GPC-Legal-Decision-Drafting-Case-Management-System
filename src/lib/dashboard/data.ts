import "server-only";

import prisma from "@/lib/db";
import { DemoDashboardDataSource } from "./demo";
import { getDashboardDateRange } from "./metrics";
import { loadDashboardFromSource } from "./loader";
import type {
  DashboardDataSource,
  DashboardFilters,
  DashboardPermissions,
  DashboardSourcePayload,
} from "./types";

class DatabaseDashboardDataSource implements DashboardDataSource {
  readonly kind = "database" as const;

  async load(filters: DashboardFilters): Promise<DashboardSourcePayload> {
    const now = new Date();
    const range = getDashboardDateRange(filters.period, now);
    const type = filters.type === "complaint" ? "ร้องทุกข์" : filters.type === "appeal" ? "อุทธรณ์" : undefined;
    const where = {
      ...(type ? { type } : {}),
      ...(range ? { receivedDate: range } : {}),
    };

    const queries = await Promise.allSettled([
      prisma.case.findMany({
        where,
        select: {
          id: true,
          type: true,
          blackNumber: true,
          redNumber: true,
          subject: true,
          currentStatus: true,
          receivedDate: true,
          dueDate30: true,
          dueDate60: true,
          dueDate90: true,
          dueDate120: true,
          dueDate240: true,
          legalOfficerId: true,
          legalOfficerName: true,
          legalOfficer: { select: { name: true } },
          updatedAt: true,
        },
      }),
      prisma.caseEvent.findMany({
        orderBy: { timestamp: "desc" },
        take: 8,
        select: {
          id: true,
          action: true,
          actorName: true,
          timestamp: true,
          case: { select: { blackNumber: true, type: true } },
        },
      }),
      prisma.meeting.findMany({
        where: { meetingDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }, status: { not: "CANCELLED" } },
        orderBy: { meetingDate: "asc" },
        take: 6,
        select: {
          id: true,
          title: true,
          meetingNo: true,
          meetingDate: true,
          status: true,
          _count: { select: { agendaItems: true } },
        },
      }),
    ]);

    if (queries[0].status === "rejected") throw queries[0].reason;
    const partialReasons: string[] = [];
    if (queries[1].status === "rejected") partialReasons.push("กิจกรรมล่าสุด");
    if (queries[2].status === "rejected") partialReasons.push("การประชุม");

    const events = queries[1].status === "fulfilled" ? queries[1].value : [];
    const meetings = queries[2].status === "fulfilled" ? queries[2].value : [];
    return {
      cases: queries[0].value,
      activities: events.map((event) => ({
        id: event.id,
        blackNumber: event.case.blackNumber,
        type: event.case.type,
        action: event.action,
        actor: event.actorName,
        timestamp: event.timestamp,
      })),
      meetings: meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        meetingNo: meeting.meetingNo,
        meetingDate: meeting.meetingDate,
        status: meeting.status,
        caseCount: meeting._count.agendaItems,
      })),
      partialReasons,
    };
  }
}

export function isDemoDashboardModeAllowed(environment = process.env) {
  return environment.DASHBOARD_DATA_MODE === "demo" &&
    (environment.NODE_ENV !== "production" || environment.VERCEL_ENV === "preview");
}

export async function getUnifiedDashboardData(
  filters: DashboardFilters,
  permissions: DashboardPermissions,
) {
  const source: DashboardDataSource = isDemoDashboardModeAllowed()
    ? new DemoDashboardDataSource()
    : new DatabaseDashboardDataSource();

  const result = await loadDashboardFromSource(source, filters, permissions);
  if (result.state === "unavailable" || (result.state === "partial" && !result.snapshot)) {
    console.error("Dashboard data source is not ready", { state: result.state, source: result.source });
  }
  return result;
}
