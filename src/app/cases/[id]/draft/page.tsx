import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateDraft } from "./actions";
import { DraftEditor } from "./DraftEditor";
import fs from "fs/promises";
import path from "path";

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

  let templateExists = false;
  try {
    const templatePath = path.join(process.cwd(), "templates", "docx", "gpc-decision-template.docx");
    await fs.access(templatePath);
    templateExists = true;
  } catch (err) {
    templateExists = false;
  }

  return <DraftEditor caseData={caseData} draftData={draftData} templateExists={templateExists} />;
}
