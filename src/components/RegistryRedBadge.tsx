import { getRegistryRedText } from "@/lib/caseStatus";

export function RegistryRedBadge({ record }: { record: { registryRedText?: string | null; redNumber?: string | null } }) {
  const red = getRegistryRedText(record);
  return red
    ? <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">แดง: {red}</span>
    : <span className="text-xs text-slate-400 pl-1">- ไม่มีเรื่องแดง -</span>;
}
