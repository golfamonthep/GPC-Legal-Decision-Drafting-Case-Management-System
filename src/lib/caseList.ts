import { getRegistryCaseStatus, isClosedCaseStatus, isClosedOrRedCase, type RegistryCompletionRecord } from './caseStatus';
import type { Prisma } from '../generated/prisma';
import { getBlackNumberYear } from './dashboard/metrics';

export function caseTextSearch(term: string): Prisma.CaseWhereInput {
  return { OR: ['blackNumber','registryRedText','petitionerName','respondentName','subject','proceedingNote'].map(field => ({ [field]: { contains: term.trim().slice(0, 200), mode: 'insensitive' as const } })) };
}

export function filterCasesByBlackYear<T extends { blackNumber: string }>(items: T[], year?: string) {
  return year ? items.filter(item => getBlackNumberYear(item.blackNumber).replace('พ.ศ. ', '') === year) : items;
}

export function filterCaseWorkflowRecords<T extends RegistryCompletionRecord>(items: T[], status?: string, preset?: string): T[] {
  return items.filter(item => {
    const completed = isClosedOrRedCase(item);
    if (status && getRegistryCaseStatus(item) !== status) return false;
    if (preset === 'unfinished') return !completed;
    if (preset === 'has_red_unfinished') return completed && !isClosedCaseStatus(item.currentStatus);
    if (preset === 'completed_no_red') return !completed && isClosedCaseStatus(item.currentStatus);
    return true;
  });
}

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
