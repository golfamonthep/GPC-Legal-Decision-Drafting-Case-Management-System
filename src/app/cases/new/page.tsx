import { requirePermission } from '@/lib/auth/requirePermission';
import { CaseEditor } from '@/components/CaseEditor';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requirePermission('IMPORT_REGISTRY');
  const { type } = await searchParams;
  return <div className="gpc-tabler mx-auto max-w-3xl px-4 py-6">
    <Link href="/cases" className="btn mb-4">กลับรายการคดี</Link>
    <h1 className="mb-4 text-2xl">เพิ่มเรื่องใหม่</h1>
    <CaseEditor initial={{ type: type === 'อุทธรณ์' ? 'อุทธรณ์' : 'ร้องทุกข์' }} />
  </div>;
}
