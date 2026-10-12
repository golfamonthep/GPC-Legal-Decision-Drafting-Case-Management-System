import { isClosedOrRedCase, type RegistryCompletionRecord } from './caseStatus';

/** Apply exact trimmed-cell semantics, including arbitrary text and whitespace-only blanks. */
export function filterCasesByRegistryCompletion<T extends RegistryCompletionRecord>(
  cases: T[], completionStatus?: string, redNumberStatus?: string,
): T[] {
  return cases.filter(item => {
    const completed = isClosedOrRedCase(item);
    return !(completionStatus === 'completed' && !completed || completionStatus === 'open' && completed ||
      redNumberStatus === 'hasRed' && !completed || redNumberStatus === 'noRed' && completed);
  });
}

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
