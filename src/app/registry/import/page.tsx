import { ImportRegistryClient } from "./ImportRegistryClient";
import { requirePermission } from "@/lib/auth/requirePermission";

export default async function ImportRegistryPage() {
  await requirePermission("IMPORT_REGISTRY");

  return <ImportRegistryClient />;
}
