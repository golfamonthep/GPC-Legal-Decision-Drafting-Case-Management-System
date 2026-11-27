import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { 
  searchPoliceLaws, 
  getSectionById, 
  getLawActs, 
  getLawCategories,
  toArabicNum,
  toThaiNum
} from './search';

test('Thai law numerals conversion works bidirectional', () => {
  assert.equal(toArabicNum('มาตรา ๑๔๑'), 'มาตรา 141');
  assert.equal(toArabicNum('ข้อ ๓'), 'ข้อ 3');
  assert.equal(toThaiNum('มาตรา 141'), 'มาตรา ๑๔๑');
  assert.equal(toThaiNum('ข้อ 3'), 'ข้อ ๓');
});

test('Thai police law catalog loads current 2565 Act and categories properly', () => {
  const acts = getLawActs();
  assert.ok(acts.length >= 30, `Expected at least 30 acts, got ${acts.length}`);
  
  // Verify current 2565 Police Act is present as primary act
  const policeAct2565 = acts.find(a => a.id === 'police-act-2565');
  assert.ok(policeAct2565, 'Police Act 2565 (current) must be present');
  assert.equal(policeAct2565?.category, 'วินัย อุทธรณ์ ร้องทุกข์');
  assert.ok(policeAct2565?.title.includes('2565'), 'Title must specify 2565');

  // Verify 2567 appointment regulation is present
  const ktrApp2567 = acts.find(a => a.id === 'ktr-appointment-2567');
  assert.ok(ktrApp2567, 'Police appointment regulation 2567 must be present');

  const criminalCode = acts.find(a => a.id === 'criminal-code-2499');
  assert.ok(criminalCode, 'Criminal Code must be present');

  const categories = getLawCategories();
  assert.equal(categories[0].name, 'ทั้งหมด');
  assert.ok(categories[0].count >= 2200, `Expected >= 2200 sections, got ${categories[0].count}`);
});

test('Search finds exact section numbers in 2565 Act with top priority (Section 141 & 33 & 157)', () => {
  // 1. Search for Section 141 (Police Act 2565 - Appeal to ก.พ.ค.ตร.)
  const res141 = searchPoliceLaws({ q: '141', category: 'วินัย อุทธรณ์ ร้องทุกข์' });
  assert.ok(res141.items.length > 0, 'Must find results for 141');
  const top141 = res141.items[0];
  assert.equal(top141.actId, 'police-act-2565');
  assert.equal(top141.sectionNumArabic, '141');
  assert.ok(top141.content.includes('อุทธรณ์'));
  assert.ok(top141.content.includes('ก.พ.ค.ตร.'));

  // 2. Search for Section 33 (Police Act 2565 - Establishment of ก.พ.ค.ตร.)
  const res33 = searchPoliceLaws({ q: '33', category: 'วินัย อุทธรณ์ ร้องทุกข์' });
  assert.ok(res33.items.length > 0, 'Must find results for 33');
  const top33 = res33.items[0];
  assert.equal(top33.actId, 'police-act-2565');
  assert.equal(top33.sectionNumArabic, '33');
  assert.ok(top33.content.includes('ก.พ.ค.ตร.'));

  // 3. Search for Section 157 (Criminal Code)
  const res157 = searchPoliceLaws({ q: '157', category: 'กฎหมายอาญาและวิธีพิจารณา' });
  assert.ok(res157.items.length > 0, 'Must find results for 157');
  const top157 = res157.items[0];
  assert.equal(top157.actId, 'criminal-code-2499');
  assert.equal(top157.sectionNumArabic, '157');
  assert.ok(top157.content.includes('ปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยมิชอบ'));
});

test('Search filters correctly by category and act', () => {
  // Category filter
  const resCat = searchPoliceLaws({ category: 'กฎหมายปกครองและการปฏิบัติราชการ' });
  assert.ok(resCat.items.length > 0);
  for (const item of resCat.items) {
    assert.equal(item.category, 'กฎหมายปกครองและการปฏิบัติราชการ');
  }

  // Act filter for 2565 Act
  const resAct = searchPoliceLaws({ actId: 'police-act-2565' });
  assert.ok(resAct.items.length > 0);
  for (const item of resAct.items) {
    assert.equal(item.actId, 'police-act-2565');
  }
});

test('getSectionById returns full text and sequential navigation for 2565 Act', () => {
  const detail = getSectionById('police-act-2565-sec-141');
  assert.ok(detail.section, 'Section 141 of 2565 Act must be found');
  assert.equal(detail.section?.actId, 'police-act-2565');
  assert.ok(detail.act, 'Act metadata must be resolved');
  assert.equal(detail.act?.title, detail.section?.actTitle);
  
  // Previous section in same act
  if (detail.prevSection) {
    assert.equal(detail.prevSection.actId, 'police-act-2565');
  }
  // Next section in same act
  if (detail.nextSection) {
    assert.equal(detail.nextSection.actId, 'police-act-2565');
    assert.equal(detail.nextSection.sectionNumArabic, '142');
  }
});

test('ก.พ.ค.ตร. 2567 appeal and grievance rules are active and 2547 rules are marked repealed', () => {
  const acts = getLawActs();
  
  // 1. Verify 2567 ก.พ.ค.ตร. Appeal rule
  const appealAct2567 = acts.find(a => a.id === 'kpkt-appeal-2567');
  assert.ok(appealAct2567, 'ก.พ.ค.ตร. 2567 Appeal rule must exist');
  assert.ok(appealAct2567?.title.includes('2567 (ฉบับปัจจุบัน)'));
  assert.ok(appealAct2567?.title.includes('ก.พ.ค.ตร.'));

  // 2. Verify 2567 ก.พ.ค.ตร. Grievance rule
  const grievanceAct2567 = acts.find(a => a.id === 'kpkt-grievance-2567');
  assert.ok(grievanceAct2567, 'ก.พ.ค.ตร. 2567 Grievance rule must exist');
  assert.ok(grievanceAct2567?.title.includes('2567 (ฉบับปัจจุบัน)'));

  // 3. Verify old 2547 rules are marked repealed
  const oldAppeal = acts.find(a => a.id === 'ktr-appeal-2547');
  assert.ok(oldAppeal, 'Old 2547 appeal rule must exist for history');
  assert.ok(oldAppeal?.title.includes('ยกเลิกแล้ว'), 'Old appeal rule must be marked repealed');

  const oldPetition = acts.find(a => a.id === 'ktr-petition-2547');
  assert.ok(oldPetition, 'Old 2547 petition rule must exist for history');
  assert.ok(oldPetition?.title.includes('ยกเลิกแล้ว'), 'Old petition rule must be marked repealed');

  // 4. Test searching for ก.พ.ค.ตร. 2567 appeal rule
  const appealSearch = searchPoliceLaws({ q: 'ก.พ.ค.ตร. อุทธรณ์' });
  assert.ok(appealSearch.items.length > 0, 'Must find results for ก.พ.ค.ตร. อุทธรณ์');
  const topAppeal = appealSearch.items.find(i => i.actId === 'kpkt-appeal-2567');
  assert.ok(topAppeal, 'Must retrieve section from kpkt-appeal-2567');

  // 5. Test searching for ก.พ.ค.ตร. 2567 grievance rule
  const grievanceSearch = searchPoliceLaws({ q: 'ก.พ.ค.ตร. ร้องทุกข์' });
  assert.ok(grievanceSearch.items.length > 0, 'Must find results for ก.พ.ค.ตร. ร้องทุกข์');
  const topGrievance = grievanceSearch.items.find(i => i.actId === 'kpkt-grievance-2567');
  assert.ok(topGrievance, 'Must retrieve section from kpkt-grievance-2567');

  // 6. Verify Circular ว 2456 (22 ต.ค. 2569) for รอง ผบก. ลงมาถึง สว.
  const circular2456 = acts.find(a => a.id === 'tr-circular-2456-2569');
  assert.ok(circular2456, 'Circular ว 2456 (2569) must exist in catalog');
  const circularSearch = searchPoliceLaws({ q: 'ว ๒๔๕๖' });
  assert.ok(circularSearch.items.length > 0, 'Must find results for ว ๒๔๕๖');
});

test('Order 515/2569 (24 Nov 2569) is indexed across all 20 clauses + intro and GPC scope filters separate appeal vs grievance', () => {
  const acts = getLawActs();
  const order515 = acts.find(a => a.id === 'tr-order-515-2569');
  assert.ok(order515, 'Order 515/2569 must exist in catalog');
  assert.equal(order515?.gpcScope, 'appeal_discipline');
  assert.equal(order515?.sectionCount, 21);
  assert.equal(order515?.isNew, true);

  // Search by Arabic or Thai order number
  const byArabic = searchPoliceLaws({ q: '515' });
  assert.ok(byArabic.items.some(i => i.actId === 'tr-order-515-2569'));
  const byThai = searchPoliceLaws({ q: '๕๑๕/๒๕๖๙', actId: 'tr-order-515-2569', pageSize: 30 });
  assert.equal(byThai.total, 21);

  // Key clauses exist with exact statutory wording
  const clause1 = getSectionById('order-515-2569-clause-01');
  assert.ok(clause1.section?.content.includes('ไม่ถูกต้อง') && clause1.section?.content.includes('ไม่เหมาะสม'));
  const clause13 = getSectionById('order-515-2569-clause-13');
  assert.ok(clause13.section?.content.includes('มาตรา ๘๗ วรรคสี่'));
  const clause19 = getSectionById('order-515-2569-clause-19');
  assert.ok(clause19.section?.content.includes('๔๓๖/๒๕๔๘'));

  // Scope filter separates discipline appeal vs appointment grievance & hideRepealed hides 2547 rules
  const appealScope = searchPoliceLaws({ scope: 'appeal_discipline', hideRepealed: true, pageSize: 100 });
  assert.ok(appealScope.items.every(i => i.actId !== 'ktr-appeal-2547' && i.actId !== 'ktr-appointment-2567'));
  const grievanceScope = searchPoliceLaws({ scope: 'grievance_appointment', hideRepealed: true, pageSize: 100 });
  assert.ok(grievanceScope.items.every(i => i.actId !== 'tr-order-515-2569' && i.actId !== 'ktr-petition-2547'));
});

test('Legal Data Integrity Guard: 0 duplicate IDs, clean Police Act 2565 (181 secs), official 2567/2569 Royal Gazette texts & repealed flags', () => {
  const acts = getLawActs();
  const allRes = searchPoliceLaws({ hideRepealed: false, pageSize: 5000 });

  // 1. Zero duplicate section IDs across entire catalog
  const idSet = new Set<string>();
  for (const item of allRes.items) {
    assert.ok(!idSet.has(item.id), `Duplicate section ID found: ${item.id}`);
    idSet.add(item.id);
  }

  // 2. Police Act 2565 has exact 181 sections (1..181), 0 broken sara-am, 0 Royal Gazette page-header noise
  const act2565 = searchPoliceLaws({ actId: 'police-act-2565', pageSize: 300 });
  assert.equal(act2565.total, 181, `Expected 181 sections in police-act-2565, got ${act2565.total}`);
  for (let n = 1; n <= 181; n++) {
    const sec = getSectionById(`police-act-2565-sec-${n}`).section;
    assert.ok(sec, `Missing police-act-2565-sec-${n}`);
    assert.equal(sec.sectionNumArabic, String(n));
    assert.ok(!/[\u0e01-\u0e2e\u0e48-\u0e4b]\s+\u0e32/.test(sec.content), `Broken sara-am in sec ${n}`);
    assert.ok(!/หนา\s+[๐-๙0-9]+\s*้/.test(sec.content), `Royal Gazette header noise in sec ${n}`);
  }
  // Key sections sanity check
  assert.ok(getSectionById('police-act-2565-sec-115').section?.content.includes('ภาคทัณฑ์'));
  assert.ok(getSectionById('police-act-2565-sec-138').section?.content.includes('มลทิน'));
  assert.ok(getSectionById('police-act-2565-sec-141').section?.content.includes('อุทธรณ์'));
  assert.ok(getSectionById('police-act-2565-sec-147').section?.content.includes('ร้องทุกข์'));

  // 3. Official Royal Gazette กฎ ก.พ.ค.ตร. อุทธรณ์ ๒๕๖๗ (58 clauses + intro = 59) & ร้องทุกข์ ๒๕๖๗ (70 clauses + intro = 71)
  const kpktAppeal = searchPoliceLaws({ actId: 'kpkt-appeal-2567', pageSize: 100 });
  assert.equal(kpktAppeal.total, 59, `Expected 59 items in kpkt-appeal-2567, got ${kpktAppeal.total}`);
  assert.ok(getSectionById('kpkt-appeal-2567-rule-51').section?.content.includes('เพิ่มโทษ'));

  const kpktGrievance = searchPoliceLaws({ actId: 'kpkt-grievance-2567', pageSize: 100 });
  assert.equal(kpktGrievance.total, 71, `Expected 71 items in kpkt-grievance-2567, got ${kpktGrievance.total}`);
  assert.ok(getSectionById('kpkt-grievance-2567-rule-63').section?.content.includes('เจ็ดวัน'));

  // 4. Official Royal Gazette กฎ ก.ตร. วินัย ๒๕๖๙ (intro + 114 clauses + penalty table = 116)
  const ktrDisc = searchPoliceLaws({ actId: 'ktr-discipline-2569', pageSize: 150 });
  assert.equal(ktrDisc.total, 116, `Expected 116 items in ktr-discipline-2569, got ${ktrDisc.total}`);
  assert.ok(getSectionById('ktr-discipline-2569-rule-2').section?.content.includes('ให้ยกเลิก'));
  assert.ok(getSectionById('ktr-discipline-2569-rule-71').section?.content.includes('ร้องทุกข์'));
  assert.ok(getSectionById('ktr-discipline-2569-rule-75').section?.content.includes('อุทธรณ์'));
  assert.ok(getSectionById('ktr-discipline-2569-penalty-table').section?.content.includes('ตารางอำนาจและอัตราการลงโทษ'));

  // 5. All 8 discipline regulations repealed by กฎ ก.ตร. วินัย ๒๕๖๙ ข้อ ๒ + 2 repealed drug acts are flagged isRepealed
  const mustBeRepealed = [
    'ktr-inquiry-2547',
    'ktr-flagrant-offense-2547',
    'ktr-suspend-leave-2547',
    'ktr-filter-committee-2547',
    'ktr-order-manner-2547',
    'ktr-punish-power-2547',
    'ktr-restore-status-2547',
    'ktr-investigation-fact-2556',
    'narcotics-2522',
    'drug-suppression-2534',
    'ktr-appeal-2547',
    'ktr-petition-2547',
  ];
  for (const id of mustBeRepealed) {
    const act = acts.find(a => a.id === id);
    assert.ok(act, `Expected act ${id} to exist`);
    assert.equal(act?.isRepealed, true, `Act ${id} must be marked isRepealed=true`);
  }

  // 6. ktr-qualifications-2547 is NOT misclassified under grievance_appointment
  const qualAct = acts.find(a => a.id === 'ktr-qualifications-2547');
  assert.notEqual(qualAct?.gpcScope, 'grievance_appointment');

  // 7. All 7 core laws have verified local Royal Gazette / official PDFs staged under public/
  const corePdfActs = [
    'police-act-2565',
    'ktr-discipline-2569',
    'tr-order-515-2569',
    'kpkt-appeal-2567',
    'kpkt-grievance-2567',
    'ktr-appointment-2567',
    'tr-circular-2456-2569',
  ];
  for (const id of corePdfActs) {
    const act = acts.find(a => a.id === id);
    assert.ok(act?.officialPdfUrl, `Core act ${id} must expose officialPdfUrl`);
    const diskPath = path.join(process.cwd(), 'public', act.officialPdfUrl.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Official PDF missing on disk for ${id}: ${diskPath}`);
  }
});
