import { redirect } from "next/navigation";
import { ImportRegistryClient, FixedCaseType } from "./ImportRegistryClient";
import { requirePermission } from "@/lib/auth/requirePermission";

export default async function ImportRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requirePermission("IMPORT_REGISTRY");

  const params = await searchParams;
  let fixedCaseType: FixedCaseType | null = null;

  if (params.type === "grievance" || params.type === "ร้องทุกข์") {
    fixedCaseType = "ร้องทุกข์";
  } else if (params.type === "appeal" || params.type === "อุทธรณ์") {
    fixedCaseType = "อุทธรณ์";
  }

  if (!fixedCaseType) {
    redirect("/upload");
  }

  return <ImportRegistryClient fixedCaseType={fixedCaseType} />;
}
