export type DataQualitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DataQualityCategory = 
  | 'MISSING_FIELDS' 
  | 'STATUS_CONSISTENCY' 
  | 'DATE_QUALITY' 
  | 'DUPLICATE_RISK' 
  | 'WORKFLOW_RISK';

export interface DataQualityIssue {
  id: string; // Dynamic ID based on caseId and issue type
  caseId: string;
  category: DataQualityCategory;
  severity: DataQualitySeverity;
  title: string;
  description: string;
  fieldName?: string;
  currentValue?: string | null;
  recommendedAction?: string;
  
  // Minimal case info for display
  caseBlackNumber: string;
  caseRedNumber?: string | null;
  caseType: string;
  petitionerName: string;
  respondentName: string;
  subject: string;
  legalOfficerName?: string | null;
  ownerId?: string | null;
}
