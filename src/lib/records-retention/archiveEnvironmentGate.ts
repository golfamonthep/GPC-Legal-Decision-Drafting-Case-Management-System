export type BlockedReason =
  | "ARCHIVE_EXECUTION_DISABLED"
  | "PRODUCTION_ENVIRONMENT_BLOCKED"
  | "MISSING_STAGING_EXECUTION_FLAG"
  | "ENVIRONMENT_UNKNOWN"
  | "PRODUCTION_URL_DETECTED";

export interface ArchiveEnvironmentStatus {
  executionEnabled: boolean;
  environmentSafe: boolean;
  blockedReasons: BlockedReason[];
}

/**
 * Validates whether the current environment is safely configured to allow
 * archive execution. This MUST block execution in production.
 */
export function getArchiveExecutionEnvironmentStatus(): ArchiveEnvironmentStatus {
  const reasons: BlockedReason[] = [];
  let isSafe = true;

  // 1. Check NODE_ENV
  const isProductionMode = process.env.NODE_ENV === "production";

  // 2. Check explicit staging flag
  const hasStagingFlag = process.env.ALLOW_STAGING_ARCHIVE_EXECUTION === "YES";

  // 3. Check for production override (must NOT be present for now)
  const hasProductionOverride = process.env.ALLOW_PRODUCTION_ARCHIVE_EXECUTION === "YES";

  // 4. Detect known production URL
  const vercelUrl = process.env.VERCEL_URL || "";
  const isProductionUrl = vercelUrl === "gpc-legal-system.vercel.app" || vercelUrl.includes("production");

  if (isProductionMode && !hasProductionOverride) {
    // Note: If deployed on Vercel preview, NODE_ENV is often 'production', 
    // but we rely on the specific staging flag to differentiate.
    // For extreme safety, we block any production environment unless the explicit staging flag is set.
    if (!hasStagingFlag) {
      isSafe = false;
      reasons.push("PRODUCTION_ENVIRONMENT_BLOCKED");
    }
  }

  if (!hasStagingFlag && !hasProductionOverride) {
    isSafe = false;
    reasons.push("MISSING_STAGING_EXECUTION_FLAG");
  }

  if (isProductionUrl && !hasProductionOverride) {
    isSafe = false;
    reasons.push("PRODUCTION_URL_DETECTED");
  }

  // If no reasons but still not safe based on logic, fail closed
  if (!isSafe && reasons.length === 0) {
    reasons.push("ENVIRONMENT_UNKNOWN");
  }

  const executionEnabled = isSafe && reasons.length === 0;

  return {
    executionEnabled,
    environmentSafe: isSafe,
    blockedReasons: reasons,
  };
}

/**
 * Throws an error if the environment is not safe for archive execution.
 * MUST be called before any database mutation.
 */
export function assertArchiveExecutionEnvironment() {
  const status = getArchiveExecutionEnvironmentStatus();
  if (!status.executionEnabled) {
    throw new Error(`Archive execution blocked: ${status.blockedReasons.join(", ")}`);
  }
}
