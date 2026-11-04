import React from 'react';
import { sourceUrl } from './api';
export function Icon({name}){const paths={home:<><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></>,folder:<path d="M3 6h7l2 3h9v12H3z"/>,forward:<path d="M4 12h16m-7-7 7 7-7 7"/>,refresh:<><path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5"/></>,file:<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,database:<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>,settings:<><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/></>,back:<path d="M20 12H4m7-7-7 7 7 7"/>,open:<><path d="M13 3h8v8M21 3 10 14M10 4H4v16h16v-6"/></>};return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.file}</svg>;}
export function Field({label,children,wide=false}){return <label className={'field'+(wide?' wide':'')}><span>{label}</span>{children}</label>;}
export function SourceLink({source,page=1,children}){return <a href={sourceUrl(source,page)} target="_blank" rel="noreferrer">{children||`เปิด ${source} หน้า ${page}`} <Icon name="open"/></a>;}
export function KnowledgeRail({knowledge,onOpen}){
  return (
    <aside className="knowledge-rail">
      <h3>ฐานข้อมูลปัจจุบัน (นายพล – สว.)</h3>
      <dl>
        <div><dt>ขอบเขตระดับ</dt><dd>ผบช. ลงมาถึง สว.</dd></div>
        <div><dt>แต่งตั้งนายพล</dt><dd>{knowledge?.appointments??'…'} ราย</dd></div>
        <div><dt>อาวุโสนายพล</dt><dd>{knowledge?.seniority??'…'} ราย (ครั้งที่ 4)</dd></div>
        <div><dt>เกณฑ์ รอง ผบก.–สว.</dt><dd>ว ๒๔๕๖ (๒๒ ต.ค. ๖๙)</dd></div>
        <div><dt>แบบฟอร์มแนบท้าย</dt><dd>ผนวก ก – ผนวก ช</dd></div>
      </dl>
      <p className="warning">ตำแหน่งว่างจริง: ต้องอ้างอิงเอกสารที่ตรวจแล้ว</p>
      <div className="rail-note">
        <p>รองรับระดับนายพลขึ้นไป และระดับ รอง ผบก. ลงมาถึง สว.</p>
        <p className="muted">
          ระดับนายพลใช้บัญชีอาวุโสครั้งที่ 4 (181 รายตรวจภาพแล้ว) · ระดับ รอง ผบก. ลงมาถึง สว. ใช้หลักเกณฑ์ตามบันทึกข้อความ ตร. ที่ ๐๐๐๙.๒๓๑/ว ๒๔๕๖ ลง ๒๒ ต.ค. ๒๕๖๙ (ข้อ ๑–๑๓ และ ผนวก ก–ช)
        </p>
      </div>
      <button className="outline full" onClick={onOpen}><Icon name="open"/>เปิดฐานอ้างอิง</button>
    </aside>
  );
}
