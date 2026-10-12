import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompletionRing, RankedBars, YearColumns } from "../../components/dashboard/BacklogCharts";

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
