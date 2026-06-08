import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateDraft } from "./actions";
import { DraftEditor } from "./DraftEditor";

export default async function DraftDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const caseId = resolvedParams.id;
  
  const caseData = await prisma.case.findUnique({
    where: { id: caseId }
  });

  if (!caseData) {
    notFound();
  }

  const draftData = await getOrCreateDraft(caseId);

  return <DraftEditor caseData={caseData} draftData={draftData} />;
}
