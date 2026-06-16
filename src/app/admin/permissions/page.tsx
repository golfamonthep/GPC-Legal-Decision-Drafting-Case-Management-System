import { requirePermission } from "@/lib/auth/requirePermission";
import { ROLE_PERMISSIONS, Role } from "@/lib/auth/permissions";
import { Check, X } from "lucide-react";

export default async function PermissionsUatPage() {
  // Enforce ADMIN only for this page.
  const user = await requirePermission("MANAGE_USERS");

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">UAT: Permission Matrix Validator</h1>
        <p className="text-gray-500 mt-2">
          This read-only dashboard is used during UAT to verify the active role permissions matrix.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Session Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Authenticated User Email</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Role</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {user.role}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">User Status</p>
            <p className="font-medium text-green-600">{user.status}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Role-Permission Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Backend enforcement matrix currently running in the system.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                {Object.keys(ROLE_PERMISSIONS).map((role) => (
                  <th key={role} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {ROLE_PERMISSIONS["ADMIN"].map((permission) => (
                <tr key={permission} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {permission}
                  </td>
                  {Object.keys(ROLE_PERMISSIONS).map((role) => {
                    const r = role as Role;
                    const hasPerm = ROLE_PERMISSIONS[r].includes(permission);
                    return (
                      <td key={`${role}-${permission}`} className="px-6 py-4 whitespace-nowrap text-center">
                        {hasPerm ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
