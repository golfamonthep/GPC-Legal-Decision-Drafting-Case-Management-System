import React, { useState, useEffect } from 'react';
import { api, SECTIONS, blankSections } from './api';

const LEGAL_PHRASES = [
  { label: '+ พิเคราะห์แล้วเห็นว่า', text: 'พิเคราะห์แล้วเห็นว่า ' },
  { label: '+ พิจารณาแล้วเห็นว่า', text: 'พิจารณาแล้วเห็นว่า ' },
  { label: '+ ข้อเท็จจริงรับฟังได้ว่า', text: 'ข้อเท็จจริงรับฟังได้ว่า ' },
  { label: '+ ประเด็นที่ต้องวินิจฉัยมีว่า', text: 'ประเด็นที่ต้องวินิจฉัยมีว่า ' },
];

export default function Drafts({ job, setJob, operate, onDirty, canAI = true, aiUnavailableReason = null }) {
  const [section, setSection] = useState(SECTIONS[0]);
  const [text, setText] = useState(job.revisions[0]?.data.sections || blankSections());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    onDirty(dirty);
  }, [dirty, onDirty]);

  const proposal = job.proposals.find((p) => p.data.section === section);
  const latest = job.revisions[0];
  const filledSections = SECTIONS.filter((s) => Boolean(text[s]?.trim())).length;
  const approvedCitations = [
    ...(job.data.references || []).filter((r) => r.reviewed),
    ...(job.documents || []).filter((d) => d.data.reviewed).map((d) => ({ id: 'doc-' + d.id, label: d.name })),
  ];

  const save = () =>
    operate(async () => {
      setJob(await api(`/jobs/${job.id}/drafts`, 'POST', { version: job.version, sections: text }));
      setDirty(false);
    });
  const propose = () =>
    operate(async () => {
      setJob(await api(`/jobs/${job.id}/propose`, 'POST', { section, version: job.version }));
    });
  const accept = () => {
    if (proposal.data.job_version !== job.version) throw new Error('ข้อเสนอใช้ข้อมูลรุ่นเก่า กรุณาร่างใหม่');
    setText({ ...text, [section]: proposal.data.text });
    setDirty(true);
  };
  const appendProposal = () => {
    if (proposal.data.job_version !== job.version) throw new Error('ข้อเสนอใช้ข้อมูลรุ่นเก่า กรุณาร่างใหม่');
    const current = String(text[section] || '').trim();
    setText({
      ...text,
      [section]: current ? `${current}\n\n${proposal.data.text}` : proposal.data.text,
    });
    setDirty(true);
  };
  const insertSnippet = (snippet) => {
    const current = String(text[section] || '');
    const sep = current && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
    setText({ ...text, [section]: `${current}${sep}${snippet}` });
    setDirty(true);
  };
  const fillInputs = () => {
    if (
      !window.confirm(
        'เติมคำร้องและคำชี้แจงจากข้อมูลที่บันทึกลงช่องร่าง โดยจะทับข้อความสองช่องนี้ ต้องการดำเนินการไหม?',
      )
    )
      return;
    setText({
      ...text,
      ข้อมูลเรื่องและบุคคล: `${job.data.title}\n${job.data.subject_name}\n${job.data.rank_position}`,
      คำร้องและคำขอ: job.data.claim + '\n' + job.data.issues,
      คำชี้แจง: job.data.response,
    });
    setDirty(true);
  };

  return (
    <>
      <div className="section-title">
        <div>
          <h3>ร่างเบื้องต้น</h3>
          <p className="muted">
            {dirty ? 'มีข้อความที่ยังไม่บันทึก' : 'ข้อความร่างที่บันทึกไว้'} · เขียนแล้ว {filledSections}/{SECTIONS.length} หมวด ·
            ข้อเสนอ AI แสดงแยก ต้องตรวจแหล่งและรับข้อความด้วยตนเอง
          </p>
        </div>
        <div className="actions">
          <button className="outline" onClick={fillInputs}>
            เติมข้อความข้อมูลเรื่อง
          </button>
          <button onClick={save}>บันทึกร่างฉบับใหม่</button>
        </div>
      </div>

      <div className="draft-layout">
        <nav className="section-nav" aria-label="ส่วนร่าง">
          {SECTIONS.map((s) => {
            const hasContent = Boolean(text[s]?.trim());
            return (
              <button className={s === section ? 'active' : ''} key={s} onClick={() => setSection(s)}>
                <span>{s}</span>
                <small className={hasContent ? 'sec-dot filled' : 'sec-dot'}>{hasContent ? '✓' : '○'}</small>
              </button>
            );
          })}
        </nav>

        <div>
          <div className="editor-head">
            <h3>{section}</h3>
            <small>{String(text[section] || '').length.toLocaleString('th-TH')} ตัวอักษร</small>
          </div>

          <div className="phrase-toolbar" aria-label="เครื่องมือแทรกถ้อยคำและแหล่งอ้างอิง">
            {LEGAL_PHRASES.map((p) => (
              <button
                key={p.label}
                type="button"
                className="chip-btn"
                onClick={() => insertSnippet(p.text)}
              >
                {p.label}
              </button>
            ))}
            {approvedCitations.slice(0, 6).map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip-btn cite-chip"
                title={`แทรกอ้างอิง ${c.label}`}
                onClick={() => insertSnippet(`[${c.id}]`)}
              >
                [{c.id}]
              </button>
            ))}
          </div>

          <textarea
            className="draft-editor"
            aria-label={'ข้อความร่าง ' + section}
            value={text[section]}
            onChange={(e) => {
              setText({ ...text, [section]: e.target.value });
              setDirty(true);
            }}
            rows="19"
          />
          <p className="muted">
            ฉบับบันทึกล่าสุด {latest ? new Date(latest.created_at).toLocaleString('th-TH') : 'ยังไม่มี'} ·
            เก็บประวัติทุกครั้งที่บันทึก (บันทึกแล้ว {job.revisions.length} ฉบับ)
          </p>
        </div>

        <aside className="proposal">
          <h3>ข้อเสนอ AI</h3>
          <button className="outline" disabled={!canAI} onClick={propose}>
            เสนอร่างเฉพาะส่วนนี้
          </button>
          {!canAI && aiUnavailableReason ? (
            <p className="muted" role="status">
              {aiUnavailableReason} · ยังเขียน บันทึก และส่งออกร่างด้วยมือได้ตามปกติ
            </p>
          ) : null}
          {proposal ? (
            <>
              <p className="muted">
                ใช้ข้อมูลรุ่น {proposal.data.job_version} · ต้องตรวจความหมายของอ้างอิง
                {proposal.data.model ? ` · โมเดล ${proposal.data.model}` : ''}
              </p>
              <pre>{proposal.data.text}</pre>
              <p>อ้างอิง: {proposal.data.citations.join(', ') || 'ไม่มี'}</p>
              <ul>
                {proposal.data.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
              <div className="proposal-actions">
                <button disabled={proposal.data.job_version !== job.version} onClick={() => operate(async () => accept())}>
                  รับข้อเสนอแทนข้อความส่วนนี้
                </button>
                <button
                  type="button"
                  className="outline"
                  disabled={proposal.data.job_version !== job.version}
                  onClick={() => operate(async () => appendProposal())}
                >
                  แทรกต่อท้ายข้อความเดิม
                </button>
              </div>
              <h4>ข้อความเดิมที่บันทึก</h4>
              <pre>{latest?.data.sections[section] || 'ยังไม่มีข้อความบันทึก'}</pre>
            </>
          ) : (
            <p className="muted">ร่างข้อเสนอจะปรากฏที่นี่ ข้อความมนุษย์ไม่ถูกทับเมื่อขอร่างใหม่</p>
          )}
        </aside>
      </div>
    </>
  );
}

