import {NextRequest,NextResponse} from 'next/server';
import {requireApiPermission} from '@/lib/auth/requireApiPermission';
import {analysisService} from '@/lib/analysis/service.mjs';
import {assertSameOrigin} from '@/lib/analysis/safety.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const LIMIT=4.2*1024*1024;
async function handler(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 try{
  const actor=await requireApiPermission('USE_ANALYSIS');
  const {path}=await params;
  if(path.length>4)throw Object.assign(new Error('ไม่พบเส้นทาง'),{status:404});
  let body={};
  if(req.method!=='GET'){
   assertSameOrigin(req.headers.get('origin'),req.headers.get('host'),process.env.NODE_ENV==='production');
   if(!req.headers.get('content-type')?.startsWith('application/json'))throw Object.assign(new Error('ต้องส่ง JSON'),{status:415});
   if(path[2]==='attach')await requireApiPermission('EDIT_DRAFT');
   if(path[2]==='propose')await requireApiPermission('USE_AI_DRAFT');
   const reader=req.body?.getReader();if(!reader)throw new SyntaxError('ไม่มีข้อมูล');let size=0;const chunks:Uint8Array[]=[];
   while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>LIMIT){await reader.cancel();throw Object.assign(new Error('ไฟล์ใหญ่เกินขนาดที่เว็บรับได้ (สูงสุด 3 MB)'),{status:413});}chunks.push(next.value);}
   body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||Array.isArray(body)||typeof body!=='object')throw new SyntaxError('JSON ไม่ถูกต้อง');
  }
  const result=await analysisService(path,req.method,body,new URL(req.url),actor);
  return result instanceof Response?result:NextResponse.json(result,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){const e=error as Error&{status?:number};const status=e.message==='UNAUTHORIZED'?401:e.message==='FORBIDDEN'?403:e instanceof SyntaxError?400:e.status||503;return NextResponse.json({error:status===401?'กรุณาเข้าสู่ระบบ':status===403?'ไม่มีสิทธิ์ดำเนินการในงานหรือสำนวนนี้':e instanceof SyntaxError?'รูปแบบข้อมูลไม่ถูกต้อง':status===503&&e.status!==503?'ฐานงานวิเคราะห์ยังไม่พร้อม กรุณาตรวจฐานข้อมูลและ migration':e.status?e.message:'ดำเนินการไม่สำเร็จ'},{status,headers:{'Cache-Control':'private, no-store'}});}
}
export const GET=handler;
export const POST=handler;
export const PUT=handler;
export const DELETE=handler;
