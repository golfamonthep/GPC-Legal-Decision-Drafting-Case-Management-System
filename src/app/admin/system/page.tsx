import { requirePermission } from "@/lib/auth/requirePermission";
import { getSystemHealth } from "@/lib/admin/systemHealth";
import { getAdminMetrics } from "@/lib/admin/adminMetrics";
import prisma from "@/lib/db";
import { 
  Server, CheckCircle, XCircle, Database, Shield, FileText, Cpu, 
  Activity, AlertTriangle, Users, Lock, HardDrive, Zap, Info
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { MaintenanceActionsPanel } from "@/components/admin/MaintenanceActionsPanel";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const StatusIcon = ({ ok }: { ok: boolean }) => 
  ok ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

export default async function SystemConsolePage() {
  const user = await requirePermission("VIEW_ADMIN_CONSOLE");

  // Fetch data
  const health = await getSystemHealth(user.id);
  const metrics = await getAdminMetrics(user.id);
  
  const [recentAuditLogs, recentJobs, securitySignals] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } }
    }),
    prisma.documentIngestionJob.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { legalSource: { select: { title: true, documentType: true } } }
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: ['LOGIN_FAILED', 'PERMISSION_DENIED', 'UNAUTHORIZED_ACCESS']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } }
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" />
          System Administration Console
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Read-only system monitoring and maintenance oversight. For authorized administrators only.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. System Health */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
            <Server className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Database Connected</span>
              <div className="flex items-center gap-2 font-medium"><StatusIcon ok={health.dbConnected} /></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Prisma Ready</span>
              <div className="flex items-center gap-2 font-medium"><StatusIcon ok={health.prismaReady} /></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Environment</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-800">{health.environment}</span>
            </div>
          </div>
        </div>

        {/* 2. Environment Readiness */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
            <Cpu className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Environment Config</h2>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Auth Config</span>
              <div className="flex items-center gap-2 font-medium"><StatusIcon ok={health.config.AUTH_SECRET && health.config.AUTH_URL} /></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Microsoft Graph</span>
              <div className="flex items-center gap-2 font-medium"><StatusIcon ok={health.config.MICROSOFT_TENANT_ID && health.config.MICROSOFT_CLIENT_ID} /></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">OpenAI API</span>
              <div className="flex items-center gap-2 font-medium"><StatusIcon ok={health.config.OPENAI_API_KEY} /></div>
            </div>
            {health.alerts.map((alert, i) => (
              <div key={i} className={`mt-2 text-xs flex items-center gap-1.5 p-2 rounded ${alert.level === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                <AlertTriangle className="w-4 h-4" /> {alert.message}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Usage Overview */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
            <Users className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">Usage Overview</h2>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total / Active Users</span>
              <span className="font-medium text-slate-900">{metrics.totalUsers} / {metrics.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Total / Active Cases</span>
              <span className="font-medium text-slate-900">{metrics.totalCases} / {metrics.activeCases}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Drafts Created</span>
              <span className="font-medium text-slate-900">{metrics.draftCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Documents / Chunks</span>
              <span className="font-medium text-slate-900">{metrics.totalDocuments} / {metrics.totalDocumentChunks}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Queue / RAG Jobs */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-slate-900">Queue & RAG Ingestion Jobs</h2>
            </div>
            <div className="text-sm font-medium flex gap-4">
              <span className="text-blue-600">Pending: {metrics.ragIngestionJobsByStatus['pending'] || 0}</span>
              <span className="text-amber-600">Processing: {metrics.ragIngestionJobsByStatus['processing'] || 0}</span>
              <span className="text-red-600">Failed: {metrics.ragIngestionJobsByStatus['failed'] || 0}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentJobs.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 italic text-center">No recent jobs</div>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="p-4 flex justify-between items-start text-sm hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-medium text-slate-900">{job.legalSource?.title || 'Unknown Source'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{job.legalSource?.documentType}</div>
                    {job.errorMessage && <div className="text-xs text-red-600 mt-1">{job.errorMessage}</div>}
                  </div>
                  <div className="text-right ml-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      job.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      job.status === 'failed' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                      'bg-blue-50 text-blue-700 ring-blue-600/20'
                    }`}>
                      {job.status}
                    </span>
                    <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                      {formatDistanceToNow(job.updatedAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 6. Security Signals */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900">Security Signals</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100 flex-1 bg-slate-50">
            {securitySignals.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-sm text-slate-500 h-full">
                <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                No suspicious activities detected
              </div>
            ) : (
              securitySignals.map((signal) => (
                <div key={signal.id} className="p-4 bg-white text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-red-700">{signal.action}</span>
                    <span className="text-xs text-slate-500">{formatDistanceToNow(signal.timestamp, { addSuffix: true })}</span>
                  </div>
                  <div className="text-slate-700">
                    User: {signal.user?.email || signal.user?.name || 'Unknown'} 
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Audit Overview */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Recent Audit Logs</h2>
            </div>
            <Link href="/api/admin/audit" className="text-xs text-blue-600 hover:underline">View Raw JSON</Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="p-4 text-sm hover:bg-slate-50">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-900">{log.action}</span>
                  <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                </div>
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Actor: {log.user?.name || 'System'}</span>
                  <span>Target: {log.entityType}:{log.entityId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Maintenance Actions */}
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-6 flex flex-col lg:col-span-2">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Maintenance Actions</h2>
          </div>
          <MaintenanceActionsPanel />
        </div>
      </div>

    </div>
  );
}
