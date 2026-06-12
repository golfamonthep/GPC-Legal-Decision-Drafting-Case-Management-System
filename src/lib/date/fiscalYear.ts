export function getFiscalYearStart(date: Date = new Date()): Date {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, 9 is October

  if (month >= 9) {
    // Oct, Nov, Dec belong to the next fiscal year, but they start this year.
    return new Date(year, 9, 1);
  } else {
    // Jan-Sep belong to the current fiscal year, which started last year.
    return new Date(year - 1, 9, 1);
  }
}

export function getFiscalYearEnd(date: Date = new Date()): Date {
  const start = getFiscalYearStart(date);
  // Ends on Sept 30 of the next year
  return new Date(start.getFullYear() + 1, 8, 30, 23, 59, 59, 999);
}

export function getThisMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getThisMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getThisQuarterStart(date: Date = new Date()): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

export function getThisQuarterEnd(date: Date = new Date()): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
}
