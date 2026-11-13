'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, emptyInput, inferJobTier, jobStatus, normalizeTierParam, WORKFLOW_STAGES } from './api';
import InputForm from './InputForm';
import Documents from './Documents';
import Analysis from './Analysis';
import Drafts from './Drafts';
import Knowledge from './Knowledge';
import { PERSON_SEARCH_TRANSFER_KEY } from './PersonSearchStandalone';
import { KnowledgeRail } from './components';
import './workbench.css';

const TABS = [
  'ข้อมูลที่ใช้วิเคราะห์',
  'เอกสารประกอบ',
  'ผลวิเคราะห์',
  'ร่างเบื้องต้น',
  'ส่งออก',
  'ฐานอ้างอิง',
];

const TIER_OPTIONS = [
  {
    id: 'general',
    title: 'ระดับ ผบก. ขึ้นไป (ระดับนายพล)',
  },
  {
    id: 'sub_general_to_inspector',
    title: 'ระดับ รอง ผบก. ลงมา (รอง ผบก. – สว.)',
  },
];

function normalizeInputFromJob(jobData) {
  const base = Object.fromEntries(Object.keys(emptyInput).map((k) => [k, jobData?.[k] || '']));
  base.analysis_tier = inferJobTier(jobData || {});
  return base;
}

export default function Workbench({
  initialJobId = null,
  caseId = null,
  initialTier = null,
  canAI = false,
  aiUnavailableReason = null,
  canAttach = false,
}) {
  const defaultTier = normalizeTierParam(initialTier) || 'general';
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState(null);
  const [input, setInput] = useState({
    ...emptyInput,
    analysis_tier: defaultTier,
    unit_type: defaultTier === 'general' ? 'tr_hq' : '',
  });
  const [knowledge, setKnowledge] = useState(null);
  const [knowledgeError, setKnowledgeError] = useState(null);
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [exported, setExported] = useState(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState('');

  const activeTier = input.analysis_tier || inferJobTier(job?.data || input);
  const baselineInput = job
    ? normalizeInputFromJob(job.data)
    : {
        ...emptyInput,
        analysis_tier: activeTier,
        unit_type: activeTier === 'general' ? input.unit_type : input.unit_type,
      };
  const dirty = JSON.stringify(input) !== JSON.stringify(baselineInput);
  const [activeCaseId, setActiveCaseId] = useState(caseId);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(PERSON_SEARCH_TRANSFER_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        window.sessionStorage.removeItem(PERSON_SEARCH_TRANSFER_KEY);
        setInput((prev) => ({
          ...prev,
          title: prev.title || data.title || '',
          subject_name: data.subject_name || prev.subject_name,
          rank_position: data.rank_position || prev.rank_position,
          level: data.level || prev.level,
          account: data.account || prev.account,
          case_summary: data.summaryLine
            ? prev.case_summary
              ? `${prev.case_summary}\n\n${data.summaryLine}`
              : data.summaryLine
            : prev.case_summary,
        }));
        setTab(0);
        if (data.fullNameWithRank) {
          setNotice(
            `ดึงข้อมูลของ ${data.fullNameWithRank} เข้าสู่ฟอร์มวิเคราะห์เรียบร้อยแล้ว — กด "บันทึกข้อมูล" เพื่อเริ่มงานวิเคราะห์`,
          );
        }
        return;
      }
    } catch {
      // Ignore storage errors cleanly
    }
    const nextTier = normalizeTierParam(initialTier);
    if (nextTier && !job) {
      setInput((prev) => ({
        ...prev,
        analysis_tier: nextTier,
        level: '',
        account: '',
        unit_type: nextTier === 'general' ? 'tr_hq' : prev.unit_type === 'tr_hq' ? '' : prev.unit_type,
      }));
      setTab(0);
    }
  }, [initialTier, job]);

  useEffect(() => {
    const guard = (e) => {
      if (!(dirty || draftDirty) || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const dest = new URL(a.href, window.location.href);
      if (dest.origin === window.location.origin && dest.href !== window.location.href) {
        e.preventDefault();
        e.stopPropagation();
        setNotice('บันทึกข้อมูลและร่างก่อนออกจากหน้าวิเคราะห์');
      }
    };
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [dirty, draftDirty]);

  function loaded(j) {
    setActiveCaseId(j.case_id || null);
    setJob(j);
    setInput(normalizeInputFromJob(j.data));
    setTab(0);
    setExported(null);
    setSelectedRevisionId(j.revisions?.[0]?.id || '');
    setDraftDirty(false);
    window.history.replaceState(null, '', '/analysis?job=' + encodeURIComponent(j.id));
  }

  useEffect(() => {
    if (job?.revisions?.length && (!selectedRevisionId || !job.revisions.some((r) => r.id === selectedRevisionId))) {
      setSelectedRevisionId(job.revisions[0].id);
    }
  }, [job?.revisions, selectedRevisionId]);

  async function operate(fn) {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setJobs((await api('/jobs')).jobs);
  }

  useEffect(() => {
    let live = true;
    api('/knowledge')
      .then((k) => live && setKnowledge(k))
      .catch((e) => live && setKnowledgeError(e.message));
    api('/jobs')
      .then((j) => live && setJobs(j.jobs))
      .catch((e) => live && setNotice(e.message));
    if (initialJobId)
      api('/jobs/' + encodeURIComponent(initialJobId))
        .then((j) => live && loaded(j))
        .catch((e) => live && setNotice(e.message));
    else if (caseId)
      api('/case/' + encodeURIComponent(caseId))
        .then((c) =>
          live &&
          setInput({
            ...emptyInput,
            analysis_tier: defaultTier,
            unit_type: defaultTier === 'general' ? 'tr_hq' : '',
            title: c.subject,
            external_case_ref: c.blackNumber,
            subject_name: c.petitionerName,
          }),
        )
        .catch((e) => live && setNotice(e.message));
    return () => {
      live = false;
    };
  }, [initialJobId, caseId, defaultTier]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty || draftDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, draftDirty]);

  function safeSwitch(fn) {
    if (busy) return;
    if (dirty || draftDirty) {
      setNotice('บันทึกข้อมูลและร่างก่อนเปลี่ยนงานหรือขั้นตอน');
      return;
    }
    fn();
  }

  function selectTier(nextTier) {
    if (busy || nextTier === activeTier) return;
    const allAccounts = knowledge?.accounts || [];
    const currentAccountObj = allAccounts.find((a) => a.source_level === input.level);
    const currentLevelTier =
      currentAccountObj?.tier === 'sub_general_to_inspector' ? 'sub_general_to_inspector' : 'general';
    const shouldResetLevel = Boolean(input.level && currentLevelTier !== nextTier);

    setInput({
      ...input,
      analysis_tier: nextTier,
      level: shouldResetLevel ? '' : input.level,
      account: shouldResetLevel ? '' : input.account,
      unit_type: nextTier === 'general' ? 'tr_hq' : input.unit_type === 'tr_hq' ? '' : input.unit_type,
      annex_status: nextTier === 'general' ? '' : input.annex_status,
    });
    if (!job) {
      const qs = nextTier === 'sub_general_to_inspector' ? '?tier=sub_general' : '?tier=general';
      window.history.replaceState(null, '', '/analysis' + qs);
    }
  }

  const save = () =>
    operate(async () => {
      const j = job
        ? await api('/jobs/' + job.id, 'PUT', { ...input, version: job.version })
        : await api('/jobs', 'POST', { ...input, case_id: activeCaseId });
      loaded(j);
      await refresh();
    });

  const exportDraft = (revision) =>
    operate(async () => {
      setExported(await api('/jobs/' + job.id + '/export', 'POST', { revision_id: revision.id }));
    });

  const attach = (revision) =>
    operate(async () => {
      if (!window.confirm('แนบร่างฉบับนี้เข้าสำนวนเดิม โดยไม่เปลี่ยนสถานะคดี ต้องการยืนยันไหม?')) return;
      const r = await api('/jobs/' + job.id + '/attach', 'POST', { revision_id: revision.id, confirmed: true });
      setNotice(
        r.reused ? 'ร่างฉบับนี้แนบในสำนวนแล้ว ไม่แนบซ้ำ' : 'แนบร่างเข้าสำนวนแล้ว รอตรวจโดยผู้รับผิดชอบ',
      );
    });

  const jobWithoutAI = { ...job, proposals: job?.proposals || [] };
  const currentStage = jobStatus(job);
  const currentStageIdx = WORKFLOW_STAGES.indexOf(currentStage);
  const selectedRevision = job?.revisions?.find((r) => r.id === selectedRevisionId) || job?.revisions?.[0] || null;
  const activeTierCard = TIER_OPTIONS.find((c) => c.id === activeTier) || TIER_OPTIONS[0];

  return (
    <section className="analysis-workbench" aria-busy={busy}>
      <header className="page-title">
        <div>
          <p className="brand-eyebrow">พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร. · ระบบวิเคราะห์และร่างคำวินิจฉัยเบื้องต้น</p>
          <h1>วิเคราะห์และร่างคำวินิจฉัยเบื้องต้น</h1>
          <p className="muted">
            โหมดที่เลือก: <strong>{activeTierCard.title}</strong> · ผลทั้งหมดเป็นร่างสำหรับตรวจทาน ·{' '}
            {canAI
              ? 'AI Harness พร้อมใช้งาน (Pseudonymization + Citation Allowlist)'
              : `โหมดร่างด้วยมือ (${aiUnavailableReason || 'AI ปิดใช้งาน'})`}
          </p>
        </div>
        <Link href="/dashboard" className="outline-link">
          กลับ Dashboard
        </Link>
      </header>

      {notice ? (
        <div role="alert" className="notice error">
          {notice}
          <button aria-label="ปิดข้อความ" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      ) : null}
      {knowledgeError ? (
        <p role="alert" className="warning">
          {knowledgeError} — รับข้อมูลและเขียนร่างด้วยตนเองได้ แต่การค้นฐานอ้างอิงและวิเคราะห์ยังไม่พร้อม
        </p>
      ) : null}
      {busy ? <p role="status" className="busy">กำลังดำเนินการ…</p> : null}

      <div className="workflow-pipeline" aria-label="สถานะความคืบหน้าของงานวิเคราะห์">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isCurrent = stage === currentStage;
          const isCompleted = idx < currentStageIdx;
          return (
            <span
              key={stage}
              className={'stage-step' + (isCurrent ? ' current' : isCompleted ? ' completed' : '')}
            >
              <small>{idx + 1}</small> {stage}
            </span>
          );
        })}
      </div>

      <div className="review-form workspace-bar">
        <label className="workspace-select-label">
          เปิดงานวิเคราะห์{' '}
          <select
            aria-label="เลือกงานวิเคราะห์"
            value={job?.id || ''}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              safeSwitch(() => operate(async () => loaded(await api('/jobs/' + encodeURIComponent(id)))));
            }}
          >
            <option value="">เลือกงานที่บันทึกไว้ ({jobs.length} งาน)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </label>
        <div className="tier-inline-toggle" role="group" aria-label="เลือกระดับการวิเคราะห์">
          {TIER_OPTIONS.map((opt) => {
            const isSelected = activeTier === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                className={isSelected ? 'active' : 'outline'}
                onClick={() => selectTier(opt.id)}
              >
                {opt.title}
              </button>
            );
          })}
        </div>
        <div className="workspace-meta">
          {job ? (
            <span className="muted">
              รุ่นข้อมูล #{job.version} · เอกสารตรวจแล้ว {job.documents.filter((d) => d.data.reviewed).length}/
              {job.documents.length} · แหล่งอ้างอิง {(job.data.references || []).length} · ร่างที่บันทึก{' '}
              {job.revisions.length}
            </span>
          ) : null}
          <button
            className="outline"
            disabled={busy}
            onClick={() =>
              safeSwitch(() => {
                setActiveCaseId(null);
                setJob(null);
                setInput({
                  ...emptyInput,
                  analysis_tier: activeTier,
                  unit_type: activeTier === 'general' ? 'tr_hq' : '',
                });
                setTab(0);
                setExported(null);
                const qs = activeTier === 'sub_general_to_inspector' ? '?tier=sub_general' : '?tier=general';
                window.history.replaceState(null, '', '/analysis' + qs);
              })
            }
          >
            สร้างงานใหม่
          </button>
        </div>
      </div>

      {job?.case_id ? (
        <p className="notice">
          เชื่อมสำนวน <Link href={'/cases/' + encodeURIComponent(job.case_id)}>{job.data.external_case_ref}</Link> ·
          สำเนาสำหรับวิเคราะห์ ไม่เปลี่ยนสถานะทางการ
        </p>
      ) : null}

      <nav className="tabs" aria-label="ขั้นตอนวิเคราะห์">
        {TABS.map((name, i) => (
          <button
            key={name}
            disabled={busy || (i > 0 && i < 5 && !job)}
            className={tab === i ? 'active' : ''}
            aria-current={tab === i ? 'step' : undefined}
            onClick={() => safeSwitch(() => setTab(i))}
          >
            {name}
          </button>
        ))}
      </nav>

      <div hidden={tab !== 0}>
        <div className="work-layout">
          <div>
            <div className="section-title">
              <h2>
                {job ? job.title : `ข้อมูลสำหรับงานใหม่ (${activeTierCard.title})`}
              </h2>
              <button disabled={busy} onClick={save}>
                บันทึกข้อมูล
              </button>
            </div>
            <InputForm
              input={input}
              setInput={setInput}
              knowledge={knowledge}
              activeTier={activeTier}
              onSelectTier={selectTier}
            />
          </div>
          <KnowledgeRail
            knowledge={knowledge}
            activeTier={activeTier}
            onOpen={() => safeSwitch(() => setTab(5))}
          />
        </div>
      </div>

      {job ? (
        <div key={job.id}>
          <div hidden={tab !== 1}>
            <Documents job={job} setJob={setJob} operate={operate} />
          </div>
          <div hidden={tab !== 2}>
            {knowledge ? (
              <Analysis
                job={job}
                setJob={setJob}
                operate={operate}
                knowledge={knowledge}
                activeTier={activeTier}
                onSources={() => safeSwitch(() => setTab(5))}
              />
            ) : (
              <p>ฐานอ้างอิงยังไม่พร้อม จึงไม่สร้างผลวิเคราะห์</p>
            )}
          </div>
          <div hidden={tab !== 3}>
            <Drafts
              job={jobWithoutAI}
              setJob={setJob}
              operate={operate}
              onDirty={setDraftDirty}
              canAI={canAI}
              aiUnavailableReason={aiUnavailableReason}
            />
          </div>
          <div hidden={tab !== 4}>
            <h2>ร่างฉบับที่บันทึกและส่งออก</h2>
            <p className="warning">ร่างเบื้องต้น ต้องตรวจข้อเท็จจริง กฎหมาย และแหล่งอ้างอิงก่อนใช้ทุกครั้ง</p>
            {job.revisions.length ? (
              <>
                <div className="search-row">
                  <select
                    aria-label="ฉบับร่างที่จะส่งออก"
                    value={selectedRevision?.id || ''}
                    onChange={(e) => {
                      setSelectedRevisionId(e.target.value);
                      setExported(null);
                    }}
                  >
                    {job.revisions.map((r, i) => (
                      <option key={r.id} value={r.id}>
                        ฉบับที่ {job.revisions.length - i} · {new Date(r.created_at).toLocaleString('th-TH')} ·
                        ข้อมูลรุ่น {r.data.job_version}
                      </option>
                    ))}
                  </select>
                  {selectedRevision ? (
                    <button disabled={busy} onClick={() => exportDraft(selectedRevision)}>
                      สร้างไฟล์ Word
                    </button>
                  ) : null}
                  {selectedRevision && job.case_id && canAttach ? (
                    <button className="outline" disabled={busy} onClick={() => attach(selectedRevision)}>
                      ตรวจและยืนยันแนบร่างเข้าสำนวน
                    </button>
                  ) : null}
                </div>

                {selectedRevision && selectedRevision.data.job_version !== job.version ? (
                  <p className="warning">
                    ฉบับที่เลือกใช้ข้อมูลรุ่นก่อน (รุ่น {selectedRevision.data.job_version} จากปัจจุบันรุ่น {job.version})
                    โปรดตรวจข้อความและรายการอ้างอิงก่อนนำไปใช้
                  </p>
                ) : null}

                {exported ? (
                  <p className="verified">
                    <a href={exported.url}>ดาวน์โหลดร่าง Word</a>
                    <small>SHA-256: {exported.sha256}</small>
                  </p>
                ) : null}

                {selectedRevision ? (
                  <article className="paper-preview" aria-label="ตัวอย่างร่างคำวินิจฉัยเบื้องต้น">
                    <h2>ร่างคำวินิจฉัยเบื้องต้น</h2>
                    <p>
                      <strong>{selectedRevision.data.title}</strong>
                      {selectedRevision.data.external_case_ref
                        ? ` · เลขอ้างอิง ${selectedRevision.data.external_case_ref}`
                        : ''}
                    </p>
                    <small>
                      ฉบับ {selectedRevision.id} · บันทึกเมื่อ{' '}
                      {new Date(selectedRevision.created_at).toLocaleString('th-TH')} · ข้อมูลรุ่น{' '}
                      {selectedRevision.data.job_version}
                    </small>
                    {Object.entries(selectedRevision.data.sections || {}).map(([secName, secText]) => (
                      <section key={secName}>
                        <h3>{secName}</h3>
                        <p className="preserve">{secText || 'ยังไม่มีข้อความ'}</p>
                      </section>
                    ))}
                    <h3>แหล่งอ้างอิงที่แนบในฉบับนี้ ({(selectedRevision.data.references || []).length} รายการ)</h3>
                    <ul>
                      {(selectedRevision.data.references || []).map((ref) => (
                        <li key={ref.id}>
                          [{ref.id}] {ref.label} ({ref.source_pdf || '-'} หน้า {ref.page || '-'}) —{' '}
                          {ref.reviewed ? 'ตรวจข้อความแล้ว' : 'ยังไม่ตรวจ'}
                        </li>
                      ))}
                    </ul>
                    <h3>ข้อมูลที่ยังรอตรวจ ({(selectedRevision.data.gaps || []).length} รายการ)</h3>
                    <ul>
                      {(selectedRevision.data.gaps || []).map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </article>
                ) : null}
              </>
            ) : (
              <p>บันทึกร่างก่อนส่งออก</p>
            )}
          </div>
        </div>
      ) : null}

      <div hidden={tab !== 5}>
        {knowledge ? (
          <Knowledge
            knowledge={knowledge}
            job={job}
            setJob={setJob}
            operate={operate}
            activeTier={activeTier}
          />
        ) : (
          <p>ยังไม่มีฐานอ้างอิงบนเว็บที่ผ่านการตรวจความครบถ้วน</p>
        )}
      </div>
    </section>
  );
}
