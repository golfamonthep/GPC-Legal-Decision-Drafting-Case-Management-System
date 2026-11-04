import React, { useState, useEffect } from 'react';
import { api, inferJobTier, statusLabel } from './api';
import { Field, SourceLink } from './components';

export default function Analysis({ job, setJob, operate, knowledge, activeTier, onSources }) {
  const effectiveTier = activeTier || inferJobTier(job.data || {});
  const isSubGenJob = effectiveTier === 'sub_general_to_inspector';

  const [facts, setFacts] = useState(job.data.facts || []);
  const [manual, setManual] = useState({
    name: job.data.subject_name,
    position: job.data.rank_position,
    level: job.data.level,
    account: job.data.account,
    unit_name: job.data.unit_name || '',
    order: '',
    total_suitable_population: '',
    page: '',
    verified: false,
  });
  const [showManual, setShowManual] = useState(false);
  const [vacancy, setVacancy] = useState({ document_id: '', text: '', page: '', reviewed: false });
  const [quota, setQuota] = useState({
    value: job.data.vacancies?.value ?? '',
    vacancy_reference: job.data.vacancies?.vacancy_reference || '',
    rule_reference: job.data.vacancies?.rule_reference || '',
    applies: Boolean(job.data.vacancies?.applies),
  });

  useEffect(() => {
    setFacts(job.data.facts || []);
  }, [job.data.facts]);

  const result = job.runs[0]?.data;
  const refs = job.data.references || [];
  const evidence = [
    ...refs.filter((r) => r.reviewed && r.role !== 'reference_only'),
    ...job.documents.filter((d) => d.data.reviewed).map((d) => ({ id: 'doc-' + d.id, label: d.name })),
  ];

  const allAccounts = knowledge?.accounts || [];
  const tierAccounts = allAccounts.filter((a) =>
    isSubGenJob ? a.tier === 'sub_general_to_inspector' : a.tier !== 'sub_general_to_inspector',
  );
  const manualLevels = [...new Set((tierAccounts.length ? tierAccounts : allAccounts).map((a) => a.source_level))];

  const selectedManualAccount = allAccounts.find(
    (a) => a.source_level === manual.level && a.source_account === manual.account,
  );
  const isSubGenManual =
    selectedManualAccount?.tier === 'sub_general_to_inspector' ||
    isSubGenJob ||
    /\(เลื่อนจาก|สับเปลี่ยนหมุนเวียน/.test(String(manual.level || ''));

  const saveFacts = () =>
    operate(async () => setJob(await api(`/jobs/${job.id}/facts`, 'POST', { version: job.version, facts })));
  const run = () =>
    operate(async () => {
      if (JSON.stringify(facts) !== JSON.stringify(job.data.facts || [])) {
        setJob(await api(`/jobs/${job.id}/facts`, 'POST', { version: job.version, facts }));
      }
      setJob(await api(`/jobs/${job.id}/analyze`, 'POST', {}));
    });
  const saveManual = () =>
    operate(async () =>
      setJob(
        await api(`/jobs/${job.id}/manual-seniority`, 'POST', {
          ...manual,
          version: job.version,
          order: Number(manual.order),
          total_suitable_population: isSubGenManual
            ? Number(manual.total_suitable_population)
            : Number(selectedManualAccount?.total_suitable_population || 0),
          page: Number(manual.page),
        }),
      ),
    );
  const saveVacancy = () =>
    operate(async () => setJob(await api(`/jobs/${job.id}/vacancy-source`, 'POST', { ...vacancy, version: job.version })));
  const saveQuota = () =>
    operate(async () =>
      setJob(await api(`/jobs/${job.id}/vacancies`, 'POST', { ...quota, version: job.version, value: Number(quota.value) })),
    );
  const updateFact = (i, key, value) => setFacts(facts.map((f, n) => (n === i ? { ...f, [key]: value } : f)));

  const importClaimsAsAssertions = () => {
    const existingTexts = new Set(facts.map((f) => f.text.trim()));
    const lines = [
      ...String(job.data.claim || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `[คำร้อง] ${s}`),
      ...String(job.data.response || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `[คำชี้แจง] ${s}`),
    ].filter((line) => !existingTexts.has(line));
    if (!lines.length) return;
    setFacts([
      ...facts,
      ...lines.map((line) => ({
        id: crypto.randomUUID(),
        text: line,
        status: 'assertion',
        citations: [],
      })),
    ]);
  };

  const establishedCount = facts.filter((f) => f.status === 'established').length;
  const assertionCount = facts.filter((f) => f.status === 'assertion').length;
  const unresolvedCount = facts.filter((f) => f.status === 'unresolved').length;

  return (
    <>
      <div className="analysis-kpi-strip" aria-label="สรุปความพร้อมการวิเคราะห์">
        <div className="kpi-chip">
          <small>แหล่งที่อนุมัติแล้ว</small>
          <strong>{refs.length} แหล่ง</strong>
        </div>
        <div className="kpi-chip">
          <small>ข้อเท็จจริงที่ยืนยัน</small>
          <strong>{establishedCount} รายการ</strong>
        </div>
        <div className="kpi-chip">
          <small>ข้อกล่าวอ้าง / รอยืนยัน</small>
          <strong>{assertionCount + unresolvedCount} รายการ</strong>
        </div>
        <div className="kpi-chip">
          <small>สถานะรอบวิเคราะห์ล่าสุด</small>
          <strong>{result ? statusLabel(result.status) : 'ยังไม่ประมวลผล'}</strong>
        </div>
      </div>

      <div className="section-title">
        <h3>แหล่งที่อนุมัติของงาน</h3>
        <button className="outline" onClick={onSources}>
          ค้นและเพิ่มแหล่ง
        </button>
      </div>
      {refs.length === 0 ? (
        <p className="empty">ยังไม่มีแหล่งที่อนุมัติ</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>หน้า</th>
                <th>ประเภท</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.label}
                    <small>{r.id}</small>
                  </td>
                  <td>
                    {r.document_id && r.kind === 'vacancy' ? (
                      r.page
                    ) : (
                      <SourceLink source={r.source_pdf} page={r.page}>
                        {r.page}
                      </SourceLink>
                    )}
                  </td>
                  <td>
                    {r.role === 'reference_only'
                      ? 'ตัวอย่าง โครง/ภาษาเท่านั้น'
                      : r.kind === 'law'
                        ? 'กฎหมายที่ตรวจแล้ว'
                        : r.kind === 'seniority'
                          ? 'อาวุโสที่ตรวจแล้ว'
                          : r.kind === 'vacancy'
                            ? 'ตำแหน่งว่างจริง'
                            : 'การแต่งตั้งที่ตรวจแล้ว'}
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        operate(async () =>
                          setJob(await api(`/jobs/${job.id}/references`, 'DELETE', { version: job.version, source_id: r.id })),
                        )
                      }
                    >
                      ถอนแหล่ง
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="outline" onClick={() => setShowManual(!showManual)}>
        {showManual
          ? 'ปิดแบบตรวจอาวุโส'
          : isSubGenJob
            ? 'เพิ่ม/ยืนยันข้อมูลอาวุโสภายในหน่วย (ระดับ รอง ผบก. ลงมาถึง สว. · ผนวก ก)'
            : 'เพิ่ม/ยืนยันข้อมูลอาวุโสระดับนายพล (ระดับ ผบก. ขึ้นไป · บัญชีอาวุโสครั้งที่ ๔)'}
      </button>
      {showManual ? (
        <div className="review-form">
          <h3>
            {isSubGenManual
              ? 'ตรวจและยืนยันข้อมูลบัญชีอาวุโสภายในหน่วย (ระดับ รอง ผบก. ลงมาถึง สว. ตาม ม.๘๐, ข้อ ๓๓ และ ว ๒๔๕๖ ผนวก ก)'
              : 'ตรวจและยืนยันข้อมูลบัญชีอาวุโสระดับนายพล (ระดับ ผบก. ขึ้นไป ตาม ม.๗๘, ข้อ ๓๓ บัญชีอาวุโสครั้งที่ ๔)'}
          </h3>
          <SourceLink
            source={isSubGenManual ? 'circular_2456_2569.pdf' : knowledge?.exclusive_seniority_source}
            page={Number(manual.page) || 1}
          />
          <p className="muted">
            {isSubGenManual
              ? 'กรณีระดับ รอง ผบก. ลงมาถึง สว. การเลื่อนตำแหน่งสูงขึ้นทำเฉพาะภายในหน่วย (ม.๘๐) ให้ระบุลำดับอาวุโสและจำนวนผู้เหมาะสมทั้งหมดตามประกาศลำดับอาวุโสของหน่วย (ผนวก ก)'
              : 'กรณีระดับ ผบก. ขึ้นไป (นายพล) ใช้บัญชีอาวุโสครั้งที่ 4 ระดับ ตร. เท่านั้น จำนวนผู้เหมาะสมจะใช้ค่าของระดับและประเภทที่ตรวจแล้ว'}
          </p>
          <div className="form-grid">
            {[
              ['name', 'ชื่อในบัญชี'],
              ['position', 'ยศ / ตำแหน่งในบัญชี'],
            ].map(([k, l]) => (
              <Field key={k} label={l}>
                <input
                  value={manual[k]}
                  onChange={(e) => setManual({ ...manual, [k]: e.target.value, verified: false })}
                />
              </Field>
            ))}
            <Field label={isSubGenManual ? 'ระดับบัญชี (รอง ผบก. ลงมาถึง สว.)' : 'ระดับบัญชี (ระดับ ผบก. ขึ้นไป)'}>
              <select
                value={manual.level}
                onChange={(e) => setManual({ ...manual, level: e.target.value, account: '', verified: false })}
              >
                <option value="">เลือกระดับ</option>
                {manualLevels.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ประเภทบัญชี">
              <select
                value={manual.account}
                onChange={(e) => setManual({ ...manual, account: e.target.value, verified: false })}
              >
                <option value="">เลือกประเภท</option>
                {allAccounts
                  .filter((a) => a.source_level === manual.level)
                  .map((a) => (
                    <option key={a.source_account} value={a.source_account}>
                      {a.source_account}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="ลำดับอาวุโส (x)">
              <input
                type="number"
                min="1"
                value={manual.order}
                onChange={(e) => setManual({ ...manual, order: e.target.value, verified: false })}
              />
            </Field>
            {isSubGenManual ? (
              <>
                <Field label="จำนวนผู้เหมาะสมทั้งหมดในบัญชีของหน่วย (y)">
                  <input
                    type="number"
                    min="1"
                    value={manual.total_suitable_population}
                    placeholder="เช่น 45 (ตามประกาศอาวุโสหน่วย / ผนวก ก)"
                    onChange={(e) =>
                      setManual({ ...manual, total_suitable_population: e.target.value, verified: false })
                    }
                  />
                </Field>
                <Field label="ชื่อหน่วย / สังกัดบัญชีอาวุโส">
                  <input
                    value={manual.unit_name}
                    placeholder="เช่น บช.น., ภ.1, สทส."
                    onChange={(e) => setManual({ ...manual, unit_name: e.target.value, verified: false })}
                  />
                </Field>
              </>
            ) : null}
            <Field label="หน้า PDF อ้างอิง">
              <input
                type="number"
                min="1"
                value={manual.page}
                onChange={(e) => setManual({ ...manual, page: e.target.value, verified: false })}
              />
            </Field>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={manual.verified}
              onChange={(e) => setManual({ ...manual, verified: e.target.checked })}
            />
            ตรวจชื่อ ยศ ตำแหน่ง ลำดับ จำนวนผู้เหมาะสม และหน้าเอกสารอ้างอิงแล้ว
          </label>
          <button onClick={saveManual} disabled={!manual.verified}>
            บันทึกผลตรวจอาวุโส
          </button>
        </div>
      ) : null}

      <div className="section-title">
        <h3>ข้อกล่าวอ้างและข้อเท็จจริง</h3>
        <div className="actions">
          <button
            type="button"
            className="outline"
            disabled={!job.data.claim && !job.data.response}
            onClick={importClaimsAsAssertions}
          >
            นำเข้าย่อหน้าจากคำร้อง/คำชี้แจง
          </button>
          <button
            className="outline"
            onClick={() => setFacts([...facts, { id: crypto.randomUUID(), text: '', status: 'assertion', citations: [] }])}
          >
            เพิ่มรายการ
          </button>
        </div>
      </div>
      <p className="muted">
        คำร้องและคำชี้แจงเริ่มเป็นข้อกล่าวอ้าง ยืนยันเป็นข้อเท็จจริงเมื่อมีหลักฐานที่ตรวจแล้วเท่านั้น (กด Ctrl/Cmd ค้างเพื่อเลือกหลายแหล่ง)
      </p>
      {facts.map((f, i) => (
        <div className="fact-row" key={f.id}>
          <textarea
            aria-label={`ข้อความรายการ ${i + 1}`}
            rows="2"
            value={f.text}
            onChange={(e) => updateFact(i, 'text', e.target.value)}
          />
          <select
            aria-label={`สถานะรายการ ${i + 1}`}
            value={f.status}
            onChange={(e) => updateFact(i, 'status', e.target.value)}
          >
            <option value="assertion">ข้อกล่าวอ้าง</option>
            <option value="established">ยืนยันจากหลักฐาน</option>
            <option value="unresolved">ยังไม่ยืนยัน</option>
          </select>
          <select
            aria-label={`หลักฐานรายการ ${i + 1}`}
            multiple
            value={f.citations}
            onChange={(e) =>
              updateFact(
                i,
                'citations',
                [...e.target.selectedOptions].map((o) => o.value),
              )
            }
          >
            {evidence.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button className="text-button" onClick={() => setFacts(facts.filter((_, n) => n !== i))}>
            ลบ
          </button>
        </div>
      ))}
      {facts.length ? (
        <button className="outline" onClick={saveFacts}>
          บันทึกตารางข้อเท็จจริง
        </button>
      ) : null}

      <details className="review-form">
        <summary>
          {isSubGenJob
            ? 'ตำแหน่งว่างจริงภายในหน่วย และหลักเกณฑ์สัดส่วนอาวุโสระดับ รอง ผบก. ลงมาถึง สว. (ร้อยละ ๓๓ ตาม ม.๘๒(๓), ข้อ ๔๗(๓))'
            : 'ตำแหน่งว่างจริงระดับ ตร. และหลักเกณฑ์สัดส่วนอาวุโสระดับ ผบก. ขึ้นไป (ร้อยละ ๕๐ ตาม ม.๘๒(๒), ข้อ ๔๗(๒) / ร้อยละ ๑๐๐ ตาม ม.๘๒(๑))'}
        </summary>
        <p className="muted">
          {isSubGenJob
            ? 'ระดับ รอง ผบก. ลงมาถึง สว. ใช้จำนวนตำแหน่งว่างในแต่ละระดับของหน่วยนั้น คำนวณกลุ่มอาวุโสไม่น้อยกว่าร้อยละ ๓๓ (x × 0.33) และกลุ่มความรู้ความสามารถร้อยละ ๖๗ — ต้องอ้างอิงเอกสารตำแหน่งว่างที่ตรวจแล้ว'
            : 'ระดับ ผบก. ขึ้นไป (ผบช. ลงมาถึง ผบก.) ใช้จำนวนตำแหน่งว่างในแต่ละระดับในภาพรวม ตร. คำนวณกลุ่มอาวุโสไม่น้อยกว่าร้อยละ ๕๐ (x × 0.50) (ส่วน รอง ผบ.ตร. และ ผู้ช่วย ผบ.ตร. ใช้ร้อยละ ๑๐๐) — ต้องอ้างอิงเอกสารตำแหน่งว่างที่ตรวจแล้ว'}
        </p>
        <div className="form-grid">
          <Field label="เอกสารตำแหน่งว่างจริง">
            <select
              value={vacancy.document_id}
              onChange={(e) => setVacancy({ ...vacancy, document_id: e.target.value })}
            >
              <option value="">เลือกเอกสารที่ตรวจแล้ว</option>
              {job.documents
                .filter((d) => d.data.reviewed)
                .map((d) => (
                  <option value={'doc-' + d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="หน้า / ชีตและเซลล์">
            <input value={vacancy.page} onChange={(e) => setVacancy({ ...vacancy, page: e.target.value })} />
          </Field>
          <Field wide label="ข้อความแหล่งที่ยืนยันจำนวนตำแหน่งว่าง">
            <textarea
              value={vacancy.text}
              onChange={(e) => setVacancy({ ...vacancy, text: e.target.value, reviewed: false })}
            />
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={vacancy.reviewed}
            onChange={(e) => setVacancy({ ...vacancy, reviewed: e.target.checked })}
          />
          ตรวจจากเอกสารแล้ว
        </label>
        <button className="outline" onClick={saveVacancy}>
          บันทึกแหล่งตำแหน่งว่าง
        </button>

        <div className="form-grid">
          <Field label="จำนวนตำแหน่งว่างจริง">
            <input
              type="number"
              min="0"
              value={quota.value}
              onChange={(e) => setQuota({ ...quota, value: e.target.value })}
            />
          </Field>
          <Field label="แหล่งตำแหน่งว่าง">
            <select
              value={quota.vacancy_reference}
              onChange={(e) => setQuota({ ...quota, vacancy_reference: e.target.value })}
            >
              <option value="">เลือกแหล่ง</option>
              {refs
                .filter((r) => r.kind === 'vacancy')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </Field>
          <Field wide label="หลักเกณฑ์ที่ใช้กับกรณีนี้">
            <select value={quota.rule_reference} onChange={(e) => setQuota({ ...quota, rule_reference: e.target.value })}>
              <option value="">เลือกกฎหมายที่ตรวจแล้ว</option>
              {refs
                .filter((r) => r.kind === 'law')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={quota.applies}
            onChange={(e) => setQuota({ ...quota, applies: e.target.checked })}
          />
          ตรวจว่าหลักเกณฑ์สัดส่วนอาวุโสใช้กับระดับ/กรณีนี้ และจำนวนตรงกับแหล่ง
        </label>
        <button className="outline" onClick={saveQuota}>
          บันทึกเงื่อนไขคำนวณ
        </button>
      </details>

      <div className="section-title">
        <h3>ผลตรวจข้อมูลสำหรับวิเคราะห์</h3>
        <button onClick={run}>ตรวจข้อมูลและสร้างผลวิเคราะห์</button>
      </div>
      {result ? (
        <>
          <p>
            {statusLabel(result.status)} · รุ่นข้อมูล {result.job_version} · ขอบเขต:{' '}
            <strong>
              {result.is_sub_general
                ? 'ระดับที่ ๒: ระดับ รอง ผบก. ลงมาถึง สว. (พ.ร.บ.ฯ ม.๗๗(๗)–(๑๐), ๗๙, ๘๐, ๘๒(๓) · กฎ ก.ตร.ฯ ข้อ ๔๗(๓) · ว ๒๔๕๖)'
                : 'ระดับที่ ๑: ระดับ ผบก. ขึ้นไป หรือระดับนายพล (พ.ร.บ.ฯ ม.๗๗(๑)–(๖), ๗๘, ๘๑(๑)(ก), ๘๒(๑)–(๒) · กฎ ก.ตร.ฯ ข้อ ๔๗(๑)–(๒))'}
            </strong>
            {result.job_version !== job.version ? (
              <strong className="warning-inline"> · ข้อมูลเปลี่ยนแล้ว กรุณาตรวจใหม่</strong>
            ) : null}
          </p>
          {result.person ? (
            <p className="verified">
              {result.person.label || result.person.name} · ลำดับที่ {result.person.seniority_order} จากทั้งหมด{' '}
              {result.person.total_suitable_population}
              {result.person.unit_name ? ` (${result.person.unit_name})` : ''} · หน้า{' '}
              {result.person.page || result.person.source_pdf_page}
            </p>
          ) : null}
          {result.quota ? (
            <p className="verified">
              ตำแหน่งว่างจริง {result.quota.actual_vacancies} · กลุ่มอาวุโส {result.quota.seniority_quota} ·
              กลุ่มความรู้/ความสามารถ {result.quota.knowledge_ability_quota}
              <small>
                สูตร {result.quota.formula}
                {result.quota.statutory_ref ? ` · อ้างอิง ${result.quota.statutory_ref}` : ''}
              </small>
            </p>
          ) : null}
          {(result.person_candidates || result.candidates || []).length > 1 && !result.person ? (
            <div className="review-form">
              <h4>พบข้อมูลอาวุโสในชุด 181 รายที่ชื่อตรงกันหลายรายการ</h4>
              <p className="muted">โปรดเปิดแท็บฐานอ้างอิงเพื่อตรวจและอนุมัติรายการที่ตรงกับบุคคลของงาน</p>
              <ul>
                {(result.person_candidates || result.candidates || []).map((c) => (
                  <li key={c.id}>
                    {c.source_name} · {c.source_level} / {c.source_account} · ลำดับที่ {c.seniority_order} (หน้า PDF{' '}
                    {c.source_pdf_page})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.rule_checks?.length ? (
            <div className="review-form" aria-label="ผลการตรวจสอบหลักเกณฑ์ตามระดับตำแหน่ง">
              <h4>
                หลักเกณฑ์และประเด็นที่ต้องตรวจสอบตามระดับตำแหน่ง (
                {result.is_sub_general ? 'ระดับ รอง ผบก. ลงมาถึง สว.' : 'ระดับ ผบก. ขึ้นไป / นายพล'})
              </h4>
              <ul>
                {result.rule_checks.map((rc) => (
                  <li key={rc.id}>
                    <strong>[{rc.clause}] {rc.title}:</strong> {rc.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul className="gap-list">
            {result.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
          {result.claims.map((c) => (
            <div className="claim" key={c.id}>
              <strong>ข้อกล่าวอ้าง</strong>
              <p>{c.text}</p>
            </div>
          ))}
        </>
      ) : (
        <p className="empty">ยังไม่มีรอบตรวจข้อมูล ระบบจะระบุข้อมูลที่ขาดก่อนร่าง</p>
      )}
    </>
  );
}
