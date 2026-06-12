import { getCurrentUser } from "./currentUser";
import { hasPermission, Permission } from "./permissions";
import { redirect } from "next/navigation";

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/dashboard?error=AccessDenied");
  }

  return user;
}
