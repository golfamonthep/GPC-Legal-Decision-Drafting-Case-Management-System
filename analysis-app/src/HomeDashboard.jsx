import React from 'react';
import {Icon,KnowledgeRail} from './components';
import {pageUrl} from './routes.mjs';

const date=value=>new Date(value).toLocaleString('th-TH');
export default function HomeDashboard({snapshot,error,knowledge,busy,onRefresh,onNew,onNavigate,onOpenJob}){
 const nav=(e,view)=>{e.preventDefault();onNavigate(view);};
 return <>
  <div className="work-layout dashboard-layout"><div>
  <div className="page-title dashboard-title"><div><h2>แดชบอร์ดเรื่องร้องทุกข์การแต่งตั้ง</h2><p className="muted">ระบบวิเคราะห์เรื่องร้องทุกข์ กรณีไม่ได้รับความเป็นธรรมในการแต่งตั้ง ระดับนายพล วาระประจำปี ๒๕๖๙</p></div><div className="actions"><button className="outline" disabled={busy} onClick={onRefresh}><Icon name="refresh"/>รีเฟรช</button><button disabled={busy} onClick={onNew}>สร้างงานวิเคราะห์</button></div></div>
   {error?<div role="alert" className="notice error">อ่านสรุปงานไม่ได้: {error} โปรดกดรีเฟรชอีกครั้ง</div>:snapshot?<>
    <dl className="dashboard-metrics" aria-label="สรุปงานวิเคราะห์">{[['งานวิเคราะห์ทั้งหมด',snapshot.jobs_count],['เอกสารรอตรวจข้อความ',snapshot.pending_documents],['ฉบับร่างที่บันทึก',snapshot.saved_revisions]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value.toLocaleString('th-TH')}</dd></div>)}</dl>
    <section className="dashboard-recent" aria-labelledby="recent-title"><div className="section-title"><h3 id="recent-title">งานล่าสุด</h3><a href={pageUrl('work')} onClick={e=>nav(e,'work')}>เปิดระบบวิเคราะห์ <Icon name="forward"/></a></div>
     <div className="table-wrap"><table className={snapshot.recent_jobs.length?'has-jobs':''}><thead><tr><th>ชื่อเรื่อง</th><th>ปรับข้อมูลล่าสุด</th><th>รุ่นข้อมูล</th><th><span className="sr-only">เปิดงาน</span></th></tr></thead><tbody>{snapshot.recent_jobs.length?snapshot.recent_jobs.map(j=><tr key={j.id}><td>{j.title}</td><td>{date(j.updated_at)}</td><td>{j.version}</td><td><a href={pageUrl('work',{jobId:j.id})} onClick={e=>{e.preventDefault();onOpenJob(j);}}>เปิดงาน</a></td></tr>):<tr><td colSpan="4" className="dashboard-empty"><strong>ยังไม่มีงานวิเคราะห์</strong><p>เริ่มสร้างงาน หรือรับชุดข้อมูลจากสำนวน</p></td></tr>}</tbody></table></div>
    <small className="snapshot-time">อ่านข้อมูลเมื่อ {date(snapshot.fetched_at)}{snapshot.last_job_update?` · งานปรับข้อมูลล่าสุด ${date(snapshot.last_job_update)}`:''}</small></section>
   </>:<p role="status">กำลังอ่านสรุปงาน…</p>}
   <div className="dashboard-entry"><Icon name="file"/><div><h3>ระบบวิเคราะห์</h3><p>ตรวจหลักฐาน จัดทำร่าง และส่งออก Word</p></div><a className="button-link outline" href={pageUrl('work')} onClick={e=>nav(e,'work')}>เปิดระบบวิเคราะห์</a></div>
   <div className="dashboard-entry"><Icon name="database"/><div><h3>ระบบทะเบียนและเจ้าของสำนวน</h3><p>รายชื่อผู้ร้อง เจ้าของสำนวน และสถานะทางราชการอยู่ที่ระบบทะเบียน</p></div><a href="http://127.0.0.1:3000/dashboard" target="_blank" rel="noopener noreferrer">เปิดทะเบียนสำนวน <Icon name="open"/></a></div>
   <p className="muted dashboard-note">สรุปนี้เป็นงานวิเคราะห์ ไม่ใช่จำนวนคดีในทะเบียน</p>
  </div><KnowledgeRail knowledge={knowledge} onOpen={()=>onNavigate('knowledge')}/></div>
 </>;
}
