import { requirePermission } from '@/lib/auth/requirePermission';
import PersonSearchStandalone from '@/components/analysis/PersonSearchStandalone';

export const dynamic = 'force-dynamic';

export default async function PersonSearchPage() {
  await requirePermission('USE_ANALYSIS');
  return <PersonSearchStandalone />;
}
