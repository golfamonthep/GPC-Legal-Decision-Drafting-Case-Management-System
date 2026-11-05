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
  'ผู้ช่วย ผบ.ตร. / รอง จตช.': {
    requiredYears: 1,
    nextLevel: 'รอง ผบ.ตร. / จตช.',
    previousLevelLabel: 'ผบช. / จตร.',
    rankColumnLabels: ['ผู้ช่วย ผบ.ตร.', 'ผบช.', 'รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๒) (ระดับผู้ช่วย ผบ.ตร. หรือรอง จตช. ไม่น้อยกว่า ๑ ปี)',
  },
  'ผบช. / จตร. / เทียบเท่า': {
    requiredYears: 1,
    nextLevel: 'ผู้ช่วย ผบ.ตร. / รอง จตช.',
    previousLevelLabel: 'รอง ผบช. / รอง จตร.',
    rankColumnLabels: ['ผบช.', 'รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๓) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗ (ระดับ ผบช. หรือ จตร. ไม่น้อยกว่า ๑ ปี)',
  },
  'รอง ผบช. / รอง จตร. / เทียบเท่า': {
    requiredYears: 2,
    nextLevel: 'ผบช. / จตร.',
    previousLevelLabel: 'ผบก.',
    rankColumnLabels: ['รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๔) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗ (ระดับ รอง ผบช. หรือ รอง จตร. ไม่น้อยกว่า ๒ ปี)',
  },
  'รอง ผบช. / เทียบเท่า': {
    requiredYears: 2,
    nextLevel: 'ผบช. / นายแพทย์ใหญ่ (สบ ๘)',
    previousLevelLabel: 'ผบก. / นายแพทย์ (สบ ๖)',
    rankColumnLabels: ['รอง ผบช.', 'ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๔) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗ (ระดับ รอง ผบช. ไม่น้อยกว่า ๒ ปี)',
  },
  'ผบก. / เทียบเท่า': {
    requiredYears: 3,
    nextLevel: 'รอง ผบช. / รอง จตร.',
    previousLevelLabel: 'รอง ผบก.',
    rankColumnLabels: ['ผบก.', 'รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๕) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗ (ระดับ ผบก. ไม่น้อยกว่า ๓ ปี)',
  },
  'รอง ผบก. / เทียบเท่า': {
    requiredYears: 4,
    nextLevel: 'ผบก.',
    previousLevelLabel: 'ผกก.',
    rankColumnLabels: ['รอง ผบก.', 'ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๖) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗ (ระดับ รอง ผบก. ไม่น้อยกว่า ๔ ปี)',
  },
  'ผกก. (เลื่อนเป็น รอง ผบก.)': {
    requiredYears: 4,
    nextLevel: 'รอง ผบก.',
    previousLevelLabel: 'รอง ผกก. / สวญ.',
    rankColumnLabels: ['ผกก.', 'รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๗) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๗) (ระดับ ผกก. ไม่น้อยกว่า ๔ ปี)',
  },
  'รอง ผกก. / สวญ. (เลื่อนเป็น ผกก.)': {
    requiredYears: 4,
    nextLevel: 'ผกก.',
    previousLevelLabel: 'สว.',
    rankColumnLabels: ['รอง ผกก.', 'สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๘) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๘) (ระดับ รอง ผกก. หรือ สวญ. ไม่น้อยกว่า ๔ ปี)',
  },
  'สว. (เลื่อนเป็น รอง ผกก. / สวญ.)': {
    requiredYears: 5,
    nextLevel: 'รอง ผกก. / สวญ.',
    previousLevelLabel: 'รอง สว.',
    rankColumnLabels: ['สว.', 'รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๙) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๙) (ระดับ สว. ไม่น้อยกว่า ๕ ปี)',
  },
  'รอง สว. (เลื่อนเป็น สว.)': {
    requiredYears: 7,
    nextLevel: 'สว.',
    previousLevelLabel: 'ผบ.หมู่',
    rankColumnLabels: ['รอง สว.', 'วันเกิด'],
    legalBasis: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗(๑๐) และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗ ข้อ ๑๗(๑๐) (ระดับ รอง สว. ไม่น้อยกว่า ๗ ปี)',
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

  let totalMonths = (ref.yearBE - start.yearBE) * 12 + (ref.month - start.month);
  if (ref.day < start.day && !(start.day <= 4 && start.month === 11)) {
    // Handle exact day difference unless standard appointment round
    totalMonths -= 1;
  }
  if (totalMonths < 0) totalMonths = 0;

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
      : `${tenureYears} ปีบริบูรณ์ (ตั้งแต่วันที่ ${start.formattedThai})`;

  let eligibilityDisplay;
  if (isEligible) {
    if (yearsPastEligibility === 0 && monthsPastEligibility === 0) {
      eligibilityDisplay = `ครบเกณฑ์พอดีในปี พ.ศ. ${eligibleYearBE} (เกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี · เกินเกณฑ์ 0 ปี)`;
    } else if (monthsPastEligibility > 0) {
      eligibilityDisplay = `ครบเกณฑ์มาแล้ว ${yearsPastEligibility} ปี ${monthsPastEligibility} เดือน (ครบเกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี ตั้งแต่ พ.ศ. ${eligibleYearBE})`;
    } else {
      eligibilityDisplay = `ครบเกณฑ์มาแล้ว ${yearsPastEligibility} ปี (ครบเกณฑ์ขั้นต่ำ ${rule.requiredYears} ปี ตั้งแต่ พ.ศ. ${eligibleYearBE})`;
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
  if (s.includes('ผู้ช่วย ผบ.ตร') || s.includes('รอง จตช')) return 'ผู้ช่วย ผบ.ตร. / รอง จตช.';
  if (s.includes('ผบช') || s.includes('จตร')) {
    if (s.includes('รอง')) return s.includes('แพทย์') ? 'รอง ผบช. / เทียบเท่า' : 'รอง ผบช. / รอง จตร. / เทียบเท่า';
    return 'ผบช. / จตร. / เทียบเท่า';
  }
  if (s.includes('ผบก')) {
    if (s.includes('รอง')) return 'รอง ผบก. / เทียบเท่า';
    return 'ผบก. / เทียบเท่า';
  }
  if (s.includes('ผกก')) {
    if (s.includes('รอง')) return 'รอง ผกก. / สวญ. (เลื่อนเป็น ผกก.)';
    return 'ผกก. (เลื่อนเป็น รอง ผบก.)';
  }
  if (s.includes('สว.')) {
    if (s.includes('รอง')) return 'รอง สว. (เลื่อนเป็น สว.)';
    return 'สว. (เลื่อนเป็น รอง ผกก. / สวญ.)';
  }
  return s;
}

/**
 * ค้นหาและเปรียบเทียบข้อมูลข้าราชการตำรวจจากฐานข้อมูลในเครื่อง 100% (Zero-API-Cost)
 */
export const DIRECT_OCR_MAP = {
  'ปิตภพ โตเหมือน': 'ชิตภพ โตเหมือน',
  'จรภพ ภริเดช': 'จิรภพ ภูริเดช',
  'อบูซา รมยะนบันทน์': 'อนุชา รมยะนันทน์',
  'ฯๆวัฒน์ แสงนุ่ม': 'จิรวัฒน์ แสงนุ่ม',
  'YE กวินเดชาธร': 'ปิยะ กวินเดชาธร',
  'HAY อาภาวศิน': 'นิเวศน์ อาภาวศิน',
  'สรพล เปรมบตร': 'สรพล เปรมบุตร',
  'ปยะวัฒน์ เฉลิมศรี': 'ปิยะวัฒน์ เฉลิมศรี',
  'ชัยต์พจน สวรรณรักษ์': 'ชัยต์พจน์ สุวรรณรักษ์',
  'สวินท์ หรรษมนตร์': 'สุวินท์ หรรษมนตร์',
  'าโัฐศักดิ์ เชาวนาศัย': 'ณัฐศักดิ์ เชาวนาศัย',
  'ายภจ์ จันทร์ถาวร': 'สายภพ จันทร์ถาวร',
  'ว่งโรจน์ ฐากรปณยสิริ': 'รุ่งโรจน์ ฐากูรปุณยสิริ',
  'ภาณพงศ์ ชอบเพื่อน': 'ภาณุพงศ์ ชอบเพื่อน',
  'นันทวฒิ สวรรณละออง': 'นันทวุฒิ สุวรรณละออง',
  'ามสัน สขมาก': 'รามสูรย์ สุขมาก',
  'าญชล อินทราราม': 'กาญจน์ชล อินทราราม',
  'อนุสรณ์ พัฒนถาบตร': 'อนุสรณ์ พัฒนถาบุตร',
  'ณรงค์ฤทธิ์ ด่านสวรรณ์': 'ณรงค์ฤทธิ์ ด่านสุวรรณ์',
  'เพโรจน์ ค้มภัย': 'ไพโรจน์ คุ้มภัย',
  'วรพจน์ ดิษยบตร': 'วรพจน์ ดิษยบุตร',
  'ฯมิทธิ สวรรณสขโรจน์': 'สมิทธิ สุวรรณสุขโรจน์',
  'จมพร พกหอม': 'ชุมพร พุกหอม',
  'ก4พวัฒน์ อารยางกร': 'ณพวัฒน์ อารยางกูร',
  'วนพล ศรีโสภา': 'ธนพล ศรีโสภา',
  'าถษภา สรเชษฐพงษ์': 'กฤษฎา สุรเชษฐพงษ์',
  'อทธิพล อิทธิสารรณชัย': 'อิทธิพล อิทธิสารรณชัย',
  '1รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
  'รพงษ์ ถนอมจิตร': 'จิรพงษ์ ถนอมจิตร',
  'สยาม บญสม': 'สยาม บุญสม',
  'อทธิพล นาคคำ': 'อิทธิพล นาคคำ',
  'พิทักษ์ อทัยธรรม': 'พิทักษ์ อุทัยธรรม',
  'กอฎตธาพล  ยี่สาคร': 'กฤตธาพล ยี่สาคร',
  'Was ตันประเสริฐ': 'พิสิฐ ตันประเสริฐ',
  'จันติ ชัยนิรามัย': 'สันติ ชัยนิรามัย',
  'ธรจิต ซิงนวรรณ์': 'สุรจิต ชิงนวรรณ์',
  'วมล พิทักษ์บรพา': 'วิมล พิทักษ์บูรพา',
  'พโรจน์ สขรวยธนโชติ': 'ไพโรจน์ สุขรวยธนโชติ',
  'เชคชัย งามวงศ์': 'โชคชัย งามวงศ์',
  'URS เทศขัน': 'มนตรี เทศขัน',
  'Suwa ลีลาประภาภรณ์': 'กัมพล ลีลาประภาภรณ์',
  'SU พวงมณี': 'ธนู พวงมณี',
  'SUT แก่นจันทร์': 'ยุทธนา แก่นจันทร์',
  'พุศวีร์ Sean': 'พศวีร์ เรืองภู่',
  'SINT ชิ้นทอง': 'อาทร ชิ้นทอง',
  'Insane วัชรเสวิ': 'ไกรวิทย์ วัชรเสวี',
  'SHUT ธรรเมศรานนท์': 'ชูสิทธิ์ ธรรเมศรานนท์',
  'ALN รักษาสุวรรณ': 'ชยพัทธ์ รักษาสุวรรณ',
  'ATR ชาวศรีทอง': 'ดำรงศักดิ์ ชาวศรีทอง',
  'ARNT เอกสิงหชัย': 'ศิริ เอกสิงหชัย',
  'Fons ทองนาเพียง': 'ธีระพงษ์ ทองนาเพียง',
  'A159 อำพรรทอง': 'ธีรพงษ์ อำพรรทอง',
  'LOAN มารศรี': 'มานพ มารศรี',
  'NS ปานดำ': 'สิทธิชัย ปานดำ',
  'DUN บตรอินทร์': 'ดนัย บุตรอินทร์',
  'SAUNT สุนทรโชติ': 'สุทธิพงศ์ สุนทรโชติ',
  'nan วาลีประโคน': 'วิโรจน์ วาลีประโคน',
  'AWA คำพานิช': 'อำนาจ คำพานิช',
  'TUN อนุเอกจิตร': 'ธัชพล อนุเอกจิตร',
  'AUN เสถียรพงศ์': 'สุเทพ เสถียรพงศ์',
  'uals วงษ์กล้าหาญ': 'สุทธิพงษ์ วงษ์กล้าหาญ',
  'Suna รัตนประทีป': 'สุรเชษฐ์ รัตนประทีป',
  'DANS ทองทิพย์': 'เดชา ทองทิพย์',
  'BNI ช่วยศรี': 'บุญเลิศ ช่วยศรี',
};

export function cleanThaiOcrName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if (DIRECT_OCR_MAP[s]) return DIRECT_OCR_MAP[s];
  s = s.replace(/^[0-9ฯๆ1\s]+/, '');
  s = s.replace(/^า[โถ]\s*/, '');
  s = s.replace(/^ก4\s*/, '');
  s = s.replace(/บตร\b/g, 'บุตร');
  s = s.replace(/สวรรณ/g, 'สุวรรณ');
  s = s.replace(/ค้มภัย/g, 'คุ้มภัย');
  s = s.replace(/พกหอม/g, 'พุกหอม');
  s = s.replace(/จมพร/g, 'ชุมพร');
  s = s.replace(/สพรรณ/g, 'สุพรรณ');
  s = s.replace(/บญ/g, 'บุญ');
  s = s.replace(/สข/g, 'สุข');
  s = s.replace(/มสิกล/g, 'มุสิกูล');
  s = s.replace(/กาวิกล/g, 'กาวิกูล');
  s = s.replace(/วสทธิ์/g, 'วสุทธิ์');
  s = s.replace(/สริย/g, 'สุริย');
  s = s.replace(/พบลย์/g, 'พิบูลย์');
  s = s.replace(/บำรง/g, 'บำรุง');
  s = s.replace(/บตราช/g, 'บุตรราช');
  return s.trim();
}

export function thaiConsonantSkeleton(str) {
  if (!str) return '';
  return String(str)
    .replace(/[0-9๑-๙]/g, '')
    .replace(/[\u0E30-\u0E3A\u0E47-\u0E4E\u0E31\u0E34-\u0E39\u0E40-\u0E44]/g, '')
    .replace(/\s+/g, '');
}

export function canonicalRankForLevel(level) {
  const l = String(level || '');
  if (l.includes('ผู้ช่วย ผบ.ตร.')) return 'พล.ต.ท.';
  if (l.includes('รอง ผบช.')) return 'พล.ต.ต.';
  if (l.includes('ผบช.') || l.includes('จตร')) return 'พล.ต.ท.';
  if (l.includes('รอง ผบก.')) return 'พ.ต.อ.';
  if (l.includes('ผบก.')) return 'พล.ต.ต.';
  if (l.includes('รอง ผกก.')) return 'พ.ต.ท.';
  if (l.includes('ผกก.')) return 'พ.ต.อ.';
  if (l.includes('รอง สว.')) return 'ร.ต.อ.';
  if (l.includes('สว.')) return 'พ.ต.ท.';
  return '';
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

  for (const appt of appointmentsList) {
    const rawFullName = String(appt['ชื่อ–นามสกุล'] || appt['ชื่อ-นามสกุล'] || appt.label || '').trim();
    const cleanFullName = cleanThaiOcrName(rawFullName);
    const norm = normalizeName(cleanFullName || rawFullName);
    if (!norm) continue;
    const stdLevel = canonicalLevel(appt.source_level || appt['ระดับเดิม'] || '');
    const rank = appt['ยศเดิม'] || canonicalRankForLevel(stdLevel);
    const skeleton = thaiConsonantSkeleton(rawFullName + ' ' + cleanFullName);

    officerMap.set(norm, {
      key: norm,
      cleanKey: normalizeName(cleanFullName),
      name: cleanFullName,
      rawName: rawFullName,
      skeleton,
      rank,
      appointmentNumber: appt['ข้อที่'] || null,
      currentPosition: appt['ตำแหน่งเดิม'] || '',
      newPosition: appt['ตำแหน่งใหม่'] || '',
      currentLevel: appt['ระดับเดิม'] || appt.source_level || '',
      newLevel: appt['ระดับใหม่'] || '',
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
    });
  }

  for (const sen of seniorityList) {
    const rawFullName = String(sen.appointment_name || sen.source_name || sen.label || '').trim();
    const cleanFullName = cleanThaiOcrName(rawFullName);
    const norm = normalizeName(cleanFullName || rawFullName);
    if (!norm) continue;
    const isPromoted = Boolean(
      (sen.promotion_outcome && (sen.promotion_outcome.includes('ได้เลื่อน') || sen.promotion_outcome.includes('พบในรายการ'))) ||
      sen.new_position
    );
    const stdLevel = canonicalLevel(sen.source_level || '');
    const existing = officerMap.get(norm) || officerMap.get(normalizeName(rawFullName)) || {
      key: norm,
      cleanKey: normalizeName(cleanFullName),
      name: cleanFullName,
      rawName: rawFullName,
      skeleton: thaiConsonantSkeleton(rawFullName + ' ' + cleanFullName),
      rank: canonicalRankForLevel(sen.source_level || stdLevel),
      appointmentNumber: sen.appointment_item_no || null,
      currentPosition: sen.source_position || '',
      newPosition: sen.new_position || '',
      currentLevel: sen.source_level || '',
      newLevel: sen.new_level || '',
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
    const rank = existing.rank || canonicalRankForLevel(sen.source_level || stdLevel);
    const skeleton = existing.skeleton || thaiConsonantSkeleton(rawFullName + ' ' + cleanFullName);

    officerMap.set(norm, {
      ...existing,
      name: cleanFullName,
      rawName: rawFullName,
      skeleton,
      rank,
      currentPosition: existing.currentPosition || sen.source_position || '',
      appointmentType: effectiveApptType,
      inAppointmentOrder: effectiveInOrder,
      newPosition: existing.newPosition || sen.new_position || '',
      newLevel: existing.newLevel || sen.new_level || '',
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

  const allOfficers = [...officerMap.values()];

  // Multi-criteria filter: query keyword, consonant skeleton, level, account, or seniority order
  let matches = allOfficers;
  const queryTokens = qRaw
    .replace(/^(?:พ\.ต\.(?:อ|ท|ต)|พล\.ต\.(?:อ|ท|ต)|ร\.ต\.(?:อ|ท|ต)|ดาบตำรวจ|ด\.ต\.|ส\.ต\.(?:อ|ท|ต))\s*/, '')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const surnameToken =
    queryTokens.length >= 2
      ? queryTokens[queryTokens.length - 1]
      : queryTokens.length === 1
        ? queryTokens[0]
        : null;
  const surnameNorm = surnameToken ? normalizeName(surnameToken) : null;
  const surnameSkel = surnameToken ? thaiConsonantSkeleton(surnameToken) : null;

  if (qNorm) {
    matches = matches.filter((o) => {
      // 1. Direct key, cleanKey, skeleton, rank+name, position, appointment number, or seniority order match
      if (
        o.key.includes(qNorm) ||
        (o.cleanKey && o.cleanKey.includes(qNorm)) ||
        (qSkel && o.skeleton && o.skeleton.includes(qSkel)) ||
        normalizeName(`${o.rank}${o.name}`).includes(qNorm) ||
        (o.currentPosition && normalizeName(o.currentPosition).includes(qNorm)) ||
        (o.newPosition && normalizeName(o.newPosition).includes(qNorm)) ||
        (o.appointmentNumber && String(o.appointmentNumber) === qRaw) ||
        (qOrderNum && o.seniorityOrder === qOrderNum)
      ) {
        return true;
      }

      // 2. Surname / Token match (min 3 chars)
      if (surnameNorm && surnameNorm.length >= 3) {
        if (o.key.includes(surnameNorm) || (o.cleanKey && o.cleanKey.includes(surnameNorm))) return true;
        if (surnameSkel && surnameSkel.length >= 3 && o.skeleton && o.skeleton.includes(surnameSkel)) return true;
      }

      // 3. Multi-token match (all tokens match across key, cleanKey, skeleton, or rank)
      if (queryTokens.length > 1) {
        const allTokensFound = queryTokens.every((tok) => {
          const tNorm = normalizeName(tok);
          const tSkel = thaiConsonantSkeleton(tok);
          return (
            o.key.includes(tNorm) ||
            (o.cleanKey && o.cleanKey.includes(tNorm)) ||
            (tSkel && o.skeleton && o.skeleton.includes(tSkel)) ||
            (o.rank && o.rank.includes(tok))
          );
        });
        if (allTokensFound) return true;
      }

      return false;
    });
  }
  if (manualLevel) {
    const cLevel = canonicalLevel(manualLevel);
    matches = matches.filter(
      (o) => canonicalLevel(o.sourceLevel) === cLevel || canonicalLevel(o.currentLevel) === cLevel,
    );
  }
  if (manualAccount) {
    matches = matches.filter((o) => !o.sourceAccount || o.sourceAccount === manualAccount);
  }
  if (Number.isInteger(manualOrder) && manualOrder > 0) {
    const orderMatches = matches.filter((o) => o.seniorityOrder === manualOrder);
    if (orderMatches.length > 0) matches = orderMatches;
  }

  // Pick primary target officer
  let target = null;
  if (qNorm) {
    target =
      matches.find((o) => o.key === qNorm || o.cleanKey === qNorm || normalizeName(o.name) === qNorm) ||
      matches.find((o) => qSkel && o.skeleton && o.skeleton === qSkel) ||
      (queryTokens.length > 1
        ? matches.find((o) =>
            queryTokens.every(
              (t) => o.key.includes(normalizeName(t)) || (o.cleanKey && o.cleanKey.includes(normalizeName(t))),
            ),
          )
        : null) ||
      (surnameNorm && surnameNorm.length >= 3
        ? matches.find((o) => o.key.includes(surnameNorm) || (o.cleanKey && o.cleanKey.includes(surnameNorm)))
        : null) ||
      (surnameSkel && surnameSkel.length >= 3
        ? matches.find((o) => o.skeleton && o.skeleton.includes(surnameSkel))
        : null) ||
      matches.find((o) => qOrderNum && o.seniorityOrder === qOrderNum) ||
      (matches.length > 0 ? matches[0] : null);
  } else if (Number.isInteger(manualOrder) && manualOrder > 0) {
    target = matches.find((o) => o.seniorityOrder === manualOrder) || null;
  } else if (matches.length > 0 && manualLevel) {
    target = matches[0];
  }

  // Determine effective level, account and seniority order
  const effectiveLevel = canonicalLevel(manualLevel || target?.sourceLevel || target?.currentLevel || 'รอง ผบก. / เทียบเท่า');
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

  const tenureInfo = calculateTenureAndEligibility(effectiveCurrentPosDate, effectiveLevel);
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

  // 1. All promoted officers in this level & account (sorted by seniorityOrder)
  const promotedInSameAccount = allOfficers
    .filter(
      (o) =>
        o.inAppointmentOrder &&
        o.appointmentType === 'เลื่อนระดับ' &&
        canonicalLevel(o.sourceLevel) === effectiveLevel &&
        ((o.sourceAccount || 'ทั่วไป') === (effectiveAccount || 'ทั่วไป')) &&
        Number.isInteger(o.seniorityOrder),
    )
    .sort((a, b) => a.seniorityOrder - b.seniorityOrder)
    .map((o) => {
      const oTenure = calculateTenureAndEligibility(o.currentPositionDate, o.sourceLevel);
      const oRetire = calculateRetirementInfo(o.birthDate);
      const isTarget = Boolean(target && (o.key === target.key || o.name === target.name));
      const isJunior = Boolean(effectiveOrder && o.seniorityOrder > effectiveOrder);
      const isSenior = Boolean(effectiveOrder && o.seniorityOrder < effectiveOrder);
      return {
        name: o.name,
        rank: o.rank,
        fullNameWithRank: `${o.rank ? `${o.rank} ` : ''}${o.name}`.trim(),
        appointmentNumber: o.appointmentNumber,
        seniorityOrder: o.seniorityOrder,
        previousOrder: o.previousOrder,
        totalSuitablePopulation: o.totalSuitablePopulation || totalPopulation,
        currentPosition: o.currentPosition,
        newPosition: o.newPosition,
        appointmentType: o.appointmentType || 'เลื่อนระดับ',
        currentPositionDate: o.currentPositionDate,
        currentPositionDateThai: oTenure.currentPositionDateThai,
        tenureDisplay: oTenure.tenureDisplay,
        birthDate: o.birthDate,
        birthDateThai: oRetire?.birthDateThai || null,
        retirementYearBE: oRetire?.retirementYearBE || null,
        bornAfterSep30: oRetire?.bornAfterSep30 || false,
        seniorityPdfPage: o.seniorityPdfPage,
        appointmentPdfPage: o.appointmentPdfPage,
        orderGap: effectiveOrder ? Math.abs(o.seniorityOrder - effectiveOrder) : null,
        isTarget,
        isJunior,
        isSenior,
        relationTag: isTarget ? 'target' : isJunior ? 'junior' : isSenior ? 'senior' : 'same',
      };
    });

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
    .map((o) => {
      const oTenure = calculateTenureAndEligibility(o.currentPositionDate, o.sourceLevel);
      const oRetire = calculateRetirementInfo(o.birthDate);
      const isTarget = Boolean(target && (o.key === target.key || o.name === target.name));
      const isJunior = Boolean(effectiveOrder && Number.isInteger(o.seniorityOrder) && o.seniorityOrder > effectiveOrder);
      const isSenior = Boolean(effectiveOrder && Number.isInteger(o.seniorityOrder) && o.seniorityOrder < effectiveOrder);
      const isRotation = o.appointmentType !== 'เลื่อนระดับ';
      return {
        name: o.name,
        rank: o.rank,
        fullNameWithRank: `${o.rank ? `${o.rank} ` : ''}${o.name}`.trim(),
        appointmentNumber: o.appointmentNumber,
        seniorityOrder: o.seniorityOrder,
        previousOrder: o.previousOrder,
        totalSuitablePopulation: o.totalSuitablePopulation || totalPopulation,
        currentPosition: o.currentPosition,
        newPosition: o.newPosition,
        appointmentType: o.appointmentType || 'ระดับเดิม',
        currentPositionDate: o.currentPositionDate,
        currentPositionDateThai: oTenure.currentPositionDateThai,
        tenureDisplay: oTenure.tenureDisplay,
        birthDate: o.birthDate,
        birthDateThai: oRetire?.birthDateThai || null,
        retirementYearBE: oRetire?.retirementYearBE || null,
        bornAfterSep30: oRetire?.bornAfterSep30 || false,
        seniorityPdfPage: o.seniorityPdfPage,
        appointmentPdfPage: o.appointmentPdfPage,
        orderGap: effectiveOrder && Number.isInteger(o.seniorityOrder) ? Math.abs(o.seniorityOrder - effectiveOrder) : null,
        isTarget,
        isJunior,
        isSenior,
        isRotation,
        relationTag: isTarget ? 'target' : isRotation ? 'rotation' : isJunior ? 'junior' : isSenior ? 'senior' : 'same',
      };
    });

  // Junior promoted officers: those with seniorityOrder > effectiveOrder
  const juniorPromotedOfficers = effectiveOrder
    ? promotedInSameAccount.filter((o) => o.seniorityOrder > effectiveOrder)
    : [];

  // Senior promoted officers: those with seniorityOrder < effectiveOrder
  const seniorPromotedOfficers = effectiveOrder
    ? promotedInSameAccount.filter((o) => o.seniorityOrder < effectiveOrder)
    : [];

  const profile =
    target || qRaw || effectiveOrder || manualLevel
      ? {
          foundInDatabase: Boolean(target),
          isPromotedInOrder2569: Boolean(target && target.appointmentType === 'เลื่อนระดับ'),
          appointmentType: target?.appointmentType || 'ผู้ร้องทุกข์ / เปรียบเทียบลำดับอาวุโส (ไม่ได้เลื่อนตำแหน่งสูงขึ้น)',
          appointmentNumber: target?.appointmentNumber || null,
          rank: target?.rank || '',
          name: target?.name || qRaw || `ผู้เปรียบเทียบลำดับอาวุโสที่ ${effectiveOrder || '-'}`,
          fullNameWithRank: target
            ? `${target.rank ? `${target.rank} ` : ''}${target.name}`.trim()
            : qRaw || `ผู้เปรียบเทียบลำดับอาวุโสที่ ${effectiveOrder || '-'}`,
          currentPosition:
            manualCurrentPos ||
            target?.currentPosition ||
            (effectiveLevel ? `ข้าราชการตำรวจระดับ ${effectiveLevel}` : '-'),
          newPosition: target?.newPosition || 'ไม่ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้นในคำสั่งนี้',
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
          comparison: {
            sourceLevel: effectiveLevel,
            sourceAccount: effectiveAccount,
            totalSuitablePopulation: totalPopulation,
            totalPromotedInAccount: promotedInSameAccount.length,
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
                ? `เมื่อเทียบกับคำสั่งแต่งตั้งเลื่อนตำแหน่งสูงขึ้นในระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) ซึ่งมีผู้ได้รับเลื่อนตำแหน่งรวม ${promotedInSameAccount.length} ราย พบว่ามีผู้ที่อาวุโสน้อยกว่า (ลำดับอาวุโสหลังลำดับที่ ${effectiveOrder}) ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้นจำนวน ${juniorPromotedOfficers.length} คน (ตั้งแต่ลำดับอาวุโสที่ ${juniorPromotedOfficers[0].seniorityOrder} ถึงลำดับที่ ${juniorPromotedOfficers[juniorPromotedOfficers.length - 1].seniorityOrder})`
                : `ในระดับ ${effectiveLevel} (บัญชี${effectiveAccount}) มีผู้ได้รับเลื่อนตำแหน่งรวม ${promotedInSameAccount.length} ราย โดยไม่ปรากฏผู้ที่อาวุโสน้อยกว่าลำดับที่ ${effectiveOrder} ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้น`
              : `ในระดับ ${effectiveLevel} มีผู้ได้รับแต่งตั้งรวม ${allAppointedInLevel.length} ราย (เลื่อนตำแหน่งสูงขึ้น ${promotedInSameAccount.length} ราย · สับเปลี่ยนหมุนเวียน ${allAppointedInLevel.length - promotedInSameAccount.length} ราย)`,
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
      fullNameWithRank: `${o.rank ? `${o.rank} ` : ''}${o.name}`.trim(),
      currentPosition: o.currentPosition,
      newPosition: o.newPosition,
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
