import { getCurrentUser } from "./currentUser";
import { hasPermission, Permission } from "./permissions";
import { redirect } from "next/navigation";
import { isNoneAuthEnabled } from "./mvp-auth";

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  
  if (!user) {
    if (isNoneAuthEnabled()) {
      return {
        id: "mvp-user",
        name: "MVP User",
        email: "mvp@local",
        role: "ADMIN",
        status: "ACTIVE",
      } as any;
    }
    redirect("/login");
  }

  if (isNoneAuthEnabled()) {
    return user;
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/dashboard?error=AccessDenied");
  }

  return user;
}
