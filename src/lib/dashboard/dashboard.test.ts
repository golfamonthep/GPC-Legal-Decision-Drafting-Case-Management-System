import assert from "node:assert/strict";
import test from "node:test";
import { hasRedCaseNumber, hasRegistryCompletionText, isClosedCaseStatus } from "../caseStatus";
import { deriveDashboardSnapshot, getBlackNumberYear, getDashboardDateRange, getDaysUntilDue, getNearestDueDate, parseDashboardFilters } from "./metrics";
import { loadDashboardFromSource } from "./loader";
import { detectCaseDataQualityIssues } from "../dataQuality/caseDataQuality";
import { evaluateDataQuality } from "../search/dataQuality";
import type { DashboardCaseRecord, DashboardDataSource } from "./types";

const now = new Date("2026-08-03T05:00:00.000Z");

function record(overrides: Partial<DashboardCaseRecord> = {}): DashboardCaseRecord {
  return {
    id: "case-1",
    type: "ร้องทุกข์",
    blackNumber: "1/69",
    redNumber: null,
    subject: "เรื่องทดสอบ",
    currentStatus: "ตรวจสอบข้อเท็จจริง",
    receivedDate: new Date("2026-08-01T00:00:00.000Z"),
    dueDate30: new Date("2026-08-08T05:00:00.000Z"),
    dueDate60: null,
    dueDate90: null,
    dueDate120: null,
    dueDate240: null,
    legalOfficerId: "officer-1",
    legalOfficerName: "นิติกร ก",
    legalOfficer: null,
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    ...overrides,
  };
}

const permissions = { canViewCaseDetails: true, canViewDataQuality: true };

test("registry year comes only from the black-number suffix", () => {
  assert.equal(getBlackNumberYear("123/68"), "พ.ศ. 2568");
  assert.equal(getBlackNumberYear("เรื่องดำที่ ๑๒๓ / ๒๕๖๗"), "พ.ศ. 2567");
  assert.equal(getBlackNumberYear("123/๖๙"), "พ.ศ. 2569");
  for (const value of ["123", "123/2026", "123/68/extra", "123/8"]) {
    assert.equal(getBlackNumberYear(value), "ไม่ระบุปีในเลขดำ");
  }
});

test("backlog breakdowns reconcile, retain every officer and use proceedingNote rather than status", () => {
  const cases = Array.from({ length: 12 }, (_, index) => record({
    id: String(index), blackNumber: `${index + 1}/${index % 2 ? "68" : "67"}`,
    legalOfficerName: `นิติกรทดสอบ ${index}`,
    proceedingNote: index % 2 ? "รอคำชี้แจง" : "จัดทำร่าง",
    receivedDate: null,
  }));
  cases.push(record({ id: "blank", blackNumber: "ไม่มีปี", legalOfficerName: " ", legalOfficer: null, proceedingNote: null }));
  cases.push(record({ id: "closed", registryRedText: "ถอน", proceedingNote: "ห้ามนับ", currentStatus: "ยังดำเนินการ" }));
  const snapshot = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: "all", type: "all" }, permissions, now);
  assert.equal(snapshot.kpis.active, 13);
  for (const dimension of [snapshot.backlog.byYear, snapshot.backlog.byOfficer, snapshot.backlog.byProceeding]) {
    assert.equal(dimension.reduce((sum, item) => sum + item.count, 0), 13);
  }
  assert.equal(snapshot.backlog.byOfficer.length, 13);
  assert.equal(snapshot.backlog.byProceeding.find(item => item.label === "รอคำชี้แจง")?.count, 6);
  assert.equal(snapshot.backlog.byProceeding.some(item => item.label === "ตรวจสอบข้อเท็จจริง" || item.label === "ห้ามนับ"), false);
  assert.equal(snapshot.backlog.cases.length, 13);
  assert.equal(snapshot.backlog.byYear.find(item => item.label === "ไม่ระบุปีในเลขดำ")?.count, 1);
});

test("restricted dashboard DTO does not expose proceedings, subjects or officer names", () => {
  const snapshot = deriveDashboardSnapshot({ cases: [record({ proceedingNote: "ข้อความส่วนตัว", legalOfficerName: "ชื่อส่วนตัว", subject: "เรื่องส่วนตัว" })], activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: false, canViewDataQuality: false }, now);
  const json = JSON.stringify(snapshot.backlog);
  assert.equal(/ข้อความส่วนตัว|ชื่อส่วนตัว|เรื่องส่วนตัว/.test(json), false);
  assert.equal(snapshot.backlog.byProceeding[0].count, 1);
});

test("literal registry red text closes a case without inventing a unique red number", () => {
  for (const value of ["ถอน", "จำหน่ายแล้ว", "แดงแล้ว\n(รอเลขแดง)", "๑/๒๕๖๙"]) {
    assert.equal(hasRegistryCompletionText(value), true);
    const snapshot = deriveDashboardSnapshot({ cases: [record({ registryRedText: value, currentStatus: "เสร็จสิ้น" })], activities: [], meetings: [] }, { period: "all", type: "all" }, permissions, now);
    assert.equal(snapshot.kpis.active, 0);
    assert.equal(snapshot.kpis.overdue, 0);
    assert.equal(snapshot.kpis.criticalDataQuality, 0);
    const sourceCase = record({ registryRedText: value, currentStatus: "เสร็จสิ้น" });
    assert.equal(detectCaseDataQualityIssues(sourceCase).some(issue => issue.severity === "CRITICAL"), false);
    assert.equal(evaluateDataQuality(sourceCase).hasInconsistentStatus, false);
  }
  assert.equal(hasRegistryCompletionText(" \n "), false);
});

test("normalizes Thai and English closed statuses and red numbers", () => {
  assert.equal(isClosedCaseStatus("  เสร็จสิ้น (ศาลปกครอง) "), true);
  assert.equal(isClosedCaseStatus("COMPLETED"), true);
  assert.equal(isClosedCaseStatus("อยู่ระหว่างดำเนินการ"), false);
  assert.equal(hasRedCaseNumber("163/68"), true);
  assert.equal(hasRedCaseNumber("ยังไม่ได้เลขแดง"), false);
});

test("uses the nearest upcoming deadline, then the latest expired milestone", () => {
  const upcoming = record({
    dueDate30: new Date("2026-07-01T00:00:00.000Z"),
    dueDate60: new Date("2026-08-10T00:00:00.000Z"),
    dueDate90: new Date("2026-09-01T00:00:00.000Z"),
  });
  assert.equal(getNearestDueDate(upcoming, now)?.toISOString(), "2026-08-10T00:00:00.000Z");
  assert.equal(getDaysUntilDue(upcoming, now), 7);

  const expired = record({
    dueDate30: new Date("2026-06-01T00:00:00.000Z"),
    dueDate60: new Date("2026-08-01T00:00:00.000Z"),
  });
  assert.equal(getNearestDueDate(expired, now)?.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(getDaysUntilDue(expired, now), -2);
});

test("parses filters and calculates Thai fiscal-year boundaries", () => {
  assert.deepEqual(parseDashboardFilters({ period: "bad", type: "bad" }), { period: "all", type: "all" });
  const range = getDashboardDateRange("fiscal-year", now)!;
  assert.equal(range.gte.getFullYear(), 2025);
  assert.equal(range.gte.getMonth(), 9);
  assert.equal(range.lte.getFullYear(), 2026);
  assert.equal(range.lte.getMonth(), 8);
});

test("builds consistent KPI, filters, data-quality and DTO output", () => {
  const snapshot = deriveDashboardSnapshot({
    cases: [
      record(),
      record({ id: "case-2", blackNumber: "2/69", currentStatus: "เสร็จสิ้น", redNumber: null, dueDate30: null }),
      record({ id: "case-3", blackNumber: "3/69", currentStatus: "กำลังดำเนินการ", redNumber: "3/69", receivedDate: null, dueDate30: null, legalOfficerId: null, legalOfficerName: null }),
      record({ id: "case-4", blackNumber: "4/69", type: "อุทธรณ์", dueDate30: new Date("2026-08-01T00:00:00.000Z") }),
    ],
    activities: [],
    meetings: [],
  }, { period: "all", type: "complaint" }, permissions, now);

  assert.equal(snapshot.totalCases, 3);
  assert.equal(snapshot.kpis.active, 1);
  assert.equal(snapshot.kpis.dueWithin7Days, 1);
  assert.equal(snapshot.kpis.criticalDataQuality, 2);
  assert.equal(snapshot.dataQuality.missingReceivedDate, 1);
  assert.equal(snapshot.urgentCases[0].dueDate, "2026-08-08T05:00:00.000Z");
});

test("reports ready, empty, partial and unavailable without fake zero KPIs", async () => {
  const source = (kind: DashboardDataSource["kind"], load: DashboardDataSource["load"]): DashboardDataSource => ({ kind, load });
  const ready = await loadDashboardFromSource(source("database", async () => ({ cases: [record()], activities: [], meetings: [] })), { period: "all", type: "all" }, permissions, now);
  assert.equal(ready.byType?.complaint.totalCases, 1);
  assert.equal(ready.byType?.appeal.totalCases, 0);
  assert.equal(ready.byType!.complaint.totalCases + ready.byType!.appeal.totalCases, ready.snapshot!.totalCases);
  assert.equal(ready.state, "ready");

  const empty = await loadDashboardFromSource(source("database", async () => ({ cases: [], activities: [], meetings: [] })), { period: "all", type: "all" }, permissions, now);
  assert.equal(empty.state, "empty");

  const partial = await loadDashboardFromSource(source("database", async () => ({ cases: [record()], activities: [], meetings: [], partialReasons: ["การประชุม"] })), { period: "all", type: "all" }, permissions, now);
  assert.equal(partial.state, "partial");
  assert.ok(partial.snapshot);

  const missingTable = await loadDashboardFromSource(source("database", async () => { throw Object.assign(new Error("relation does not exist"), { code: "P2021" }); }), { period: "all", type: "all" }, permissions, now);
  assert.equal(missingTable.state, "partial");
  assert.equal(missingTable.snapshot, null);

  const unavailable = await loadDashboardFromSource(source("database", async () => { throw Object.assign(new Error("timeout"), { code: "P1001" }); }), { period: "all", type: "all" }, permissions, now);
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.snapshot, null);
});
