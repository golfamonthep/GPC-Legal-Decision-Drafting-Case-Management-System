import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';

export interface QuarantineCandidate {
  externalItemKeyHash: string;
  safeDisplayName: string;
  extension?: string;
  mimeType?: string;
  sizeBytes?: bigint;
  classification?: string;
  quarantineReason: string;
}

export async function buildQuarantineItemsFromPrototypeResult(
  candidates: QuarantineCandidate[],
  prototypeRunId?: string
) {
  // Purely creates quarantine objects in memory, no DB write here
  return candidates.map((candidate) => ({
    prototypeRunId,
    externalItemKeyHash: candidate.externalItemKeyHash,
    safeDisplayName: candidate.safeDisplayName,
    extension: candidate.extension || null,
    mimeType: candidate.mimeType || null,
    sizeBytes: candidate.sizeBytes || null,
    classification: candidate.classification || null,
    quarantineReason: candidate.quarantineReason,
    quarantineStatus: 'QUARANTINED',
  }));
}

export async function persistQuarantineItems(
  items: ReturnType<typeof buildQuarantineItemsFromPrototypeResult> extends Promise<infer U> ? U : never,
  actor: any
) {
  // Staging-gate check is assumed handled by the caller or endpoint.
  // We assume the schema exists, but we wrap in try-catch in case it's deferred.
  try {
    const records = await (prisma as any).graphContentIngestionQuarantineItem.createMany({
      data: items,
      skipDuplicates: true,
    });
    return { success: true, count: records.count };
  } catch (err: any) {
    // If schema is not available, we fail gracefully.
    console.error('Failed to persist quarantine items', err);
    return { success: false, error: err.message, previewOnly: true, items };
  }
}

export async function listQuarantineItemsForReview(options?: {
  status?: string;
  limit?: number;
}) {
  try {
    const items = await (prisma as any).graphContentIngestionQuarantineItem.findMany({
      where: options?.status ? { quarantineStatus: options.status } : undefined,
      take: options?.limit || 100,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, items: items.map(sanitizeQuarantineItem) };
  } catch (err: any) {
    return { success: false, error: 'Schema unavailable or query failed', items: [] };
  }
}

export async function updateQuarantineReviewStatus(input: {
  itemId: string;
  newStatus: string;
  reviewNotes: string;
}, actor: { id: string }) {
  if (!input.reviewNotes) {
    throw new Error('Review notes are required for status updates.');
  }

  const allowedStatuses = [
    'REVIEW_PENDING',
    'APPROVED_FOR_FUTURE_TEST',
    'REJECTED',
    'RELEASED_FROM_QUARANTINE_METADATA_ONLY',
    'ESCALATED',
  ];

  if (!allowedStatuses.includes(input.newStatus)) {
    throw new Error('Invalid quarantine status.');
  }

  try {
    const updated = await (prisma as any).graphContentIngestionQuarantineItem.update({
      where: { id: input.itemId },
      data: {
        quarantineStatus: input.newStatus,
        reviewNotes: input.reviewNotes,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });
    return { success: true, item: sanitizeQuarantineItem(updated) };
  } catch (err: any) {
    throw new Error('Failed to update quarantine status. ' + err.message);
  }
}

export function sanitizeQuarantineItem(item: any) {
  // Strip out any potentially raw IDs or secrets, though schema shouldn't have them
  return {
    id: item.id,
    safeDisplayName: item.safeDisplayName,
    extension: item.extension,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes?.toString() || null,
    quarantineReason: item.quarantineReason,
    quarantineStatus: item.quarantineStatus,
    reviewNotes: item.reviewNotes,
    reviewedAt: item.reviewedAt,
    createdAt: item.createdAt,
  };
}
