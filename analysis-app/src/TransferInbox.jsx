import React,{useEffect,useState,useCallback} from 'react';
import {api} from './api';

export default function TransferInbox({settings,operate,onImported}){
 const [packet,setPacket]=useState(null);const [preview,setPreview]=useState(null);const [notice,setNotice]=useState('');
 const previewPacket=useCallback(async p=>{setPreview(null);setPacket(null);const r=await api('/transfers/preview','POST',{packet:p});setPacket(p);setPreview(r);setNotice('ตรวจรายการต่อไปนี้ก่อนรับเข้าเป็นงานวิเคราะห์');},[]);
 useEffect(()=>{
   const origin=new URLSearchParams(window.location.search).get('registry_origin');
   if(!origin||!settings?.registry_origins?.includes(origin)||!window.opener)return;
   const receive=e=>{if(e.origin!==origin||e.source!==window.opener||e.data?.type!=='gpc.analysis.request')return;if(e.data.packet?.registry?.origin!==origin){setNotice('ที่อยู่ต้นทางไม่ตรงหน้าต่างที่ส่งงาน');return;}previewPacket(e.data.packet).catch(e=>setNotice(e.message));};
   window.addEventListener('message',receive);window.opener.postMessage({type:'gpc.analysis.ready'},origin);
   return()=>window.removeEventListener('message',receive);
 },[settings,previewPacket]);
 const readFile=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>30*1024*1024)throw new Error('ชุดข้อมูลใหญ่เกิน 30 MB');await previewPacket(JSON.parse(await f.text()));}catch(err){setNotice(err.message);}};
 const receive=()=>operate(async()=>{const r=await api('/transfers/import','POST',{packet,confirmed:true});await onImported(r.job);});
 return <><h2>รับงานจากระบบเจ้าของสำนวน</h2><p className="muted">เลือกส่งเฉพาะสำนวนจากหน้าสำนวนเดิม หรือใช้ไฟล์ชุดส่งงาน .json ที่ดาวน์โหลดจากระบบเดิม ข้อมูลนี้เป็นสำเนาสำหรับวิเคราะห์ เอกสารทุกฉบับยังต้องตรวจข้อความก่อนใช้</p><div className="upload-row"><label>เลือกชุดส่งงาน .json <input aria-label="เลือกชุดส่งงานจากทะเบียน" type="file" accept=".json,application/json" onChange={readFile}/></label></div>{notice?<p role="status" className="notice">{notice}</p>:null}{preview?<section className="review-form"><h3>{preview.title}</h3><dl className="settings-list"><div><dt>เลขสำนวนต้นทาง</dt><dd>{preview.registry.black_number}</dd></div><div><dt>บุคคลที่ใช้วิเคราะห์</dt><dd>{preview.subject_name}</dd></div><div><dt>ระบบต้นทาง</dt><dd>{preview.registry.origin}</dd></div></dl>{[['คำร้องหรือข้อกล่าวอ้าง',preview.claim],['คำชี้แจง',preview.response],['ประเด็นและคำขอ',preview.issues]].map(([label,text])=><section key={label}><h4>{label}</h4><p className="preserve">{text||'ยังไม่มีข้อความ ต้องเพิ่มในงานวิเคราะห์'}</p></section>)}<h4>เอกสารที่ส่งมา {preview.documents.length} ฉบับ</h4>{preview.documents.length?<ul>{preview.documents.map(d=><li key={d.sha256+d.name}>{d.name}<small>SHA-256 {d.sha256}</small></li>)}</ul>:<p>ไม่มีเอกสารแนบในชุดนี้ เพิ่มต้นฉบับในแท็บเอกสารประกอบได้</p>}<small>รหัสส่งงาน {preview.transfer_id}</small><p className="warning">ข้อกล่าวอ้างที่ส่งมายังไม่ใช่ข้อเท็จจริงที่ยืนยัน การรับงานไม่เปลี่ยนสถานะหรือผู้รับผิดชอบของทะเบียน</p><button onClick={receive}>{preview.existing_job_id?'เปิดงานที่เคยรับแล้ว':'ยืนยันรับเป็นงานวิเคราะห์'}</button></section>:null}</>;
}
