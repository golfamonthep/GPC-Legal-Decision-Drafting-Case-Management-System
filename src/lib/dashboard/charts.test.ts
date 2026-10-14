import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompletionRing, RankedBars, YearColumns, YearOutcomeBars } from "../../components/dashboard/BacklogCharts";
import { OfficerPerformance } from "../../components/dashboard/OfficerPerformance";
import { RegistryOverview } from "../../components/dashboard/RegistryOverview";
import { deriveDashboardSnapshot } from "./metrics";
import { createDemoDashboardPayload } from "./demo";

test("removing the proceedings chart does not remove original case detail text", () => {
  const snapshot = deriveDashboardSnapshot(createDemoDashboardPayload(new Date("2026-10-12T00:00:00Z")), { period: "all", type: "complaint" }, { canViewCaseDetails: true, canViewDataQuality: true });
  const html = renderToStaticMarkup(createElement(RegistryOverview, { title: "เรื่องร้องทุกข์", snapshot, accent: "teal", canViewDetails: true, yearMax: 6, officerMax: 4, responsibilityMax: 4 }));
  assert.doesNotMatch(html, /การดำเนินการของเรื่องค้าง/);
  assert.match(html, /นำเสนอที่ประชุม/);
  assert.match(html, /อยู่ระหว่างจัดทำร่างคำวินิจฉัย/);
  assert.match(html, /href="\/cases\/demo-case-/);
  assert.match(html, /ความรับผิดชอบและความสำเร็จรายนิติกร/);
});

test("registry overview is visible first and officer performance is the final closed disclosure", () => {
  const snapshot = deriveDashboardSnapshot({ cases: [], activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: true, canViewDataQuality: true });
  for (const accent of ["teal", "blue"] as const) {
    const title = accent === "teal" ? "เรื่องร้องทุกข์" : "เรื่องอุทธรณ์";
    const html = renderToStaticMarkup(createElement(RegistryOverview, { title, snapshot, accent, canViewDetails: true, yearMax: 2, officerMax: 1, responsibilityMax: 1 }));
    assert.match(html, /^<section /);
    assert.equal((html.match(/<details[ >]/g) ?? []).length, 2);
    assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|\s|>)/);
    const order = ["สัดส่วนของทะเบียนทั้งหมด", "สถานะเรื่องตามปีเลขดำ", "เรื่องค้างแยกตามนิติกร", "รายละเอียดเรื่องค้าง", "ความรับผิดชอบและความสำเร็จรายนิติกร"];
    order.forEach((label, index) => {
      assert.ok(html.includes(label));
      if (index) assert.ok(html.indexOf(order[index - 1]) < html.indexOf(label));
    });
    assert.ok(html.indexOf("เรื่องค้างแยกตามนิติกร") < html.indexOf("<details"));
    assert.doesNotMatch(html, /การดำเนินการของเรื่องค้าง/);
    assert.match(html, accent === "teal" ? /id="registry-complaint"/ : /id="registry-appeal"/);
    assert.match(html, /ยังไม่มีข้อมูลความรับผิดชอบ/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
});

test('year outcome bars show measured counts and link to matching case filters', () => {
  const html = renderToStaticMarkup(createElement(YearOutcomeBars, { data: [{ label: 'พ.ศ. 2568', pending: 3, completed: 7 }], scaleMax: 20, type: 'ร้องทุกข์' }));
  assert.match(html, /width:50%/);
  assert.match(html, /width:70%/);
  assert.match(html, /เสร็จแล้ว 7/);
  assert.match(html, /ค้าง 3/);
  assert.match(html, /completionStatus=completed/);
  assert.match(html, /completionStatus=open/);
  assert.match(html, /year=2568/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("registry detail disclosure preserves access restriction", () => {
  const snapshot = deriveDashboardSnapshot({ cases: [], activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: false, canViewDataQuality: false });
  const html = renderToStaticMarkup(createElement(RegistryOverview, { title: "เรื่องร้องทุกข์", snapshot, accent: "teal", canViewDetails: false, yearMax: 2, officerMax: 1, responsibilityMax: 1 }));
  assert.match(html, /บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่อง/);
  assert.doesNotMatch(html, /href="\/cases\//);
});

test("officer chart exposes exact counts and absolute stacked widths without hover", () => {
  const snapshot = deriveDashboardSnapshot({ cases: [], activities: [], meetings: [] }, { period: "all", type: "all" }, { canViewCaseDetails: true, canViewDataQuality: true });
  snapshot.officerPerformance = [
    { name: "นิติกร ก", total: 10, completed: 7, pending: 3, completionPercent: 70, rank: 1, unassigned: false },
    { name: "ยังไม่ระบุนิติกร", total: 2, completed: 0, pending: 2, completionPercent: 0, rank: null, unassigned: true },
  ];
  snapshot.totalCases = 12;
  snapshot.kpis.active = 5;
  const html = renderToStaticMarkup(createElement(OfficerPerformance, { title: "ร้องทุกข์", snapshot, accent: "teal", scaleMax: 20 }));
  assert.match(html, /70%/);
  assert.match(html, /width:35%/);
  assert.match(html, /width:15%/);
  assert.match(html, /รับทั้งหมด/);
  assert.match(html, /เสร็จแล้ว/);
  assert.match(html, /#1/);
  assert.equal((html.match(/<li /g) ?? []).length, 2);
  assert.doesNotMatch(html, /#2|NaN|Infinity/);
  snapshot.officerPerformance = [];
  const empty = renderToStaticMarkup(createElement(OfficerPerformance, { title: "ร้องทุกข์", snapshot, accent: "blue", scaleMax: 0 }));
  assert.match(empty, /ยังไม่มีข้อมูลความรับผิดชอบ/);
});

test("completion ring keeps its denominator explicit and has no fake empty percentage", () => {
  const html = renderToStaticMarkup(createElement(CompletionRing, { total: 20, pending: 5, accent: "teal" }));
  assert.match(html, /75%/);
  assert.match(html, /15 เรื่อง/);
  assert.match(html, /5 เรื่อง/);
  assert.match(html, /20 เรื่อง/);
  const empty = renderToStaticMarkup(createElement(CompletionRing, { total: 0, pending: 0, accent: "blue" }));
  assert.match(empty, /ยังไม่มีข้อมูล/);
  assert.doesNotMatch(empty, /NaN|Infinity|0%/);
});

test("dark completion card preserves labels, denominator and zero/full states", () => {
  for (const [total, pending, expected] of [[20, 5, "75%"], [20, 20, "0%"], [20, 0, "100%"]] as const) {
    const html = renderToStaticMarkup(createElement(CompletionRing, { total, pending, accent: "teal", tone: "dark" }));
    assert.ok(html.includes(expected));
    assert.match(html, /ฐาน: 20 เรื่อง/);
    assert.match(html, /text-white/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
  const empty = renderToStaticMarkup(createElement(CompletionRing, { total: 0, pending: 0, accent: "blue", tone: "dark" }));
  assert.match(empty, /ยังไม่มีข้อมูล/);
  assert.doesNotMatch(empty, /NaN|Infinity|0%/);
});

test("year columns show direct values, unknown years and zero-based shared scale", () => {
  const html = renderToStaticMarkup(createElement(YearColumns, { data: [{ label: "พ.ศ. 2568", count: 4 }, { label: "ไม่ระบุปีในเลขดำ", count: 2 }], scaleMax: 8, accent: "blue" }));
  assert.match(html, /height:50%/);
  assert.match(html, /height:25%/);
  assert.match(html, /2568/);
  assert.match(html, /ไม่ระบุปีในเลขดำ/);
  assert.match(html, />0</);
  const empty = renderToStaticMarkup(createElement(YearColumns, { data: [], scaleMax: 0, accent: "teal" }));
  assert.match(empty, /ไม่มีเรื่องค้างให้แสดงกราฟ/);
  assert.doesNotMatch(empty, /NaN|Infinity/);
});

test("ranked bars retain all labels, percentages and safely escape source text", () => {
  const data = Array.from({ length: 12 }, (_, index) => ({ label: index === 0 ? "รอคำชี้แจง <script>ข้อความเต็ม</script>" : `นิติกร ${index}`, count: 1 }));
  const html = renderToStaticMarkup(createElement(RankedBars, { title: "ทดสอบ", note: "ข้อความเต็ม", data, total: 12, scaleMax: 2, accent: "teal" }));
  assert.equal((html.match(/<li>/g) ?? []).length, 12);
  assert.match(html, /8.3% ของเรื่องค้าง/);
  assert.match(html, /width:50%/);
  assert.match(html, /&lt;script&gt;ข้อความเต็ม&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
