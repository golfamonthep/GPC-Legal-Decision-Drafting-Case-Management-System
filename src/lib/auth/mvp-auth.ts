import { cookies } from "next/headers";

export function getAuthMode() {
  // EMERGENCY HARD BYPASS FOR MVP
  return "none";
}

export function isSimpleAuthEnabled() {
  return getAuthMode() === "simple";
}

export function isNoneAuthEnabled() {
  return getAuthMode() === "none";
}

export function validateMvpAccessCode(code: string) {
  const expectedCode = process.env.MVP_ACCESS_CODE;
  if (!expectedCode) return false;
  return code === expectedCode;
}

export async function createMvpSession() {
  const cookieStore = await cookies();
  cookieStore.set("mvp_session", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function clearMvpSession() {
  const cookieStore = await cookies();
  cookieStore.delete("mvp_session");
}

export async function getMvpUser() {
  const authMode = getAuthMode();
  
  if (authMode === "none") {
    return {
      id: "mvp-user",
      name: "MVP User",
      email: "mvp@local",
      role: process.env.MVP_DEFAULT_ROLE || "ADMIN",
      status: "ACTIVE",
    };
  }

  const cookieStore = await cookies();
  if (cookieStore.get("mvp_session")?.value === "true") {
    return {
      id: "mvp-internal-user",
      name: "MVP Internal User",
      email: "mvp@internal.local",
      role: process.env.MVP_DEFAULT_ROLE || "ADMIN",
      status: "ACTIVE",
    };
  }
  return null;
}
