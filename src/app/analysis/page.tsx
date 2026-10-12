import {requirePermission} from '@/lib/auth/requirePermission';
import {hasPermission} from '@/lib/auth/permissions';
import Workbench from '@/components/analysis/Workbench';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{job?:string;case?:string}>}){
 const user=await requirePermission('USE_ANALYSIS');
 const p=await searchParams;
 return <Workbench initialJobId={p.job||null} caseId={p.case||null} canAI={false} canAttach={hasPermission(user.role,'EDIT_DRAFT')}/>;
}
