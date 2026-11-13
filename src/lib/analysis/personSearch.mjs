import { normalizeName } from './engine.mjs';

const THAI_MONTHS_SHORT = [
  '',
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/**
 * Minimum tenure years in current level required for promotion to the next higher level
 * under พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗ and กฎ ก.ตร.ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. ๒๕๖๗ ข้อ ๑๗
 */
export const MINIMUM_TENURE_RULES = {
  'รอง ผบ.ตร. / จตช.': {
    requiredYears: 0,
    nextLevel: 'ผบ.ตร.',
    previousLevelLabel: 'ผู้ช่วย ผบ.ตร. / รอง จตช.',
    rankColumnLabels: ['รอง ผบ.ตร.', 'ผู้ช่วย ผบ.ตร.', 'ผบช.', 'รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๑) (ระดับ รอง ผบ.ตร. หรือ จตช. เพื่อคัดเลือกเป็น ผบ.ตร.)',
  },
  'ผู้ช่วย ผบ.ตร. / รอง จตช.': {
    requiredYears: 1,
    nextLevel: 'รอง ผบ.ตร. / จตช.',
    previousLevelLabel: 'ผบช. / จตร.',
    rankColumnLabels: ['ผู้ช่วย ผบ.ตร.', 'ผบช.', 'รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๒) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๑), ข้อ ๑๐(๑) (ระดับ ผู้ช่วย ผบ.ตร. / รอง จตช. ไม่น้อยกว่า ๑ ปี เพื่อเลื่อนเป็น รอง ผบ.ตร. / จตช.)',
  },
  'ผบช. / จตร. / เทียบเท่า': {
    requiredYears: 1,
    nextLevel: 'ผู้ช่วย ผบ.ตร. / รอง จตช.',
    previousLevelLabel: 'รอง ผบช. / รอง จตร.',
    rankColumnLabels: ['ผบช.', 'รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๓) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๒), ข้อ ๑๐(๑) (ระดับ ผบช. / จตร. ไม่น้อยกว่า ๑ ปี เพื่อเลื่อนเป็น ผู้ช่วย ผบ.ตร. / รอง จตช.)',
  },
  'รอง ผบช. / รอง จตร. / เทียบเท่า': {
    requiredYears: 2,
    nextLevel: 'ผบช. / จตร.',
    previousLevelLabel: 'ผบก.',
    rankColumnLabels: ['รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๔) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๓), ข้อ ๑๐(๑) (ระดับ รอง ผบช. / รอง จตร. ไม่น้อยกว่า ๒ ปี เพื่อเลื่อนเป็น ผบช. / จตร.)',
  },
  'รอง ผบช. / เทียบเท่า': {
    requiredYears: 2,
    nextLevel: 'ผบช. / นายแพทย์ใหญ่ (สบ ๘)',
    previousLevelLabel: 'ผบก. / นายแพทย์ (สบ ๖)',
    rankColumnLabels: ['รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๔) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๓), ข้อ ๑๐(๑) (ระดับ รอง ผบช. ไม่น้อยกว่า ๒ ปี เพื่อเลื่อนเป็น ผบช. / นายแพทย์ใหญ่)',
  },
  'ผบก. / เทียบเท่า': {
    requiredYears: 3,
    nextLevel: 'รอง ผบช. / รอง จตร.',
    previousLevelLabel: 'รอง ผบก.',
    rankColumnLabels: ['ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๕) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๔), ข้อ ๑๐(๑) (ระดับ ผบก. ไม่น้อยกว่า ๓ ปี เพื่อเลื่อนเป็น รอง ผบช. / รอง จตร.)',
  },
  'รอง ผบก. / เทียบเท่า': {
    requiredYears: 4,
    nextLevel: 'ผบก.',
    previousLevelLabel: 'ผกก.',
    rankColumnLabels: ['รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๖) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๕), ข้อ ๑๐(๑) (ระดับ รอง ผบก. ไม่น้อยกว่า ๔ ปี เพื่อเลื่อนเป็น ผบก.)',
  },
  'ผกก. (เลื่อนเป็น รอง ผบก.)': {
    requiredYears: 4,
    nextLevel: 'รอง ผบก.',
    previousLevelLabel: 'รอง ผกก. / สวญ.',
    rankColumnLabels: ['ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๗) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๖) (ระดับ ผกก. ไม่น้อยกว่า ๔ ปี เพื่อเลื่อนเป็น รอง ผบก.)',
  },
  'รอง ผกก. / สวญ. (เลื่อนเป็น ผกก.)': {
    requiredYears: 4,
    nextLevel: 'ผกก.',
    previousLevelLabel: 'สว.',
    rankColumnLabels: ['รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๘) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๗) (ระดับ รอง ผกก. หรือ สวญ. ไม่น้อยกว่า ๔ ปี เพื่อเลื่อนเป็น ผกก.)',
  },
  'สว. (เลื่อนเป็น รอง ผกก. / สวญ.)': {
    requiredYears: 5,
    nextLevel: 'รอง ผกก. / สวญ.',
    previousLevelLabel: 'รอง สว.',
    rankColumnLabels: ['สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๙) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๘) (ระดับ สว. ไม่น้อยกว่า ๕ ปี เพื่อเลื่อนเป็น รอง ผกก. / สวญ.)',
  },
  'รอง สว. (เลื่อนเป็น สว.)': {
    requiredYears: 7,
    nextLevel: 'สว.',
    previousLevelLabel: 'ผบ.หมู่',
    rankColumnLabels: ['รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๑๐) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๙) (ระดับ รอง สว. ไม่น้อยกว่า ๗ ปี เพื่อเลื่อนเป็น สว.)',
  },
};

export function parseThaiDateBE(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let yearBE = Number(m[3]);
  if (yearBE < 2400) yearBE += 543;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return {
    raw: `${day}/${String(month).padStart(2, '0')}/${yearBE}`,
    day,
    month,
    yearBE,
    yearCE: yearBE - 543,
    formattedThai: `${day} ${THAI_MONTHS_SHORT[month] || month} ${yearBE}`,
  };
}

/**
 * คำนวณปีครบเกษียณอายุราชการ (60 ปีบริบูรณ์)
 * กฎหมายบำเหน็จบำนาญข้าราชการ: เกิดหลังวันที่ 30 ก.ย. (คือตั้งแต่ 1 ต.ค. - 31 ธ.ค.) ได้บวกปีเกษียณเพิ่ม 1 ปี (ปีเกิด พ.ศ. + 61)
 * กรณีเกิดวันที่ 1 ม.ค. - 30 ก.ย. เกษียณปีเกิด พ.ศ. + 60
 */
export function calculateRetirementInfo(birthDateStr, referenceYearBE = 2569) {
  const parsed = parseThaiDateBE(birthDateStr);
  if (!parsed) return null;
  const bornAfterSep30 = parsed.month >= 10; // ต.ค. (10), พ.ย. (11), ธ.ค. (12) คือเกิดหลัง 30 ก.ย.
  const retirementYearBE = parsed.yearBE + 60 + (bornAfterSep30 ? 1 : 0);
  const remainingYearsFrom2569 = retirementYearBE - referenceYearBE;
  return {
    birthDate: parsed.raw,
    birthDateThai: parsed.formattedThai,
    birthDay: parsed.day,
    birthMonth: parsed.month,
    birthYearBE: parsed.yearBE,
    bornAfterSep30,
    retirementYearBE,
    retirementDateThai: `30 ก.ย. ${retirementYearBE}`,
    remainingYearsFrom2569,
    explanation: bornAfterSep30
      ? `พ.ศ. ${retirementYearBE} (เกิด ${parsed.formattedThai} หลัง 30 ก.ย. ได้บวกปีเกษียณเพิ่ม +1 ปี)`
      : `พ.ศ. ${retirementYearBE} (เกิด ${parsed.formattedThai} ก่อน/ภายใน 30 ก.ย. คำนวณ +60 ปีปกติ)`,
  };
}

/**
 * คำนวณระยะเวลาดำรงตำแหน่งปัจจุบัน และระยะเวลาที่ครบหลักเกณฑ์เลื่อนตำแหน่งสูงขึ้น
 * เทียบ ณ วันสิ้นปีงบประมาณ/วันคำนวณเกณฑ์วาระประจำปี (30 ก.ย. 2569 / 1 ต.ค. 2569)
 */
export function calculateTenureAndEligibility(currentPosDateStr, sourceLevel, referenceDateStr = '1/10/2569') {
  const start = parseThaiDateBE(currentPosDateStr);
  const ref = parseThaiDateBE(referenceDateStr) || { day: 1, month: 10, yearBE: 2569 };
  const rule = MINIMUM_TENURE_RULES[sourceLevel] || {
    requiredYears: 4,
    nextLevel: 'ระดับสูงขึ้น',
    previousLevelLabel: 'ระดับก่อนหน้า',
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗ และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗',
  };

  if (!start) {
    return {
      currentPositionDate: null,
      currentPositionDateThai: null,
      tenureYears: null,
      tenureMonths: null,
      tenureTotalYearsDecimal: null,
      tenureDisplay: 'ไม่ปรากฏข้อมูลวันเริ่มดำรงตำแหน่งในตาราง',
      requiredYears: rule.requiredYears,
      eligibleYearBE: null,
      yearsPastEligibility: null,
      monthsPastEligibility: null,
      isEligible: null,
      eligibilityDisplay: `เกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี`,
      legalBasis: rule.legalBasis,
    };
  }

  const isAnnualRoundDate = start.month >= 10; // วาระประจำปี (ต.ค.–ธ.ค.) นับถึงวาระประจำปีถัดไปเป็น 1 ปีเต็มตาม กฎ ก.ตร.ฯ ข้อ ๑๐(๑)
  let totalMonths;
  if (isAnnualRoundDate && ref.month >= 10) {
    totalMonths = Math.max(0, (ref.yearBE - start.yearBE) * 12);
  } else {
    totalMonths = (ref.yearBE - start.yearBE) * 12 + (ref.month - start.month);
    if (ref.day < start.day) {
      totalMonths -= 1;
    }
    if (totalMonths < 0) totalMonths = 0;
  }

  const tenureYears = Math.floor(totalMonths / 12);
  const tenureMonths = totalMonths % 12;
  const tenureTotalYearsDecimal = Number((totalMonths / 12).toFixed(2));

  const requiredMonths = rule.requiredYears * 12;
  const diffMonths = totalMonths - requiredMonths;
  const isEligible = diffMonths >= 0;
  const yearsPastEligibility = isEligible ? Math.floor(diffMonths / 12) : 0;
  const monthsPastEligibility = isEligible ? diffMonths % 12 : 0;
  const eligibleYearBE = start.yearBE + rule.requiredYears;

  const tenureDisplay =
    tenureMonths > 0
      ? `${tenureYears} ปี ${tenureMonths} เดือน (ตั้งแต่วันที่ ${start.formattedThai})`
      : `${tenureYears} ปีบริบูรณ์ (ตั้งแต่วันที่ ${start.formattedThai}${isAnnualRoundDate ? ' · นับวาระประจำปีตามข้อ ๑๐(๑)' : ''})`;

  const ruleSuffix = isAnnualRoundDate ? ' · นับตามข้อ ๑๐(๑)' : '';
  let eligibilityDisplay;
  if (rule.requiredYears === 0) {
    eligibilityDisplay = `ครบหลักเกณฑ์ระดับสูงสุด (ดำรงตำแหน่งมาแล้ว ${tenureYears} ปี${tenureMonths > 0 ? ` ${tenureMonths} เดือน` : ''})`;
  } else if (isEligible) {
    if (yearsPastEligibility === 0 && monthsPastEligibility === 0) {
      eligibilityDisplay = `ครบเกณฑ์ ${rule.requiredYears} ปีแล้วในปี พ.ศ. ${eligibleYearBE}${ruleSuffix}`;
    } else if (monthsPastEligibility > 0) {
      eligibilityDisplay = `ครบเกณฑ์มาแล้ว ${yearsPastEligibility} ปี ${monthsPastEligibility} เดือน (ครบเกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี ตั้งแต่ พ.ศ. ${eligibleYearBE}${ruleSuffix})`;
    } else {
      eligibilityDisplay = `ครบเกณฑ์มาแล้ว ${yearsPastEligibility} ปี (ครบเกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี ตั้งแต่ พ.ศ. ${eligibleYearBE}${ruleSuffix})`;
    }
  } else {
    const shortMonths = Math.abs(diffMonths);
    const shortY = Math.floor(shortMonths / 12);
    const shortM = shortMonths % 12;
    eligibilityDisplay = `ยังไม่ครบเกณฑ์ ${rule.requiredYears} ปี (ขาดอีก ${shortY > 0 ? `${shortY} ปี ` : ''}${shortM > 0 ? `${shortM} เดือน` : ''})`;
  }

  return {
    currentPositionDate: start.raw,
    currentPositionDateThai: start.formattedThai,
    tenureYears,
    tenureMonths,
    tenureTotalYearsDecimal,
    tenureDisplay,
    requiredYears: rule.requiredYears,
    eligibleYearBE,
    yearsPastEligibility,
    monthsPastEligibility,
    isEligible,
    isAnnualRoundCount: isAnnualRoundDate && ref.month >= 10,
    eligibilityDisplay,
    legalBasis: rule.legalBasis,
    nextLevel: rule.nextLevel,
    previousLevelLabel: rule.previousLevelLabel,
  };
}

/**
 * ดึงลำดับวันที่จากหน้า PDF บัญชีอาวุโส สำหรับลำดับอาวุโสที่ระบุ (กรณีค้นหาตามลำดับอาวุโสในบัญชี)
 */
export function lookupDatesByAccountAndOrder(knowledgeBundle, sourceLevel, sourceAccount, seniorityOrder) {
  if (!knowledgeBundle || !sourceLevel || !sourceAccount || !Number.isInteger(seniorityOrder) || seniorityOrder < 1) {
    return null;
  }
  const acc = (knowledgeBundle.accounts || []).find(
    (a) => a.source_level === sourceLevel && a.source_account === sourceAccount,
  );
  if (!acc || !acc.source_page_start) return null;
  const pageOffset = Math.floor((seniorityOrder - 1) / 20);
  const targetPage = acc.source_page_start + pageOffset;
  if (acc.source_page_end && targetPage > acc.source_page_end) return null;
  const pageRows = knowledgeBundle.pageRowDates?.[targetPage] || [];
  const rowIdx = (seniorityOrder - 1) % 20;
  const dates = pageRows[rowIdx];
  if (!Array.isArray(dates) || dates.length < 2) {
    return { targetPage, dates: [] };
  }
  return {
    targetPage,
    dates,
    currentPositionDate: dates[0] || null,
    previousPositionDate: dates[1] || null,
    birthDate: dates[dates.length - 1] || null,
  };
}

/**
 * สร้างประวัติวันดำรงตำแหน่งย้อนหลังแต่ละระดับจากคอลัมน์วันที่ในบัญชีอาวุโส
 */
export function buildRankHistoryTimeline(rankDates, sourceLevel) {
  if (!Array.isArray(rankDates) || rankDates.length < 2) return [];
  const rule = MINIMUM_TENURE_RULES[sourceLevel];
  const labels = rule?.rankColumnLabels || [];
  // Last item is always วันเกิด
  const posDates = rankDates.slice(0, -1);
  return posDates.map((d, idx) => {
    const parsed = parseThaiDateBE(d);
    const label = labels[idx] || (idx === 0 ? 'ระดับปัจจุบัน' : idx === 1 ? 'ระดับก่อนหน้า' : `ระดับย้อนหลังลำดับที่ ${idx + 1}`);
    return {
      step: idx + 1,
      levelLabel: label,
      date: parsed?.raw || d,
      dateThai: parsed?.formattedThai || d,
    };
  });
}

/**
 * Standardize source level names to match canonical seniority accounts
 */
export function canonicalLevel(rawLevel) {
  if (!rawLevel) return '';
  const s = String(rawLevel).trim();
  if (s.includes('ผู้ช่วย ผบ.ตร') || s.includes('ผู้ช่วยผู้บัญชาการตำรวจแห่งชาติ') || s.includes('รอง จตช') || s.includes('รองจเรตำรวจแห่งชาติ')) {
    return 'ผู้ช่วย ผบ.ตร. / รอง จตช.';
  }
  if (s.includes('รอง ผบ.ตร') || s.includes('รองผู้บัญชาการตำรวจแห่งชาติ') || s.includes('จตช') || s.includes('จเรตำรวจแห่งชาติ')) {
    return 'รอง ผบ.ตร. / จตช.';
  }
  if (s.includes('ผบช') || s.includes('จตร') || s.includes('ผู้บัญชาการ') || s.includes('จเรตำรวจ')) {
    if (s.includes('รอง')) return s.includes('แพทย์') ? 'รอง ผบช. / เทียบเท่า' : 'รอง ผบช. / รอง จตร. / เทียบเท่า';
    return 'ผบช. / จตร. / เทียบเท่า';
  }
  if (s.includes('ผบก') || s.includes('ผู้บังคับการ')) {
    if (s.includes('รอง')) return 'รอง ผบก. / เทียบเท่า';
    return 'ผบก. / เทียบเท่า';
  }
  if (s.includes('ผกก') || s.includes('ผู้กำกับการ')) {
    if (s.includes('รอง')) return 'รอง ผกก. / สวญ. (เลื่อนเป็น ผกก.)';
    return 'ผกก. (เลื่อนเป็น รอง ผบก.)';
  }
  if (s.includes('สว.') || s.includes('สารวัตร')) {
    if (s.includes('รอง')) return 'รอง สว. (เลื่อนเป็น สว.)';
    return 'สว. (เลื่อนเป็น รอง ผกก. / สวญ.)';
  }
  return s;
}

/**
 * ค้นหาและเปรียบเทียบข้อมูลข้าราชการตำรวจจากฐานข้อมูลในเครื่อง 100% (Zero-API-Cost)
 */
export const DIRECT_OCR_MAP = {
  "1รพงษ์ ถนอมจิตร": "จิรพงษ์ ถนอมจิตร",
  "33005 ศิรบญภาคย์": "สิริณัฐ ศิรบุญภาคย์",
  "51549 จิกิตศิลปิน": "ธำรง วิจิตศิลปิน",
  "591 แบ่งเครื่อง": "ธรา แปงเครื่อง",
  "5998 ธีระจรรยาภรณ์": "ธงชัย ธีระจรรยาภรณ์",
  "A159 อำพรรทอง": "ธีรพงษ์ อำพรรทอง",
  "ALN รักษาสวรรณ": "ยศเอก รักษาสุวรรณ",
  "ALN รักษาสุวรรณ": "ยศเอก รักษาสุวรรณ",
  "ANNA ABU": "อรรถพล อนุสิทธิ์",
  "ARNT เอกสิงหชัย": "ศิริ เอกสิงหชัย",
  "ATR ชาวศรีทอง": "ดำรงศักดิ์ ชาวศรีทอง",
  "AUN เสถียรพงศ์": "สุเทพ เสถียรพงศ์",
  "AUNT อรณนารา": "สุนทร อรุณนารา",
  "AWA คำพานิช": "อำนาจ คำพานิช",
  "BNI ช่วยศรี": "บุญเลิศ ช่วยศรี",
  "BUN อะนันทวรรณ": "เอนก อะนันทวรรณ",
  "DANS ทองทิพย์": "เดชา ทองทิพย์",
  "DUN บตรอินทร์": "ดนัย บุตรอินทร์",
  "Fons ทองนาเพียง": "ธีระพงษ์ ทองนาเพียง",
  "HAY อาภาวศิน": "นิเวศน์ อาภาวศิน",
  "Insane วัชรเสวิ": "ไกรวิทย์ วัชรเสวี",
  "LOAN มารศรี": "มานพ มารศรี",
  "NS ปานดำ": "ฤทธิ์ ปานดำ",
  "Naan แอร่มหล้า": "พัลลภ แอร่มหล้า",
  "SAUNT สุนทรโชติ": "สุทธิพงศ์ สุนทรโชติ",
  "SHUT ธรรเมศรานนท์": "ชูสิทธิ์ ธรรเมศรานนท์",
  "SINT ชิ้นทอง": "อาทร ชิ้นทอง",
  "SU พวงมณี": "ธนู พวงมณี",
  "SUT แก่นจันทร์": "ยุทธนา แก่นจันทร์",
  "Suna รัตนประทีป": "สุรเชษฐ์ รัตนประทีป",
  "Suwa ลีลาประภาภรณ์": "กัมพล ลีลาประภาภรณ์",
  "TUN อนุเอกจิตร": "ธัชพล อนุเอกจิตร",
  "URS เทศขัน": "มนตรี เทศขัน",
  "USUI ชงัดเวช": "ณฐมณฑ์ ชงัดเวช",
  "Was ตันประเสริฐ": "พิสิฐ ตันประเสริฐ",
  "YATE เหล่าอารยะ": "โชคชัย เหล่าอารยะ",
  "YE กวินเดชาธร": "อุทัย กวินเดชาธร",
  "a5 ภษาชีวะ": "ชูศักดิ์ พฤกษาชีวะ",
  "le การปลก": "นิมิต การปลูก",
  "nan วาลีประโคน": "วิโรจน์ วาลีประโคน",
  "ning ไชยสถิตย์": "สานิตย์ ไชยสถิตย์",
  "uals วงษ์กล้าหาญ": "สุทธิพงษ์ วงษ์กล้าหาญ",
  "un จันทร์ศร": "เอนก จันทร์ศร",
  "ก4พวัฒน์ อารยางกร": "ณพวัฒน์ อารยางกูร",
  "กริกกมล แย้มประยร": "เกริกกมล แย้มประยูร",
  "กอฎตธาพล  ยี่สาคร": "กฤตธาพล ยี่สาคร",
  "กิงกาญจน์ กฤษณสุวรรณ": "กิ่งกาญจน์ กฤษณสุวรรณ",
  "ขชนะ จงโชคดี": "ชนะ จงโชคดี",
  "ขนกนาถ สุวรรณรัตน์": "ชนกนาถ สุวรรณรัตน์",
  "ขอดขวัญ อภิกลซาติกิจ": "ยอดขวัญ อภิกุลชาติกิจ",
  "จนตนา วชิรกิติกล": "จินตนา วชิรกิติกุล",
  "จมพภ อรพงศา": "จุมพฏ อุรุพงศา",
  "จมพร พกหอม": "ชุมพร พุกหอม",
  "จรภพ ภริเดช": "จิรภพ ภูริเดช",
  "จราย วิสตรานกล": "จิรายุ วิสูตรานุกูล",
  "จวรรณี บรณวัฒนาโชค": "สุวรรณี บูรณวัฒนาโชค",
  "จันติ ชัยนิรามัย": "สันติ ชัยนิรามัย",
  "จารวัตร เวชศิลป์": "จารุวัตร เวชศิลป์",
  "จิกิตศิลปิน": "ธำรง วิจิตศิลปิน",
  "ฉลิมเกียรติ รวีภควัต": "เฉลิมเกียรติ รวีภควัต",
  "ชยวัจน์ สีบุญเรื่อง": "ชยวัจน์ สีบุญเรือง",
  "ชัยต์พจน สวรรณรักษ์": "ชัยต์พจน์ สุวรรณรักษ์",
  "ชาวลิต พัฒนสิริกล": "เชาวลิต พัฒนสิริกุล",
  "ชำนาญ เอี่ยมศิริกลมิตร": "ชำนาญ เอี่ยมศิริกุลมิตร",
  "ฏา ภจพนธ์ พยอมใหม่": "ณัฏฐพนธ์ พยอมใหม่",
  "ฑทอดทล สร้อยสุขพาพันธ์": "เทอดทูล สร้อยสุขพาพันธ์",
  "ณรงค์ฤทธิ์ ด่านสวรรณ์": "ณรงค์ฤทธิ์ ด่านสุวรรณ์",
  "ณ์ธวฒิ NANA": "ณัฐวุฒิ ภาคภูมิ",
  "ทธิชัย สงค์อนุกล": "สุทธิชัย สงค์อนุกูล",
  "ทวีศักดิ์ จรรยาพน": "ทวีศักดิ์ จรรยาพูน",
  "ทองศูนย์ DUA": "ทองศูนย์ อุ่นวงค์",
  "ทัดดาว โฉมลักษณ์": "ทัดดาว โถมลักษณ์",
  "ทิพย์ฆัมพร เกษโกมล": "ทิพย์อัมพร เกษโกมล",
  "ธรจิต ซิงนวรรณ์": "สุรจิต ชิงนวรรณ์",
  "ธี เสน่ห์ลักษณา": "สุธี เสน่ห์ลักษณา",
  "ธี เอี่ยมเจริณยิ่ง": "สุธี เอี่ยมเจริญยิ่ง",
  "ธีระจรรยาภรณ์": "ธงชัย ธีระจรรยาภรณ์",
  "นันทชัย กศลศิลป์วฒิ": "นันทชัย กุศลศิลป์วุฒิ",
  "นันทวฒิ สวรรณละออง": "นันทวุฒิ สุวรรณละออง",
  "นาถ นันทรัตพันธ์": "นาถ นันทรัตน์พันธุ์",
  "นเรนทร์ สันติกลานนท์": "นเรนทร์ สันติกุลานนท์",
  "บณฑริกา สุวรรณเวโช": "บุณฑริกา สุวรรณเวโช",
  "บัญชา ชีวะอิสระกล": "บัญชา ชีวะอิสระกุล",
  "บันเจิด จิตาภิวัฒนกล": "บันเจิด ฐิตาภิวัฒนกุล",
  "บุญจวรรณ วุฒิวรวงศ์": "เบญจวรรณ วุฒิวรวงศ์",
  "บุณฑล บัวจีบ": "มณฑล บัวจีบ",
  "บูมิตต์ อุตมา": "นิมิตต์ อุตมา",
  "ปญจมาพร ซาตะคุณ": "ปัญจมาพร ชาตะคุณ",
  "ปญญวัชร ภาษีผล": "ปัญญวัชร ภาษีผล",
  "ปพัฒน์ วสธวัช": "นภพัฒน์ วสุธวัช",
  "ปภัช ปณันพัทธ์ชา": "ณปภัช ปณันพัทธ์ชา",
  "ปยบุตร ไพิบูลย์": "ปิยบุตร ไพบูลย์",
  "ปยะวัฒน์ เฉลิมศรี": "ปิยะวัฒน์ เฉลิมศรี",
  "ปรรพต เดชมา": "บรรพต เดชมา",
  "ปิตภพ โตเหมือน": "ชิตภพ โตเหมือน",
  "ผูเวศ สิงห์วงษ์": "นิเวศ สิงห์วงษ์",
  "พงศกร จิตโชติ": "พงศกร ฐิตโชติ",
  "พล Ane": "สุพล ค้ำชู",
  "พัสวี วนานวัธ": "พัสวี วนานุวัธ",
  "พิทักษ์ อทัยธรรม": "พิทักษ์ อุทัยธรรม",
  "พุศวีร์ Sean": "พศวีร์ เรืองภู่",
  "พโรจน์ สขรวยธนโชติ": "ไพโรจน์ สุขรวยธนโชติ",
  "ภาณพงศ์ ชอบเพื่อน": "ภาณุพงศ์ ชอบเพื่อน",
  "มชัย สีเจริญ": "มีชัย สีเจริญ",
  "มณัติ คำปาละ": "สมบัติ คำปาละ",
  "มานพ NUBIA": "มานพ ภุชงค์",
  "รพงษ์ ถนอมจิตร": "จิรพงษ์ ถนอมจิตร",
  "รัชนี ชาญสไชย": "รัชนี ชาญสุไชย",
  "รัตน์ สาเรือง": "สุรัตน์ สาเรือง",
  "รีรัตน์ จารหทัย": "สุรีรัตน์ จารุหทัย",
  "วนพล ศรีโสภา": "ธนพล ศรีโสภา",
  "วนาวรรณ มาเซโด": "ธนาวรรณ มาเชโด",
  "วมล พิทักษ์บรพา": "วิมล พิทักษ์บูรพา",
  "วรพจน์ ดิษยบตร": "วรพจน์ ดิษยบุตร",
  "วรรมโรจน์ ปญญโชติ": "ธรรมโรจน์ ปุญญโชติ",
  "วส เทพชาตรี": "วสุ เทพชาตรี",
  "วสุทธิ์ พันธ์ฤทธิ์": "ธีรสุทธิ์ พันธ์ฤทธิ์",
  "วัครพร ดีประเสริฐวิทย์": "อัครพร ดีประเสริฐวิทย์",
  "วัญญ์จิตา ศรีภา": "กัญญ์ฐิตา ศรีภา",
  "วัญลักษณ์ of": "ธัญลักษณ์ ธุดี",
  "วัสพล ตันตะราวงศา": "อัสพล ตันตะราวงศา",
  "วิตติพงศ์ เศรษฐไกรสิงห์": "กิตติพงศ์ เศรษฐไกรสิงห์",
  "ว่งโรจน์ ฐากรปณยสิริ": "รุ่งโรจน์ ฐากูรปุณยสิริ",
  "ศิรบญภาคย์": "สิริณัฐ ศิรบุญภาคย์",
  "ศิรบุญภาคย์": "สิริณัฐ ศิรบุญภาคย์",
  "สถืยร uaa": "เสถียร บุญค้ำ",
  "สยาม บญสม": "สยาม บุญสม",
  "สรพล เปรมบตร": "สรพล เปรมบุตร",
  "สวินท์ หรรษมนตร์": "สุวินท์ หรรษมนตร์",
  "สาวพักตร์ วงศ์ทองคำ": "เสาวพักตร์ วงศ์ทองคำ",
  "หทัยรัตน์ ลาวัณย์รัตนากล": "หทัยรัตน์ ลาวัณย์รัตนากุล",
  "หพัฒน์ หอมจันทร์": "สหพัฒน์ หอมจันทร์",
  "อกสิทธิ์ หงส์แก้ว": "เอกสิทธิ์ หงส์แก้ว",
  "อทธิพล นาคคำ": "อิทธิพล นาคคำ",
  "อทธิพล อิทธิสารรณชัย": "อิทธิพล อิทธิสารรณชัย",
  "อนชัย ณ วัชรเจริญ": "อนุชัย ณ วัชรเจริญ",
  "อนุสรณ์ พัฒนถาบตร": "อนุสรณ์ พัฒนถาบุตร",
  "อบูซา รมยะนบันทน์": "อนุชา รมยะนันทน์",
  "อารญา โถวรุงเรือง": "อารญา โถวะรุ่งเรือง",
  "ฮิทธิพงษ์ ศรีเลอจันทร์": "สิทธิพงษ์ ศรีเลอจันทร์",
  "ฮ์รีศักดิ์ พรหมบุญ": "ศรีศักดิ์ พรหมบุญ",
  "ฯธี เอี่ยมเจริณยิ่ง": "สุธี เอี่ยมเจริญยิ่ง",
  "ฯพล Ane": "สุพล ค้ำชู",
  "ฯมิทธิ สวรรณสขโรจน์": "สมิทธิ สุวรรณสุขโรจน์",
  "ฯๆวัฒน์ แสงนุ่ม": "สุวัฒน์ แสงนุ่ม",
  "างกรานต์ สันหกรณ์": "สงกรานต์ สันหกรณ์",
  "างชัย เนตรสขาวัฒน์": "ธงชัย เนตรสขาวัฒน์",
  "างชัย เนตรสุขาวัฒน์": "ธงชัย เนตรสขาวัฒน์",
  "างฐณวิทย์ สิทธาภิรมย์": "ณัฏฐวิทย์ สิทธาภิรมย์",
  "าจฐ บัณฑรัตน์": "วิจิตร บัณฑรัตน์",
  "าญชล อินทราราม": "กาญจน์ชล อินทราราม",
  "าฏตภาส กิตติรัฐธกรณ์": "กฤตภาส กิตติรัฐกรณ์",
  "าฏฤษภา ตันติไพบลย์วงศ์": "กฤษฎา ตันติไพบูลย์วงศ์",
  "าฏฤษภา ตันติไพิบูลย์วงศ์": "กฤษฎา ตันติไพบูลย์วงศ์",
  "าฑธิรงค์ โชติกลาง": "ฤทธิรงค์ โชติกลาง",
  "าตติ แสงศิริวฒิ": "กิตติ แสงศิริวุฒิ",
  "าติพงษ์ คล้ายแก้ว": "กิติพงษ์ คล้ายแก้ว",
  "าถตยา เลาประสพวัฒนา": "กฤตยา เลาประสพวัฒนา",
  "าถฤษภากรณ์ กลิ่นเกษร": "กฤษฎากรณ์ กลิ่นเกษร",
  "าถษภา สรเชษฐพงษ์": "กฤษฎา สุรเชษฐพงษ์",
  "าทธิชัย ชางคำ": "ฤทธิชัย ช่างคำ",
  "าธิชา วงศาโรจน์": "สุธิชา วงศาโรจน์",
  "านพล บินทปัญญา": "ธนพล บินทปัญญา",
  "านศักดิ์ ศักดาวัชรานนท์": "อนุศักดิ์ ศักดาวัชรานนท์",
  "านอมศักดิ์ รู้ยืนยง": "ถนอมศักดิ์ รู้ยืนยง",
  "านเดช ตันติอาภา": "มานเดช ตันติอาภา",
  "าพิไชย ลื่มศิวะวงศ์": "สุพิไชย ลิ่มศิวะวงศ์",
  "ามล นุ่มหอม": "กมล นุ่มหอม",
  "ามสัน สขมาก": "รามสูรย์ สุขมาก",
  "ายภจ์ จันทร์ถาวร": "สายภพ จันทร์ถาวร",
  "ารกมล หยงสตาร์": "กรกมล หยงสตาร์",
  "ารธวัช สวัสดิ์โรจน์": "วรธวัช สวัสดิ์โรจน์",
  "ารพัฒน์ หอมหวล": "กรพัฒน์ หอมหวล",
  "ารรถพล วนาเดช": "อรรถพล วนาเดช",
  "ารรมนูญ บุญเรือง": "ธรรมนูญ บุญเรือง",
  "ารวิชญ์ วิจิตรพรกล": "สรวิชญ์ วิจิตรพรกุล",
  "าราวัฒน์ ศักดิ์ศรีวัฒนา": "จิราวัฒน์ ศักดิ์ศรีวัฒนา",
  "าฤติชาติ กำจรปรีชา": "กฤติชาติ กำจรปรีชา",
  "าฤศ จันทร์สว่าง": "กฤษ จันทร์สว่าง",
  "าฤษดา ศรีอิสาณ": "กฤษดา ศรีอิสาณ",
  "าลเซษจ์ บางพราน": "กุลเชษฐ์ บางพราน",
  "าล้าหาญณ โชคพิพัฒน์ไพบลย์": "กล้าหาญ โชคพิพัฒน์ไพบูลย์",
  "าล้าหาญณ โชคพิพัฒน์ไพิบูลย์": "กล้าหาญ โชคพิพัฒน์ไพบูลย์",
  "าวัช มลศาสตรสาทร": "ชูวัช มนต์ศาสตร์สาทร",
  "าวินศักดิ์ พีรยศธนนนท์": "กวินศักดิ์ พีรยศธนนนท์",
  "าศล ป้องบุญจันทร์": "กุศล ป้องบุญจันทร์",
  "าสินธ์ ธำรงศรีสข": "กสินธุ์ ธำรงศรีสุข",
  "าสินธ์ ธำรงศรีสุข": "กสินธุ์ ธำรงศรีสุข",
  "าองกฤษภา กิตติถิระพงษ์": "กฤษฎา กิตติถิระพงษ์",
  "าานต์พิชชา สุทธิสัตยารักษ์": "กานต์พิชชา สุทธิสัตยารักษ์",
  "าาวร มีขำ": "ถาวร มีขำ",
  "าิตติพงศ์ พันธ์ศรี": "กิตติพงศ์ พันธ์ศรี",
  "าโธพงษ์ ปิตะบุตร": "ณัฐพงษ์ ปิตะบุตร",
  "าโัฐศักดิ์ เชาวนาศัย": "ณัฐศักดิ์ เชาวนาศัย",
  "เขเฮิต บุญทวี": "โฆษิต บุญทวี",
  "เชคชัย งามวงศ์": "โชคชัย งามวงศ์",
  "เพโรจน์ ค้มภัย": "ไพโรจน์ คุ้มภัย",
  "เมวดี ไชยเวช": "สมวดี ไชยเวช",
  "แบ่งเครื่อง": "ธรา แปงเครื่อง",
  "ไว ๆพร วสนาท": "สุภาพร วสนาท",
  "ๆธี เสน่ห์ลักษณา": "สุธี เสน่ห์ลักษณา",
  "ๆรพันธ์ มันคงดี": "ธีรพันธ์ มั่นคงดี",
  "จกรเทพ กุณชร ณ อยธยา": "จักรเทพ กุณชร ณ อยุธยา",
};

export function cleanThaiOcrName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (DIRECT_OCR_MAP[s]) return DIRECT_OCR_MAP[s];
  s = s.replace(/^[0-9ฯๆ1\s]+/, '');
  s = s.replace(/^า[โถ]\s*/, '');
  s = s.replace(/^ก4\s*/, '');
  s = s.replace(/ณ\s*อยธยา/g, 'ณ อยุธยา');
  s = s.replace(/ณอยุธยา/g, 'ณ อยุธยา');
  s = s.replace(/ณชุมแพ/g, 'ณ ชุมแพ');
  if (DIRECT_OCR_MAP[s]) return DIRECT_OCR_MAP[s];
  return s.trim();
}

export function thaiConsonantSkeleton(str) {
  if (!str) return '';
  return String(str)
    .replace(/[0-9๑-๙]/g, '')
    .replace(/[\u0E30-\u0E3A\u0E45\u0E47-\u0E4E]/g, '')
    .replace(/\s+/g, '');
}

const THAI_PHONETIC_CHAR_MAP = {
  ข: 'ก', ค: 'ก', ฅ: 'ก', ฆ: 'ก',
  ฉ: 'ช', จ: 'ช', ซ: 'ช', ฌ: 'ช',
  ฎ: 'ด',
  ฏ: 'ต',
  ฐ: 'ท', ฑ: 'ท', ฒ: 'ท', ถ: 'ท', ธ: 'ท',
  ณ: 'น',
  ป: 'บ',
  ผ: 'พ', ภ: 'พ',
  ฝ: 'ฟ',
  ญ: 'ย',
  ร: 'ล', ฬ: 'ล',
  ศ: 'ส', ษ: 'ส',
  ฮ: 'ห',
};

export function thaiPhoneticKey(str) {
  if (!str) return '';
  const cleaned = String(str)
    .normalize('NFC')
    .replace(/\u0E33/g, 'ม')
    .replace(/[\u0E30-\u0E4E0-9๑-๙\s]/g, '')
    .replace(/[^\u0E01-\u0E2EA-Za-z]/g, '');
  let out = '';
  let prev = '';
  for (const ch of cleaned) {
    const mapped = THAI_PHONETIC_CHAR_MAP[ch] || ch;
    if (mapped !== prev) {
      out += mapped;
      prev = mapped;
    }
  }
  return out;
}

function editDistance(a, b) {
  if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 4) return Math.abs(la - lb);
  const dp = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    let prev = i;
    let diag = i - 1;
    for (let j = 1; j <= lb; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = diag;
      } else {
        dp[j] = 1 + Math.min(diag, dp[j], prev);
      }
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        // transposition check skipped for O(n) single-row DP simplicity
      }
      diag = temp;
      prev = dp[j];
    }
  }
  return dp[lb];
}

function bestTokenFuzzyScore(qTokNorm, qTokPhonetic, targetTokens) {
  let best = 0;
  for (const t of targetTokens) {
    if (!t.norm) continue;
    if (t.norm === qTokNorm) return 95;
    if (t.norm.includes(qTokNorm) || (qTokNorm.length >= 3 && qTokNorm.includes(t.norm))) {
      best = Math.max(best, 85);
      continue;
    }
    if (qTokPhonetic && t.phonetic) {
      if (t.phonetic === qTokPhonetic) {
        best = Math.max(best, 78);
        continue;
      }
      if (qTokPhonetic.length >= 3 && (t.phonetic.includes(qTokPhonetic) || (t.phonetic.length >= 3 && qTokPhonetic.includes(t.phonetic)))) {
        best = Math.max(best, 72);
        continue;
      }
      const minLenPh = Math.min(qTokPhonetic.length, t.phonetic.length);
      if (minLenPh >= 3) {
        const sameInitial = qTokPhonetic[0] === t.phonetic[0];
        const maxEditPh = sameInitial && minLenPh <= 5 ? 2 : Math.max(1, Math.floor(minLenPh / 3));
        const dPh = editDistance(qTokPhonetic, t.phonetic);
        if (dPh <= maxEditPh) {
          best = Math.max(best, 72 - dPh * 9);
          continue;
        }
      }
    }
    if (qTokNorm.length >= 3 && t.norm.length >= 3) {
      const sameStart = qTokNorm[0] === t.norm[0] || (qTokPhonetic && t.phonetic && qTokPhonetic[0] === t.phonetic[0]);
      const minLenRaw = Math.min(qTokNorm.length, t.norm.length);
      const maxEdit = sameStart ? Math.max(1, Math.floor(minLenRaw / 3)) : Math.max(1, Math.floor(minLenRaw / 4));
      const dRaw = editDistance(qTokNorm, t.norm);
      if (dRaw <= maxEdit) {
        best = Math.max(best, 64 - dRaw * 10);
      }
    }
  }
  return best;
}

const FULL_RANK_ORDER = [
  'สิบตำรวจตรี',
  'สิบตำรวจโท',
  'สิบตำรวจเอก',
  'จ่าสิบตำรวจ',
  'ดาบตำรวจ',
  'ร้อยตำรวจตรี',
  'ร้อยตำรวจโท',
  'ร้อยตำรวจเอก',
  'พันตำรวจตรี',
  'พันตำรวจโท',
  'พันตำรวจเอก',
  'พลตำรวจตรี',
  'พลตำรวจโท',
  'พลตำรวจเอก',
];

const ABBREV_TO_FULL_RANK = [
  [/พล\.?\s*ต\.?\s*อ\.?/, 'พลตำรวจเอก'],
  [/พล\.?\s*ต\.?\s*ท\.?/, 'พลตำรวจโท'],
  [/พล\.?\s*ต\.?\s*ต\.?/, 'พลตำรวจตรี'],
  [/พ\.?\s*ต\.?\s*อ\.?/, 'พันตำรวจเอก'],
  [/พ\.?\s*ต\.?\s*ท\.?/, 'พันตำรวจโท'],
  [/พ\.?\s*ต\.?\s*ต\.?/, 'พันตำรวจตรี'],
  [/ร\.?\s*ต\.?\s*อ\.?/, 'ร้อยตำรวจเอก'],
  [/ร\.?\s*ต\.?\s*ท\.?/, 'ร้อยตำรวจโท'],
  [/ร\.?\s*ต\.?\s*ต\.?/, 'ร้อยตำรวจตรี'],
  [/ด\.?\s*ต\.?/, 'ดาบตำรวจ'],
  [/จ\.?\s*ส\.?\s*ต\.?/, 'จ่าสิบตำรวจ'],
  [/ส\.?\s*ต\.?\s*อ\.?/, 'สิบตำรวจเอก'],
  [/ส\.?\s*ต\.?\s*ท\.?/, 'สิบตำรวจโท'],
  [/ส\.?\s*ต\.?\s*ต\.?/, 'สิบตำรวจตรี'],
];

function rankPriority(fullRank) {
  const clean = String(fullRank || '').replace(/^ว่าที่\s*/, '').replace(/\s*หญิง$/, '').trim();
  return FULL_RANK_ORDER.indexOf(clean);
}

export function normalizeFullRank(rawRank) {
  const s = String(rawRank || '').trim();
  if (!s) return '';
  const isFemale = /หญิง/.test(s);
  const acting = /^ว่าที่\s*/.test(s) ? 'ว่าที่ ' : '';
  for (const base of [...FULL_RANK_ORDER].reverse()) {
    if (s.includes(base)) {
      return `${acting}${base}${isFemale ? 'หญิง' : ''}`;
    }
  }
  for (const [re, full] of ABBREV_TO_FULL_RANK) {
    if (re.test(s)) {
      return `${acting}${full}${isFemale ? 'หญิง' : ''}`;
    }
  }
  return s;
}

export function canonicalRankForLevel(level) {
  const l = String(level || '').replace(/\s+/g, ' ').trim();
  if (!l) return '';
  if (
    l.includes('ผู้ช่วย ผบ.ตร.') ||
    l.includes('ผู้ช่วยผู้บัญชาการตำรวจแห่งชาติ') ||
    l.includes('รอง จตช.') ||
    l.includes('รองจเรตำรวจแห่งชาติ')
  ) {
    return 'พลตำรวจโท';
  }
  if (
    l.includes('ผบ.ตร.') ||
    l.includes('รอง ผบ.ตร.') ||
    l.includes('จตช.') ||
    l.includes('ผู้บัญชาการตำรวจแห่งชาติ') ||
    l.includes('จเรตำรวจแห่งชาติ')
  ) {
    return 'พลตำรวจเอก';
  }
  if (l.includes('รอง ผบช.') || l.includes('รองผู้บัญชาการ') || l.includes('รอง จตร.') || l.includes('รองจเรตำรวจ')) {
    return 'พลตำรวจตรี';
  }
  if (l.includes('ผบช.') || l.includes('จตร') || l.includes('ผู้บัญชาการ') || l.includes('จเรตำรวจ')) {
    return 'พลตำรวจโท';
  }
  if (l.includes('รอง ผบก.') || l.includes('รองผู้บังคับการ')) return 'พันตำรวจเอก';
  if (l.includes('ผบก.') || l.includes('ผู้บังคับการ')) return 'พลตำรวจตรี';
  if (l.includes('รอง ผกก.') || l.includes('รองผู้กำกับการ') || l.includes('สารวัตรใหญ่') || l.includes('สวญ.')) {
    return 'พันตำรวจโท';
  }
  if (l.includes('ผกก.') || l.includes('ผู้กำกับการ')) return 'พันตำรวจเอก';
  if (l.includes('รอง สว.') || l.includes('รองสารวัตร') || l.includes('ผู้บังคับหมวด')) return 'ร้อยตำรวจเอก';
  if (l.includes('สารวัตร') || l.includes('สว.')) return 'พันตำรวจตรี';
  if (l.includes('ผู้บังคับกอง')) return 'ร้อยตำรวจเอก';
  return '';
}

export function resolveLatestRankForLevel(levelOrPosition, previousRank = '') {
  const prevNorm = normalizeFullRank(previousRank);
  const expected = canonicalRankForLevel(levelOrPosition);
  if (!expected) return prevNorm;
  if (!prevNorm) return expected;

  const isFemale = /หญิง/.test(prevNorm);
  const expectedWithGender = `${expected}${isFemale ? 'หญิง' : ''}`;
  if (rankPriority(expectedWithGender) > rankPriority(prevNorm)) {
    return expectedWithGender;
  }
  return prevNorm;
}

export function searchAndComparePerson(knowledgeBundle, params = {}) {
  const qRaw = String(params.q || params.name || '').trim();
  const qNorm = normalizeName(qRaw);
  const qSkel = thaiConsonantSkeleton(qRaw);
  const orderMatch = qRaw.match(/^(?:ลำดับ(?:ที่)?\s*)?(\d+)$/);
  const qOrderNum = orderMatch ? parseInt(orderMatch[1], 10) : null;

  const manualLevel = String(params.level || '').trim();
  const manualAccount = String(params.account || '').trim();
  const manualOrder = params.order ? Number(params.order) : qOrderNum;
  const manualBirthDate = String(params.birth_date || '').trim();
  const manualTenureDate = String(params.tenure_date || '').trim();
  const manualCurrentPos = String(params.current_position || '').trim();
  const manualPrevPos = String(params.previous_position || '').trim();

  const seniorityList = knowledgeBundle?.seniority || [];
  const appointmentsList = knowledgeBundle?.appointments || [];
  const accountsList = knowledgeBundle?.accounts || [];

  // Build unified index of all unique officers in the database (281 appointments + 987 seniority roster)
  const officerMap = new Map();
  const apptByPageOrder = new Map();

  for (const appt of appointmentsList) {
    const rawFullName = String(appt['ชื่อ–นามสกุล'] || appt['ชื่อ-นามสกุล'] || appt.label || '').trim();
    const cleanFullName = cleanThaiOcrName(rawFullName);
    const norm = normalizeName(cleanFullName || rawFullName);
    if (!norm) continue;
    const stdLevel = canonicalLevel(appt.source_level || appt['ระดับเดิม'] || '');
    const previousRank = normalizeFullRank(appt['ยศเดิม'] || canonicalRankForLevel(stdLevel));
    const positionBeforeOrder = appt['ตำแหน่งเดิม'] || '';
    const newPosition = appt['ตำแหน่งใหม่'] || '';
    const newLevel = appt['ระดับใหม่'] || '';
    const latestRank = resolveLatestRankForLevel(newLevel || newPosition || stdLevel, previousRank);
    const latestPosition = newPosition || positionBeforeOrder;
    const rankPromoted = Boolean(previousRank && latestRank && latestRank !== previousRank);
    const skeleton = thaiConsonantSkeleton(rawFullName + ' ' + cleanFullName);

    const record = {
      key: norm,
      cleanKey: normalizeName(cleanFullName),
      name: cleanFullName,
      rawName: rawFullName,
      searchAliases: [rawFullName, cleanFullName].filter(Boolean),
      skeleton,
      rank: latestRank,
      previousRank,
      rankPromoted,
      appointmentNumber: appt['ข้อที่'] || null,
      currentPosition: latestPosition,
      positionBeforeOrder,
      newPosition,
      currentLevel: appt['ระดับเดิม'] || appt.source_level || '',
      newLevel,
      latestLevel: newLevel || appt['ระดับเดิม'] || appt.source_level || '',
      appointmentType: appt['ลักษณะการแต่งตั้ง'] || '',
      appointmentPdfPage: appt['หน้า PDF'] || null,
      sourceLevel: stdLevel,
      sourceAccount: appt.source_account || 'ทั่วไป',
      seniorityOrder: Number.isInteger(appt.seniority_order) ? appt.seniority_order : null,
      previousOrder: null,
      totalSuitablePopulation: appt.total_suitable_population || null,
      seniorityPdfPage: appt.source_pdf_page || null,
      currentPositionDate: null,
      previousPositionDate: null,
      birthDate: null,
      rankDates: [],
      inAppointmentOrder: true,
    };

    officerMap.set(norm, record);
    if (record.seniorityPdfPage && Number.isInteger(record.seniorityOrder)) {
      apptByPageOrder.set(`${record.seniorityPdfPage}::${record.seniorityOrder}`, record);
    }
  }

  for (const sen of seniorityList) {
    const rawFullName = String(sen.appointment_name || sen.source_name || sen.label || '').trim();
    const cleanFullName = cleanThaiOcrName(rawFullName);
    const norm = normalizeName(cleanFullName || rawFullName);
    if (!norm) continue;
    const isPromoted = Boolean(
      (sen.promotion_outcome &&
        !sen.promotion_outcome.startsWith('ไม่พบ') &&
        (sen.promotion_outcome.includes('ได้เลื่อน') || sen.promotion_outcome.includes('พบในรายการ'))) ||
      sen.new_position
    );
    const stdLevel = canonicalLevel(sen.source_level || '');
    const senAliases = [...new Set([
      rawFullName,
      cleanFullName,
      sen.source_name,
      sen.appointment_name,
      ...(Array.isArray(sen.search_aliases) ? sen.search_aliases : []),
    ].map((s) => String(s || '').trim()).filter(Boolean))];

    let fromAppt = officerMap.get(norm) || officerMap.get(normalizeName(rawFullName));
    if (!fromAppt && sen.source_pdf_page && Number.isInteger(sen.seniority_order)) {
      fromAppt = apptByPageOrder.get(`${sen.source_pdf_page}::${sen.seniority_order}`);
    }
    if (!fromAppt) {
      for (const alias of senAliases) {
        const hit = officerMap.get(normalizeName(alias));
        if (hit) {
          fromAppt = hit;
          break;
        }
      }
    }

    const isFemale = Boolean(
      sen.is_female ||
      /หญิง/.test(rawFullName) ||
      /หญิง/.test(sen.source_name || '') ||
      /หญิง/.test(fromAppt?.previousRank || '') ||
      /หญิง/.test(fromAppt?.rank || '')
    );
    const basePrevRank = canonicalRankForLevel(sen.source_level || stdLevel);
    const fallbackPrevRank = normalizeFullRank(`${basePrevRank}${isFemale && basePrevRank ? 'หญิง' : ''}`);
    const fallbackLatestRank = isPromoted && (sen.new_level || sen.new_position)
      ? resolveLatestRankForLevel(sen.new_level || sen.new_position, fallbackPrevRank)
      : fallbackPrevRank;
    const fallbackPosBefore = sen.source_position || '';
    const fallbackCurrentPos = isPromoted && sen.new_position ? sen.new_position : fallbackPosBefore;
    const existing = fromAppt || {
      key: norm,
      cleanKey: normalizeName(cleanFullName),
      name: cleanFullName,
      rawName: rawFullName,
      searchAliases: senAliases,
      skeleton: thaiConsonantSkeleton(`${rawFullName} ${cleanFullName} ${senAliases.join(' ')}`),
      rank: fallbackLatestRank,
      previousRank: fallbackPrevRank,
      rankPromoted: Boolean(fallbackPrevRank && fallbackLatestRank && fallbackLatestRank !== fallbackPrevRank),
      appointmentNumber: sen.appointment_item_no || null,
      currentPosition: fallbackCurrentPos,
      positionBeforeOrder: fallbackPosBefore,
      newPosition: sen.new_position || '',
      currentLevel: sen.source_level || '',
      newLevel: sen.new_level || '',
      latestLevel: sen.new_level || sen.source_level || '',
      appointmentType: isPromoted ? 'เลื่อนระดับ' : '',
      appointmentPdfPage: null,
      inAppointmentOrder: isPromoted,
    };

    const pageLookup = lookupDatesByAccountAndOrder(
      knowledgeBundle,
      sen.source_level,
      sen.source_account,
      sen.seniority_order,
    );
    const rankDates =
      Array.isArray(sen.rank_dates) && sen.rank_dates.length >= 2
        ? sen.rank_dates
        : pageLookup?.dates || [];

    const effectiveInOrder = Boolean(existing.inAppointmentOrder || isPromoted);
    const effectiveApptType = existing.inAppointmentOrder ? (existing.appointmentType || 'เลื่อนระดับ') : (isPromoted ? 'เลื่อนระดับ' : '');
    let rank = existing.rank || fallbackLatestRank;
    if (isFemale && rank && !/หญิง/.test(rank)) {
      rank = `${rank}หญิง`;
    }
    const mergedAliases = [...new Set([...(existing.searchAliases || []), ...senAliases])];
    const skeleton = existing.skeleton || thaiConsonantSkeleton(`${rawFullName} ${cleanFullName} ${mergedAliases.join(' ')}`);
    const preferredName = (fromAppt?.name && fromAppt.name.length >= 3) ? fromAppt.name : cleanFullName;
    const mapKey = fromAppt?.key || norm;

    officerMap.set(mapKey, {
      ...existing,
      key: mapKey,
      name: preferredName,
      rawName: rawFullName,
      searchAliases: mergedAliases,
      skeleton,
      rank,
      previousRank: isFemale && existing.previousRank && !/หญิง/.test(existing.previousRank)
        ? `${existing.previousRank}หญิง`
        : existing.previousRank,
      currentPosition: existing.currentPosition || fallbackCurrentPos,
      positionBeforeOrder: existing.positionBeforeOrder || fallbackPosBefore,
      appointmentType: effectiveApptType,
      inAppointmentOrder: effectiveInOrder,
      newPosition: existing.newPosition || sen.new_position || '',
      newLevel: existing.newLevel || sen.new_level || '',
      latestLevel: existing.latestLevel || existing.newLevel || sen.new_level || sen.source_level || '',
      sourceLevel: stdLevel || existing.sourceLevel,
      sourceAccount: sen.source_account || existing.sourceAccount || 'ทั่วไป',
      seniorityOrder: Number.isInteger(sen.seniority_order) ? sen.seniority_order : existing.seniorityOrder,
      previousOrder: sen.previous_order ?? existing.previousOrder,
      totalSuitablePopulation: sen.total_suitable_population || existing.totalSuitablePopulation,
      seniorityPdfPage: sen.source_pdf_page || existing.seniorityPdfPage,
      currentPositionDate: sen.current_position_date || rankDates[0] || null,
      previousPositionDate: sen.previous_position_date || rankDates[1] || null,
      birthDate: sen.birth_date || (rankDates.length > 0 ? rankDates[rankDates.length - 1] : null),
      rankDates,
    });
  }

  const allOfficers = [...officerMap.values()].map((o) => {
    const tokenWords = [...new Set(
      [o.name, ...(o.searchAliases || [])]
        .flatMap((s) => String(s || '').split(/\s+/))
        .map((t) => t.trim())
        .filter((t) => t.length >= 2),
    )];
    return {
      ...o,
      nameTokens: tokenWords.map((t) => ({
        raw: t,
        norm: normalizeName(t),
        phonetic: thaiPhoneticKey(t),
      })),
      fullPhonetic: thaiPhoneticKey(o.name),
      aliasNorms: [...new Set((o.searchAliases || []).map((a) => normalizeName(a)).filter(Boolean))],
      aliasPhonetics: [...new Set((o.searchAliases || []).map((a) => thaiPhoneticKey(a)).filter(Boolean))],
    };
  });

  // Multi-criteria filter: query keyword, consonant skeleton, level, account, or seniority order
  let matches = allOfficers;
  const queryCleanNoRank = qRaw
    .replace(
      /^(?:ว่าที่\s*)?(?:พล\.?\s*ต\.?\s*[อทต]\.?|พ\.?\s*ต\.?\s*[อทต]\.?|ร\.?\s*ต\.?\s*[อทต]\.?|ด\.?\s*ต\.?|จ\.?\s*ส\.?\s*ต\.?|ส\.?\s*ต\.?\s*[อทต]\.?|พลตำรวจ(?:เอก|โท|ตรี)|พันตำรวจ(?:เอก|โท|ตรี)|ร้อยตำรวจ(?:เอก|โท|ตรี)|ดาบตำรวจ|จ่าสิบตำรวจ|สิบตำรวจ(?:เอก|โท|ตรี))(?:\s*หญิง|\s*\(หญิง\))?\s*/,
      '',
    )
    .trim();
  const qNameNorm = normalizeName(queryCleanNoRank || qRaw);
  const qNameSkel = thaiConsonantSkeleton(queryCleanNoRank || qRaw);
  const qPhoneticFull = thaiPhoneticKey(queryCleanNoRank || qRaw);
  const queryTokens = queryCleanNoRank
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const queryTokenEntries = queryTokens.map((t) => ({
    raw: t,
    norm: normalizeName(t),
    phonetic: thaiPhoneticKey(t),
  }));

  const scoreOfficerMatch = (o) => {
    if (!qNorm) return 100;
    let best = 0;

    // 1. Exact matches (name, cleanKey, aliases, order/appointment number)
    if (
      o.key === qNorm ||
      o.cleanKey === qNorm ||
      (qNameNorm && (o.key === qNameNorm || o.cleanKey === qNameNorm)) ||
      o.aliasNorms.includes(qNorm) ||
      (qNameNorm && o.aliasNorms.includes(qNameNorm))
    ) {
      return 100;
    }
    if ((o.appointmentNumber && String(o.appointmentNumber) === qRaw) || (qOrderNum && o.seniorityOrder === qOrderNum)) {
      best = Math.max(best, 92);
    }

    // 2. Exact phonetic match across whole name or aliases (handles Thai homophones/vowels)
    if (
      qPhoneticFull &&
      qPhoneticFull.length >= 4 &&
      (o.fullPhonetic === qPhoneticFull || o.aliasPhonetics.includes(qPhoneticFull))
    ) {
      best = Math.max(best, 90);
    }

    // 3. Direct substring match on name, aliases, rank+name
    if (
      o.key.includes(qNorm) ||
      (o.cleanKey && o.cleanKey.includes(qNorm)) ||
      (qNameNorm && (o.key.includes(qNameNorm) || (o.cleanKey && o.cleanKey.includes(qNameNorm)))) ||
      o.aliasNorms.some((a) => a.includes(qNorm) || (qNameNorm && a.includes(qNameNorm))) ||
      normalizeName(`${o.rank}${o.name}`).includes(qNorm)
    ) {
      best = Math.max(best, 84);
    }

    // 4. Skeleton / phonetic substring match (min 3 chars)
    const skelCheck = qNameSkel || qSkel;
    if (skelCheck && skelCheck.length >= 3 && o.skeleton && o.skeleton.includes(skelCheck)) {
      best = Math.max(best, 78);
    }
    if (
      qPhoneticFull &&
      qPhoneticFull.length >= 4 &&
      (o.fullPhonetic.includes(qPhoneticFull) || o.aliasPhonetics.some((p) => p.includes(qPhoneticFull)))
    ) {
      best = Math.max(best, 76);
    }

    // 5. Position substring match
    if (
      (o.currentPosition && normalizeName(o.currentPosition).includes(qNorm)) ||
      (o.positionBeforeOrder && normalizeName(o.positionBeforeOrder).includes(qNorm)) ||
      (o.newPosition && normalizeName(o.newPosition).includes(qNorm))
    ) {
      best = Math.max(best, 70);
    }

    // 6. Per-token exact, phonetic, and fuzzy edit-distance scoring
    if (queryTokenEntries.length > 0) {
      const tokenScores = queryTokenEntries.map((qt) =>
        bestTokenFuzzyScore(qt.norm, qt.phonetic, o.nameTokens),
      );
      if (queryTokenEntries.length === 1) {
        if (tokenScores[0] >= 48) {
          best = Math.max(best, tokenScores[0]);
        }
      } else {
        const minTok = Math.min(...tokenScores);
        const maxTok = Math.max(...tokenScores);
        const avgTok = tokenScores.reduce((acc, v) => acc + v, 0) / tokenScores.length;
        if (minTok >= 45) {
          const allStrongBonus = minTok >= 65 ? 5 : 0;
          best = Math.max(best, Math.min(99, Math.round(avgTok) + allStrongBonus));
        } else if (maxTok >= 72 && minTok >= 20) {
          best = Math.max(best, Math.max(46, Math.round(avgTok * 0.78)));
        }
      }
    }

    // 7. Full-string phonetic fuzzy edit distance fallback (even when written without spaces)
    if (best < 45 && qPhoneticFull && qPhoneticFull.length >= 5 && o.fullPhonetic.length >= 5) {
      const maxEd = Math.max(1, Math.floor(Math.min(qPhoneticFull.length, o.fullPhonetic.length) / 4));
      const d = editDistance(qPhoneticFull, o.fullPhonetic);
      if (d <= maxEd) {
        best = Math.max(best, 64 - d * 8);
      }
    }

    return best;
  };

  if (qNorm) {
    matches = matches
      .map((o) => ({ officer: o, score: scoreOfficerMatch(o) }))
      .filter((entry) => entry.score >= 45)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.officer.seniorityOrder && b.officer.seniorityOrder) {
          return a.officer.seniorityOrder - b.officer.seniorityOrder;
        }
        return (a.officer.name || '').localeCompare(b.officer.name || '', 'th');
      })
      .map((entry) => entry.officer);
  }
  if (manualLevel) {
    const cLevel = canonicalLevel(manualLevel);
    matches = matches.filter(
      (o) =>
        canonicalLevel(o.sourceLevel) === cLevel ||
        canonicalLevel(o.currentLevel) === cLevel ||
        canonicalLevel(o.latestLevel) === cLevel,
    );
  }
  if (manualAccount) {
    matches = matches.filter((o) => !o.sourceAccount || o.sourceAccount === manualAccount);
  }
  if (Number.isInteger(manualOrder) && manualOrder > 0) {
    const orderMatches = matches.filter((o) => o.seniorityOrder === manualOrder);
    if (orderMatches.length > 0) matches = orderMatches;
  }

  // Pick primary target officer (highest-scored match first)
  let target = null;
  if (qNorm) {
    target =
      matches.find((o) => o.key === qNorm || o.cleanKey === qNorm || normalizeName(o.name) === qNorm) ||
      (matches.length > 0 ? matches[0] : null);
  } else if (Number.isInteger(manualOrder) && manualOrder > 0) {
    target = matches.find((o) => o.seniorityOrder === manualOrder) || null;
  } else if (matches.length > 0 && manualLevel) {
    target = matches[0];
  }

  // Determine effective level (seniority roster level), current position level (after appointment), account and order
  const effectiveLevel = canonicalLevel(manualLevel || target?.sourceLevel || target?.currentLevel || 'รอง ผบก. / เทียบเท่า');
  const currentLevelForLaw = canonicalLevel(
    manualLevel ||
      (target?.inAppointmentOrder
        ? target.latestLevel || target.newLevel || target.currentPosition || effectiveLevel
        : target?.sourceLevel || target?.currentLevel || effectiveLevel),
  );
  const currentPositionRule = MINIMUM_TENURE_RULES[currentLevelForLaw] || MINIMUM_TENURE_RULES[effectiveLevel];
  const isPromotedToHigherLevel = Boolean(
    target &&
      target.appointmentType === 'เลื่อนระดับ' &&
      currentLevelForLaw &&
      effectiveLevel &&
      currentLevelForLaw !== effectiveLevel,
  );
  const effectiveAccount = manualAccount || target?.sourceAccount || 'ทั่วไป';
  const effectiveOrder =
    Number.isInteger(manualOrder) && manualOrder > 0 ? manualOrder : target?.seniorityOrder || null;

  const accountMeta = accountsList.find(
    (a) => canonicalLevel(a.source_level) === effectiveLevel && a.source_account === effectiveAccount,
  );
  const totalPopulation = accountMeta?.total_suitable_population || target?.totalSuitablePopulation || null;

  // If target is not in crosswalk or user overrode seniority order, try extracting dates from pageRowDates for that order!
  const orderDateLookup =
    effectiveOrder && (!target || effectiveOrder !== target.seniorityOrder || !target.currentPositionDate)
      ? lookupDatesByAccountAndOrder(knowledgeBundle, effectiveLevel, effectiveAccount, effectiveOrder)
      : null;

  const effectiveCurrentPosDate =
    manualTenureDate || target?.currentPositionDate || orderDateLookup?.currentPositionDate || null;
  const effectivePrevPosDate =
    target?.previousPositionDate || orderDateLookup?.previousPositionDate || null;
  const effectiveBirthDate =
    manualBirthDate || target?.birthDate || orderDateLookup?.birthDate || null;
  const effectiveRankDates =
    target?.rankDates?.length >= 2 ? target.rankDates : orderDateLookup?.dates || [];

  const baseTenureInfo = calculateTenureAndEligibility(effectiveCurrentPosDate, effectiveLevel);
  const tenureInfo = {
    ...baseTenureInfo,
    currentLevel: currentLevelForLaw,
    currentRequiredYears: currentPositionRule?.requiredYears ?? baseTenureInfo.requiredYears,
    currentNextLevel: currentPositionRule?.nextLevel ?? baseTenureInfo.nextLevel,
    currentLegalBasis: currentPositionRule?.legalBasis || baseTenureInfo.legalBasis,
    isPromotedToHigherLevel,
    legalBasis: currentPositionRule?.legalBasis || baseTenureInfo.legalBasis,
    priorLevelLegalBasis: baseTenureInfo.legalBasis,
  };
  const retirementInfo = calculateRetirementInfo(effectiveBirthDate);
  const rankTimeline = buildRankHistoryTimeline(effectiveRankDates, effectiveLevel);

  // Previous position display
  const prevLevelLabel = tenureInfo.previousLevelLabel || 'ระดับก่อนหน้า';
  const prevPosDateParsed = parseThaiDateBE(effectivePrevPosDate);
  const previousPositionDisplay = manualPrevPos
    ? manualPrevPos
    : prevPosDateParsed
      ? `ดำรงตำแหน่งระดับ ${prevLevelLabel} เมื่อวันที่ ${prevPosDateParsed.formattedThai}`
      : `ระดับ ${prevLevelLabel} (ตรวจสอบจากตารางประวัติการดำรงตำแหน่ง)`;

  // Raw promoted officers in this level & account (sorted by seniorityOrder) to compute vacancies & 50% / 100% cutoff
  const rawPromotedInSameAccount = allOfficers
    .filter(
      (o) =>
        o.inAppointmentOrder &&
        o.appointmentType === 'เลื่อนระดับ' &&
        canonicalLevel(o.sourceLevel) === effectiveLevel &&
        ((o.sourceAccount || 'ทั่วไป') === (effectiveAccount || 'ทั่วไป')) &&
        Number.isInteger(o.seniorityOrder),
    )
    .sort((a, b) => a.seniorityOrder - b.seniorityOrder);

  const totalVacanciesFromPromotions = rawPromotedInSameAccount.length;
  const is100PercentSeniorityLevel =
    effectiveLevel === 'ผู้ช่วย ผบ.ตร. / รอง จตช.' ||
    effectiveLevel === 'ผบช. / จตร. / เทียบเท่า' ||
    effectiveLevel === 'รอง ผบ.ตร. / จตช.';
  const seniorityQuotaRatio = is100PercentSeniorityLevel ? 1.0 : 0.5;
  const seniorityQuotaCount =
    totalVacanciesFromPromotions > 0 ? Math.ceil(totalVacanciesFromPromotions * seniorityQuotaRatio) : 0;
  const knowledgeQuotaCount = Math.max(0, totalVacanciesFromPromotions - seniorityQuotaCount);
  const seniorityCutoffOrder =
    seniorityQuotaCount > 0
      ? (rawPromotedInSameAccount[seniorityQuotaCount - 1]?.seniorityOrder ?? seniorityQuotaCount)
      : null;

  const classifyOfficerPromotionGroup = (orderNum, isPromotedFlag) => {
    if (!Number.isInteger(orderNum) || !seniorityCutoffOrder) return '';
    if (is100PercentSeniorityLevel) {
      return orderNum <= seniorityCutoffOrder ? 'กลุ่มอาวุโส 100%' : 'นอกกรอบตำแหน่งว่าง';
    }
    if (orderNum <= seniorityCutoffOrder) {
      return 'กลุ่มอาวุโส 50%';
    }
    return isPromotedFlag ? 'กลุ่มความรู้ความสามารถ (ได้เลื่อนสูงขึ้น)' : 'กลุ่มความรู้ความสามารถ';
  };

  const toComparisonRow = (o, includeRotationFlag = false) => {
    const oTenure = calculateTenureAndEligibility(o.currentPositionDate, o.sourceLevel);
    const oRetire = calculateRetirementInfo(o.birthDate);
    const isTarget = Boolean(target && (o.key === target.key || o.name === target.name));
    const hasOrder = Number.isInteger(o.seniorityOrder);
    const isJunior = Boolean(effectiveOrder && hasOrder && o.seniorityOrder > effectiveOrder);
    const isSenior = Boolean(effectiveOrder && hasOrder && o.seniorityOrder < effectiveOrder);
    const isRotation = includeRotationFlag && o.appointmentType !== 'เลื่อนระดับ';
    const isRowPromoted = o.appointmentType === 'เลื่อนระดับ' || !includeRotationFlag;
    const promotionGroup = isRotation
      ? 'สับเปลี่ยนหมุนเวียน'
      : classifyOfficerPromotionGroup(o.seniorityOrder, isRowPromoted);
    return {
      name: o.name,
      rank: o.rank,
      previousRank: o.previousRank || '',
      rankPromoted: Boolean(o.rankPromoted),
      fullNameWithRank: `${o.rank ? `${o.rank} ` : ''}${o.name}`.trim(),
      appointmentNumber: o.appointmentNumber,
      seniorityOrder: o.seniorityOrder,
      previousOrder: o.previousOrder,
      totalSuitablePopulation: o.totalSuitablePopulation || totalPopulation,
      currentPosition: o.currentPosition,
      positionBeforeOrder: o.positionBeforeOrder || '',
      newPosition: o.newPosition,
      latestLevel: o.latestLevel || o.newLevel || o.sourceLevel,
      appointmentType: o.appointmentType || (includeRotationFlag ? 'ระดับเดิม' : 'เลื่อนระดับ'),
      promotionGroup,
      currentPositionDate: o.currentPositionDate,
      currentPositionDateThai: oTenure.currentPositionDateThai,
      tenureDisplay: oTenure.tenureDisplay,
      birthDate: o.birthDate,
      birthDateThai: oRetire?.birthDateThai || null,
      retirementYearBE: oRetire?.retirementYearBE || null,
      bornAfterSep30: oRetire?.bornAfterSep30 || false,
      seniorityPdfPage: o.seniorityPdfPage,
      appointmentPdfPage: o.appointmentPdfPage,
      orderGap: effectiveOrder && hasOrder ? Math.abs(o.seniorityOrder - effectiveOrder) : null,
      isTarget,
      isJunior,
      isSenior,
      ...(includeRotationFlag ? { isRotation } : {}),
      relationTag: isTarget ? 'target' : isRotation ? 'rotation' : isJunior ? 'junior' : isSenior ? 'senior' : 'same',
    };
  };

  // 1. All promoted officers in this level & account (sorted by seniorityOrder)
  const promotedInSameAccount = rawPromotedInSameAccount.map((o) => toComparisonRow(o, false));

  // 2. All appointed officers in this level (promotions + rotations, sorted by appointmentNumber)
  const allAppointedInLevel = allOfficers
    .filter(
      (o) =>
        o.inAppointmentOrder &&
        (canonicalLevel(o.sourceLevel) === effectiveLevel ||
        canonicalLevel(o.currentLevel) === effectiveLevel),
    )
    .sort((a, b) => {
      if (a.appointmentNumber && b.appointmentNumber) return a.appointmentNumber - b.appointmentNumber;
      if (a.seniorityOrder && b.seniorityOrder) return a.seniorityOrder - b.seniorityOrder;
      return 0;
    })
    .map((o) => toComparisonRow(o, true));

  // Junior promoted officers: those with seniorityOrder > effectiveOrder
  const juniorPromotedOfficers = effectiveOrder
    ? promotedInSameAccount.filter((o) => o.seniorityOrder > effectiveOrder)
    : [];

  // Senior promoted officers: those with seniorityOrder < effectiveOrder
  const seniorPromotedOfficers = effectiveOrder
    ? promotedInSameAccount.filter((o) => o.seniorityOrder < effectiveOrder)
    : [];

  const isTargetPromoted = Boolean(target && target.appointmentType === 'เลื่อนระดับ');
  let quotaGroupKey = 'unknown';
  let quotaGroupLabel = 'ระบุลำดับอาวุโสเพื่อเทียบเกณฑ์โควตาตำแหน่งว่าง';
  let quotaShortBadge = 'รอเทียบโควตา';

  if (totalVacanciesFromPromotions > 0 && Number.isInteger(effectiveOrder) && seniorityCutoffOrder) {
    if (is100PercentSeniorityLevel) {
      if (effectiveOrder <= seniorityCutoffOrder) {
        quotaGroupKey = 'seniority_100';
        quotaGroupLabel = isTargetPromoted
          ? 'อยู่ในกลุ่มอาวุโส 100% ที่ได้เลื่อนตำแหน่งสูงขึ้น'
          : 'อยู่ในเกณฑ์กลุ่มอาวุโส 100%';
        quotaShortBadge = 'กลุ่มอาวุโส 100%';
      } else {
        quotaGroupKey = 'outside_100';
        quotaGroupLabel = isTargetPromoted
          ? 'ได้เลื่อนตำแหน่งสูงขึ้น (ลำดับเกินกรอบอัตราว่างปกติ)'
          : 'อยู่นอกกรอบตำแหน่งว่าง (เกณฑ์อาวุโส 100%)';
        quotaShortBadge = 'นอกกรอบอาวุโส 100%';
      }
    } else if (effectiveOrder <= seniorityCutoffOrder) {
      quotaGroupKey = 'seniority_50';
      quotaGroupLabel = isTargetPromoted
        ? 'อยู่ในกลุ่มอาวุโส 50% ที่ได้เลื่อนตำแหน่งสูงขึ้น'
        : 'อยู่ในเกณฑ์กลุ่มอาวุโส 50%';
      quotaShortBadge = 'กลุ่มอาวุโส 50%';
    } else if (isTargetPromoted) {
      quotaGroupKey = 'knowledge_promoted';
      quotaGroupLabel = 'อยู่ในกลุ่มความรู้ความสามารถ ที่ได้เลื่อนตำแหน่งสูงขึ้น';
      quotaShortBadge = 'กลุ่มความรู้ความสามารถ (ได้เลื่อนสูงขึ้น)';
    } else {
      quotaGroupKey = 'knowledge_pool';
      quotaGroupLabel = 'อยู่ในเกณฑ์กลุ่มความรู้ความสามารถ (เกินจุดตัดอาวุโส 50% · ไม่ได้เลื่อนสูงขึ้น)';
      quotaShortBadge = 'เกณฑ์กลุ่มความรู้ความสามารถ (ไม่ได้เลื่อนสูงขึ้น)';
    }
  } else if (isTargetPromoted) {
    quotaGroupKey = is100PercentSeniorityLevel ? 'seniority_100' : 'promoted';
    quotaGroupLabel = is100PercentSeniorityLevel
      ? 'อยู่ในกลุ่มอาวุโส 100% ที่ได้เลื่อนตำแหน่งสูงขึ้น'
      : 'ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้น';
    quotaShortBadge = is100PercentSeniorityLevel ? 'กลุ่มอาวุโส 100%' : 'ได้เลื่อนตำแหน่งสูงขึ้น';
  }

  const quotaVacancySummary =
    totalVacanciesFromPromotions > 0 && seniorityCutoffOrder
      ? is100PercentSeniorityLevel
        ? `ระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) มีตำแหน่งว่างเทียบจากผู้ได้เลื่อนตำแหน่งสูงขึ้นรวม ${totalVacanciesFromPromotions} ตำแหน่ง · คัดเลือกเรียงตามลำดับอาวุโส 100% ตัดที่ลำดับอาวุโสที่ ${seniorityCutoffOrder} (ลำดับที่ 1–${seniorityCutoffOrder})`
        : `ระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) มีตำแหน่งว่าง (เทียบจากผู้ได้เลื่อนตำแหน่งสูงขึ้น) รวม ${totalVacanciesFromPromotions} ตำแหน่ง · ตัดโควตาอาวุโส 50% ที่ลำดับอาวุโสที่ ${seniorityCutoffOrder} (กลุ่มอาวุโส 50% จำนวน ${seniorityQuotaCount} ตำแหน่ง [ลำดับที่ 1–${seniorityCutoffOrder}] · กลุ่มความรู้ความสามารถ จำนวน ${knowledgeQuotaCount} ตำแหน่ง [คัดเลือกจากลำดับที่ ${seniorityCutoffOrder + 1}${totalPopulation ? `–${totalPopulation}` : ' ขึ้นไป'}])`
      : `ในระดับ ${effectiveLevel || '-'} (บัญชี${effectiveAccount || 'ทั่วไป'}) ยังไม่มีรายการผู้ได้รับเลื่อนตำแหน่งสูงขึ้นในชุดข้อมูลเปรียบเทียบนี้`;

  const quotaLegalBasis = is100PercentSeniorityLevel
    ? 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๘๒(๑) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๓๙, ข้อ ๔๗(๑) (พิจารณาเรียงตามลำดับอาวุโสจำนวนร้อยละ ๑๐๐ ของจำนวนตำแหน่งว่าง)'
    : 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๘๒(๒),(๔) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๓๙, ข้อ ๔๗(๒),(๔) (กลุ่มอาวุโสจำนวนร้อยละ ๕๐ ของจำนวนตำแหน่งว่าง และกลุ่มความรู้ความสามารถประกอบอาวุโสอีกร้อยละ ๕๐)';

  const quotaAssessment = {
    totalVacancies: totalVacanciesFromPromotions,
    is100PercentSeniority: is100PercentSeniorityLevel,
    quotaRatioPct: is100PercentSeniorityLevel ? 100 : 50,
    seniorityQuotaCount,
    knowledgeQuotaCount,
    seniorityCutoffOrder,
    knowledgeOrderStart: seniorityCutoffOrder ? seniorityCutoffOrder + 1 : null,
    groupKey: quotaGroupKey,
    groupLabel: quotaGroupLabel,
    shortBadge: quotaShortBadge,
    vacancySummary: quotaVacancySummary,
    legalBasis: quotaLegalBasis,
  };

  const profile =
    target || qRaw || effectiveOrder || manualLevel
      ? {
          foundInDatabase: Boolean(target),
          isPromotedInOrder2569: isTargetPromoted,
          isAppointedInOrder2569: Boolean(target && target.inAppointmentOrder),
          appointmentType: target?.appointmentType || 'ผู้ร้องทุกข์ / เปรียบเทียบลำดับอาวุโส (ไม่ได้เลื่อนตำแหน่งสูงขึ้น)',
          appointmentNumber: target?.appointmentNumber || null,
          rank: target?.rank || '',
          previousRank: target?.previousRank || '',
          rankPromoted: Boolean(target?.rankPromoted),
          name: target?.name || qRaw || `ผู้เปรียบเทียบลำดับอาวุโสที่ ${effectiveOrder || '-'}`,
          fullNameWithRank: target
            ? `${target.rank ? `${target.rank} ` : ''}${target.name}`.trim()
            : qRaw || `ผู้เปรียบเทียบลำดับอาวุโสที่ ${effectiveOrder || '-'}`,
          currentPosition:
            manualCurrentPos ||
            target?.currentPosition ||
            (effectiveLevel ? `ข้าราชการตำรวจระดับ ${effectiveLevel}` : '-'),
          positionBeforeOrder: target?.positionBeforeOrder || '',
          newPosition: target?.newPosition || 'ไม่ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้นในคำสั่งนี้',
          latestLevel: target?.latestLevel || target?.newLevel || effectiveLevel,
          currentPositionDate: effectiveCurrentPosDate,
          currentPositionDateThai: tenureInfo.currentPositionDateThai,
          birthDate: effectiveBirthDate,
          birthDateThai: retirementInfo?.birthDateThai || null,
          previousPosition: previousPositionDisplay,
          previousPositionDate: effectivePrevPosDate,
          previousPositionDateThai: prevPosDateParsed?.formattedThai || null,
          sourceLevel: effectiveLevel,
          sourceAccount: effectiveAccount,
          seniorityOrder: effectiveOrder,
          previousOrder: target?.previousOrder || null,
          totalSuitablePopulation: totalPopulation,
          seniorityDisplay: effectiveOrder
            ? `ลำดับอาวุโสที่ ${effectiveOrder}${totalPopulation ? ` จากทั้งหมด ${totalPopulation} ราย` : ''}`
            : 'ยังไม่ได้ระบุลำดับอาวุโส',
          seniorityPdfPage: target?.seniorityPdfPage || orderDateLookup?.targetPage || null,
          appointmentPdfPage: target?.appointmentPdfPage || null,
          tenure: tenureInfo,
          retirement: retirementInfo,
          rankTimeline,
          quotaAssessment,
          comparison: {
            sourceLevel: effectiveLevel,
            sourceAccount: effectiveAccount,
            totalSuitablePopulation: totalPopulation,
            totalPromotedInAccount: promotedInSameAccount.length,
            totalVacancies: totalVacanciesFromPromotions,
            seniorityQuotaCount,
            knowledgeQuotaCount,
            seniorityCutoffOrder,
            quotaRatioPct: is100PercentSeniorityLevel ? 100 : 50,
            totalAppointedInLevel: allAppointedInLevel.length,
            targetSeniorityOrder: effectiveOrder,
            juniorPromotedCount: juniorPromotedOfficers.length,
            juniorPromotedOfficers,
            seniorPromotedCount: seniorPromotedOfficers.length,
            seniorPromotedOfficers,
            allPromotedInAccount: promotedInSameAccount,
            allAppointedInLevel,
            summaryText: effectiveOrder
              ? juniorPromotedOfficers.length > 0
                ? `เมื่อเทียบกับคำสั่งแต่งตั้งเลื่อนตำแหน่งสูงขึ้นในระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) ซึ่งมีตำแหน่งว่าง (ผู้ได้รับเลื่อนตำแหน่งสูงขึ้น) รวม ${promotedInSameAccount.length} ตำแหน่ง${seniorityCutoffOrder ? (is100PercentSeniorityLevel ? ` (เกณฑ์อาวุโส 100% ตัดที่ลำดับที่ ${seniorityCutoffOrder})` : ` (ตัดโควตาอาวุโส 50% จำนวน ${seniorityQuotaCount} อัตรา ที่ลำดับอาวุโสที่ ${seniorityCutoffOrder} · กลุ่มความรู้ความสามารถ ${knowledgeQuotaCount} อัตรา)`) : ''} พบว่ามีผู้ที่อาวุโสน้อยกว่า (ลำดับอาวุโสหลังลำดับที่ ${effectiveOrder}) ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้นจำนวน ${juniorPromotedOfficers.length} คน (ตั้งแต่ลำดับอาวุโสที่ ${juniorPromotedOfficers[0].seniorityOrder} ถึงลำดับที่ ${juniorPromotedOfficers[juniorPromotedOfficers.length - 1].seniorityOrder})`
                : `ในระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) มีตำแหน่งว่าง (ผู้ได้รับเลื่อนตำแหน่งสูงขึ้น) รวม ${promotedInSameAccount.length} ตำแหน่ง${seniorityCutoffOrder ? (is100PercentSeniorityLevel ? ` (เกณฑ์อาวุโส 100% ตัดที่ลำดับที่ ${seniorityCutoffOrder})` : ` (ตัดโควตาอาวุโส 50% จำนวน ${seniorityQuotaCount} อัตรา ที่ลำดับอาวุโสที่ ${seniorityCutoffOrder} · กลุ่มความรู้ความสามารถ ${knowledgeQuotaCount} อัตรา)`) : ''} โดยไม่ปรากฏผู้ที่อาวุโสน้อยกว่าลำดับที่ ${effectiveOrder} ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้น`
              : `ในระดับ ${effectiveLevel} มีผู้ได้รับแต่งตั้งรวม ${allAppointedInLevel.length} ราย (เลื่อนตำแหน่งสูงขึ้น ${promotedInSameAccount.length} ตำแหน่ง${seniorityCutoffOrder && !is100PercentSeniorityLevel ? ` · ตัดอาวุโส 50% ที่ลำดับที่ ${seniorityCutoffOrder}` : ''} · สับเปลี่ยนหมุนเวียน ${allAppointedInLevel.length - promotedInSameAccount.length} ราย)`,
          },
        }
      : null;

  return {
    zeroApiCost: true,
    query: qRaw,
    accounts: accountsList.filter((a) => a.source_page_start || a.total_suitable_population),
    totalMatches: matches.length,
    suggestions: matches.slice(0, 150).map((o) => ({
      name: o.name,
      rank: o.rank,
      previousRank: o.previousRank || '',
      rankPromoted: Boolean(o.rankPromoted),
      fullNameWithRank: `${o.rank ? `${o.rank} ` : ''}${o.name}`.trim(),
      currentPosition: o.currentPosition,
      positionBeforeOrder: o.positionBeforeOrder || '',
      newPosition: o.newPosition,
      latestLevel: o.latestLevel || o.newLevel || o.sourceLevel,
      sourceLevel: o.sourceLevel,
      sourceAccount: o.sourceAccount,
      seniorityOrder: o.seniorityOrder,
      totalSuitablePopulation: o.totalSuitablePopulation,
      appointmentType: o.appointmentType,
      appointmentNumber: o.appointmentNumber,
    })),
    profile,
  };
}
