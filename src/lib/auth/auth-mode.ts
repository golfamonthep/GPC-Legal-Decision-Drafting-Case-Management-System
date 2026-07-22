export type AuthMode = "none" | "simple" | "microsoft" | "misconfigured";

const VALID_AUTH_MODES = new Set(["none", "simple", "microsoft"]);

/**
 * Resolve the active authentication mode with production-safe defaults.
 *
 * `none` is intentionally blocked in production unless the owner explicitly
 * sets ALLOW_INSECURE_AUTH_MODE=true. This prevents an accidental environment
 * variable or temporary MVP setting from silently exposing the application.
 */
export function getAuthMode(): AuthMode {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredMode = (process.env.AUTH_MODE || (isProduction ? "microsoft" : "simple"))
    .trim()
    .toLowerCase();

  if (!VALID_AUTH_MODES.has(configuredMode)) {
    return "misconfigured";
  }

  if (
    configuredMode === "none" &&
    isProduction &&
    process.env.ALLOW_INSECURE_AUTH_MODE !== "true"
  ) {
    return "misconfigured";
  }

  if (configuredMode === "simple" && !process.env.MVP_ACCESS_CODE) {
    return "misconfigured";
  }

  if (
    configuredMode === "simple" &&
    !process.env.MVP_SESSION_SECRET &&
    !process.env.NEXTAUTH_SECRET &&
    !process.env.AUTH_SECRET
  ) {
    return "misconfigured";
  }

  return configuredMode as Exclude<AuthMode, "misconfigured">;
}

export function getAuthConfigurationMessage(): string | null {
  const mode = getAuthMode();
  if (mode !== "misconfigured") return null;

  const configuredMode = (process.env.AUTH_MODE || "").trim().toLowerCase();

  if (configuredMode === "none" && process.env.NODE_ENV === "production") {
    return "AUTH_MODE=none is blocked in production. Configure simple or microsoft authentication.";
  }

  if (configuredMode === "simple" && !process.env.MVP_ACCESS_CODE) {
    return "MVP_ACCESS_CODE is required when AUTH_MODE=simple.";
  }

  if (configuredMode === "simple") {
    return "MVP_SESSION_SECRET, NEXTAUTH_SECRET, or AUTH_SECRET is required when AUTH_MODE=simple.";
  }

  return "AUTH_MODE must be one of: none, simple, microsoft.";
}
