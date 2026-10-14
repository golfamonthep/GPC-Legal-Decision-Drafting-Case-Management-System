import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterCasesByRegistryCompletion, groupCasesByRegistry } from "./caseList";
import { CaseRegistryBlocks } from "../components/CaseRegistryBlocks";
import type { Case } from "../types";
import { CaseTable } from "../components/CaseTable";
import { TopHeader } from "../components/TopHeader";
import * as caseList from "./caseList";

function fixture(id: string, type: Case["type"]): Case {
  return {
    id, type, blackNumber: `${id}/68`, subject: `เรื่องทดสอบ ${id}`, petitionerName: "ผู้ร้องสาธิต",
    respondentName: "คู่กรณีสาธิต", legalCategory: "", legalOfficer: "นิติกรสาธิต",
    ownerCommissioner: "-", receivedDate: "-", currentStatus: "รับเรื่อง",
    dueDates: { days30: "-", days60: "-", days90: "-", days120: "-", days240: "-" },
  };
}

test("registry partition retains all records, original order and duplicate black numbers across types", () => {
  const cases = [{ id: "a", type: "ร้องทุกข์", blackNumber: "1/68" }, { id: "b", type: "อุทธรณ์", blackNumber: "1/68" },
    { id: "c", type: "ร้องทุกข์" }, { id: "d", type: "ประเภทไม่ทราบ" }];
  const groups = groupCasesByRegistry(cases);
  assert.deepEqual(groups.complaint.map(item => item.id), ["a", "c"]);
  assert.deepEqual(groups.appeal.map(item => item.id), ["b"]);
  assert.deepEqual(groups.unknown.map(item => item.id), ["d"]);
  assert.equal(groups.complaint.length + groups.appeal.length + groups.unknown.length, cases.length);
  assert.equal(cases.length, 4);
});

test("both blocks, jump links, named tables and case detail links are rendered separately", () => {
  const html = renderToStaticMarkup(createElement(CaseRegistryBlocks, { cases: [fixture("c1", "ร้องทุกข์"), fixture("a1", "อุทธรณ์")] }));
  assert.match(html, /href="#complaint-cases"/);
  assert.match(html, /href="#appeal-cases"/);
  assert.match(html, /<caption class="sr-only">รายการคดีร้องทุกข์/);
  assert.match(html, /<caption class="sr-only">รายการคดีอุทธรณ์/);
  const split = html.indexOf('<section id="appeal-cases"');
  assert.ok(split > 0);
  assert.match(html.slice(0, split), /href="\/cases\/c1"/);
  assert.doesNotMatch(html.slice(0, split), /href="\/cases\/a1"/);
  assert.match(html.slice(split), /href="\/cases\/a1"/);
  assert.doesNotMatch(html.slice(split), /href="\/cases\/c1"/);
});

test("empty or type-filtered lists retain explicit empty counterpart without an empty table", () => {
  const empty = renderToStaticMarkup(createElement(CaseRegistryBlocks, { cases: [] }));
  assert.match(empty, /ไม่พบเรื่องร้องทุกข์ตามตัวกรอง/);
  assert.match(empty, /ไม่พบเรื่องอุทธรณ์ตามตัวกรอง/);
  assert.doesNotMatch(empty, /<table/);
  const filtered = renderToStaticMarkup(createElement(CaseRegistryBlocks, { cases: [fixture("a1", "อุทธรณ์")] }));
  assert.match(filtered, /ไม่พบเรื่องร้องทุกข์ตามตัวกรอง/);
  assert.equal((filtered.match(/<table /g) ?? []).length, 1);
});

test("completion and red-cell filters use the same raw cell rule without mutating records", () => {
  const cases = [
    { id: "literal", registryRedText: "แดงแล้ว", redNumber: null, currentStatus: "รับเรื่อง" },
    { id: "number", registryRedText: "123/68", redNumber: "123/68", currentStatus: "เสร็จสิ้น" },
    { id: "blank", registryRedText: null, redNumber: "999/68", currentStatus: "เสร็จสิ้น" },
    { id: "spaces", registryRedText: " \n ", currentStatus: "COMPLETED" },
  ];
  const original = JSON.stringify(cases);
  for (const [completion, redCell, expected] of [
    ["completed", undefined, ["literal", "number"]],
    ["open", undefined, ["blank", "spaces"]],
    [undefined, "hasRed", ["literal", "number"]],
    [undefined, "noRed", ["blank", "spaces"]],
    ["completed", "noRed", []],
  ] as const) {
    assert.deepEqual(filterCasesByRegistryCompletion(cases, completion, redCell).map(item => item.id), expected);
  }
  assert.equal(JSON.stringify(cases), original);
});

test("case rows display literal red text as completed and do not display stale extracted red numbers", () => {
  const completed = renderToStaticMarkup(createElement(CaseRegistryBlocks, { cases: [
    { ...fixture("text", "ร้องทุกข์"), registryRedText: "แดงแล้ว (รอเลขแดง)", currentStatus: "รับเรื่อง" },
  ] }));
  assert.match(completed, /แดงแล้ว \(รอเลขแดง\)/);
  assert.match(completed, /เสร็จสิ้น/);
  const pending = renderToStaticMarkup(createElement(CaseRegistryBlocks, { cases: [
    { ...fixture("blank", "อุทธรณ์"), registryRedText: null, redNumber: "99999/68", currentStatus: "เสร็จสิ้น" },
  ] }));
  assert.doesNotMatch(pending, /99999\/68/);
  assert.doesNotMatch(pending, />เสร็จสิ้น</);
  assert.match(pending, /อยู่ระหว่างดำเนินการ/);
});

test("petitioner is the emphasized identity and deadline flags cannot color or label a row", () => {
  const html = renderToStaticMarkup(createElement(CaseTable, { cases: [{ ...fixture("identity", "อุทธรณ์"),
    petitionerName: "ผู้อุทธรณ์ทดสอบ", legalOfficer: "นิติกรทดสอบ", isOverdue: true, daysUntilDue: -999,
  }] }));
  assert.match(html, /<strong[^>]*>ผู้อุทธรณ์ทดสอบ<\/strong>/);
  assert.doesNotMatch(html, /<strong[^>]*>นิติกรทดสอบ<\/strong>/);
  assert.doesNotMatch(html, /เกินกำหนด|กำหนดเวลา|เหลือ .*วัน|bg-red-50\/50|รับเรื่อง:/);
});

test("long proceedings are explicitly expandable instead of requiring wide rows", () => {
  const note = "การดำเนินการที่ต้องตรวจอ่านทั้งหมด ".repeat(25);
  const html = renderToStaticMarkup(createElement(CaseTable, { cases: [{ ...fixture("long", "ร้องทุกข์"), proceedingNote: note }] }));
  assert.match(html, /<details/);
  assert.match(html, /<summary[^>]*>[\s\S]*อ่านการดำเนินการทั้งหมด/);
  assert.ok(html.includes(note));
  assert.doesNotMatch(html, /min-w-\[1320px\]/);
});

test("global header offers an accessible navigation toggle and a real case search without deadline alert", () => {
  const html = renderToStaticMarkup(createElement(TopHeader, { user: null }));
  assert.match(html, /aria-label="เปิดเมนูหลัก"/);
  assert.match(html, /action="\/cases"/);
  assert.match(html, /name="q"/);
  assert.doesNotMatch(html, /ใกล้ครบกำหนด/);
});

test("query search covers the petitioner and proceedings, and registry-year filtering keeps carry-over cases", () => {
  const functions = caseList as unknown as { caseTextSearch?: (term: string) => object; filterCasesByBlackYear?: <T extends { blackNumber: string }>(items: T[], year: string) => T[] };
  assert.equal(typeof functions.caseTextSearch, 'function', 'case text search must exist');
  assert.deepEqual(functions.caseTextSearch!(' รอคำชี้แจง '), { OR: ['blackNumber','registryRedText','petitionerName','respondentName','subject','proceedingNote'].map(field => ({ [field]: { contains: 'รอคำชี้แจง', mode: 'insensitive' } })) });
  assert.equal(typeof functions.filterCasesByBlackYear, 'function');
  assert.deepEqual(functions.filterCasesByBlackYear!([{ blackNumber: '1/68' }, { blackNumber: '2/2568' }, { blackNumber: '3/69' }], '2568').map(row => row.blackNumber), ['1/68','2/2568']);
});

test('advanced search completion filters use raw red cells before counts or pagination', () => {
  const functions = caseList as unknown as { filterCaseWorkflowRecords?: <T>(items: T[], status?: string, preset?: string) => T[] };
  assert.equal(typeof functions.filterCaseWorkflowRecords, 'function');
  const rows = [{ id: 'literal', registryRedText: 'แดงแล้ว', currentStatus: 'รับเรื่อง' }, { id: 'pending', registryRedText: ' ', currentStatus: 'เสร็จสิ้น' }];
  assert.deepEqual(functions.filterCaseWorkflowRecords!(rows, '', 'unfinished').map(row => row.id), ['pending']);
  assert.deepEqual(functions.filterCaseWorkflowRecords!(rows, 'เสร็จสิ้น').map(row => row.id), ['literal']);
  assert.deepEqual(functions.filterCaseWorkflowRecords!(rows, 'อยู่ระหว่างดำเนินการ').map(row => row.id), ['pending']);
});
