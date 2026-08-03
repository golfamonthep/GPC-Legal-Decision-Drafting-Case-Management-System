import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const legacyPeriods: Record<string, string> = {
  all: "all",
  this_month: "month",
  this_quarter: "quarter",
  this_fiscal_year: "fiscal-year",
};

export default async function ExecutiveDashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; type?: string }>;
}) {
  const params = await searchParams;
  const period = legacyPeriods[params.filter ?? "all"] ?? "all";
  const type = ["complaint", "appeal"].includes(params.type ?? "")
    ? params.type
    : "all";

  redirect(`/dashboard?period=${period}&type=${type}`);
}
