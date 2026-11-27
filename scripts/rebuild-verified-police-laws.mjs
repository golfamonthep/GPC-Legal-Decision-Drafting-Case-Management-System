import fs from 'node:fs';
import path from 'node:path';
import { KPKT_APPEAL_2567_ACT, KPKT_APPEAL_2567_SECTIONS } from '../src/lib/thai-law/official/kpktAppeal2567Official.mjs';
import { KPKT_GRIEVANCE_2567_ACT, KPKT_GRIEVANCE_2567_SECTIONS } from '../src/lib/thai-law/official/kpktGrievance2567Official.mjs';
import { KTR_DISCIPLINE_2569_ACT, KTR_DISCIPLINE_2569_SECTIONS } from '../src/lib/thai-law/official/ktrDiscipline2569Official.mjs';

const ROOT = process.cwd();
const LAWS_PATH = path.join(ROOT, 'src/data/thai-law/police-laws.json');
const POLICE_ACT_VERIFIED_PATH = path.join(ROOT, 'scratch/police-act-2565-verified.json');

// 8 discipline regulations explicitly repealed by กฎ ก.ตร. ว่าด้วยการดำเนินการทางวินัย พ.ศ. ๒๕๖๙ ข้อ ๒ (๑)–(๑๑)
const REPEALED_BY_DISCIPLINE_2569 = new Set([
  'ktr-inquiry-2547',
  'ktr-flagrant-offense-2547',
  'ktr-suspend-leave-2547',
  'ktr-filter-committee-2547',
  'ktr-order-manner-2547',
  'ktr-punish-power-2547',
  'ktr-restore-status-2547',
  'ktr-investigation-fact-2556',
]);

// 2 narcotics acts repealed by ประมวลกฎหมายยาเสพติด พ.ศ. ๒๕๖๔
const REPEALED_BY_NARCOTICS_CODE_2564 = new Set([
  'narcotics-2522',
  'drug-suppression-2534',
]);

function markTitleRepealed(title, reason) {
  if (title.includes('ยกเลิกแล้ว')) return title;
  return `[ยกเลิกแล้ว - ${reason}] ${title}`;
}

function main() {
  const existing = JSON.parse(fs.readFileSync(LAWS_PATH, 'utf8'));
  const policeActVerified = JSON.parse(fs.readFileSync(POLICE_ACT_VERIFIED_PATH, 'utf8'));

  if (!Array.isArray(policeActVerified.sections) || policeActVerified.sections.length !== 181) {
    throw new Error(`Expected 181 verified sections for police-act-2565, got ${policeActVerified.sections?.length}`);
  }

  // Group existing sections by actId
  const sectionsByAct = new Map();
  for (const sec of existing.catalog) {
    if (!sectionsByAct.has(sec.actId)) sectionsByAct.set(sec.actId, []);
    sectionsByAct.get(sec.actId).push(sec);
  }

  // Replace verified acts in sectionsByAct
  sectionsByAct.set('police-act-2565', policeActVerified.sections);
  sectionsByAct.set('kpkt-appeal-2567', KPKT_APPEAL_2567_SECTIONS);
  sectionsByAct.set('kpkt-grievance-2567', KPKT_GRIEVANCE_2567_SECTIONS);
  sectionsByAct.set('ktr-discipline-2569', KTR_DISCIPLINE_2569_SECTIONS);

  // Build updated acts list (insert ktr-discipline-2569 right after tr-order-515-2569)
  const updatedActs = [];
  let insertedDiscipline2569 = false;

  for (const rawAct of existing.acts) {
    if (rawAct.id === 'ktr-discipline-2569') continue; // will insert in canonical position

    let act = { ...rawAct };
    if (act.id === 'police-act-2565') {
      act = { ...policeActVerified.act };
    } else if (act.id === 'kpkt-appeal-2567') {
      act = { ...KPKT_APPEAL_2567_ACT };
    } else if (act.id === 'kpkt-grievance-2567') {
      act = { ...KPKT_GRIEVANCE_2567_ACT };
    } else if (REPEALED_BY_DISCIPLINE_2569.has(act.id)) {
      act.title = markTitleRepealed(act.title, 'โดย กฎ ก.ตร. ว่าด้วยการดำเนินการทางวินัย พ.ศ. ๒๕๖๙');
    } else if (REPEALED_BY_NARCOTICS_CODE_2564.has(act.id)) {
      act.title = markTitleRepealed(act.title, 'โดย ประมวลกฎหมายยาเสพติด พ.ศ. ๒๕๖๔');
    }

    updatedActs.push(act);

    if (act.id === 'tr-order-515-2569' && !insertedDiscipline2569) {
      updatedActs.push({ ...KTR_DISCIPLINE_2569_ACT });
      insertedDiscipline2569 = true;
    }
  }

  if (!insertedDiscipline2569) {
    updatedActs.unshift({ ...KTR_DISCIPLINE_2569_ACT });
  }

  // Rebuild catalog in act order, ensuring actTitle matches acts[].title and ALL section IDs are 100% unique
  const updatedCatalog = [];
  const seenIds = new Map();
  let dedupedCount = 0;

  for (const act of updatedActs) {
    const actSections = sectionsByAct.get(act.id) || [];
    for (const rawSec of actSections) {
      const sec = { ...rawSec, actTitle: act.title };
      const baseId = sec.id;
      const count = (seenIds.get(baseId) || 0) + 1;
      seenIds.set(baseId, count);
      if (count > 1) {
        sec.id = `${baseId}-dup${count}`;
        dedupedCount++;
      }
      updatedCatalog.push(sec);
    }
  }

  const nextData = {
    ...existing,
    metadata: {
      ...(existing.metadata || {}),
      totalActs: updatedActs.length,
      totalSections: updatedCatalog.length,
      verifiedAt: '2026-11-27',
      verifiedOfficialActs: [
        'police-act-2565',
        'ktr-discipline-2569',
        'tr-order-515-2569',
        'kpkt-appeal-2567',
        'kpkt-grievance-2567',
      ],
    },
    acts: updatedActs,
    catalog: updatedCatalog,
  };

  fs.writeFileSync(LAWS_PATH, JSON.stringify(nextData, null, 2), 'utf8');

  console.log(
    JSON.stringify(
      {
        totalActs: updatedActs.length,
        activeActs: updatedActs.filter((a) => !a.title.includes('ยกเลิกแล้ว')).length,
        repealedActs: updatedActs.filter((a) => a.title.includes('ยกเลิกแล้ว')).length,
        totalSections: updatedCatalog.length,
        dedupedIds: dedupedCount,
        policeAct2565Count: sectionsByAct.get('police-act-2565').length,
        ktrDiscipline2569Count: sectionsByAct.get('ktr-discipline-2569').length,
        kpktAppeal2567Count: sectionsByAct.get('kpkt-appeal-2567').length,
        kpktGrievance2567Count: sectionsByAct.get('kpkt-grievance-2567').length,
      },
      null,
      2
    )
  );
}

main();
