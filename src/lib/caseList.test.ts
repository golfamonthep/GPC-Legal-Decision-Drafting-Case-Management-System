import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterCasesByRegistryCompletion, groupCasesByRegistry } from "./caseList";
import { CaseRegistryBlocks } from "../components/CaseRegistryBlocks";
import type { Case } from "../types";

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
