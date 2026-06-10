"use client";

import { useState } from "react";
import { Case } from "@/types";
import { EditCaseModal } from "./EditCaseModal";
import { Pencil } from "lucide-react";

interface CaseDetailActionsProps {
  caseData: any; // Using any or Case depending on your types
}

export function CaseDetailActions({ caseData }: CaseDetailActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      >
        <Pencil className="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />
        แก้ไขข้อมูล
      </button>

      {isEditModalOpen && (
        <EditCaseModal
          caseData={caseData}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
}
