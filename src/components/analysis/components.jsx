import React from 'react';
import { sourceUrl } from './api';
export function Icon({name}){const paths={home:<><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></>,folder:<path d="M3 6h7l2 3h9v12H3z"/>,forward:<path d="M4 12h16m-7-7 7 7-7 7"/>,refresh:<><path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5"/></>,file:<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,database:<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>,settings:<><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/></>,back:<path d="M20 12H4m7-7-7 7 7 7"/>,open:<><path d="M13 3h8v8M21 3 10 14M10 4H4v16h16v-6"/></>};return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.file}</svg>;}
export function Field({label,children,wide=false}){return <label className={'field'+(wide?' wide':'')}><span>{label}</span>{children}</label>;}
export function SourceLink({source,page=1,children}){return <a href={sourceUrl(source,page)} target="_blank" rel="noreferrer">{children||`เปิด ${source} หน้า ${page}`} <Icon name="open"/></a>;}
export function KnowledgeRail({knowledge,activeTier='general',onOpen}){
  const isSubGen=activeTier==='sub_general_to_inspector';
  return (
    <aside className="knowledge-rail">
      <h3>{isSubGen?'ฐานอ้างอิง รอง ผบก. – สว.':'ฐานอ้างอิง ผบก. ขึ้นไป (นายพล)'}</h3>
      <dl>
        <div><dt>ระดับที่เลือก</dt><dd>{isSubGen?'รอง ผบก. ลงมาถึง สว.':'ผบก. ขึ้นไป (นายพล)'}</dd></div>
        <div><dt>พ.ร.บ.ตำรวจฯ ๒๕๖๕</dt><dd>{isSubGen?'ม.๗๗(๗)–(๑๐), ๗๙–๘๒':'ม.๗๗(๑)–(๖), ๗๘, ๘๑–๘๒'}</dd></div>
        <div><dt>กฎ ก.ตร.ฯ ๒๕๖๗</dt><dd>{isSubGen?'ข้อ ๗(๑)(ค), ๑๗, ๒๑, ๔๐, ๔๗':'ข้อ ๗(๑)(ข), ๑๗, ๓๙, ๔๗'}</dd></div>
        <div><dt>สัดส่วนอาวุโส</dt><dd>{isSubGen?'≥ ร้อยละ ๓๓ (ภายในหน่วย)':'≥ ร้อยละ ๕๐ / ๑๐๐ (ระดับ ตร.)'}</dd></div>
        <div><dt>แหล่งข้อมูลหลัก</dt><dd>{isSubGen?'ว ๒๔๕๖ (ผนวก ก–ช)':'อาวุโสครั้งที่ ๔ (181 ราย)'}</dd></div>
      </dl>
      <p className="warning">ตำแหน่งว่างจริง: ต้องอ้างอิงเอกสารที่ตรวจแล้ว</p>
      <div className="rail-note">
        <p>{isSubGen?'หลักเกณฑ์ระดับ รอง ผบก. ลงมาถึง สว.':'หลักเกณฑ์ระดับ ผบก. ขึ้นไป (ระดับนายพล)'}</p>
        <p className="muted">
          {isSubGen
            ?'พิจารณาแต่งตั้งเลื่อนตำแหน่งสูงขึ้นเฉพาะภายในหน่วย (ม.๘๐) คำนึงถึงอาวุโสไม่น้อยกว่าร้อยละ ๓๓ ของตำแหน่งว่างในแต่ละระดับของหน่วยนั้น (ม.๘๒(๓), ข้อ ๔๗(๓)) และตรวจตามแนวทาง ว ๒๔๕๖ (ข้อ ๑–๑๓, ผนวก ก–ช)'
            :'ผบ.ตร. คัดเลือกผ่านคณะกรรมการระดับ ตร. (ม.๘๑(๑)(ก) มีผู้แทน ก.พ. ร่วม) เสนอ ก.ตร. และโปรดเกล้าฯ · รอง ผบ.ตร./ผู้ช่วย ผบ.ตร. อาวุโส ๑๐๐% · ผบช. ลงมาถึง ผบก. อาวุโส ≥ ๕๐% ของตำแหน่งว่างระดับ ตร.'}
        </p>
      </div>
      <button className="outline full" onClick={onOpen}><Icon name="open"/>เปิดฐานอ้างอิง</button>
    </aside>
  );
}
