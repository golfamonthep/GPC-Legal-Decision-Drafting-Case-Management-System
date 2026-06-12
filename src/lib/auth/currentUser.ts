import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";
import prisma from "@/lib/db";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  status: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    // Local dev mock fallback (if explicitly enabled)
    if (process.env.NODE_ENV === "development" && process.env.AUTH_DEV_MOCK_USER === "true") {
      return {
        id: "mock-admin-id",
        name: "Mock Admin (Dev)",
        email: "admin@mock.local",
        role: "ADMIN",
        status: "ACTIVE",
      };
    }
    return null;
  }

  const user = session.user as SessionUser;

  if (user.status !== "ACTIVE") {
    return null;
  }

  return user;
}
