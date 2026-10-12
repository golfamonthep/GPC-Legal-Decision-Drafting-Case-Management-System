import { isClosedOrRedCase, isClosedCaseStatus, hasRedCaseNumber } from "@/lib/caseStatus";

export type DataQualityFlags = {
  isOverdue: boolean;
  isNearDue: boolean;
  hasRedCaseNumber: boolean;
  isCompleted: boolean;
  missingImportantFields: string[];
  hasInconsistentStatus: boolean;
  isOldActiveCase: boolean;
};

export function calculateDaysUntilDue(caseData: any): number | undefined {
  const now = new Date();
  const dueDate = caseData.dueDate30 || caseData.dueDate60 || caseData.dueDate90 || caseData.dueDate120 || caseData.dueDate240;
  if (!dueDate) return undefined;
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function evaluateDataQuality(caseData: any): DataQualityFlags {
  const flags: DataQualityFlags = {
    isOverdue: false,
    isNearDue: false,
    hasRedCaseNumber: false,
    isCompleted: false,
    missingImportantFields: [],
    hasInconsistentStatus: false,
    isOldActiveCase: false,
  };

  if (!caseData) return flags;

  // Evaluate basic completion flags
  flags.isCompleted = isClosedOrRedCase(caseData);
  flags.hasRedCaseNumber = hasRedCaseNumber(caseData.redNumber);

  // Evaluate dates
  const daysUntilDue = calculateDaysUntilDue(caseData);
  if (daysUntilDue !== undefined) {
    if (daysUntilDue < 0 && !flags.isCompleted) {
      flags.isOverdue = true;
    } else if (daysUntilDue <= 7 && daysUntilDue >= 0 && !flags.isCompleted) {
      flags.isNearDue = true;
    }
  }

  // Missing important fields
  if (!caseData.blackNumber?.trim()) flags.missingImportantFields.push("เรื่องดำ");
  if (!caseData.petitionerName?.trim()) flags.missingImportantFields.push("ผู้ร้องทุกข์/ผู้อุทธรณ์");
  if (!caseData.respondentName?.trim()) flags.missingImportantFields.push("คู่กรณี");
  if (!caseData.subject?.trim()) flags.missingImportantFields.push("เรื่อง");
  if (!caseData.legalOfficerId && !caseData.legalOfficerName) flags.missingImportantFields.push("นิติกร");
  if (!caseData.receivedDate) flags.missingImportantFields.push("วันที่รับเรื่อง");

  // Inconsistent status
  // Numeric red numbers are optional; only flag disagreement with the raw registry cell.
  flags.hasInconsistentStatus = isClosedCaseStatus(caseData.currentStatus) !== flags.isCompleted;
  
  // Very old active case (> 1 year without completion)
  if (!flags.isCompleted && caseData.receivedDate) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (new Date(caseData.receivedDate) < oneYearAgo) {
      flags.isOldActiveCase = true;
    }
  }

  return flags;
}
