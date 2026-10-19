import React, { useState } from 'react';
import { api, statusLabel } from './api';
import { Field, SourceLink } from './components';

const QUICK_SEARCHES = [
  { label: 'มาตรา 87 (การร้องทุกข์)', q: 'มาตรา 87', kind: 'law' },
  { label: 'มาตรา 79 (หลักเกณฑ์แต่งตั้ง)', q: 'มาตรา 79', kind: 'law' },
  { label: 'สัดส่วนอาวุโส 50%', q: 'ร้อยละห้าสิบ', kind: 'law' },
  { label: 'ตัวอย่างโครงสร้างคำวินิจฉัย', q: 'พิเคราะห์แล้วเห็นว่า', kind: 'precedent' },
];

export default function Knowledge({ knowledge, job, operate, setJob }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('law');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [page, setPage] = useState(1);
  const [comparison, setComparison] = useState(false);

  const runSearch = (queryValue, kindValue) =>
    operate(async () => {
      const r = await api(`/knowledge/search?q=${encodeURIComponent(queryValue)}&kind=${kindValue}`);
      setResults(r.results);
      setSelected(null);
    });

  const search = () => runSearch(q, kind);

  const choose = (r) => {
    setSelected(r);
    setText(r.text);
    setPage(r.page || r.source_pdf_page || 1);
    setReviewed(false);
    setComparison(false);
  };

  const approve = () =>
    operate(async () => {
      if (!job) throw new Error('บันทึกหรือเปิดงานวิเคราะห์ก่อนเพิ่มแหล่ง');
      if (!reviewed) throw new Error('โปรดเปิดต้นฉบับ ตรวจข้อความและยืนยันก่อน');
      setJob(
        await api(`/jobs/${job.id}/references`, 'POST', {
          version: job.version,
          source_id: selected.id,
          text,
          page: Number(page),
          reviewed,
          comparison,
        }),
      );
      setReviewed(false);
    });

  const approvedIds = new Set((job?.data?.references || []).map((r) => r.id));

  return (
    <>
      <div className="page-title">
        <h2>ฐานข้อมูลอ้างอิง</h2>
        <span className="muted">
          รุ่น {knowledge?.version} · ตรวจ hash ตรงกับชุดต้นทาง ({knowledge?.sources?.length || 0} ไฟล์ PDF)
        </span>
      </div>
      <p className="muted">
        ดัชนีใช้ค้นหา (รองรับเลขไทย ๐-๙ และเลขอารบิก 0-9) ข้อความต้องตรวจจาก PDF ก่อนอนุมัติสำหรับงาน
        คำวินิจฉัยตัวอย่างใช้เป็นโครงและภาษาเท่านั้น
      </p>

      <div className="search-row">
        <input
          aria-label="ค้นฐานอ้างอิง"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ชื่อบุคคล คำค้น หรือเลขมาตรา (เช่น มาตรา ๘๗ หรือ มาตรา 87)"
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <select aria-label="ชนิดแหล่ง" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="law">กฎหมาย</option>
          <option value="seniority">อาวุโสที่ตรวจภาพ</option>
          <option value="appointment">การแต่งตั้ง</option>
          <option value="precedent">คำวินิจฉัยตัวอย่าง</option>
        </select>
        <button onClick={search}>ค้นหา</button>
      </div>

      <div className="phrase-toolbar" aria-label="คำค้นด่วนฐานอ้างอิง">
        {job?.data?.subject_name ? (
          <>
            <button
              type="button"
              className="chip-btn cite-chip"
              onClick={() => {
                setQ(job.data.subject_name);
                setKind('seniority');
                runSearch(job.data.subject_name, 'seniority');
              }}
            >
              ค้นอาวุโส: {job.data.subject_name}
            </button>
            <button
              type="button"
              className="chip-btn cite-chip"
              onClick={() => {
                setQ(job.data.subject_name);
                setKind('appointment');
                runSearch(job.data.subject_name, 'appointment');
              }}
            >
              ค้นการแต่งตั้ง: {job.data.subject_name}
            </button>
          </>
        ) : null}
        {QUICK_SEARCHES.map((item) => (
          <button
            key={item.label}
            type="button"
            className="chip-btn"
            onClick={() => {
              setQ(item.q);
              setKind(item.kind);
              runSearch(item.q, item.kind);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="reference-layout">
        <div>
          <h3>ผลค้นหา {results.length} รายการ</h3>
          {results.length === 0 ? (
            <p className="muted">กรอกคำค้นแล้วกดค้นหา ระบบไม่ใช้แหล่งอาวุโสรุ่นเก่า</p>
          ) : (
            results.map((r) => (
              <button
                className={'source-row' + (r.id === selected?.id ? ' selected' : '')}
                key={r.id}
                onClick={() => choose(r)}
              >
                <strong>
                  {r.label}{' '}
                  {approvedIds.has(r.id) ? <span className="status-tag ok">อนุมัติในงานนี้แล้ว</span> : null}
                </strong>
                <span>
                  {r.source_pdf} · หน้า {r.page || r.source_pdf_page || 'รอตรวจ'}
                </span>
                <small>{statusLabel(r.status)}</small>
              </button>
            ))
          )}
        </div>

        <div className="source-inspector">
          {selected ? (
            <>
              <h3>{selected.label}</h3>
              <SourceLink source={selected.source_pdf} page={page} />
              <Field label="หน้า PDF">
                <input type="number" min="1" value={page} onChange={(e) => setPage(e.target.value)} />
              </Field>
              <Field label="ข้อความที่ตรวจเทียบต้นฉบับ">
                <textarea
                  rows="15"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setReviewed(false);
                  }}
                />
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                ตรวจชื่อ ตัวเลข มาตรา/ข้อ และหน้าอ้างอิงจากต้นฉบับแล้ว
              </label>
              {selected.kind === 'seniority' ? (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={comparison}
                    onChange={(e) => setComparison(e.target.checked)}
                  />
                  รายการนี้เป็นบุคคลที่ใช้เปรียบเทียบกับบุคคลของงาน
                </label>
              ) : null}
              <button disabled={!job || !reviewed} onClick={approve}>
                อนุมัติแหล่งให้กับงานนี้
              </button>
              {!job ? (
                <p className="muted">เปิดงานวิเคราะห์ก่อนอนุมัติแหล่ง</p>
              ) : (
                <p className="muted">งานที่เปิด: {job.title}</p>
              )}
            </>
          ) : (
            <>
              <h3>ต้นฉบับในชุดปัจจุบัน</h3>
              {knowledge?.sources.map((s) => (
                <div className="original-row" key={s.filename}>
                  <SourceLink source={s.filename}>{s.filename}</SourceLink>
                  <small>
                    {s.page_count} หน้า · {s.role === 'reference_only' ? 'ตัวอย่างเท่านั้น' : 'แหล่งอ้างอิง'} · SHA{' '}
                    {s.sha256.slice(0, 12)}
                  </small>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

