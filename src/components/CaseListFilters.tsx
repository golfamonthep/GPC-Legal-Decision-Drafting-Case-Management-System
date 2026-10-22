'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconSearch } from '@tabler/icons-react';

export function CaseListFilters({ years = [] }: { years?: string[] }) {
  const params = useSearchParams();
  return <div className="gpc-tabler card">
    <form action="/cases" method="GET" className="card-body case-search-form" key={params.toString()} aria-label="ค้นหาและกรองรายการคดี">
      <div className="case-search-query">
        <label htmlFor="case-query" className="form-label">ค้นหาชื่อผู้ร้อง / ผู้อุทธรณ์ เลขเรื่อง หรือการดำเนินการ</label>
        <div className="input-icon"><span className="input-icon-addon"><IconSearch className="icon" aria-hidden="true" /></span>
          <input id="case-query" name="q" type="search" defaultValue={params.get('q') || ''} className="form-control" placeholder="เช่น ชื่อผู้ร้อง 123/68 หรือ รอคำชี้แจง" maxLength={200} />
        </div>
      </div>
      <div><label htmlFor="case-type-filter" className="form-label">ประเภททะเบียน</label><select id="case-type-filter" name="type" className="form-select" defaultValue={params.get('type') || ''}><option value="">ทั้งหมด</option><option>ร้องทุกข์</option><option>อุทธรณ์</option></select></div>
      <div><label htmlFor="case-state-filter" className="form-label">สถานะงาน</label><select id="case-state-filter" name="completionStatus" className="form-select" defaultValue={params.get('completionStatus') || ''}><option value="">ทั้งหมด</option><option value="open">กำลังดำเนินการ</option><option value="completed">เสร็จสิ้นแล้ว</option></select></div>
      <div><label htmlFor="case-year-filter" className="form-label">ปีจากเรื่องดำ</label><select id="case-year-filter" name="year" className="form-select" defaultValue={params.get('year') || ''}><option value="">ทุกปี</option>{[...new Set([...years, ...(params.get('year') ? [params.get('year')!] : [])])].sort().reverse().map(year => <option key={year}>{year}</option>)}</select></div>
      <div><label htmlFor="case-officer-filter" className="form-label">นิติกรผู้รับผิดชอบ</label><input id="case-officer-filter" name="legalOfficer" defaultValue={params.get('legalOfficer') || ''} className="form-control" placeholder="ชื่อนิติกร" maxLength={200} /></div>
      <details className="case-editor-wide"><summary className="text-secondary">ตัวกรองเพิ่มเติม</summary><div className="row g-3 mt-1">
        <div className="col-md-4"><label htmlFor="case-red-filter" className="form-label">ช่องเรื่องแดง</label><select id="case-red-filter" name="redNumberStatus" className="form-select" defaultValue={params.get('redNumberStatus') || ''}><option value="">ทั้งหมด</option><option value="hasRed">มีข้อความ (เสร็จสิ้น)</option><option value="noRed">ว่าง (ยังไม่เสร็จสิ้น)</option></select></div>
        <div className="col-md-4"><label htmlFor="case-assignment-filter" className="form-label">การมอบหมาย</label><select id="case-assignment-filter" name="unassigned" className="form-select" defaultValue={params.get('unassigned') || ''}><option value="">ทั้งหมด</option><option value="LEGAL">ยังไม่มีนิติกร</option><option value="COMMITTEE">ยังไม่มีกรรมการ</option></select></div>
        <div className="col-md-4"><label htmlFor="case-qa-filter" className="form-label">คุณภาพข้อมูล</label><select id="case-qa-filter" name="qaMissingFields" className="form-select" defaultValue={params.get('qaMissingFields') || ''}><option value="">ทั้งหมด</option><option value="missing">ข้อมูลไม่ครบถ้วน</option></select></div>
      </div></details>
      <div className="case-search-actions"><button type="submit" className="btn btn-primary"><IconSearch className="icon" aria-hidden="true" />ค้นหา / แสดงผล</button><Link href="/cases" prefetch={false} className="btn">ล้างตัวกรอง</Link></div>
    </form>
  </div>;
}
