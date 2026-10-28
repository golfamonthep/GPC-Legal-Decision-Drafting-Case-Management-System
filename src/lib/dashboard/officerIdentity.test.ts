import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOfficerDirectory, CANONICAL_OFFICERS, CANONICAL_OFFICER_RANKS } from './officerIdentity';

test('groups rank, whitespace and one-character spelling changes by full name', () => {
  const directory = buildOfficerDirectory([
    'พ.ต.ท.กิตติ ศรีวัฒน์', 'ร.ต.อ. กิตติ\nศรีวัฒน์',
    'กิตตื ศรีวัฒน์', 'กิตติ ศรีวัฒน', 'กิตติ ศรีธรรม',
  ]);
  assert.deepEqual(directory.current('ร.ต.อ. กิตตื ศรีวัฒน์'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('กิตติ ศรีธรรม'), ['กิตติ ศรีธรรม']);
});

test('groups the explicitly confirmed officer name variants to canonical names', () => {
  const directory = buildOfficerDirectory([
    'ชญาณทิพย์ บัวดิษฐ์เดชา',
    'ชญาณ์พิมพ์ บัวดิษฐ์เดชา',
    'ปราโมทย์ พุ่มบรรเทา',
    'ปราโมท พุ่มบรรเทา',
    'พิจักษ์กร โปตระนันท์',
    'สุรพัฒน์ วัลลา',
    'สลิตา ธีระวัฒน์',
    'ธีรงษ์ มั่นประสาทธิ์',
  ]);
  assert.deepEqual(directory.current('ชญาณทิพย์ บัวดิษฐ์เดชา'), ['ชญาณ์พิมพ์ บัวดิษฐ์เดชา']);
  assert.deepEqual(directory.current('ชญาณ์พิมพ์ บัวดิษฐ์เดชา'), ['ชญาณ์พิมพ์ บัวดิษฐ์เดชา']);
  assert.deepEqual(directory.current('ปราโมทย์ พุ่มบรรเทา'), ['ปราโมทย์ พุ่มบรรเทา']);
  assert.deepEqual(directory.current('ปราโมท พุ่มบรรเทา'), ['ปราโมทย์ พุ่มบรรเทา']);
  assert.deepEqual(directory.current('พ.ต.ท. พิจักษ์กร โปตระนันท์'), ['พิจักษณ์กร โปตระนันทน์']);
  assert.deepEqual(directory.current('พ.ต.ต. สุรพัฒน์ วัลลา'), ['สุรพัตร์ วัลลา']);
  assert.deepEqual(directory.current('พ.ต.ต.หญิง สลิตา ธีระวัฒน์'), ['สลิลดา ธีระวัฒน์']);
  assert.deepEqual(directory.current('พ.ต.ต. ธีรงษ์ มั่นประสาทธิ์'), ['ธีรพงษ์ มั่นประสิทธิ์']);
});

test('primary returns the first responsible officer when multiple officers are listed', () => {
  const directory = buildOfficerDirectory([]);
  assert.equal(directory.primary('พ.ต.ท.พิจักษณ์กร โปตระนันทน์ + ร.ต.อ.กรรพี วีระเดช'), 'พิจักษณ์กร โปตระนันทน์');
  assert.equal(directory.primary(''), null);
});

test('canonical officers dataset contains verified officers with highest ranks', () => {
  assert.equal(CANONICAL_OFFICERS.length, 18);
  assert.equal(CANONICAL_OFFICER_RANKS.get('พิจักษณ์กร โปตระนันทน์'), 'พ.ต.ท.');
  assert.equal(CANONICAL_OFFICER_RANKS.get('ชญาณ์พิมพ์ บัวดิษฐ์เดชา'), 'พ.ต.ต.หญิง');
  assert.equal(CANONICAL_OFFICER_RANKS.get('สุรพัตร์ วัลลา'), 'พ.ต.ท.');
});

test('retains titled and three-part names while matching by given name and surname', () => {
  const directory = buildOfficerDirectory(['กิตติ ศรีวัฒน์', 'กิตติ ธนา ศรีวัฒน์']);
  assert.deepEqual(directory.current('นาย กิตติ ศรีวัฒน์'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('กิตติ ธนา ศรีวัฒน์'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ นภา ธรรมดี'), []);
});

test('counts joint owners once each, excludes prior owners and helpers', () => {
  const directory = buildOfficerDirectory([]);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ\nศรีวัฒน์ + ร.ต.อ.นภา ธรรมดี'), ['กิตติ ศรีวัฒน์', 'นภา ธรรมดี']);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์ (เก่า)\nร.ต.อ.นภา ธรรมดี (ใหม่)'), ['นภา ธรรมดี']);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์ (ร.ต.อ.นภา ผู้ช่วย)'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์ + ร.ต.อ. กิตติ ศรีวัฒน์'), ['กิตติ ศรีวัฒน์']);
});

test('does not invent an identity for an incomplete successor', () => {
  const directory = buildOfficerDirectory([]);
  assert.deepEqual(directory.current('ร.ต.อ.กิตติ ศรีวัฒน์ (นภารับช่วงต่อ)'), []);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ (เก่า)\nนภา ธรรมดี รับช่วงต่อ'), ['นภา ธรรมดี']);
  assert.deepEqual(directory.current('นภา ธรรมดี รับช่วงต่อ'), ['นภา ธรรมดี']);
  assert.deepEqual(directory.current('ร.ต.อ.นภา'), []);
});

test('ignores unparenthesized helpers and never appends an incomplete line to a complete name', () => {
  const directory = buildOfficerDirectory([]);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์\nร.ต.อ.นภา ผู้ช่วย'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์ ผู้ช่วย ร.ต.อ.นภา ธรรมดี'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ ผู้ช่วย นภา ธรรมดี'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('พ.ต.ท.กิตติ ศรีวัฒน์\nนภา'), ['กิตติ ศรีวัฒน์']);
});

test('handles rankless handovers and comma-separated joint owners without composite identities', () => {
  const directory = buildOfficerDirectory([]);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ (เก่า)\nนภา ธรรมดี (ใหม่)'), ['นภา ธรรมดี']);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ (เก่า)\nนภา\nธรรมดี (ใหม่)'), ['นภา ธรรมดี']);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์, นภา ธรรมดี'), ['กิตติ ศรีวัฒน์', 'นภา ธรรมดี']);
  assert.deepEqual(directory.current('กิตติ ศรีวัฒน์ นภา ธรรมดี'), []);
});
