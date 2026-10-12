import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompletionRing, RankedBars, YearColumns } from "../../components/dashboard/BacklogCharts";
import { OfficerPerformance } from "../../components/dashboard/OfficerPerformance";
import { deriveDashboardSnapshot } from "./metrics";

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
