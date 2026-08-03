export const MVP_SESSION_COOKIE = "mvp_session";
export const MVP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSessionSecret(): string {
  return (
    process.env.MVP_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    ""
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sign(payload: string): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("MVP_SESSION_SECRET_MISSING");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return encodeBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function createSignedMvpSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + MVP_SESSION_MAX_AGE_SECONDS;
  const nonce = crypto.randomUUID();
  const payload = `v1.${expiresAt}.${nonce}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedMvpSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const [version, expiresAtRaw, nonce, suppliedSignature, ...extraParts] = token.split(".");
  if (
    version !== "v1" ||
    !expiresAtRaw ||
    !nonce ||
    !suppliedSignature ||
    extraParts.length > 0
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const payload = `${version}.${expiresAtRaw}.${nonce}`;
    const expectedSignature = await sign(payload);
    return constantTimeEqual(suppliedSignature, expectedSignature);
  } catch {
    return false;
  }
}
