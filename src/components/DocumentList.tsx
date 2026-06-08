import { FileText, Download } from "lucide-react";

interface DocumentListProps {
  documents: { id: string; name: string; date: string; size: string }[];
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <ul role="list" className="divide-y divide-slate-100 rounded-md border border-slate-200">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
          <div className="flex w-0 flex-1 items-center">
            <FileText className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
            <div className="ml-4 flex min-w-0 flex-1 gap-2">
              <span className="truncate font-medium">{doc.name}</span>
              <span className="flex-shrink-0 text-slate-400">({doc.size})</span>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center gap-4">
            <span className="text-xs text-slate-400">{doc.date}</span>
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1">
              <Download className="h-4 w-4" />
              ดาวน์โหลด
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
