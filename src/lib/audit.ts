"use server";

import prisma from "@/lib/db";

export async function auditLog({
  userId,
  action,
  entityType,
  entityId,
  beforeValue,
  afterValue,
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeValue?: string | null;
  afterValue?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      beforeValue,
      afterValue,
    },
  });
}
