export type DashboardPeriod = "all" | "month" | "quarter" | "fiscal-year";
export type DashboardCaseType = "all" | "complaint" | "appeal";

export interface DashboardFilters {
  period: DashboardPeriod;
  type: DashboardCaseType;
}

export type DashboardLoadState = "ready" | "empty" | "partial" | "unavailable";

export interface DashboardPermissions {
  canViewCaseDetails: boolean;
  canViewDataQuality: boolean;
}

export interface DashboardCaseRecord {
  id: string;
  type: string;
  blackNumber: string;
  redNumber: string | null;
  subject: string;
  currentStatus: string;
  receivedDate: Date | null;
  dueDate30: Date | null;
  dueDate60: Date | null;
  dueDate90: Date | null;
  dueDate120: Date | null;
  dueDate240: Date | null;
  legalOfficerId: string | null;
  legalOfficerName: string | null;
  legalOfficer: { name: string } | null;
  updatedAt: Date;
}

export interface DashboardActivity {
  id: string;
  blackNumber: string;
  type: string;
  action: string;
  actor: string;
  timestamp: Date;
}

export interface DashboardMeeting {
  id: string;
  title: string;
  meetingNo: string;
  meetingDate: Date;
  status: string;
  caseCount: number;
}

export interface DashboardSourcePayload {
  cases: DashboardCaseRecord[];
  activities: DashboardActivity[];
  meetings: DashboardMeeting[];
  partialReasons?: string[];
}

export interface DashboardDataSource {
  readonly kind: "database" | "demo";
  load(filters: DashboardFilters): Promise<DashboardSourcePayload>;
}

export interface DashboardSnapshot {
  generatedAt: string;
  dataFreshness: string | null;
  totalCases: number;
  kpis: {
    active: number;
    overdue: number;
    dueWithin7Days: number;
    unassigned: number;
    criticalDataQuality: number;
  };
  trend: Array<{ key: string; label: string; count: number }>;
  statusDistribution: Array<{ label: string; count: number; tone: "teal" | "blue" | "slate" }>;
  deadlineRisk: Array<{ label: string; count: number; tone: "red" | "amber" | "teal" | "slate" }>;
  workload: Array<{ name: string; active: number; overdue: number; dueSoon: number }>;
  urgentCases: Array<{
    id: string;
    blackNumber: string;
    type: string;
    subject: string;
    status: string;
    legalOfficer: string;
    dueDate: string;
    daysUntilDue: number;
  }>;
  dataQuality: {
    missingReceivedDate: number;
    unknownType: number;
    closedWithoutRedNumber: number;
    redNumberWithOpenStatus: number;
    noDueDate: number;
  };
  activities: Array<{
    id: string;
    blackNumber: string;
    type: string;
    action: string;
    actor: string;
    timestamp: string;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    meetingNo: string;
    meetingDate: string;
    status: string;
    caseCount: number;
  }>;
}

export interface DashboardResult {
  state: DashboardLoadState;
  source: "database" | "demo";
  snapshot: DashboardSnapshot | null;
  message?: string;
  partialReasons?: string[];
}
