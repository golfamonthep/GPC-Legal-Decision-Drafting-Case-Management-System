import prisma from "@/lib/db";
import LibraryClient from "./LibraryClient";

import { LegalSource } from "@prisma/client";

export default async function LibraryPage() {
  let legalSources: LegalSource[] = [];
  try {
    legalSources = await prisma.legalSource.findMany({
      orderBy: { date: 'desc' }
    });
  } catch (e) {
    console.error("Failed to fetch legal sources, falling back to empty array", e);
  }

  return <LibraryClient initialResources={legalSources as any} />;
}
