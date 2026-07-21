const THAI_DIGITS: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

function normalizeThaiDigits(value: string): string {
  return value.replace(/[๐-๙]/g, (digit) => THAI_DIGITS[digit] ?? digit);
}

function normalizeYear(year: number): number {
  if (year < 100) {
    // Two-digit Thai Buddhist year: 67 = 2567 = 2024.
    year += 2500;
  }
  if (year > 2400) {
    year -= 543;
  } else if (year >= 1957 && year <= 1999) {
    // Excel interprets Thai two-digit years such as 68/69 as 1968/1969.
    // In these operational registers they mean B.E. 2568/2569 = 2025/2026.
    year += 57;
  }
  return year;
}

function normalizeParsedDate(date: Date): Date | null {
  if (Number.isNaN(date.getTime())) return null;

  const normalizedYear = normalizeYear(date.getFullYear());
  if (normalizedYear !== date.getFullYear()) {
    date.setFullYear(normalizedYear);
  }

  return date;
}

function buildValidDate(year: number, month: number, day: number): Date | null {
  const normalizedYear = normalizeYear(year);
  const date = new Date(normalizedYear, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== normalizedYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseThaiDate(dateValue: any): Date | null {
  if (dateValue === null || dateValue === undefined || dateValue === '') return null;

  if (dateValue instanceof Date) {
    return normalizeParsedDate(new Date(dateValue));
  }

  if (typeof dateValue === 'number') {
    // Excel epoch is Dec 30, 1899. Some Thai workbooks store full Buddhist-era
    // calendar years, producing serials around 240,000 rather than 45,000.
    // Other rows contain two-digit Thai years that Excel interpreted as 19xx.
    const excelEpoch = new Date(1899, 11, 30);
    const parsed = new Date(excelEpoch.getTime() + dateValue * 86400000);
    return normalizeParsedDate(parsed);
  }

  const str = normalizeThaiDigits(String(dateValue))
    .replace(/\s+/g, ' ')
    .trim();

  if (!str || str.includes('#VALUE!') || str.includes('#NAME?')) return null;

  // yyyy-mm-dd (ISO, Gregorian or Buddhist year)
  const ymdMatch = str.match(/^(\d{2,4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    return buildValidDate(
      Number.parseInt(ymdMatch[1], 10),
      Number.parseInt(ymdMatch[2], 10),
      Number.parseInt(ymdMatch[3], 10),
    );
  }

  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yy, including two-digit Buddhist years.
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmyMatch) {
    return buildValidDate(
      Number.parseInt(dmyMatch[3], 10),
      Number.parseInt(dmyMatch[2], 10),
      Number.parseInt(dmyMatch[1], 10),
    );
  }

  const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  // Thai text date, for example 1 ม.ค. 2568 or 1 มกราคม 68.
  const thaiDateMatch = str.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{2,4})$/);
  if (thaiDateMatch) {
    const monthText = thaiDateMatch[2];
    let monthIndex = thaiMonthsShort.indexOf(monthText);
    if (monthIndex === -1) monthIndex = thaiMonthsFull.indexOf(monthText);

    if (monthIndex !== -1) {
      return buildValidDate(
        Number.parseInt(thaiDateMatch[3], 10),
        monthIndex + 1,
        Number.parseInt(thaiDateMatch[1], 10),
      );
    }
  }

  // Conservative fallback for unambiguous browser-supported date strings.
  return normalizeParsedDate(new Date(str));
}
