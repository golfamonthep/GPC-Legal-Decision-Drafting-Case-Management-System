import { requirePermission } from '@/lib/auth/requirePermission';
import { getCurrentUser } from '@/lib/auth/currentUser';
import AssignmentDashboardClient from './AssignmentDashboardClient';

export default async function AssignmentsPage() {
  await requirePermission("VIEW_ASSIGNMENTS");
  const user = await getCurrentUser();
  
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 font-thai">
            มอบหมายสำนวนและภาระงาน
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-thai">
            ตรวจสอบภาระงานของนิติกรและกรรมการเจ้าของสำนวน พร้อมทั้งจัดการมอบหมายสำนวน
          </p>
        </div>
      </div>
      
      <AssignmentDashboardClient currentUser={user} />
    </div>
  );
}
