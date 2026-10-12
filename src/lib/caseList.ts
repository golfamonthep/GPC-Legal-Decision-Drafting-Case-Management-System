/** Partition the filtered result once; never silently drop unknown registry types. */
export function groupCasesByRegistry<T extends { type: string }>(cases: T[]) {
  const complaint: T[] = [];
  const appeal: T[] = [];
  const unknown: T[] = [];
  for (const item of cases) {
    if (item.type === "ร้องทุกข์") complaint.push(item);
    else if (item.type === "อุทธรณ์") appeal.push(item);
    else unknown.push(item);
  }
  return { complaint, appeal, unknown };
}
