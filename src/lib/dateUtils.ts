export function parseThaiDate(dateStr: any): Date | null {
  if (dateStr === null || dateStr === undefined || dateStr === '') return null;
  
  if (typeof dateStr === 'number') {
    // Excel serial date. Excel epoch is Dec 30, 1899.
    const excelEpoch = new Date(1899, 11, 30);
    const parsed = new Date(excelEpoch.getTime() + dateStr * 86400000);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const str = String(dateStr).trim();
  if (!str) return null;

  // yyyy-mm-dd (ISO)
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1]);
    if (year > 2400) year -= 543;
    const d = new Date(year, parseInt(ymdMatch[2]) - 1, parseInt(ymdMatch[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3]);
    if (year > 2400) year -= 543; // Buddhist year
    const d = new Date(year, parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d;
  }

  // Thai text date like "1 ม.ค. 2568" or "1 มกราคม 2568"
  const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  const thaiDateMatch = str.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (thaiDateMatch) {
    const day = parseInt(thaiDateMatch[1]);
    const monthStr = thaiDateMatch[2];
    let year = parseInt(thaiDateMatch[3]);
    if (year > 2400) year -= 543;

    let monthIndex = thaiMonthsShort.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = thaiMonthsFull.indexOf(monthStr);
    }

    if (monthIndex !== -1) {
      const d = new Date(year, monthIndex, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback to JS Date parse
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
