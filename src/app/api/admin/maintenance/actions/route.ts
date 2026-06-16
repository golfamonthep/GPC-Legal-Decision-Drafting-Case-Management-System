import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { MAINTENANCE_ACTIONS, executeMaintenanceAction, MaintenanceActionId } from "@/lib/admin/maintenanceActions";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/currentUser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { actionId, dryRun = true, confirmationPhrase, scope, idempotencyKey } = body;

    if (!actionId || !MAINTENANCE_ACTIONS[actionId as MaintenanceActionId]) {
      return NextResponse.json({ error: "Invalid actionId" }, { status: 400 });
    }

    const def = MAINTENANCE_ACTIONS[actionId as MaintenanceActionId];

    // Check permission
    if (!hasPermission(user.role, def.requiredPermission as any)) {
      return NextResponse.json({ error: "Permission Denied for this action" }, { status: 403 });
    }

    // Require confirmation for real execution of risky actions
    if (!dryRun && def.requiresConfirmation) {
      if (confirmationPhrase !== def.confirmationPhrase) {
        return NextResponse.json({ 
          error: "Confirmation required", 
          message: `Expected confirmation phrase: '${def.confirmationPhrase}'` 
        }, { status: 400 });
      }
    }

    const result = await executeMaintenanceAction(user.id, actionId as MaintenanceActionId, dryRun, scope);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Maintenance action error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
