import test from 'node:test';
import assert from 'node:assert/strict';
import {assertOwner,assertAssignment,cleanInput,invalidateDocument,validateCitations,boundedAppend,assertSameOrigin,invalidateSource} from './safety.mjs';
import {analyze,buildAutoDraftSections,validateProposal,normalizeName,normalizeSearchText} from './engine.mjs';
import {CIRCULAR_2456_CHUNKS,KTR_APPOINTMENT_2567_CHUNKS,STATUTORY_TIER_DEFINITIONS,SUB_GENERAL_TO_INSPECTOR_ACCOUNTS,evaluateCircular2456Rules,resolveJobTier,resolveSeniorityQuotaSpec} from './subGeneralToInspectorData.mjs';
import {calculateRetirementInfo,calculateTenureAndEligibility,searchAndComparePerson} from './personSearch.mjs';
import fs from 'node:fs';
import path from 'node:path';

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

test('2-tier statutory separation distinguishes Tier 1 (ผบก. ขึ้นไป / นายพล) and Tier 2 (รอง ผบก. ลงมาถึง สว.) with exact seniority ratios (100%, 50%, 33%)',()=>{
  assert.ok(STATUTORY_TIER_DEFINITIONS.general);
  assert.ok(STATUTORY_TIER_DEFINITIONS.sub_general_to_inspector);
  assert.equal(resolveJobTier({ analysis_tier: 'general', level: 'รอง ผบก. / เทียบเท่า' }), 'general');
  assert.equal(resolveJobTier({ analysis_tier: 'sub_general_to_inspector', level: 'รอง ผบก. (เลื่อนจาก ผกก.)' }), 'sub_general_to_inspector');

  const topSpec = resolveSeniorityQuotaSpec({ analysis_tier: 'general', level: 'ผู้ช่วย ผบ.ตร. เลื่อนเป็น รอง ผบ.ตร.' });
  assert.equal(topSpec.ratio, 1.0);

  const genSpec = resolveSeniorityQuotaSpec({ analysis_tier: 'general', level: 'รอง ผบก. / เทียบเท่า' });
  assert.equal(genSpec.ratio, 0.5);

  const subGenSpec = resolveSeniorityQuotaSpec({ analysis_tier: 'sub_general_to_inspector', level: 'ผกก. (เลื่อนจาก รอง ผกก.)' });
  assert.equal(subGenSpec.ratio, 0.33);

  const subGenJob = {
    version: 1,
    data: {
      analysis_tier: 'sub_general_to_inspector',
      level: 'ผกก. (เลื่อนจาก รอง ผกก.)',
      account: 'สถานีตำรวจ / นครบาลและภูธร',
      subject_name: 'พ.ต.ท. สมชาย ใจดี',
      bundle_fingerprint: 'fp1',
      references: [
        { id: 'vac-1', kind: 'vacancy', reviewed: true, role: 'reference_data', label: 'ว่าง 10' },
        { id: 'law-1', kind: 'law', reviewed: true, role: 'law', label: 'ม.82(3)' },
      ],
      facts: [{ id: 'f1', text: 'ข้อเท็จจริง 1', status: 'established', citations: ['law-1'] }],
      manual_seniority: {
        id: 'ms-1',
        name: 'พ.ต.ท. สมชาย ใจดี',
        seniority_order: 2,
        total_suitable_population: 30,
        page: 5,
        verified: true,
        bundle_fingerprint: 'fp1',
      },
      vacancies: {
        value: 10,
        applies: true,
        vacancy_reference: 'vac-1',
        rule_reference: 'law-1',
      },
    },
  };
  const res = analyze(subGenJob, [], { seniority: [], summary: { fingerprint: 'fp1' } });
  assert.equal(res.is_sub_general, true);
  assert.ok(res.quota);
  assert.equal(res.quota.actual_vacancies, 10);
  assert.equal(res.quota.seniority_quota, 4);
  assert.equal(res.quota.knowledge_ability_quota, 6);
});
test('KTR Appointment Regulation 2567 chunks are visually verified across all 48 clauses with full Clause 17 table', () => {
  assert.equal(KTR_APPOINTMENT_2567_CHUNKS.length, 49);
  const clause7 = KTR_APPOINTMENT_2567_CHUNKS.find((c) => c.section_num === '๗');
  assert.ok(clause7 && clause7.text.includes('๓๑ สิงหาคม') && clause7.text.includes('๓๐ พฤศจิกายน'));
  const clause17 = KTR_APPOINTMENT_2567_CHUNKS.find((c) => c.section_num === '๑๗');
  assert.ok(
    clause17 &&
      clause17.text.includes('รอง ผบก. เลื่อนเป็น ผบก.') &&
      clause17.text.includes('ไม่น้อยกว่า ๔ ปี') &&
      clause17.text.includes('รอง สว. เลื่อนเป็น สว.') &&
      clause17.text.includes('ไม่น้อยกว่า ๗ ปี'),
  );
  const clause47 = KTR_APPOINTMENT_2567_CHUNKS.find((c) => c.section_num === '๔๗');
  assert.ok(clause47 && clause47.text.includes('ไม่น้อยกว่าร้อยละห้าสิบ') && clause47.text.includes('ไม่น้อยกว่าร้อยละสามสิบสาม'));
});

test('incomplete user input auto-infers title, tier, level, motion, unit type, and builds all 8 auto-draft sections', () => {
  const cleaned = cleanInput(
    {
      subject_name: 'พ.ต.ท. สมชาย ใจดี',
      rank_position: 'รอง ผกก.ป. สภ.เมืองนนทบุรี ภ.1',
      claim: 'ขอความเป็นธรรมกรณีไม่ได้รับการเลื่อนตำแหน่งเป็น ผกก.',
    },
    { references: [], facts: [] },
  );
  assert.ok(cleaned.title.includes('พ.ต.ท. สมชาย ใจดี'));
  assert.equal(cleaned.analysis_tier, 'sub_general_to_inspector');
  assert.equal(cleaned.level, 'ผกก. (เลื่อนจาก รอง ผกก.)');
  assert.equal(cleaned.appointment_motion, 'promotion');
  assert.equal(cleaned.unit_type, 'non_opb_bch');

  const draft = buildAutoDraftSections(
    { version: 1, data: { ...cleaned, bundle_fingerprint: 'fp1' } },
    [],
    { seniority: [], appointments: [], summary: { fingerprint: 'fp1' } },
  );
  assert.ok(draft['ข้อมูลเรื่องและบุคคล'].includes('พ.ต.ท. สมชาย ใจดี'));
  assert.ok(draft['กฎหมายและหลักเกณฑ์'].includes('พิเคราะห์แล้วเห็นว่า'));
  assert.ok(draft['การวิเคราะห์'].includes('พิจารณาแล้วเห็นว่า'));
});

test('Zero-API database person search calculates retirement (+1 year after 30 Sep), tenure, eligibility, and junior promoted officers', () => {
  // 1. Born on or before 30 Sep -> +60 years
  const retBefore = calculateRetirementInfo('22/09/2515');
  assert.ok(retBefore);
  assert.equal(retBefore.bornAfterSep30, false);
  assert.equal(retBefore.retirementYearBE, 2575);

  // 2. Born after 30 Sep (e.g. 7/10/2513) -> +61 years (+1 bonus year)
  const retAfter = calculateRetirementInfo('7/10/2513');
  assert.ok(retAfter);
  assert.equal(retAfter.bornAfterSep30, true);
  assert.equal(retAfter.retirementYearBE, 2574);

  // 3. Tenure & eligibility calculation for รอง ผบก. (requires >= 4 years)
  const ten = calculateTenureAndEligibility('15/03/2561', 'รอง ผบก. / เทียบเท่า', '1/10/2569');
  assert.equal(ten.requiredYears, 4);
  assert.equal(ten.isEligible, true);
  assert.equal(ten.tenureYears, 8);
  assert.equal(ten.yearsPastEligibility, 4);

  // 4. Full person search and junior promoted officers comparison from snapshot
  const snapshotPath = path.resolve(process.cwd(), 'src/data/analysis/appointments-2569-snapshot.json');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const res = searchAndComparePerson(snapshot, { q: 'อาชยน ไกรทอง' });
  assert.equal(res.zeroApiCost, true);
  assert.ok(res.profile);
  assert.equal(res.profile.name, 'อาชยน ไกรทอง');
  assert.equal(res.profile.seniorityOrder, 3);
  assert.equal(res.profile.retirement?.bornAfterSep30, true);
  assert.equal(res.profile.retirement?.retirementYearBE, 2574);
  assert.equal(res.profile.comparison.juniorPromotedCount, 3);
  assert.deepEqual(
    res.profile.comparison.juniorPromotedOfficers.map((j: { name: string }) => j.name),
    ['กฤษกร พลีธัญญวงศ์', 'พิสิฐ ตันประเสริฐ', 'กฤตธาพล ยี่สาคร'],
  );
  // 5. Verification of complete database appointments pull: promotions & rotations
  assert.equal(res.profile.comparison.totalPromotedInAccount, 6);
  assert.equal(res.profile.comparison.allPromotedInAccount.length, 6);
  assert.equal(res.profile.comparison.totalAppointedInLevel, 17);
  assert.equal(res.profile.comparison.allAppointedInLevel.length, 17);
  assert.ok(res.totalMatches > 0);
  assert.ok(res.suggestions.length > 0);

  // 6. Verification of OCR-corrected roster officer (พันตำรวจเอก ชิตภพ โตเหมือน, Round 4 order 180 / 610)
  const resChitphop = searchAndComparePerson(snapshot, { q: 'ชิตภพ โตเหมือน' });
  assert.ok(resChitphop.profile);
  assert.equal(resChitphop.profile.foundInDatabase, true);
  assert.equal(resChitphop.profile.name, 'ชิตภพ โตเหมือน');
  assert.equal(resChitphop.profile.rank, 'พันตำรวจเอก');
  assert.equal(resChitphop.profile.seniorityOrder, 180);
  assert.equal(resChitphop.profile.totalSuitablePopulation, 610);
  assert.equal(resChitphop.profile.currentPositionDate, '22/12/2563');
  assert.equal(resChitphop.profile.birthDate, '7/05/2514');
  assert.equal(resChitphop.profile.retirement?.retirementYearBE, 2574);
  assert.equal(resChitphop.profile.comparison.juniorPromotedCount, 32);

  // 7. Verification of surname-only search fallback & rank prefix search
  const resSurname = searchAndComparePerson(snapshot, { q: 'โตเหมือน' });
  assert.ok(resSurname.profile);
  assert.equal(resSurname.profile.name, 'ชิตภพ โตเหมือน');
  assert.equal(resSurname.profile.seniorityOrder, 180);

  const resFullRankQuery = searchAndComparePerson(snapshot, { q: 'พันตำรวจเอก ชิตภพ โตเหมือน' });
  assert.equal(resFullRankQuery.profile?.name, 'ชิตภพ โตเหมือน');

  // 8. Verification of latest rank & latest position after 2569 appointment order
  const resPromoGen = searchAndComparePerson(snapshot, { q: 'ณพวัฒน์ อารยางกูร' });
  assert.equal(resPromoGen.profile?.rank, 'พลตำรวจเอก');
  assert.equal(resPromoGen.profile?.previousRank, 'พลตำรวจโท');
  assert.equal(resPromoGen.profile?.rankPromoted, true);
  assert.ok(resPromoGen.profile?.currentPosition);
  assert.equal(resPromoGen.profile?.currentPosition, resPromoGen.profile?.newPosition);
  assert.ok(resPromoGen.profile?.positionBeforeOrder);

  const resPromoLtGen = searchAndComparePerson(snapshot, { q: 'ไพโรจน์ สุขรวยธนโชติ' });
  assert.equal(resPromoLtGen.profile?.rank, 'พลตำรวจโท');
  assert.equal(resPromoLtGen.profile?.previousRank, 'พลตำรวจตรี');
  assert.equal(resPromoLtGen.profile?.rankPromoted, true);

  const resPromoFemale = searchAndComparePerson(snapshot, { q: 'พิมพรรณ ทรัพย์ขำ' });
  assert.equal(resPromoFemale.profile?.rank, 'พลตำรวจโทหญิง');
  assert.equal(resPromoFemale.profile?.previousRank, 'พลตำรวจตรีหญิง');

  const resPromoMajGen = searchAndComparePerson(snapshot, { q: 'ธงชัย วิไลพรหม' });
  assert.equal(resPromoMajGen.profile?.rank, 'พลตำรวจตรี');
  assert.equal(resPromoMajGen.profile?.previousRank, 'พันตำรวจเอก');

  const resSameRankBracket = searchAndComparePerson(snapshot, { q: 'อาชยน ไกรทอง' });
  assert.equal(resSameRankBracket.profile?.rank, 'พลตำรวจโท');
  assert.equal(resSameRankBracket.profile?.previousRank, 'พลตำรวจโท');
  assert.equal(resSameRankBracket.profile?.rankPromoted, false);
  assert.equal(resSameRankBracket.profile?.currentPosition, 'ผู้ช่วยผู้บัญชาการตำรวจแห่งชาติ');

  // 9. Verification that clean Thai names are never corrupted by OCR rules
  const resClean1 = searchAndComparePerson(snapshot, { q: 'เบญจวรรณ วุฒิวรวงศ์' });
  assert.equal(resClean1.profile?.name, 'เบญจวรรณ วุฒิวรวงศ์');
  const resClean2 = searchAndComparePerson(snapshot, { q: 'ธงชัย เนตรสขาวัฒน์' });
  assert.equal(resClean2.profile?.name, 'ธงชัย เนตรสขาวัฒน์');

  // 10. Verification of Card 4 tenure eligibility rule under กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๐(๑) (annual round date 4/11/2566 -> 2569 = 3 full years)
  const annualBgk = calculateTenureAndEligibility('4/11/2566', 'ผบก. / เทียบเท่า');
  assert.equal(annualBgk.isEligible, true);
  assert.equal(annualBgk.tenureYears, 3);
  assert.equal(annualBgk.tenureMonths, 0);
  assert.ok(!annualBgk.eligibilityDisplay.includes('ขาดอีก'));
  assert.ok(annualBgk.legalBasis.includes('ข้อ ๑๐(๑)'));

  const resPrarthana = searchAndComparePerson(snapshot, { q: 'ปรารถนา แผ่นผา' });
  assert.ok(resPrarthana.profile);
  assert.equal(resPrarthana.profile.tenure.isEligible, true);
  assert.ok(resPrarthana.profile.tenure.legalBasis.includes('มาตรา ๗๗(๕)'));
  assert.ok(resPrarthana.profile.tenure.legalBasis.includes('ข้อ ๑๗(๔)'));

  // 11. Verification that Card 4 legal basis adapts to current promoted level
  assert.equal(resSameRankBracket.profile?.tenure?.isPromotedToHigherLevel, true);
  assert.equal(resSameRankBracket.profile?.tenure?.currentLevel, 'ผู้ช่วย ผบ.ตร. / รอง จตช.');
  assert.ok(resSameRankBracket.profile?.tenure?.currentLegalBasis?.includes('มาตรา ๗๗(๒)'));

  // 12. Verification of OpenThai 2.0 restored OCR names, clean positions & female ranks
  for (const name of ['ธนิต ไทยวัชรามาศ', 'ยุทธพงษ์ ทองนุ้ย', 'ฐายุฏฐ์ จันทร์ถาวร', 'นิรมล ปัณฑวนันท์']) {
    const r = searchAndComparePerson(snapshot, { q: name });
    assert.equal(r.profile?.foundInDatabase, true, `Should find ${name}`);
    assert.equal(r.profile?.name, name);
    assert.ok(!/[A-Za-z]/.test(r.profile?.currentPosition || ''), `Position should be clean Thai for ${name}: ${r.profile?.currentPosition}`);
  }
  const resNiromon = searchAndComparePerson(snapshot, { q: 'นิรมล ปัณฑวนันท์' });
  assert.equal(resNiromon.profile?.rank, 'พลตำรวจโทหญิง');

  // 13. Verification of Thai typo & phonetic fuzzy search
  assert.equal(searchAndComparePerson(snapshot, { q: 'ชิดพบ โตเหมื่อน' }).profile?.name, 'ชิตภพ โตเหมือน');
  assert.equal(searchAndComparePerson(snapshot, { q: 'อาชย ไกรทง' }).profile?.name, 'อาชยน ไกรทอง');
  assert.equal(searchAndComparePerson(snapshot, { q: 'ทำนูน เชาววนิช' }).profile?.name, 'ธรรมนูญ เชาวะวนิชย์');
  assert.ok(searchAndComparePerson(snapshot, { q: 'กิตติพงศ' }).totalMatches > 0);

  // 14. Verification of Round 4 seniority roster officers (ลักขณา ศักดิแพทย์ #76/95 + 331 OpenThai restored names)
  const resLakkhana = searchAndComparePerson(snapshot, { q: 'ลักขณา ศักดิแพทย์' });
  assert.equal(resLakkhana.profile?.foundInDatabase, true);
  assert.equal(resLakkhana.profile?.name, 'ลักขณา ศักดิแพทย์');
  assert.equal(resLakkhana.profile?.rank, 'พลตำรวจตรีหญิง');
  assert.equal(resLakkhana.profile?.currentPosition, 'รอง ผบช.สตส.');
  assert.equal(resLakkhana.profile?.seniorityOrder, 76);
  assert.equal(resLakkhana.profile?.totalSuitablePopulation, 95);
  assert.equal(resLakkhana.profile?.currentPositionDate, '4/02/2568');
  assert.equal(resLakkhana.profile?.comparison?.juniorPromotedCount, 1);

  const resLakkhanaAlt = searchAndComparePerson(snapshot, { q: 'ลักขณา ศักดิ์แพทย์' });
  assert.equal(resLakkhanaAlt.profile?.name, 'ลักขณา ศักดิแพทย์');

  for (const name of [
    'สมควร พึ่งทรัพย์',
    'โสภณ สารพัฒน์',
    'ชูสวัสดิ์ จันทร์โรจนกิจ',
    'ณัฐนนท์ ประชุม',
    'สุรพงษ์ ถนอมจิตร',
    'ชุลีรัตน์ สงคศิริ',
    'ธีรเดช ธรรมสุธีร์',
  ]) {
    const r = searchAndComparePerson(snapshot, { q: name });
    assert.equal(r.profile?.foundInDatabase, true, `Should find Round 4 restored officer ${name}`);
    assert.equal(r.profile?.name, name);
  }

  // 15. Verification of Card 7 Quota & Vacancy Assessment (กลุ่มอาวุโส 50% / 100% vs กลุ่มความรู้ความสามารถ + จุดตัด 50%)
  // 15.1 รอง ผบช. #1/95 (ไพโรจน์ สุขรวยธนโชติ) -> อยู่ในกลุ่มอาวุโส 50% ที่ได้เลื่อนตำแหน่งสูงขึ้น (ว่าง 20 ตำแหน่ง, ตัด 50% ที่ลำดับ 10)
  const resPairoj = searchAndComparePerson(snapshot, { q: 'ไพโรจน์ สุขรวยธนโชติ' });
  assert.equal(resPairoj.profile?.quotaAssessment?.totalVacancies, 20);
  assert.equal(resPairoj.profile?.quotaAssessment?.seniorityQuotaCount, 10);
  assert.equal(resPairoj.profile?.quotaAssessment?.knowledgeQuotaCount, 10);
  assert.equal(resPairoj.profile?.quotaAssessment?.seniorityCutoffOrder, 10);
  assert.equal(resPairoj.profile?.quotaAssessment?.groupKey, 'seniority_50');
  assert.equal(resPairoj.profile?.quotaAssessment?.groupLabel, 'อยู่ในกลุ่มอาวุโส 50% ที่ได้เลื่อนตำแหน่งสูงขึ้น');

  // 15.2 รอง ผบช. #21/95 (วิวัฒน์ คำชำนาญ) -> อยู่ในกลุ่มความรู้ความสามารถ ที่ได้เลื่อนตำแหน่งสูงขึ้น
  const resWiwat = searchAndComparePerson(snapshot, { q: 'วิวัฒน์ คำชำนาญ' });
  assert.equal(resWiwat.profile?.quotaAssessment?.totalVacancies, 20);
  assert.equal(resWiwat.profile?.quotaAssessment?.seniorityCutoffOrder, 10);
  assert.equal(resWiwat.profile?.quotaAssessment?.groupKey, 'knowledge_promoted');
  assert.equal(resWiwat.profile?.quotaAssessment?.groupLabel, 'อยู่ในกลุ่มความรู้ความสามารถ ที่ได้เลื่อนตำแหน่งสูงขึ้น');

  // 15.3 รอง ผบช. #76/95 (ลักขณา ศักดิแพทย์) -> อยู่ในเกณฑ์กลุ่มความรู้ความสามารถ (เกินจุดตัดอาวุโส 50% · ไม่ได้เลื่อนสูงขึ้น)
  assert.equal(resLakkhana.profile?.quotaAssessment?.totalVacancies, 20);
  assert.equal(resLakkhana.profile?.quotaAssessment?.seniorityCutoffOrder, 10);
  assert.equal(resLakkhana.profile?.quotaAssessment?.groupKey, 'knowledge_pool');
  assert.ok(resLakkhana.profile?.quotaAssessment?.groupLabel.includes('กลุ่มความรู้ความสามารถ'));

  // 15.4 ผบก. #50/79 (ปรารถนา แผ่นผา) -> ว่าง 44 ตำแหน่ง, ตัดโควตาอาวุโส 50% ที่ลำดับที่ 22 (22 อัตรา)
  assert.equal(resPrarthana.profile?.quotaAssessment?.totalVacancies, 44);
  assert.equal(resPrarthana.profile?.quotaAssessment?.seniorityQuotaCount, 22);
  assert.equal(resPrarthana.profile?.quotaAssessment?.knowledgeQuotaCount, 22);
  assert.equal(resPrarthana.profile?.quotaAssessment?.seniorityCutoffOrder, 22);

  // 15.5 รอง ผบก. #180/610 (ชิตภพ โตเหมือน) -> ว่าง 95 ตำแหน่ง, ตัดโควตาอาวุโส 50% ที่ลำดับที่ 48 (48 อัตรา)
  assert.equal(resChitphop.profile?.quotaAssessment?.totalVacancies, 95);
  assert.equal(resChitphop.profile?.quotaAssessment?.seniorityQuotaCount, 48);
  assert.equal(resChitphop.profile?.quotaAssessment?.knowledgeQuotaCount, 47);
  assert.equal(resChitphop.profile?.quotaAssessment?.seniorityCutoffOrder, 48);
  assert.equal(resChitphop.profile?.quotaAssessment?.groupKey, 'knowledge_pool');

  const juniorPromotedRongBgkName = resChitphop.profile!.comparison.juniorPromotedOfficers[0].name;
  const resJuniorPromotedRongBgk = searchAndComparePerson(snapshot, { q: juniorPromotedRongBgkName });
  assert.equal(resJuniorPromotedRongBgk.profile?.quotaAssessment?.groupKey, 'knowledge_promoted');

  // 15.6 ผบช. #1/27 (ณพวัฒน์ อารยางกูร) -> อยู่ในกลุ่มอาวุโส 100% ที่ได้เลื่อนตำแหน่งสูงขึ้น (ว่าง 6 ตำแหน่ง, ตัดที่ลำดับ 6)
  assert.equal(resSameRankBracket.profile?.quotaAssessment?.totalVacancies, 6);
  assert.equal(resSameRankBracket.profile?.quotaAssessment?.seniorityCutoffOrder, 6);
  assert.equal(resSameRankBracket.profile?.quotaAssessment?.groupKey, 'seniority_100');

  // 15.7 รอง ผบช. #22/95 (วสันต์ เตชะอัครเกษม) -> เลื่อนเป็น ผบช.ภ.2, ระดับก่อนหน้าจริงคือ รอง ผบช. (1 ต.ค. 2565)
  const resWasan = searchAndComparePerson(snapshot, { q: 'วสันต์ เตชะอัครเกษม' });
  assert.ok(resWasan.profile);
  assert.equal(resWasan.profile.currentPosition, 'ผู้บัญชาการตำรวจภูธรภาค2');
  assert.equal(resWasan.profile.positionBeforeOrder, 'รองผู้บัญชาการตำรวจนครบาล');
  assert.ok(resWasan.profile.previousPosition.includes('รองผู้บัญชาการตำรวจนครบาล'));
  assert.ok(resWasan.profile.previousPosition.includes('รอง ผบช.'));
  assert.ok(resWasan.profile.previousPosition.includes('1 ต.ค. 2565'));
  assert.equal(resWasan.profile.previousPositionDate, '1/10/2565');
  assert.equal(resWasan.profile.previousPositionDateThai, '1 ต.ค. 2565');
  assert.equal(resWasan.profile.seniorityOrder, 22);
  assert.equal(resWasan.profile.quotaAssessment?.groupKey, 'knowledge_promoted');
});
