export type AiProvider = 'deepseek' | 'openai' | string;
export type SensitiveValue = {kind: 'PERSON' | 'CASE' | 'ID'; value: string};
export type PseudonymMapping = {kind: string; value: string; token: string};
export type AiHarnessMeta = {
  provider: AiProvider;
  model: string;
  responseId: string | null;
  usage: {inputTokens: number; outputTokens: number; totalTokens: number};
  inputHash: string;
  redactedCount: number;
};
export type AiHarnessRequest = {
  instructions: string;
  input: string | object;
  schemaName: string;
  schema: Record<string, unknown>;
  approvedSourceIds?: string[];
  sensitiveValues?: SensitiveValue[];
  userId?: string;
};
export class AiHarnessError extends Error {
  code: string;
  status: number;
  constructor(code: string, status?: number, options?: ErrorOptions);
}
export function getAiHarnessStatus(env?: Record<string, string | undefined>): {enabled: boolean; configured: boolean; provider: string; model: string; reason: 'disabled' | 'ready' | 'missing_key'};
export function pseudonymizeText(value: unknown, sensitiveValues?: SensitiveValue[]): {text: string; mapping: PseudonymMapping[]};
export function restorePseudonyms(value: unknown, mapping?: PseudonymMapping[]): string;
export function createAiHarness(options?: {env?: Record<string, string | undefined>; fetchImpl?: typeof fetch}): {
  status: ReturnType<typeof getAiHarnessStatus>;
  generateStructured<T = unknown>(request: AiHarnessRequest): Promise<{data: T; meta: AiHarnessMeta}>;
};
