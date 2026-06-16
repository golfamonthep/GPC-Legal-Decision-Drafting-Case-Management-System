import prisma from "@/lib/db";
import { getSystemHealth } from "@/lib/admin/systemHealth";
import { auditLog } from "@/lib/audit";

export type MaintenanceActionId = 
  | "recheck_system_health"
  | "refresh_readiness_snapshot"
  | "retry_failed_ingestion_jobs"
  | "trigger_rag_reindex"
  | "clear_safe_cache"
  | "toggle_maintenance_mode";

export type RiskLevel = "low" | "medium" | "high";

export type MaintenanceActionStatus = 
  | "completed" 
  | "planned" 
  | "not_configured" 
  | "not_implemented" 
  | "blocked" 
  | "failed";

export interface MaintenanceActionResult {
  ok: boolean;
  actionId: string;
  dryRun: boolean;
  status: MaintenanceActionStatus;
  message: string;
  summary?: any;
  warnings?: string[];
  auditId?: string;
}

export interface MaintenanceActionDefinition {
  id: MaintenanceActionId;
  label: string;
  description: string;
  requiredPermission: string;
  riskLevel: RiskLevel;
  supportsDryRun: boolean;
  requiresConfirmation: boolean;
  confirmationPhrase?: string;
  execute: (
    userId: string, 
    dryRun: boolean, 
    scope?: any
  ) => Promise<Omit<MaintenanceActionResult, 'auditId' | 'actionId' | 'dryRun'>>;
}

export const MAINTENANCE_ACTIONS: Record<MaintenanceActionId, MaintenanceActionDefinition> = {
  recheck_system_health: {
    id: "recheck_system_health",
    label: "Recheck System Health",
    description: "Run a fresh system health and connectivity check without modifying any data.",
    requiredPermission: "VIEW_SYSTEM_HEALTH",
    riskLevel: "low",
    supportsDryRun: true,
    requiresConfirmation: false,
    execute: async (userId, dryRun) => {
      const health = await getSystemHealth(userId);
      return {
        ok: true,
        status: "completed",
        message: "System health check completed successfully.",
        summary: health,
      };
    }
  },
  refresh_readiness_snapshot: {
    id: "refresh_readiness_snapshot",
    label: "Refresh Readiness Snapshot",
    description: "Check if the system environment variables and connections are properly configured.",
    requiredPermission: "VIEW_SYSTEM_HEALTH",
    riskLevel: "low",
    supportsDryRun: true,
    requiresConfirmation: false,
    execute: async (userId, dryRun) => {
      const health = await getSystemHealth(userId);
      return {
        ok: true,
        status: "completed",
        message: "Readiness snapshot refreshed.",
        summary: {
          environment: health.environment,
          config: health.config,
          alerts: health.alerts
        }
      };
    }
  },
  retry_failed_ingestion_jobs: {
    id: "retry_failed_ingestion_jobs",
    label: "Retry Failed Ingestion Jobs",
    description: "Finds DocumentIngestionJob records in 'failed' status and resets them to 'pending'.",
    requiredPermission: "MANAGE_SYSTEM_SETTINGS",
    riskLevel: "medium",
    supportsDryRun: true,
    requiresConfirmation: true,
    confirmationPhrase: "retry-jobs",
    execute: async (userId, dryRun) => {
      const count = await prisma.documentIngestionJob.count({
        where: { status: 'failed' }
      });

      if (dryRun) {
        return {
          ok: true,
          status: "completed",
          message: `Dry run: found ${count} failed jobs eligible for retry.`,
          summary: { eligibleCount: count }
        };
      }

      // Limit to 50 jobs at a time
      const toRetry = await prisma.documentIngestionJob.findMany({
        where: { status: 'failed' },
        take: 50,
        select: { id: true }
      });

      if (toRetry.length === 0) {
        return {
          ok: true,
          status: "completed",
          message: `No failed jobs found.`,
          summary: { updatedCount: 0 }
        };
      }

      const ids = toRetry.map(j => j.id);

      const result = await prisma.documentIngestionJob.updateMany({
        where: { id: { in: ids } },
        data: { status: 'pending', errorMessage: null }
      });

      return {
        ok: true,
        status: "completed",
        message: `Successfully requeued ${result.count} failed jobs.`,
        summary: { updatedCount: result.count }
      };
    }
  },
  trigger_rag_reindex: {
    id: "trigger_rag_reindex",
    label: "Trigger RAG Re-index",
    description: "Rebuild vector embeddings for a limited set of documents.",
    requiredPermission: "MANAGE_SYSTEM_SETTINGS",
    riskLevel: "high",
    supportsDryRun: true,
    requiresConfirmation: true,
    confirmationPhrase: "reindex-rag",
    execute: async (userId, dryRun, scope) => {
      return {
        ok: false,
        status: "not_implemented",
        message: "Full or partial RAG re-index is not implemented safely yet.",
        warnings: ["Cannot execute this action at this time."]
      };
    }
  },
  clear_safe_cache: {
    id: "clear_safe_cache",
    label: "Clear Safe Cache",
    description: "Purge temporary application cache. Does not delete any database records.",
    requiredPermission: "MANAGE_SYSTEM_SETTINGS",
    riskLevel: "medium",
    supportsDryRun: true,
    requiresConfirmation: true,
    confirmationPhrase: "clear-cache",
    execute: async (userId, dryRun) => {
      return {
        ok: false,
        status: "not_configured",
        message: "No safe cache layer is currently configured.",
      };
    }
  },
  toggle_maintenance_mode: {
    id: "toggle_maintenance_mode",
    label: "Toggle Maintenance Mode",
    description: "Lock out non-admin users from the application.",
    requiredPermission: "MANAGE_SYSTEM_SETTINGS",
    riskLevel: "high",
    supportsDryRun: true,
    requiresConfirmation: true,
    confirmationPhrase: "toggle-maintenance",
    execute: async (userId, dryRun) => {
      return {
        ok: false,
        status: "planned",
        message: "Maintenance mode persistence is not yet implemented.",
      };
    }
  }
};

export async function executeMaintenanceAction(
  userId: string,
  actionId: MaintenanceActionId,
  dryRun: boolean,
  scope?: any
): Promise<MaintenanceActionResult> {
  const def = MAINTENANCE_ACTIONS[actionId];
  if (!def) {
    throw new Error(`Unknown maintenance action: ${actionId}`);
  }

  const beforeValue = JSON.stringify({ dryRun, scope });
  
  const audit = await prisma.auditLog.create({
    data: {
      userId,
      action: `MAINTENANCE_${actionId.toUpperCase()}`,
      entityType: "MAINTENANCE_ACTION",
      entityId: actionId,
      beforeValue,
      afterValue: "pending"
    }
  });

  let resultStatus: MaintenanceActionStatus = "failed";
  let resultMsg = "Unknown error";
  let resultObj: any = null;
  let ok = false;
  let warnings: string[] | undefined;

  try {
    const res = await def.execute(userId, dryRun, scope);
    resultStatus = res.status;
    resultMsg = res.message;
    resultObj = res.summary;
    ok = res.ok;
    warnings = res.warnings;
  } catch (error: any) {
    resultStatus = "failed";
    resultMsg = error.message || "Execution failed";
    ok = false;
  }

  await prisma.auditLog.update({
    where: { id: audit.id },
    data: {
      afterValue: JSON.stringify({ ok, status: resultStatus, message: resultMsg, summary: resultObj, warnings })
    }
  });

  return {
    ok,
    actionId,
    dryRun,
    status: resultStatus,
    message: resultMsg,
    summary: resultObj,
    warnings,
    auditId: audit.id
  };
}
