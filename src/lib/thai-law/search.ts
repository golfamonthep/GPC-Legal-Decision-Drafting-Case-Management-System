import rawData from '@/data/thai-law/police-laws.json';
import { PoliceLawSection, PoliceLawAct, LawSearchOptions, LawSearchResult, LawGpcScope } from './types';

const thaiNumMap: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
};

const arabicNumMap: Record<string, string> = {
  '0': '๐', '1': '๑', '2': '๒', '3': '๓', '4': '๔',
  '5': '๕', '6': '๖', '7': '๗', '8': '๘', '9': '๙'
};

export function toArabicNum(str: string): string {
  if (!str) return '';
  return str.replace(/[๐-๙]/g, d => thaiNumMap[d] || d);
}

export function toThaiNum(str: string): string {
  if (!str) return '';
  return str.replace(/[0-9]/g, d => arabicNumMap[d] || d);
}

const SHORT_TITLES: Record<string, string> = {
  'tr-order-515-2569': 'คำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ (มอบอำนาจวินัย)',
  'tr-circular-2456-2569': 'ว ๒๔๕๖ (แต่งตั้ง รอง ผบก.–สว. ๒๕๖๙)',
  'police-act-2565': 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕',
  'ktr-appointment-2567': 'กฎ ก.ตร. แต่งตั้ง พ.ศ. ๒๕๖๗',
  'kpkt-appeal-2567': 'กฎ ก.พ.ค.ตร. อุทธรณ์ พ.ศ. ๒๕๖๗',
  'kpkt-grievance-2567': 'กฎ ก.พ.ค.ตร. ร้องทุกข์ พ.ศ. ๒๕๖๗',
  'ktr-investigation-fact-2556': 'กฎ ก.ตร. สืบสวนข้อเท็จจริง ๒๕๕๖',
  'ktr-inquiry-2547': 'กฎ ก.ตร. สอบสวนพิจารณา ๒๕๔๗',
  'ktr-punish-power-2547': 'กฎ ก.ตร. อำนาจและอัตราโทษ ๒๕๔๗',
  'ktr-suspend-leave-2547': 'กฎ ก.ตร. พักราชการ/ให้ออกไว้ก่อน ๒๕๔๗',
  'ktr-flagrant-offense-2547': 'กฎ ก.ตร. ความผิดปรากฏชัดแจ้ง ๒๕๔๗',
  'ktr-filter-committee-2547': 'กฎ ก.ตร. กลั่นกรองลงโทษ ๒๕๔๗',
  'ktr-ethics-2551': 'กฎ ก.ตร. จริยธรรมตำรวจ ๒๕๕๑',
  'ktr-discharge-ineff-2547': 'กฎ ก.ตร. ให้ออกเหตุหย่อนประสิทธิภาพ ๒๕๔๗',
  'ktr-restore-status-2547': 'กฎ ก.ตร. คืนฐานะเดิม/เพิ่มโทษ ๒๕๔๗',
  'ktr-regular-reserve-2548': 'กฎ ก.ตร. ประจำ ตร./สำรองราชการ ๒๕๔๘',
  'ktr-order-manner-2547': 'กฎ ก.ตร. วิธีการออกคำสั่งลงโทษ ๒๕๔๗',
  'ktr-qualifications-2547': 'กฎ ก.ตร. คุณสมบัติแต่งตั้ง ๒๕๔๗',
  'ktr-appeal-2547': 'กฎ ก.ตร. อุทธรณ์ ๒๕๔๗ (ยกเลิกแล้ว)',
  'ktr-petition-2547': 'กฎ ก.ตร. ร้องทุกข์ ๒๕๔๗ (ยกเลิกแล้ว)',
  'criminal-code-2499': 'ประมวลกฎหมายอาญา',
  'admin-court-2542': 'พ.ร.บ.จัดตั้งศาลปกครอง ๒๕๔๒',
  'tortious-liability-2539': 'พ.ร.บ.ความรับผิดทางละเมิด ๒๕๓๙',
  'official-info-2540': 'พ.ร.บ.ข้อมูลข่าวสารฯ ๒๕๔๐',
  'pdpa-2562': 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
};

const GRIEVANCE_ACT_IDS = new Set([
  'tr-circular-2456-2569',
  'ktr-appointment-2567',
  'kpkt-grievance-2567',
  'ktr-petition-2547',
  'ktr-qualifications-2547',
  'ktr-regular-reserve-2548',
]);

const NEW_ACT_IDS = new Set([
  'tr-order-515-2569',
  'tr-circular-2456-2569',
]);

function inferGpcScope(act: PoliceLawAct): Exclude<LawGpcScope, 'all'> {
  if (GRIEVANCE_ACT_IDS.has(act.id)) return 'grievance_appointment';
  if (act.category === 'วินัย อุทธรณ์ ร้องทุกข์') return 'appeal_discipline';
  if (act.category === 'กฎหมายอาญาและวิธีพิจารณา') return 'criminal';
  if (act.category === 'กฎหมายปกครองและการปฏิบัติราชการ') return 'admin';
  return 'security';
}

const sections: PoliceLawSection[] = rawData.catalog as PoliceLawSection[];

const sectionCountByAct: Record<string, number> = {};
for (const sec of sections) {
  sectionCountByAct[sec.actId] = (sectionCountByAct[sec.actId] || 0) + 1;
}

const acts: PoliceLawAct[] = (rawData.acts as PoliceLawAct[]).map((act) => ({
  ...act,
  shortTitle: SHORT_TITLES[act.id] || act.title.replace(/\s*\(ฉบับ[^)]*\)/g, '').slice(0, 68),
  gpcScope: inferGpcScope(act),
  sectionCount: sectionCountByAct[act.id] || 0,
  isRepealed: act.title.includes('ยกเลิกแล้ว'),
  isNew: NEW_ACT_IDS.has(act.id),
}));

const actById = new Map(acts.map((a) => [a.id, a]));

// Pre-calculate category counts
const categoryCounts: Record<string, number> = {};
for (const sec of sections) {
  categoryCounts[sec.category] = (categoryCounts[sec.category] || 0) + 1;
}

const allCategories = [
  { name: 'ทั้งหมด', count: sections.length },
  { name: 'วินัย อุทธรณ์ ร้องทุกข์', count: categoryCounts['วินัย อุทธรณ์ ร้องทุกข์'] || 0 },
  { name: 'กฎหมายอาญาและวิธีพิจารณา', count: categoryCounts['กฎหมายอาญาและวิธีพิจารณา'] || 0 },
  { name: 'กฎหมายปกครองและการปฏิบัติราชการ', count: categoryCounts['กฎหมายปกครองและการปฏิบัติราชการ'] || 0 },
  { name: 'การรักษาความสงบเรียบร้อยและความมั่นคง', count: categoryCounts['การรักษาความสงบเรียบร้อยและความมั่นคง'] || 0 }
];

function matchesScope(act: PoliceLawAct | undefined, scope: string): boolean {
  if (!act || !scope || scope === 'all') return true;
  // พ.ร.บ.ตำรวจแห่งชาติ 2565 ใช้ได้ทั้งงานอุทธรณ์ (วินัย หมวด 7–9) และงานร้องทุกข์ (แต่งตั้ง หมวด 5 & ม.147)
  if (act.id === 'police-act-2565' && (scope === 'appeal_discipline' || scope === 'grievance_appointment')) {
    return true;
  }
  return act.gpcScope === scope;
}

function buildScopes(hideRepealed: boolean) {
  const activeActs = hideRepealed ? acts.filter((a) => !a.isRepealed) : acts;
  const defs: { id: LawGpcScope; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'appeal_discipline', label: 'อุทธรณ์ / วินัยตำรวจ' },
    { id: 'grievance_appointment', label: 'ร้องทุกข์ / แต่งตั้ง' },
    { id: 'criminal', label: 'อาญาและวิธีพิจารณา' },
    { id: 'admin', label: 'ปกครอง / ละเมิด / ข้อมูล' },
    { id: 'security', label: 'ความมั่นคงและอื่นๆ' },
  ];
  return defs.map((d) => {
    const matchedActs = activeActs.filter((a) => matchesScope(a, d.id));
    const matchedActIds = new Set(matchedActs.map((a) => a.id));
    const count = sections.filter((s) => matchedActIds.has(s.actId)).length;
    return { id: d.id, label: d.label, count, actCount: matchedActs.length };
  });
}

export function getLawActs(): PoliceLawAct[] {
  return acts;
}

export function getLawCategories() {
  return allCategories;
}

export function getLawStats() {
  return {
    totalActs: acts.length,
    activeActs: acts.filter((a) => !a.isRepealed).length,
    totalSections: sections.length,
  };
}

export function getSectionById(id: string): {
  section: PoliceLawSection | null;
  prevSection: PoliceLawSection | null;
  nextSection: PoliceLawSection | null;
  act: PoliceLawAct | null;
} {
  const index = sections.findIndex(s => s.id === id);
  if (index === -1) {
    return { section: null, prevSection: null, nextSection: null, act: null };
  }

  const section = sections[index];
  const act = actById.get(section.actId) || null;

  // Previous section in same act
  let prevSection: PoliceLawSection | null = null;
  if (index > 0 && sections[index - 1].actId === section.actId) {
    prevSection = sections[index - 1];
  }

  // Next section in same act
  let nextSection: PoliceLawSection | null = null;
  if (index < sections.length - 1 && sections[index + 1].actId === section.actId) {
    nextSection = sections[index + 1];
  }

  return { section, prevSection, nextSection, act };
}

export function searchPoliceLaws(options: LawSearchOptions = {}): LawSearchResult {
  const {
    q = '',
    category = 'ทั้งหมด',
    scope = 'all',
    actId = 'all',
    hideRepealed = false,
    page = 1,
    pageSize = 20
  } = options;

  let pool = sections;

  if (hideRepealed && (!actId || actId === 'all')) {
    pool = pool.filter(s => !actById.get(s.actId)?.isRepealed);
  }

  // Category filter (backward compatible)
  if (category && category !== 'ทั้งหมด') {
    pool = pool.filter(s => s.category === category);
  }

  // Scope filter (GPC workflow grouping)
  if (scope && scope !== 'all' && (!actId || actId === 'all')) {
    pool = pool.filter(s => matchesScope(actById.get(s.actId), scope));
  }

  // Act filter
  if (actId && actId !== 'all') {
    pool = pool.filter(s => s.actId === actId);
  }

  const query = q.trim().toLowerCase();
  const scopes = buildScopes(Boolean(hideRepealed));

  if (!query) {
    const total = pool.length;
    const startIndex = (page - 1) * pageSize;
    const items = pool.slice(startIndex, startIndex + pageSize);
    return {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items,
      acts,
      categories: allCategories,
      scopes
    };
  }

  const queryArabic = toArabicNum(query);
  const queryThai = toThaiNum(query);
  const tokens = query.split(/\s+/).filter(Boolean);

  const scored: { item: PoliceLawSection; score: number }[] = [];

  for (const item of pool) {
    let score = 0;
    const secNum = item.sectionNum.toLowerCase();
    const secNumArabic = item.sectionNumArabic.toLowerCase();
    const label = item.sectionLabel.toLowerCase();
    const title = item.actTitle.toLowerCase();
    const titleArabic = toArabicNum(title);
    const content = item.content.toLowerCase();
    const contentArabic = toArabicNum(content);

    // 1. Exact match on section number (top priority: user typed "105" or "มาตรา 105")
    if (
      secNumArabic === query ||
      secNumArabic === queryArabic ||
      secNum === query ||
      secNum === queryThai ||
      label === query ||
      label === `มาตรา ${query}` ||
      label === `ข้อ ${query}` ||
      label === `มาตรา ${queryThai}` ||
      label === `ข้อ ${queryThai}`
    ) {
      score += 2000;
    } else if (
      secNumArabic.includes(queryArabic) ||
      secNum.includes(queryThai) ||
      label.includes(query) ||
      label.includes(queryThai)
    ) {
      score += 400;
    }

    // 2. Act Title match (Thai & Arabic numerals)
    if (title.includes(query) || title.includes(queryThai) || titleArabic.includes(queryArabic)) {
      score += 250;
    }

    // 3. Multi-token match across content
    let matchedTokenCount = 0;
    for (const token of tokens) {
      const tokenArabic = toArabicNum(token);
      const tokenThai = toThaiNum(token);

      if (secNumArabic === tokenArabic || secNum === tokenThai) {
        score += 300;
        matchedTokenCount++;
      } else if (label.includes(token) || label.includes(tokenThai)) {
        score += 150;
        matchedTokenCount++;
      } else if (title.includes(token) || title.includes(tokenThai) || titleArabic.includes(tokenArabic)) {
        score += 60;
        matchedTokenCount++;
      } else if (content.includes(token) || content.includes(tokenThai) || contentArabic.includes(tokenArabic)) {
        score += 20;
        matchedTokenCount++;
      }
    }

    // Extra bonus if all search tokens matched
    if (tokens.length > 1 && matchedTokenCount === tokens.length) {
      score += 100;
    }

    // Slight priority boost for non-repealed current laws
    if (score > 0 && !actById.get(item.actId)?.isRepealed) {
      score += 15;
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const total = scored.length;
  const startIndex = (page - 1) * pageSize;
  const items = scored.slice(startIndex, startIndex + pageSize).map(s => s.item);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
    acts,
    categories: allCategories,
    scopes
  };
}
