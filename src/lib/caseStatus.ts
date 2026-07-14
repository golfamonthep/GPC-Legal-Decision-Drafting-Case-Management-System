export function isClosedCaseStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.trim().replace(/\s+/g, ' ').toLowerCase();
  const closedStatuses = [
    'เสร็จสิ้น',
    'เสร็จสิ้น (ศาลปกครอง)',
    'เสร็จสิ้น(ศาลปกครอง)',
    'แล้วเสร็จ',
    'ยุติเรื่อง',
    'จำหน่ายเรื่อง',
    'ปิดเรื่อง',
    'closed',
    'completed',
    'ปิดคดี',
    'วินิจฉัยแล้วเสร็จ'
  ];
  return closedStatuses.includes(normalized);
}

export function hasRedCaseNumber(redCaseNumber: string | null | undefined): boolean {
  if (!redCaseNumber) return false;
  const normalized = redCaseNumber.trim().toLowerCase();
  if (normalized === '') return false;
  
  const negativePhrases = [
    '-',
    'ยังไม่ออก',
    'ไม่มี',
    'รอ',
    'รอออกเลขแดง',
    'ยังไม่ได้เลขแดง'
  ];
  if (negativePhrases.includes(normalized)) return false;

  const positivePhrases = [
    'แดงแล้ว',
    'ออกเลขแดงแล้ว',
    'มีเลขแดงแล้ว'
  ];
  for (const phrase of positivePhrases) {
    if (normalized.includes(phrase)) return true;
  }

  // Look for digit/digit pattern commonly used in case numbers e.g. 163/68, 19/2569
  if (/\d+\/\d+/.test(normalized)) return true;

  return false;
}

export function isClosedOrRedCase(caseObj: any): boolean {
  if (!caseObj) return false;
  
  const status = caseObj.status || caseObj.currentStatus;
  if (isClosedCaseStatus(status)) return true;

  const redCase = caseObj.redCaseNumber || caseObj.redCaseNo || caseObj.redNumber || caseObj.redNumberText;
  if (hasRedCaseNumber(redCase)) return true;

  return false;
}
