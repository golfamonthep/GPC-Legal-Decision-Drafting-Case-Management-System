import { cn } from "../lib/utils";
import { isClosedCaseStatus } from "../lib/caseStatus";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-gray-100 text-gray-800 border border-gray-200";

  if (isClosedCaseStatus(status)) {
    colorClass = "bg-green-100 text-green-800 border border-green-200";
  } else {
    switch (status) {
      case "รับเรื่อง":
      case "ตรวจสอบคำร้อง":
        colorClass = "bg-slate-100 text-slate-700 border border-slate-200";
        break;
      case "รอคำแก้":
      case "รอเอกสาร/คำชี้แจง":
        colorClass = "bg-amber-50 text-amber-700 border border-amber-200";
        break;
      case "แสวงหาข้อเท็จจริง":
        colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
        break;
      case "รอตรวจร่าง":
        colorClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
        break;
      case "รอเข้าประชุม":
        colorClass = "bg-violet-50 text-violet-700 border border-violet-200";
        break;
      case "มีมติแล้ว":
        colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
        break;
      case "แจ้งผลแล้ว":
        colorClass = "bg-cyan-50 text-cyan-700 border border-cyan-200";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}
