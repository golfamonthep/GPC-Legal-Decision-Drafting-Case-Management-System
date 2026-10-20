import test from 'node:test';
import assert from 'node:assert/strict';
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
