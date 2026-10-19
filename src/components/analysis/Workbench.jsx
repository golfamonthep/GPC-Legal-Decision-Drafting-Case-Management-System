'use client';
import React,{useState,useEffect} from 'react';
import Link from 'next/link';
import {api,emptyInput} from './api';
import InputForm from './InputForm';
import Documents from './Documents';
import Analysis from './Analysis';
import Drafts from './Drafts';
import Knowledge from './Knowledge';
import './workbench.css';

const TABS=['ข้อมูลที่ใช้วิเคราะห์','เอกสารประกอบ','ผลวิเคราะห์','ร่างเบื้องต้น','ส่งออก','ฐานอ้างอิง'];
export default function Workbench({initialJobId=null,caseId=null,canAI=false,aiUnavailableReason=null,canAttach=false}){
 const [jobs,setJobs]=useState([]),[job,setJob]=useState(null),[input,setInput]=useState({...emptyInput}),[knowledge,setKnowledge]=useState(null),[knowledgeError,setKnowledgeError]=useState(null),[tab,setTab]=useState(0),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null),[draftDirty,setDraftDirty]=useState(false),[exported,setExported]=useState(null);
 const dirty=JSON.stringify(input)!==JSON.stringify(Object.fromEntries(Object.keys(emptyInput).map(k=>[k,job?.data[k]||''])));
 const [activeCaseId,setActiveCaseId]=useState(caseId);
 useEffect(()=>{const guard=e=>{if(!(dirty||draftDirty)||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest?.('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;const dest=new URL(a.href,window.location.href);if(dest.origin===window.location.origin&&dest.href!==window.location.href){e.preventDefault();e.stopPropagation();setNotice('บันทึกข้อมูลและร่างก่อนออกจากหน้าวิเคราะห์');}};document.addEventListener('click',guard,true);return()=>document.removeEventListener('click',guard,true);},[dirty,draftDirty]);
 function loaded(j){setActiveCaseId(j.case_id||null);setJob(j);setInput(Object.fromEntries(Object.keys(emptyInput).map(k=>[k,j.data[k]||''])));setTab(0);setExported(null);setDraftDirty(false);window.history.replaceState(null,'','/analysis?job='+encodeURIComponent(j.id));}
 async function operate(fn){if(busy)return;setBusy(true);setNotice(null);try{await fn();}catch(e){setNotice(e.message);}finally{setBusy(false);}}
 async function refresh(){setJobs((await api('/jobs')).jobs);}
 useEffect(()=>{let live=true;api('/knowledge').then(k=>live&&setKnowledge(k)).catch(e=>live&&setKnowledgeError(e.message));api('/jobs').then(j=>live&&setJobs(j.jobs)).catch(e=>live&&setNotice(e.message));if(initialJobId)api('/jobs/'+encodeURIComponent(initialJobId)).then(j=>live&&loaded(j)).catch(e=>live&&setNotice(e.message));else if(caseId)api('/case/'+encodeURIComponent(caseId)).then(c=>live&&setInput({...emptyInput,title:c.subject,external_case_ref:c.blackNumber,subject_name:c.petitionerName})).catch(e=>live&&setNotice(e.message));return()=>{live=false;};},[initialJobId,caseId]);
 useEffect(()=>{const warn=e=>{if(dirty||draftDirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,draftDirty]);
 function safeSwitch(fn){if(busy)return;if(dirty||draftDirty){setNotice('บันทึกข้อมูลและร่างก่อนเปลี่ยนงานหรือขั้นตอน');return;}fn();}
 const save=()=>operate(async()=>{const j=job?await api('/jobs/'+job.id,'PUT',{...input,version:job.version}):await api('/jobs','POST',{...input,case_id:activeCaseId});loaded(j);await refresh();});
 const exportDraft=revision=>operate(async()=>{setExported(await api('/jobs/'+job.id+'/export','POST',{revision_id:revision.id}));});
 const attach=revision=>operate(async()=>{if(!window.confirm('แนบร่างฉบับนี้เข้าสำนวนเดิม โดยไม่เปลี่ยนสถานะคดี ต้องการยืนยันไหม?'))return;const r=await api('/jobs/'+job.id+'/attach','POST',{revision_id:revision.id,confirmed:true});setNotice(r.reused?'ร่างฉบับนี้แนบในสำนวนแล้ว ไม่แนบซ้ำ':'แนบร่างเข้าสำนวนแล้ว รอตรวจโดยผู้รับผิดชอบ');});
 const jobWithoutAI={...job,proposals:job?.proposals||[]};
 return <section className="analysis-workbench" aria-busy={busy}>
  <header className="page-title"><div><h1>วิเคราะห์และร่างคำวินิจฉัย</h1><p className="muted">ทำงานภายในระบบ GPC เดิม · ผลทั้งหมดเป็นร่างสำหรับตรวจทาน</p></div><Link href="/dashboard">กลับ Dashboard</Link></header>
  {notice?<div role="alert" className="notice error">{notice}<button aria-label="ปิดข้อความ" onClick={()=>setNotice(null)}>×</button></div>:null}
  {knowledgeError?<p role="alert" className="warning">{knowledgeError} — รับข้อมูลและเขียนร่างด้วยตนเองได้ แต่การค้นฐานอ้างอิงและวิเคราะห์ยังไม่พร้อม</p>:null}
  {busy?<p role="status">กำลังดำเนินการ…</p>:null}
  <div className="review-form"><label>เปิดงานวิเคราะห์ <select aria-label="เลือกงานวิเคราะห์" value={job?.id||''} onChange={e=>{const id=e.target.value;if(!id)return;safeSwitch(()=>operate(async()=>loaded(await api('/jobs/'+encodeURIComponent(id)))));}}><option value="">เลือกงานที่บันทึกไว้</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}</select></label><button className="outline" disabled={busy} onClick={()=>safeSwitch(()=>{setActiveCaseId(null);setJob(null);setInput({...emptyInput});setTab(0);setExported(null);window.history.replaceState(null,'','/analysis');})}>สร้างงานใหม่</button></div>
  {job?.case_id?<p className="notice">เชื่อมสำนวน <Link href={'/cases/'+encodeURIComponent(job.case_id)}>{job.data.external_case_ref}</Link> · สำเนาสำหรับวิเคราะห์ ไม่เปลี่ยนสถานะทางการ</p>:null}
  <nav className="tabs" aria-label="ขั้นตอนวิเคราะห์">{TABS.map((name,i)=><button key={name} disabled={busy||(i>0&&i<5&&!job)} className={tab===i?'active':''} aria-current={tab===i?'step':undefined} onClick={()=>safeSwitch(()=>setTab(i))}>{name}</button>)}</nav>
  <div hidden={tab!==0}><div className="section-title"><h2>{job?job.title:'ข้อมูลสำหรับงานใหม่'}</h2><button disabled={busy} onClick={save}>บันทึกข้อมูล</button></div><InputForm input={input} setInput={setInput} knowledge={knowledge}/></div>
  {job?<div key={job.id}>
   <div hidden={tab!==1}><Documents job={job} setJob={setJob} operate={operate}/></div>
   <div hidden={tab!==2}>{knowledge?<Analysis job={job} setJob={setJob} operate={operate} knowledge={knowledge} onSources={()=>safeSwitch(()=>setTab(5))}/>:<p>ฐานอ้างอิงยังไม่พร้อม จึงไม่สร้างผลวิเคราะห์</p>}</div>
   <div hidden={tab!==3}><Drafts job={jobWithoutAI} setJob={setJob} operate={operate} onDirty={setDraftDirty} canAI={canAI} aiUnavailableReason={aiUnavailableReason}/></div>
   <div hidden={tab!==4}><h2>ร่างฉบับที่บันทึกและส่งออก</h2><p className="warning">ร่างเบื้องต้น ต้องตรวจข้อเท็จจริง กฎหมาย และแหล่งอ้างอิงก่อนใช้ทุกครั้ง</p>{job.revisions.length?job.revisions.map(r=><article className="review-form" key={r.id}><h3>{r.data.title}</h3><p>ฉบับ {r.id} · {new Date(r.created_at).toLocaleString('th-TH')} · ข้อมูลรุ่น {r.data.job_version}</p><button disabled={busy} onClick={()=>exportDraft(r)}>สร้างไฟล์ Word</button>{job.case_id&&canAttach?<button className="outline" disabled={busy} onClick={()=>attach(r)}>ตรวจและยืนยันแนบร่างเข้าสำนวน</button>:null}</article>):<p>บันทึกร่างก่อนส่งออก</p>}{exported?<p><a href={exported.url}>ดาวน์โหลดร่าง Word</a></p>:null}</div>
  </div>:null}
  <div hidden={tab!==5}>{knowledge?<Knowledge knowledge={knowledge} job={job} setJob={setJob} operate={operate}/>:<p>ยังไม่มีฐานอ้างอิงบนเว็บที่ผ่านการตรวจความครบถ้วน</p>}</div>
 </section>;
}
