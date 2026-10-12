import { deriveDashboardSnapshot } from "./metrics";
import type {
  DashboardDataSource,
  DashboardFilters,
  DashboardPermissions,
  DashboardResult,
} from "./types";

export function isSchemaMismatchError(error: unknown) {
  const value = error as { code?: string; message?: string };
  return value?.code === "P2021" || value?.code === "P2022" || /does not exist/i.test(value?.message ?? "");
}

export async function loadDashboardFromSource(
  source: DashboardDataSource,
  filters: DashboardFilters,
  permissions: DashboardPermissions,
  now = new Date(),
): Promise<DashboardResult> {
  try {
    const payload = await source.load(filters);
    const snapshot = deriveDashboardSnapshot(payload, filters, permissions, now);
    const isPartial = Boolean(payload.partialReasons?.length);
    return {
      state: isPartial ? "partial" : snapshot.totalCases === 0 ? "empty" : "ready",
      source: source.kind,
      snapshot,
      byType: filters.type === "all" ? {
        complaint: deriveDashboardSnapshot(payload, { ...filters, type: "complaint" }, permissions, now),
        appeal: deriveDashboardSnapshot(payload, { ...filters, type: "appeal" }, permissions, now),
      } : undefined,
      partialReasons: payload.partialReasons,
      message: isPartial ? "ข้อมูลบางส่วนยังไม่พร้อมใช้งาน" : undefined,
    };
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      return {
        state: "partial",
        source: source.kind,
        snapshot: null,
        message: "โครงสร้างฐานข้อมูลยังไม่ครบสำหรับ Dashboard",
      };
    }
    return {
      state: "unavailable",
      source: source.kind,
      snapshot: null,
      message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ในขณะนี้",
    };
  }
}
