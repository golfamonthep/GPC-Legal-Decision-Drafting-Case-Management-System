import prisma from "@/lib/db";
import LibraryClient from "./LibraryClient";

import { LegalSource } from "@prisma/client";

export default async function LibraryPage() {
  let legalSources: LegalSource[] = [];
  try {
    legalSources = await prisma.legalSource.findMany({
      orderBy: { date: 'desc' },
      include: {
        ingestionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { documentChunks: true }
        }
      }
    });
  } catch (e) {
    console.error("Failed to fetch legal sources, falling back to empty array", e);
  }

  return <LibraryClient initialResources={legalSources as any} />;
}
