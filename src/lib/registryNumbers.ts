/** Shared with Excel import. Literal cell is kept separately from this extracted unique identifier. */
export function normalizeCaseNumber(value: unknown): string {
  return String(value ?? '').replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0e50)).replace(/\s+/g, '').trim();
}
export function extractStoredRedNumber(value: unknown): string | null {
  return normalizeCaseNumber(value).match(/\d+\/\d+/)?.[0] ?? null;
}
