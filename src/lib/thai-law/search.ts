import rawData from '@/data/thai-law/police-laws.json';
import { PoliceLawSection, PoliceLawAct, LawSearchOptions, LawSearchResult } from './types';

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

const acts: PoliceLawAct[] = rawData.acts as PoliceLawAct[];
const sections: PoliceLawSection[] = rawData.catalog as PoliceLawSection[];

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

export function getLawActs(): PoliceLawAct[] {
  return acts;
}

export function getLawCategories() {
  return allCategories;
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
  const act = acts.find(a => a.id === section.actId) || null;

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
    actId = 'all',
    page = 1,
    pageSize = 20
  } = options;

  let pool = sections;

  // Category filter
  if (category && category !== 'ทั้งหมด') {
    pool = pool.filter(s => s.category === category);
  }

  // Act filter
  if (actId && actId !== 'all') {
    pool = pool.filter(s => s.actId === actId);
  }

  const query = q.trim().toLowerCase();

  if (!query) {
    const total = pool.length;
    const startIndex = (page - 1) * pageSize;
    const items = pool.slice(startIndex, startIndex + pageSize);
    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
      acts,
      categories: allCategories
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
    const content = item.content.toLowerCase();

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

    // 2. Act Title match
    if (title.includes(query)) {
      score += 200;
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
      } else if (title.includes(token)) {
        score += 50;
        matchedTokenCount++;
      } else if (content.includes(token)) {
        score += 20;
        matchedTokenCount++;
      }
    }

    // Extra bonus if all search tokens matched
    if (tokens.length > 1 && matchedTokenCount === tokens.length) {
      score += 100;
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
    totalPages: Math.ceil(total / pageSize),
    items,
    acts,
    categories: allCategories
  };
}
