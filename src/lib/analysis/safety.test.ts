import test from 'node:test';
import assert from 'node:assert/strict';
import {assertOwner,assertAssignment,cleanInput,invalidateDocument,validateCitations,boundedAppend,assertSameOrigin,invalidateSource} from './safety.mjs';
import {analyze,validateProposal,normalizeName,normalizeSearchText} from './engine.mjs';
import {CIRCULAR_2456_CHUNKS,SUB_GENERAL_TO_INSPECTOR_ACCOUNTS,evaluateCircular2456Rules} from './subGeneralToInspectorData.mjs';

test('workspaces are owner scoped even when identifiers are known',()=>{assert.throws(()=>assertOwner({ownerKey:'a'},{id:'b',role:'LEGAL_OFFICER'}));assert.doesNotThrow(()=>assertOwner({ownerKey:'a'},{id:'a',role:'REGISTRY_OFFICER'}));});
test('registry role cannot attach and assignments are rechecked',()=>{const c={legalOfficerId:'a',legalOfficerName:null};assert.throws(()=>assertAssignment(c,{id:'a',role:'REGISTRY_OFFICER'}));assert.doesNotThrow(()=>assertAssignment(c,{id:'a',role:'LEGAL_OFFICER'}));assert.throws(()=>assertAssignment(c,{id:'b',role:'LEGAL_OFFICER'}));});
test('changing subject invalidates seniority and quota',()=>{const data=cleanInput({subject_name:'ข'}, {title:'งาน',subject_name:'ก',references:[{kind:'seniority',id:'1'},{kind:'law',id:'2'}],manual_seniority:{},vacancies:{}});assert.equal(data.manual_seniority,null);assert.equal(data.vacancies,null);assert.equal(data.references.length,1);});
test('document edits invalidate direct facts AND vacancy-source-derived facts',()=>{const j={data:{references:[{id:'v',document_id:'d',reviewed:true}],facts:[{status:'established',citations:['v']},{status:'established',citations:['doc-d']}],vacancies:{vacancy_reference:'v',rule_reference:'law'}}};invalidateDocument(j,'d');assert.ok(j.data.facts.every(f=>f.status==='unresolved'));assert.equal(j.data.references[0].reviewed,false);assert.equal(j.data.vacancies,null);});
test('precedent cannot establish facts of this job',()=>assert.throws(()=>validateCitations(['p'],{data:{references:[{id:'p',reviewed:true,role:'reference_only'}]},documents:[]})));
test('history limit rejects new entries instead of deleting old ones',()=>{const rows=Array(200).fill({});assert.throws(()=>boundedAppend(rows,{}));assert.equal(rows.length,200);});
test('no evidence means gaps and no inferred quota',()=>{const result=analyze({version:1,data:{references:[],facts:[],subject_name:'บุคคล',bundle_fingerprint:'x'}},[],{seniority:[],summary:{fingerprint:'x'}});assert.equal(result.quota,null);assert.equal(result.status,'NEEDS_REVIEW');assert.ok(result.gaps.length>=2);});
test('AI citation IDs must be from approved sources',()=>assert.throws(()=>validateProposal({text:'เหตุผล [foreign]',citations:['foreign']},[{id:'local'}])));
test('normalization matches rank-prefixed Thai names from General down to Sub-Inspector',()=>{
  assert.equal(normalizeName('พ.ต.อ. สมชาย ใจดี'),normalizeName('สมชายใจดี'));
  assert.equal(normalizeName('ว่าที่ พ.ต.ท.หญิง สมศรี รักงาน'),normalizeName('สมศรี รักงาน'));
  assert.equal(normalizeName('พ.ต.ต. รักพงศ์ เก่งงาน'),normalizeName('รักพงศ์ เก่งงาน'));
  assert.equal(normalizeName('ร.ต.อ.หญิง ธัญสิริ โฆษิตอนันต์'),normalizeName('ธัญสิริ โฆษิตอนันต์'));
  assert.equal(normalizeName('ว่าที่ ร.ต.ท. พิชญรัช ระวังวงศ์'),normalizeName('พิชญรัช ระวังวงศ์'));
});
test('Thai statutory numeral normalization matches Thai and Arabic digits',()=>assert.equal(normalizeSearchText('มาตรา ๘๗ วรรค ๒'),normalizeSearchText('มาตรา 87 วรรค 2')));
test('CSRF checks browser Origin against Host, not Next internal localhost URL',()=>{assert.doesNotThrow(()=>assertSameOrigin('http://127.0.0.1:3102','127.0.0.1:3102',false));assert.doesNotThrow(()=>assertSameOrigin('https://gpc.example','gpc.example',true));assert.throws(()=>assertSameOrigin('https://evil.example','gpc.example',true));assert.throws(()=>assertSameOrigin('http://gpc.example','gpc.example',true));assert.throws(()=>assertSameOrigin(null,'gpc.example',true));});
test('reapproving changed source invalidates downstream facts',()=>{const j={data:{facts:[{status:'established',citations:['law']}],vacancies:{rule_reference:'law'}}};invalidateSource(j,'law');assert.equal(j.data.facts[0].status,'unresolved');assert.equal(j.data.vacancies,null);});
test('Circular 2456 dataset and sub-general-to-inspector analysis rules cover all 13 clauses and annexes A-G',()=>{
  assert.equal(CIRCULAR_2456_CHUNKS.length, 21);
  assert.ok(SUB_GENERAL_TO_INSPECTOR_ACCOUNTS.length >= 96);
  const evalResult = evaluateCircular2456Rules({
    title: 'ร้องทุกข์การแต่งตั้งระดับ ผกก. หัวหน้าสถานีตำรวจ วาระประจำปี 2569',
    level: 'ผกก. (สับเปลี่ยนหมุนเวียนระดับเท่าเดิม)',
    account: 'สืบสวนสอบสวน (ตำแหน่งควบปรับระดับเพิ่มลดได้ในตัวเอง)',
    appointment_motion: 'station_chief_transfer',
    unit_type: 'non_opb_bch',
    annex_status: 'unsuitable_annex_c_d',
  });
  assert.equal(evalResult.is_sub_general, true);
  assert.equal(evalResult.tier, 'sub_general_to_inspector');
  assert.ok(evalResult.checks.some(c => c.id === 'circular-2456-clause-08'));
  assert.ok(evalResult.checks.some(c => c.id === 'circular-2456-clause-11'));
  assert.ok(evalResult.checks.some(c => c.id === 'circular-2456-clause-04-10'));
  assert.ok(evalResult.checks.some(c => c.id === 'circular-2456-annex-c-d'));
});
