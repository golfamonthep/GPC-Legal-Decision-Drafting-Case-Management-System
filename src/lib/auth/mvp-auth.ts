import { cookies } from "next/headers";
import { getAuthMode } from "./auth-mode";
import {
  createSignedMvpSessionToken,
  MVP_SESSION_COOKIE,
  MVP_SESSION_MAX_AGE_SECONDS,
  verifySignedMvpSessionToken,
} from "./mvp-session";
import type { Role } from "./permissions";

export { getAuthMode } from "./auth-mode";

const ALLOWED_MVP_ROLES: Role[] = [
  "ADMIN",
  "COMMISSIONER",
  "LEGAL_OFFICER",
  "REGISTRY_OFFICER",
  "VIEWER",
];

function getMvpRole(): Role {
  const configuredRole = (process.env.MVP_DEFAULT_ROLE || "REGISTRY_OFFICER") as Role;
  return ALLOWED_MVP_ROLES.includes(configuredRole) ? configuredRole : "REGISTRY_OFFICER";
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export function isSimpleAuthEnabled() {
  return getAuthMode() === "simple";
}

export function isNoneAuthEnabled() {
  return getAuthMode() === "none";
}

export function validateMvpCredentials(username: string, password: string) {
  if (getAuthMode() !== "simple") return false;

  const expectedUsername = process.env.MVP_USERNAME;
  const expectedPassword = process.env.MVP_ACCESS_CODE;
  if (!expectedUsername || !expectedPassword || !username || !password) return false;

  const usernameMatches = constantTimeEqual(username, expectedUsername);
  const passwordMatches = constantTimeEqual(password, expectedPassword);
  return usernameMatches && passwordMatches;
}

export async function createMvpSession() {
  if (getAuthMode() !== "simple") {
    throw new Error("MVP_SIMPLE_AUTH_NOT_ENABLED");
  }

  const token = await createSignedMvpSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(MVP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MVP_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearMvpSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MVP_SESSION_COOKIE);
}

export async function getMvpUser() {
  const authMode = getAuthMode();

  if (authMode === "none") {
    return {
      id: "mvp-development-user",
      name: "MVP Development User",
      email: "mvp-development@local",
      role: "ADMIN" as Role,
      status: "ACTIVE",
    };
  }

  if (authMode !== "simple") return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(MVP_SESSION_COOKIE)?.value;
  const isValidSession = await verifySignedMvpSessionToken(token);
  if (!isValidSession) return null;

  const username = process.env.MVP_USERNAME || "MVP Internal User";
  return {
    id: "mvp-internal-user",
    name: username,
    email: "mvp@internal.local",
    role: getMvpRole(),
    status: "ACTIVE",
  };
}
