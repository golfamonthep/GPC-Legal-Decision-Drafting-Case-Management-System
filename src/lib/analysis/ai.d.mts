export type AnalysisAiStatus = {enabled: boolean; configured: boolean; provider: string; model: string; reason: 'disabled' | 'ready' | 'missing_key'};
export function analysisAiStatus(env?: Record<string, string | undefined>): AnalysisAiStatus;
export function proposeAnalysisSection(options: {
  job: any;
  documents: any[];
  knowledge: any;
  section: string;
  userId?: string;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): Promise<any>;
