import { NextResponse } from "next/server";
import { MAINTENANCE_ACTIONS } from "@/lib/admin/maintenanceActions";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metadata = Object.values(MAINTENANCE_ACTIONS)
      .filter(def => hasPermission(user.role, def.requiredPermission as any))
      .map(def => ({
        id: def.id,
        label: def.label,
        description: def.description,
        riskLevel: def.riskLevel,
        supportsDryRun: def.supportsDryRun,
        requiresConfirmation: def.requiresConfirmation,
        confirmationPhrase: def.confirmationPhrase,
      }));

    return NextResponse.json({ actions: metadata });
  } catch (error: any) {
    console.error("Maintenance metadata error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
