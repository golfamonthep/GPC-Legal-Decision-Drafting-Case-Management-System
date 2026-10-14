import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOfficerDirectory } from './officerIdentity';

test('groups rank, whitespace and one-character spelling changes by full name', () => {
  const directory = buildOfficerDirectory([
    'พ.ต.ท.กิตติ ศรีวัฒน์', 'ร.ต.อ. กิตติ\nศรีวัฒน์',
    'กิตตื ศรีวัฒน์', 'กิตติ ศรีวัฒน', 'กิตติ ศรีธรรม',
  ]);
  assert.deepEqual(directory.current('ร.ต.อ. กิตตื ศรีวัฒน์'), ['กิตติ ศรีวัฒน์']);
  assert.deepEqual(directory.current('กิตติ ศรีธรรม'), ['กิตติ ศรีธรรม']);
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
