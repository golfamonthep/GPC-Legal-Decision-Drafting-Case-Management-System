import prisma from '@/lib/db';


/**
 * Request a knowledge‑reuse review for a closed case. This creates a pending review record
 * that must be approved by an authorised user before the case content can be ingested
 * into the RAG system.
 */
export async function requestKnowledgeReuse(caseId: string, userId: string, purpose: string) {
  const review = await prisma.knowledgeReuseReview.create({
    data: {
      caseId,
      requestedByUserId: userId,
      purpose,
      status: 'PENDING',
      knowledgeReuseStatus: 'NOT_REVIEWED',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'KNOWLEDGE_REUSE_REQUESTED',
      entityType: 'KnowledgeReuseReview',
      entityId: review.id,
      beforeValue: null,
      afterValue: JSON.stringify({ caseId, purpose, status: 'PENDING' }),
    },
  });

  return review;
}

/** Approve a pending knowledge‑reuse review. This will typically trigger the RAG ingestion
 * pipeline for the case (handled elsewhere). The function records the decision and audit.
 */
export async function approveKnowledgeReuse(reviewId: string, approverUserId: string) {
  const review = await prisma.knowledgeReuseReview.update({
    where: { id: reviewId },
    data: {
      status: 'APPROVED',
      approvedByUserId: approverUserId,
      approvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: approverUserId,
      action: 'KNOWLEDGE_REUSE_APPROVED',
      entityType: 'KnowledgeReuseReview',
      entityId: review.id,
      beforeValue: 'PENDING',
      afterValue: 'APPROVED',
    },
  });

  // TODO: trigger RAG ingestion for the case – the actual ingestion logic lives in
  // src/lib/rag/ingestion/*.  Here we only record the approval.
  return review;
}

/** Reject a pending knowledge‑reuse review with a reason. */
export async function rejectKnowledgeReuse(reviewId: string, userId: string, reason: string) {
  const review = await prisma.knowledgeReuseReview.update({
    where: { id: reviewId },
    data: {
      status: 'REJECTED',
      rejectedByUserId: userId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'KNOWLEDGE_REUSE_REJECTED',
      entityType: 'KnowledgeReuseReview',
      entityId: review.id,
      beforeValue: 'PENDING',
      afterValue: JSON.stringify({ status: 'REJECTED', reason }),
    },
  });

  return review;
}
