"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { AlertTriangle, Users } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function updateUser(id: string, field: 'role' | 'status', value: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      
      setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-8">กำลังโหลด...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-slate-400" />
            การจัดการผู้ใช้งานระบบ
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            กำหนดบทบาทและสิทธิ์การเข้าถึงระบบสำหรับบุคลากร ก.พ.ค.ตร.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ชื่อ - อีเมล</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-900">บทบาท (Role)</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-900">สถานะ</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-900">เข้าสู่ระบบล่าสุด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="font-medium text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, 'role', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                    <option value="COMMISSIONER">กรรมการ (COMMISSIONER)</option>
                    <option value="LEGAL_OFFICER">นิติกร (LEGAL_OFFICER)</option>
                    <option value="REGISTRY_OFFICER">เจ้าหน้าที่ธุรการ (REGISTRY_OFFICER)</option>
                    <option value="VIEWER">ผู้ใช้งานทั่วไป (VIEWER)</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <select
                    value={user.status}
                    onChange={(e) => updateUser(user.id, 'status', e.target.value)}
                    className={`block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                      user.status === 'ACTIVE' ? 'text-green-700 ring-green-300 bg-green-50' : 
                      user.status === 'PENDING' ? 'text-amber-700 ring-amber-300 bg-amber-50' : 
                      'text-red-700 ring-red-300 bg-red-50'
                    }`}
                  >
                    <option value="ACTIVE">ใช้งานปกติ (ACTIVE)</option>
                    <option value="PENDING">รออนุมัติ (PENDING)</option>
                    <option value="DISABLED">ระงับการใช้งาน (DISABLED)</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {user.lastLoginAt ? format(new Date(user.lastLoginAt), "d MMM yyyy HH:mm", { locale: th }) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
