import Link from 'next/link';
import { Pencil } from 'lucide-react';

export function CaseDetailActions({ caseData }: { caseData: { id: string } }) {
  return <Link href={`/cases/${caseData.id}/edit`} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:bg-slate-50">
    <Pencil className="mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />แก้ไขข้อมูล
  </Link>;
}
