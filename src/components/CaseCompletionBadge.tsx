import { IconCircleCheckFilled, IconClockHour4 } from '@tabler/icons-react';
import { isClosedOrRedCase, type RegistryCompletionRecord } from '@/lib/caseStatus';

export function CaseCompletionBadge({ record }: { record: RegistryCompletionRecord }) {
  const completed = isClosedOrRedCase(record);
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${completed
    ? 'bg-emerald-100 text-emerald-900 ring-emerald-600/30'
    : 'bg-amber-100 text-amber-950 ring-amber-600/35'}`}>
    {completed ? <IconCircleCheckFilled size={14} aria-hidden="true" /> : <IconClockHour4 size={14} aria-hidden="true" />}
    {completed ? 'เสร็จสิ้นแล้ว' : 'ยังไม่เสร็จสิ้น'}
  </span>;
}
