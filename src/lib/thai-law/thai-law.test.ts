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
  assert.equal(toArabicNum('มาตรา ๑๐๕'), 'มาตรา 105');
  assert.equal(toArabicNum('ข้อ ๓'), 'ข้อ 3');
  assert.equal(toThaiNum('มาตรา 105'), 'มาตรา ๑๐๕');
  assert.equal(toThaiNum('ข้อ 3'), 'ข้อ ๓');
});

test('Thai police law catalog loads acts and categories properly', () => {
  const acts = getLawActs();
  assert.ok(acts.length >= 30, `Expected at least 30 acts, got ${acts.length}`);
  
  // Verify core acts exist
  const policeAct = acts.find(a => a.id === 'police-act-2547');
  assert.ok(policeAct, 'Police Act 2547 must be present');
  assert.equal(policeAct?.category, 'วินัย อุทธรณ์ ร้องทุกข์');

  const criminalCode = acts.find(a => a.id === 'criminal-code-2499');
  assert.ok(criminalCode, 'Criminal Code must be present');

  const categories = getLawCategories();
  assert.equal(categories[0].name, 'ทั้งหมด');
  assert.ok(categories[0].count >= 2000, `Expected >= 2000 sections, got ${categories[0].count}`);
});

test('Search finds exact section numbers with top priority (Section 105 & 157)', () => {
  // 1. Search for Section 105 (Police Act - Appeals)
  const res105 = searchPoliceLaws({ q: '105', category: 'วินัย อุทธรณ์ ร้องทุกข์' });
  assert.ok(res105.items.length > 0, 'Must find results for 105');
  const top105 = res105.items[0];
  assert.equal(top105.actId, 'police-act-2547');
  assert.equal(top105.sectionNumArabic, '105');
  assert.ok(top105.content.includes('อุทธรณ์'));

  // 2. Search for Section 157 (Criminal Code)
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

  // Act filter
  const resAct = searchPoliceLaws({ actId: 'ktr-appeal-2547' });
  assert.ok(resAct.items.length > 0);
  for (const item of resAct.items) {
    assert.equal(item.actId, 'ktr-appeal-2547');
  }
});

test('getSectionById returns full text and sequential navigation', () => {
  const detail = getSectionById('police-act-2547-sec-105');
  assert.ok(detail.section, 'Section 105 must be found');
  assert.equal(detail.section?.actId, 'police-act-2547');
  assert.ok(detail.act, 'Act metadata must be resolved');
  assert.equal(detail.act?.title, detail.section?.actTitle);
  
  // Previous section in same act
  if (detail.prevSection) {
    assert.equal(detail.prevSection.actId, 'police-act-2547');
  }
  // Next section in same act
  if (detail.nextSection) {
    assert.equal(detail.nextSection.actId, 'police-act-2547');
  }
});
