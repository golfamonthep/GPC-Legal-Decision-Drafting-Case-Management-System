/** Quote every cell and prevent user text from becoming a spreadsheet formula. */
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function csvRow(values: unknown[]): string { return values.map(csvCell).join(','); }
