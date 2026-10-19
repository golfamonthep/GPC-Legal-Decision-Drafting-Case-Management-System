import {requirePermission} from '@/lib/auth/requirePermission';
import {hasPermission} from '@/lib/auth/permissions';
import Workbench from '@/components/analysis/Workbench';
import {analysisAiStatus} from '@/lib/analysis/ai.mjs';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{job?:string;case?:string}>}){
 const user=await requirePermission('USE_ANALYSIS');
 const p=await searchParams;
 const status=analysisAiStatus();
 const permitted=hasPermission(user.role,'USE_AI_DRAFT');
 const canAI=permitted&&status.enabled&&status.configured;
 const aiUnavailableReason=!permitted?'บัญชีนี้ไม่มีสิทธิ์ใช้ AI':status.reason==='disabled'?'ผู้ดูแลยังไม่เปิดบริการ AI':'ระบบ AI ยังไม่ได้ตั้งค่า API key';
 return <Workbench initialJobId={p.job||null} caseId={p.case||null} canAI={canAI} aiUnavailableReason={canAI?null:aiUnavailableReason} canAttach={hasPermission(user.role,'EDIT_DRAFT')}/>;
}
