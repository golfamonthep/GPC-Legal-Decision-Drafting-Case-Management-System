import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import prisma from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_ENTRA_ID_TENANT_ID || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Check allowed domain
      const allowedDomain = process.env.MICROSOFT_ENTRA_ID_ALLOWED_DOMAIN;
      if (allowedDomain && !user.email.endsWith(`@${allowedDomain}`)) {
        console.warn(`[Auth] Rejected login from domain not allowed: ${user.email}`);
        return false;
      }

      const microsoftAccountId = account?.providerAccountId;
      
      // Upsert or find user
      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!dbUser) {
        // First user bootstrap
        const userCount = await prisma.user.count();
        const allowBootstrap = process.env.AUTH_ALLOW_FIRST_ADMIN_BOOTSTRAP === "true";
        
        let initialRole = "VIEWER";
        let initialStatus = "PENDING";
        
        if (userCount === 0 && allowBootstrap) {
          initialRole = "ADMIN";
          initialStatus = "ACTIVE";
          console.log(`[Auth] Bootstrapping first user as ADMIN: ${user.email}`);
        }
        
        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || "Unknown User",
            microsoftAccountId,
            image: user.image,
            role: initialRole,
            status: initialStatus,
          },
        });
      } else {
        // Update microsoftAccountId if missing
        if (!dbUser.microsoftAccountId && microsoftAccountId) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { microsoftAccountId, image: user.image },
          });
        }
        
        // Block disabled users
        if (dbUser.status === "DISABLED") {
          console.warn(`[Auth] Blocked login for disabled user: ${dbUser.email}`);
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (dbUser) {
          // Add custom fields to session
          (session.user as any).id = dbUser.id;
          (session.user as any).role = dbUser.role;
          (session.user as any).status = dbUser.status;

          // Record last login in background (don't block session)
          prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          }).catch(console.error);
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
