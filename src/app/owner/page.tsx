export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import { OwnerBentoShowcase } from "@/components/owner/OwnerBentoShowcase";

export default async function OwnerPage() {
  const user = await getCurrentUser();
  let totalCases: number | undefined;
  let activeCases: number | undefined;
  let completedCases: number | undefined;

  if (user && hasPermission(user.role, "VIEW_DASHBOARD")) {
    try {
      const filters = parseDashboardFilters({ period: "all", type: "all" });
      const result = await getUnifiedDashboardData(filters, {
        canViewCaseDetails: false,
        canViewDataQuality: false,
      });
      if (result.snapshot) {
        totalCases = result.snapshot.totalCases;
        activeCases = result.snapshot.kpis.active;
        completedCases = result.snapshot.totalCases - result.snapshot.kpis.active;
      }
    } catch {
      // Keep page resilient even when dashboard snapshot is unavailable
    }
  }

  return (
    <OwnerBentoShowcase
      totalCases={totalCases}
      activeCases={activeCases}
      completedCases={completedCases}
    />
  );
}
