const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

export function thaiToArabicDigits(str: string): string {
  let result = str;
  for (let i = 0; i < THAI_DIGITS.length; i++) {
    result = result.replaceAll(THAI_DIGITS[i], String(i));
  }
  return result;
}

export function normalizeCaseNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  const converted = thaiToArabicDigits(String(raw).trim());
  return converted
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractStoredRedNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  const negativePhrases = [
    '-',
    'ยังไม่ออก',
    'ไม่มี',
    'รอ',
    'รอออกเลขแดง',
    'ยังไม่ได้เลขแดง',
  ];
  if (negativePhrases.includes(str.toLowerCase())) {
    return null;
  }

  const normalized = normalizeCaseNumber(str);
  const match = normalized.match(/(\d+\/\d+)/);
  if (match) {
    return match[1];
  }

  return null;
}
