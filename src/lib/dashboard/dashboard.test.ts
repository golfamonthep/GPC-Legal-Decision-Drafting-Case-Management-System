import assert from "node:assert/strict";
import test from "node:test";
import { getRegistryCaseStatus, getRegistryRedText, hasRedCaseNumber, hasRegistryCompletionText, isClosedCaseStatus, isClosedOrRedCase } from "../caseStatus";
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
    registryRedText: null,
    petitionerName: 'ผู้ร้องตัวอย่าง',
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

test("officer completion uses all assigned cases, shares workload ranks and keeps unassigned separate", () => {
  const cases = [
    ...Array.from({ length: 12 }, (_, index) => record({ id: `b-${index}`, legalOfficerName: "นิติกร ข", registryRedText: index < 3 ? "จำหน่าย" : null })),
    ...Array.from({ length: 10 }, (_, index) => record({ id: `a-${index}`, legalOfficerName: " นิติกร ก ", legalOfficer: { name: "ชื่อเก่า" }, registryRedText: index < 7 ? "ถอน" : null })),
    ...Array.from({ length: 10 }, (_, index) => record({ id: `c-${index}`, legalOfficerName: "นิติกร ค", currentStatus: "COMPLETED", registryRedText: "แดงแล้ว" })),
    record({ id: "fallback", legalOfficerName: " ", legalOfficer: { name: "นิติกร ง" }, redNumber: "12/68", registryRedText: "12/68" }),
    record({ id: "blank", legalOfficerName: null, legalOfficer: null }),
    record({ id: "appeal", type: "อุทธรณ์", legalOfficerName: "นิติกร ก", registryRedText: "ถอน" }),
  ];
  const snapshot = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: "all", type: "complaint" }, permissions, now);
  assert.deepEqual(snapshot.officerPerformance.map(item => item.rank), [1, 2, 2, 4, null]);
  assert.deepEqual(snapshot.officerPerformance.find(item => item.name === "นิติกร ก"), {
    name: "นิติกร ก", total: 10, completed: 7, pending: 3, completionPercent: 70, rank: 2, unassigned: false,
  });
  assert.equal(snapshot.officerPerformance.find(item => item.name === "นิติกร ค")?.completionPercent, 100);
  assert.equal(snapshot.officerPerformance.find(item => item.name === "นิติกร ง")?.completed, 1);
  assert.equal(snapshot.officerPerformance.some(item => item.name === "ชื่อเก่า"), false);
  assert.equal(snapshot.officerPerformance.reduce((sum, item) => sum + item.total, 0), snapshot.totalCases);
  assert.equal(snapshot.officerPerformance.reduce((sum, item) => sum + item.pending, 0), snapshot.kpis.active);
  for (const item of snapshot.officerPerformance) assert.equal(item.completed + item.pending, item.total);
  const restricted = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: false, canViewDataQuality: false }, now);
  assert.equal(restricted.officerPerformance.length, 1);
  assert.equal(restricted.officerPerformance[0].rank, null);
  assert.doesNotMatch(JSON.stringify(restricted.officerPerformance), /นิติกร ก|นิติกร ข|ชื่อเก่า/);
  assert.deepEqual(deriveDashboardSnapshot({ cases: [], activities: [], meetings: [] }, { period: "all", type: "all" }, permissions, now).officerPerformance, []);
});

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
  const snapshot = deriveDashboardSnapshot({ cases: [record({ proceedingNote: "ข้อความส่วนตัว", legalOfficerName: "ชื่อส่วนตัว", subject: "เรื่องส่วนตัว", petitionerName: 'ผู้ร้องส่วนตัว' })], activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: false, canViewDataQuality: false }, now);
  const json = JSON.stringify(snapshot.backlog);
  assert.equal(/ข้อความส่วนตัว|ชื่อส่วนตัว|เรื่องส่วนตัว|ผู้ร้องส่วนตัว/.test(json), false);
  assert.equal(snapshot.backlog.byProceeding[0].count, 1);
});

test('backlog exposes the petitioner as the primary case identity', () => {
  const snapshot = deriveDashboardSnapshot({ cases: [record({ petitionerName: 'ผู้ร้องตัวอย่าง', subject: 'เรื่องทดสอบ' })], activities: [], meetings: [] }, { period: 'all', type: 'all' }, permissions, now);
  assert.equal(snapshot.backlog.cases[0].petitionerName, 'ผู้ร้องตัวอย่าง');
});

test('joint responsibility exceeds unique cases while backlog and completion remain case counts', () => {
  const cases = [
    record({ id: '1', legalOfficerName: 'พ.ต.ท.กิตติ ศรีวัฒน์ + ร.ต.อ.นภา ธรรมดี' }),
    record({ id: '2', legalOfficerName: 'ร.ต.อ. กิตตื ศรีวัฒน์', registryRedText: 'แดงแล้ว' }),
  ];
  const snapshot = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: 'all', type: 'all' }, permissions, now);
  assert.equal(snapshot.totalCases, 2);
  assert.equal(snapshot.kpis.active, 1);
  assert.equal(snapshot.officerPerformance.find(item => item.name === 'กิตติ ศรีวัฒน์')?.total, 2);
  assert.equal(snapshot.officerPerformance.find(item => item.name === 'นภา ธรรมดี')?.pending, 1);
  assert.equal(snapshot.backlog.byOfficer.reduce((sum, item) => sum + item.count, 0), 2);
});

test('placeholder officer text falls back to a linked full name', () => {
  const snapshot = deriveDashboardSnapshot({ cases: [record({ legalOfficerName: '-', legalOfficer: { name: 'กิตติ ศรีวัฒน์' } })], activities: [], meetings: [] }, { period: 'all', type: 'all' }, permissions, now);
  assert.equal(snapshot.officerPerformance[0].name, 'กิตติ ศรีวัฒน์');
  assert.equal(snapshot.kpis.unassigned, 0);
});

test('completion by black-number year uses current red-cell state, not a guessed finish date', () => {
  const cases = [
    record({ id: '1', blackNumber: '1/68' }),
    record({ id: '2', blackNumber: '2/68', registryRedText: 'แดงแล้ว' }),
    record({ id: '3', blackNumber: '3/69', registryRedText: '17/69' }),
  ];
  const snapshot = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: 'all', type: 'all' }, permissions, now);
  assert.deepEqual(snapshot.backlog.byYearCompletion, [
    { label: 'พ.ศ. 2568', pending: 1, completed: 1 },
    { label: 'พ.ศ. 2569', pending: 0, completed: 1 },
  ]);
});

test("literal registry red text closes a case without inventing a unique red number", () => {
  for (const value of ["ถอน", "จำหน่ายแล้ว", "แดงแล้ว\n(รอเลขแดง)", "๑/๒๕๖๙", "ข้อความอื่น", "-", "ยังไม่ทราบเลข"]) {
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

test("blank raw red cells stay pending regardless of closed status or a stale extracted number", () => {
  const cases = [null, undefined, "", " \n\t "].map((registryRedText, index) => record({
    id: `blank-${index}`, registryRedText, redNumber: "123/68", currentStatus: "COMPLETED",
  }));
  for (const item of cases) {
    assert.equal(isClosedOrRedCase(item), false);
    assert.equal(getRegistryRedText(item), "");
    assert.equal(getRegistryCaseStatus(item), "อยู่ระหว่างดำเนินการ");
    assert.equal(evaluateDataQuality(item).hasInconsistentStatus, true);
    assert.equal(detectCaseDataQualityIssues(item).some(issue => issue.fieldName === "registryRedText"), true);
  }
  const snapshot = deriveDashboardSnapshot({ cases, activities: [], meetings: [] }, { period: "all", type: "all" }, permissions, now);
  assert.equal(snapshot.kpis.active, 4);
  assert.equal(snapshot.officerPerformance[0].completed, 0);
  assert.equal(snapshot.officerPerformance[0].completionPercent, 0);
  assert.equal(snapshot.backlog.cases.length, 4);
  assert.equal(isClosedOrRedCase({ currentStatus: "เสร็จสิ้น" }), false);
  assert.equal(isClosedOrRedCase({ redCaseNo: "แดงแล้ว" }), true);
  assert.equal(getRegistryCaseStatus({ registryRedText: "ข้อความอื่น", currentStatus: "รับเรื่อง" }), "เสร็จสิ้น");
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
      record({ id: "case-3", blackNumber: "3/69", currentStatus: "กำลังดำเนินการ", redNumber: "3/69", registryRedText: "3/69", receivedDate: null, dueDate30: null, legalOfficerId: null, legalOfficerName: null }),
      record({ id: "case-4", blackNumber: "4/69", type: "อุทธรณ์", dueDate30: new Date("2026-08-01T00:00:00.000Z") }),
    ],
    activities: [],
    meetings: [],
  }, { period: "all", type: "complaint" }, permissions, now);

  assert.equal(snapshot.totalCases, 3);
  assert.equal(snapshot.kpis.active, 2);
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
