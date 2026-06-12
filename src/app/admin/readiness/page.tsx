import { requirePermission } from "@/lib/auth/requirePermission";
import prisma from "@/lib/db";
import { Server, CheckCircle, XCircle, Database, Shield, FileText, Cpu, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ReadinessPage() {
  await requirePermission("MANAGE_USERS");

  let dbStatus = false;
  let dbMessage = "";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = true;
    dbMessage = "Connected to Supabase/PostgreSQL";
  } catch (error: any) {
    dbMessage = error.message;
  }

  const authConfigured = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.NEXTAUTH_SECRET);
  const msGraphConfigured = !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID);
  const openAIConfigured = !!process.env.OPENAI_API_KEY;
  const adminBootstrap = process.env.ADMIN_BOOTSTRAP_ENABLED === 'true';

  const checkIcon = (status: boolean) => 
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
          <Server className="h-8 w-8 text-slate-400" />
          Production Readiness Status
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          ตรวจสอบสถานะความพร้อมของระบบสำหรับแอดมินเท่านั้น ห้ามเปิดเผยข้อมูลนี้แก่บุคคลภายนอก
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Database Status */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">Database Connection</h2>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{dbStatus ? "OK" : "Error"}</span>
              {checkIcon(dbStatus)}
            </div>
          </div>
          <div className="py-2 text-xs text-slate-500 break-all">
            {dbMessage}
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Authentication & Authz</h2>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">NextAuth & Azure AD</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{authConfigured ? "Configured" : "Missing Vars"}</span>
              {checkIcon(authConfigured)}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Admin Bootstrap</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{adminBootstrap ? "Enabled (Warning)" : "Disabled (Safe)"}</span>
              {checkIcon(!adminBootstrap)}
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Microsoft Graph API</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{msGraphConfigured ? "Configured" : "Missing Vars"}</span>
              {checkIcon(msGraphConfigured)}
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">OpenAI API</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{openAIConfigured ? "Configured" : "Missing Vars"}</span>
              {checkIcon(openAIConfigured)}
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Operations & UAT</h2>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                   <div className="text-sm font-medium text-slate-900">PRODUCTION_UAT_CHECKLIST.md</div>
                   <div className="text-xs text-slate-500">ขั้นตอนการทดสอบระบบสำหรับผู้ใช้แต่ละกลุ่ม</div>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                   <div className="text-sm font-medium text-slate-900">OPERATIONS_RUNBOOK.md</div>
                   <div className="text-xs text-slate-500">คู่มือการจัดการระบบเมื่อพบปัญหา และการสำรองข้อมูล</div>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                   <div className="text-sm font-medium text-slate-900">GO_LIVE_CHECKLIST.md</div>
                   <div className="text-xs text-slate-500">รายการตรวจสอบก่อนขึ้นระบบจริง</div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-slate-200 pt-6">
        <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          &larr; กลับไปหน้าจัดการผู้ใช้
        </Link>
      </div>
    </div>
  );
}
