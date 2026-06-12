import { FileText, Download } from "lucide-react";

interface DocumentListProps {
  documents: { id: string; name: string; date: string; size: string; webUrl?: string; category?: string; status?: string; provider?: string }[];
}

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <ul role="list" className="divide-y divide-slate-100 rounded-md border border-slate-200">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
          <div className="flex w-0 flex-1 items-center">
            <FileText className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
            <div className="ml-4 flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{doc.name}</span>
                {doc.category && <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">{doc.category}</span>}
              </div>
              {doc.provider === 'microsoft_graph' && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>จัดเก็บที่: OneDrive/SharePoint</span>
                  {doc.status === 'linked' && <span className="text-emerald-600">เชื่อมโยงแล้ว</span>}
                </div>
              )}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center gap-4">
            <span className="text-xs text-slate-400">{doc.date}</span>
            {doc.webUrl ? (
              <a href={doc.webUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1">
                เปิดเอกสาร
              </a>
            ) : (
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1">
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
