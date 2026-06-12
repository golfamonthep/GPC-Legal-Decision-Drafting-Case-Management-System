import { Metadata } from 'next';
import { requirePermission } from '@/lib/auth/requirePermission';
import DataQualityClient from './DataQualityClient';

export const metadata: Metadata = {
  title: 'ตรวจคุณภาพข้อมูล - ก.พ.ค.ตร.',
};

export default async function DataQualityPage() {
  await requirePermission('VIEW_DATA_QUALITY');

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ตรวจคุณภาพข้อมูล</h1>
        <p className="text-gray-600">
          ตรวจสอบและแก้ไขปัญหาคุณภาพข้อมูลสำนวน เพื่อความถูกต้องของรายงานและสถิติ
        </p>
      </div>

      <DataQualityClient />
    </div>
  );
}
