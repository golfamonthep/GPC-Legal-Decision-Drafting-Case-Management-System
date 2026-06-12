import { getCurrentUser } from "./currentUser";
import { hasPermission, Permission } from "./permissions";

export async function requireApiPermission(permission: Permission) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
