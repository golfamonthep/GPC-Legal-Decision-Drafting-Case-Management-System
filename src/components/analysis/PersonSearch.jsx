'use client';
import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';

const GENERAL_LEVELS = [
  'ผบช. / จตร. / เทียบเท่า',
  'รอง ผบช. / รอง จตร. / เทียบเท่า',
  'รอง ผบช. / เทียบเท่า',
  'ผบก. / เทียบเท่า',
  'รอง ผบก. / เทียบเท่า',
];

const QUICK_SAMPLE_NAMES = [
  { label: 'พล.ต.ท. สันติ ชัยนิรามัย (ผบช. ลำดับ 1)', name: 'สันติ ชัยนิรามัย' },
  { label: 'พล.ต.ท. อาชยน ไกรทอง (ผบช. ลำดับ 3 · เกิดหลัง 30 ก.ย.)', name: 'อาชยน ไกรทอง' },
  { label: 'พล.ต.ต. พิทักษ์ อุทัยธรรม (รอง ผบช. ลำดับ 3)', name: 'พิทักษ์ อุทัยธรรม' },
  { label: 'พล.ต.ต. โชคชัย งามวงศ์ (รอง ผบช. ลำดับ 2)', name: 'โชคชัย งามวงศ์' },
  { label: 'พล.ต.ต. คธา เกษรมาลา (ผบก. ลำดับ 1)', name: 'คธา เกษรมาลา' },
  { label: 'พ.ต.อ. อภิชิต สุรพินิจ (รอง ผบก. ลำดับ 1)', name: 'อภิชิต สุรพินิจ' },
];

export default function PersonSearch({ onApplyToAnalysis }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [account, setAccount] = useState('');
  const [order, setOrder] = useState('');
  const [tenureDate, setTenureDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [previousPosition, setPreviousPosition] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  async function runSearch(overrideParams = {}) {
    setLoading(true);
    setError(null);
    try {
      const qVal = overrideParams.q !== undefined ? overrideParams.q : query;
      const lvlVal = overrideParams.level !== undefined ? overrideParams.level : level;
      const accVal = overrideParams.account !== undefined ? overrideParams.account : account;
      const ordVal = overrideParams.order !== undefined ? overrideParams.order : order;
      const tenVal = overrideParams.tenure_date !== undefined ? overrideParams.tenure_date : tenureDate;
      const bthVal = overrideParams.birth_date !== undefined ? overrideParams.birth_date : birthDate;
      const curPosVal = overrideParams.current_position !== undefined ? overrideParams.current_position : currentPosition;
      const prvPosVal = overrideParams.previous_position !== undefined ? overrideParams.previous_position : previousPosition;

      const qs = new URLSearchParams();
      if (qVal) qs.set('q', qVal);
      if (lvlVal) qs.set('level', lvlVal);
      if (accVal) qs.set('account', accVal);
      if (ordVal) qs.set('order', String(ordVal));
      if (tenVal) qs.set('tenure_date', tenVal);
      if (bthVal) qs.set('birth_date', bthVal);
      if (curPosVal) qs.set('current_position', curPosVal);
      if (prvPosVal) qs.set('previous_position', prvPosVal);

      const data = await api('/knowledge/person-search?' + qs.toString());
      setResult(data);
    } catch (e) {
      setError(e.message || 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch({ q: 'อาชยน ไกรทอง' });
    setQuery('อาชยน ไกรทอง');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSuggestion(item) {
    setQuery(item.name);
    setLevel('');
    setAccount('');
    setOrder('');
    setTenureDate('');
    setBirthDate('');
    setCurrentPosition('');
    setPreviousPosition('');
    runSearch({
      q: item.name,
      level: '',
      account: '',
      order: '',
      tenure_date: '',
      birth_date: '',
      current_position: '',
      previous_position: '',
    });
  }

  function handlePrintPdf() {
    if (!result?.profile) return;
    const p = result.profile;
    const comp = p.comparison || {};
    const juniors = comp.juniorPromotedOfficers || [];

    const printWindow = window.open('', '_blank', 'width=1024,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const juniorRowsHtml = juniors.length
      ? juniors
          .map(
            (j, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="font-weight:700;">${j.fullNameWithRank || j.name}</td>
            <td style="text-align:center;font-weight:700;color:#991b1b;">ลำดับที่ ${j.seniorityOrder}${j.totalSuitablePopulation ? ` / ${j.totalSuitablePopulation}` : ''}</td>
            <td style="text-align:center;">อาวุโสน้อยกว่า ${j.orderGap} ลำดับ</td>
            <td>${j.currentPosition || '-'}</td>
            <td style="font-weight:600;color:#1e3a8a;">${j.newPosition || '-'}</td>
            <td style="text-align:center;">${j.currentPositionDateThai || j.currentPositionDate || '-'}</td>
            <td style="text-align:center;">${j.retirementYearBE ? `พ.ศ. ${j.retirementYearBE}${j.bornAfterSep30 ? ' (+1 ปี)' : ''}` : '-'}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="8" style="text-align:center;padding:16px;">ไม่ปรากฏผู้ที่อาวุโสน้อยกว่าได้รับการเลื่อนตำแหน่งสูงขึ้นในบัญชีนี้</td></tr>`;

    const timelineHtml = (p.rankTimeline || [])
      .map(
        (t) =>
          `<span style="display:inline-block;margin:2px 6px 2px 0;padding:3px 8px;border:1px solid #cbd5e1;border-radius:4px;background:#f8fafc;font-size:12px;"><strong>${t.levelLabel}:</strong> ${t.dateThai}</span>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>รายงานตรวจสอบข้อมูลอาวุโสและการแต่งตั้ง - ${p.fullNameWithRank}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    body { font-family: 'Sarabun', sans-serif; color: #0f172a; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #991b1b; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 18px; color: #7f1d1d; }
    .header p { margin: 2px 0 0; font-size: 12px; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #ffffff; }
    .card-label { font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; }
    .card-val { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .card-sub { font-size: 12px; color: #334155; margin-top: 2px; }
    .highlight-box { border: 1.5px solid #991b1b; background: #fef2f2; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
    .highlight-box h2 { margin: 0 0 4px; font-size: 15px; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; color: #0f172a; }
    .footer { margin-top: 16px; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>รายงานการตรวจสอบข้อมูลประวัติ อาวุโส และการเปรียบเทียบคำสั่งแต่งตั้ง</h1>
      <p>พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร. · ประมวลผลจากฐานข้อมูลในเครื่อง (Zero-API-Cost)</p>
    </div>
    <div style="text-align:right;font-size:11px;color:#475569;">
      วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">๑. ชื่อ – นามสกุล และสถานะ</div>
      <div class="card-val">${p.fullNameWithRank}</div>
      <div class="card-sub">ระดับบัญชี: <strong>${p.sourceLevel}</strong> (สายงาน${p.sourceAccount}) · ${p.appointmentType}</div>
    </div>
    <div class="card">
      <div class="card-label">๒. ลำดับอาวุโสในบัญชี</div>
      <div class="card-val" style="color:#1e40af;">${p.seniorityDisplay}</div>
      <div class="card-sub">${p.previousOrder ? `ลำดับอาวุโสเดิม: ${p.previousOrder} · ` : ''}${p.seniorityPdfPage ? `อ้างอิงไฟล์บัญชีอาวุโส หน้า ${p.seniorityPdfPage}` : 'ระบุลำดับเพื่อเปรียบเทียบ'}</div>
    </div>
    <div class="card">
      <div class="card-label">๓. ตำแหน่งปัจจุบัน และตำแหน่งก่อนหน้า</div>
      <div class="card-val">${p.currentPosition || '-'}</div>
      <div class="card-sub"><strong>ตำแหน่งก่อนหน้า:</strong> ${p.previousPosition || '-'}</div>
      ${p.isPromotedInOrder2569 ? `<div class="card-sub" style="color:#15803d;"><strong>ตำแหน่งใหม่ที่ได้รับแต่งตั้ง:</strong> ${p.newPosition} (ข้อที่ ${p.appointmentNumber || '-'})</div>` : ''}
    </div>
    <div class="card">
      <div class="card-label">๔. ดำรงตำแหน่งปัจจุบันมาแล้วกี่ปี</div>
      <div class="card-val">${p.tenure?.tenureDisplay || '-'}</div>
      <div class="card-sub">วันเริ่มดำรงตำแหน่งระดับปัจจุบัน: <strong>${p.tenure?.currentPositionDateThai || p.tenure?.currentPositionDate || '-'}</strong></div>
    </div>
    <div class="card">
      <div class="card-label">๕. ครบหลักเกณฑ์เลื่อนตำแหน่งสูงขึ้นมาแล้วกี่ปี</div>
      <div class="card-val" style="color:#047857;">${p.tenure?.eligibilityDisplay || '-'}</div>
      <div class="card-sub">${p.tenure?.legalBasis || ''}</div>
    </div>
    <div class="card">
      <div class="card-label">๖. วันเดือนปีเกิด และปีครบเกษียณอายุราชการ (๖๐ ปี)</div>
      <div class="card-val" style="color:#7c2d12;">${p.retirement ? `ครบเกษียณ พ.ศ. ${p.retirement.retirementYearBE}` : 'ไม่ปรากฏข้อมูลวันเกิด'}</div>
      <div class="card-sub">${p.retirement ? `เกิดวันที่ ${p.retirement.birthDateThai} ${p.retirement.bornAfterSep30 ? '(เกิดหลัง 30 ก.ย. ได้บวกปีเกษียณเพิ่ม +1 ปี)' : '(เกิดภายใน 30 ก.ย. คำนวณปีเกษียณปกติ)'} · เหลืออายุราชการ ${p.retirement.remainingYearsFrom2569} ปี` : '-'}</div>
    </div>
  </div>

  ${timelineHtml ? `<div style="margin-bottom:12px;"><strong>ประวัติวันดำรงตำแหน่งในแต่ละระดับ (จากบัญชีอาวุโส):</strong><div style="margin-top:4px;">${timelineHtml}</div></div>` : ''}

  <div class="highlight-box">
    <h2>๗. ผลการคำนวณเปรียบเทียบ: ผู้อาวุโสน้อยกว่าที่ได้รับการเลื่อนตำแหน่งสูงขึ้น (${comp.juniorPromotedCount || 0} คน)</h2>
    <p style="margin:0;font-size:12.5px;">${comp.summaryText || ''}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center;">ที่</th>
        <th>ยศ ชื่อ – นามสกุล</th>
        <th style="width:95px;text-align:center;">ลำดับอาวุโส</th>
        <th style="width:110px;text-align:center;">ส่วนต่างอาวุโส</th>
        <th>ตำแหน่งเดิม</th>
        <th>ตำแหน่งใหม่ที่ได้รับเลื่อนสูงขึ้น</th>
        <th style="width:85px;text-align:center;">วันครองระดับ</th>
        <th style="width:90px;text-align:center;">ปีครบเกษียณ</th>
      </tr>
    </thead>
    <tbody>
      ${juniorRowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>แหล่งข้อมูล: ฐานข้อมูลบัญชีอาวุโสและคำสั่งแต่งตั้งข้าราชการตำรวจ วาระประจำปี พ.ศ. ๒๕๖๙</span>
    <span>ระบบวิเคราะห์และร่างคำวินิจฉัยเบื้องต้น ก.พ.ค.ตร.</span>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const p = result?.profile;
  const comp = p?.comparison || {};
  const juniors = comp.juniorPromotedOfficers || [];

  return (
    <div className="person-search-panel">
      <div className="person-search-header-box">
        <div>
          <span className="zero-api-badge">ประมวลผลจากฐานข้อมูลในเครื่อง 100% · ประหยัดงบ (0 API)</span>
          <h2>ค้นหาประวัติ อาวุโส วันเกษียณ และเปรียบเทียบผู้ได้รับเลื่อนตำแหน่งสูงขึ้น</h2>
          <p className="muted">
            १. กรอกชื่อข้าราชการตำรวจ หรือระบุลำดับอาวุโส → ๒. กดค้นหา → ๓. ระบบคำนวณระยะเวลาครองตำแหน่ง
            ระยะเวลาที่ครบเกณฑ์เลื่อนสูงขึ้น ปีเกษียณอายุราชการ (เกิดหลัง 30 ก.ย. +1 ปี) และรายชื่อผู้อาวุโสน้อยกว่าที่ได้รับเลื่อนตำแหน่งสูงขึ้นทันทีพร้อมดาวน์โหลด PDF
          </p>
        </div>
        {p ? (
          <div className="person-search-actions">
            <button type="button" className="pdf-download-btn" onClick={handlePrintPdf}>
              ดาวน์โหลดรายงาน PDF / พิมพ์
            </button>
            {onApplyToAnalysis ? (
              <button
                type="button"
                className="outline"
                onClick={() => onApplyToAnalysis(p)}
              >
                นำข้อมูลไปสร้างงานวิเคราะห์ต่อ
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Step 1 & 2: Search Bar */}
      <form
        className="person-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="person-search-main-row">
          <label className="person-search-input-wrap">
            <span>๑. กรอกชื่อ – นามสกุล ข้าราชการตำรวจ</span>
            <input
              type="search"
              placeholder="พิมพ์ชื่อ หรือ นามสกุล เช่น อาชยน ไกรทอง, พิทักษ์ อุทัยธรรม, คธา เกษรมาลา..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button type="submit" className="person-search-submit-btn" disabled={loading}>
            {loading ? 'กำลังค้นหา…' : '๒. ค้นหาและคำนวณทันที'}
          </button>
          <button
            type="button"
            className="outline"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? 'ซ่อนตัวเลือกจำลองข้อมูลผู้ร้อง' : 'กรณีค้นชื่อผู้ร้องที่ไม่ติดคำสั่ง / จำลองลำดับอาวุโส'}
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="person-search-chips">
          <small>ตัวอย่างรายชื่อในฐานข้อมูล:</small>
          {QUICK_SAMPLE_NAMES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              className={'chip-btn' + (query === sample.name ? ' active' : '')}
              onClick={() => selectSuggestion({ name: sample.name })}
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Optional Override / Non-promoted Complainant Simulation */}
        {showAdvanced ? (
          <div className="person-search-advanced-grid">
            <label>
              ระดับบัญชีอาวุโสที่ใช้เปรียบเทียบ
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">-- อัตโนมัติตามฐานข้อมูล --</option>
                {GENERAL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </label>
            <label>
              ประเภทบัญชี / สายงาน
              <select value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="">-- อัตโนมัติ (ทั่วไป) --</option>
                <option value="ทั่วไป">ทั่วไป</option>
                <option value="แพทย์">แพทย์</option>
                <option value="นิติวิทยาศาสตร์">นิติวิทยาศาสตร์</option>
                <option value="พิสูจน์หลักฐาน">พิสูจน์หลักฐาน</option>
                <option value="ตรวจสอบบัญชี">ตรวจสอบบัญชี</option>
                <option value="อาจารย์">อาจารย์</option>
                <option value="พยาบาล">พยาบาล</option>
                <option value="ทางน้ำ">ทางน้ำ</option>
              </select>
            </label>
            <label>
              ลำดับอาวุโสที่ (จะดึงวันเกิด/วันครองตำแหน่งจากหน้าบัญชีอัตโนมัติ)
              <input
                type="number"
                min="1"
                max="610"
                placeholder="เช่น 15"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </label>
            <label>
              วันดำรงตำแหน่งปัจจุบัน (ว/ด/พ.ศ. ถ้าต้องการระบุเอง)
              <input
                type="text"
                placeholder="เช่น 1/10/2564"
                value={tenureDate}
                onChange={(e) => setTenureDate(e.target.value)}
              />
            </label>
            <label>
              วันเดือนปีเกิด (ว/ด/พ.ศ. ถ้าต้องการระบุเอง)
              <input
                type="text"
                placeholder="เช่น 7/10/2513"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label>
              ตำแหน่งปัจจุบัน (ถ้าต้องการระบุเอง)
              <input
                type="text"
                placeholder="เช่น รอง ผบช.ภ.1"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </form>

      {error ? (
        <p role="alert" className="warning">
          {error}
        </p>
      ) : null}

      {/* Matching suggestions when multiple names match */}
      {result?.suggestions?.length > 1 ? (
        <div className="person-suggestions-bar">
          <strong>ผลการค้นหาที่ใกล้เคียง ({result.suggestions.length} รายการ):</strong>
          <div className="person-suggestions-list">
            {result.suggestions.slice(0, 10).map((s) => (
              <button
                key={`${s.name}-${s.appointmentNumber || s.seniorityOrder}`}
                type="button"
                className={'chip-btn' + (p?.name === s.name ? ' active' : '')}
                onClick={() => selectSuggestion(s)}
              >
                {s.fullNameWithRank} ({s.currentPosition || s.sourceLevel}
                {s.seniorityOrder ? ` · อาวุโส ${s.seniorityOrder}` : ''})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Step 3: Results Presentation (Bento Cards + Comparison Table) */}
      {p ? (
        <div ref={reportRef} className="person-result-container">
          <div className="person-profile-banner">
            <div>
              <div className="person-profile-badges">
                <span className="badge-tier">{p.sourceLevel} · บัญชี{p.sourceAccount}</span>
                <span className={p.isPromotedInOrder2569 ? 'badge-promoted' : 'badge-complainant'}>
                  {p.appointmentType}
                </span>
                {p.seniorityPdfPage ? (
                  <a
                    className="badge-link"
                    href={`/api/analysis/knowledge/source?name=seniority_2569_round4_2026-08-07_CURRENT.pdf#page=${p.seniorityPdfPage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิดไฟล์ PDF บัญชีอาวุโส หน้า {p.seniorityPdfPage}
                  </a>
                ) : null}
                {p.appointmentPdfPage ? (
                  <a
                    className="badge-link"
                    href={`/api/analysis/knowledge/source?name=appointments_2569.pdf#page=${p.appointmentPdfPage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิดไฟล์ PDF คำสั่งแต่งตั้ง หน้า {p.appointmentPdfPage} (ข้อ {p.appointmentNumber})
                  </a>
                ) : null}
              </div>
              <h3 className="person-profile-name">{p.fullNameWithRank}</h3>
            </div>
            <div className="person-profile-order-box">
              <small>ลำดับอาวุโสที่</small>
              <strong>
                {p.seniorityOrder ? `${p.seniorityOrder}` : '-'}
                {p.totalSuitablePopulation ? <span> / {p.totalSuitablePopulation}</span> : null}
              </strong>
              {p.previousOrder ? <small>ลำดับอาวุโสเดิม: {p.previousOrder}</small> : null}
            </div>
          </div>

          {/* 6 Structured Info Blocks matching user requirements */}
          <div className="person-bento-grid">
            <div className="person-bento-card">
              <span className="bento-label">๑. ชื่อ – นามสกุล และตำแหน่งปัจจุบัน</span>
              <strong className="bento-value">{p.currentPosition || '-'}</strong>
              <p className="bento-sub">
                <strong>ชื่อ-สกุล:</strong> {p.fullNameWithRank}
              </p>
              {p.isPromotedInOrder2569 ? (
                <p className="bento-sub highlight-blue">
                  <strong>ตำแหน่งใหม่ที่ได้รับแต่งตั้ง:</strong> {p.newPosition}
                </p>
              ) : null}
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๒. ตำแหน่งก่อนหน้า / ระดับก่อนหน้า</span>
              <strong className="bento-value">{p.previousPosition || '-'}</strong>
              <p className="bento-sub">
                {p.previousPositionDateThai
                  ? `วันเริ่มดำรงตำแหน่งระดับก่อนหน้า: ${p.previousPositionDateThai}`
                  : 'ดึงจากคอลัมน์ประวัติการดำรงตำแหน่งในบัญชีอาวุโส'}
              </p>
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๓. ดำรงตำแหน่งปัจจุบันมาแล้วกี่ปี</span>
              <strong className="bento-value">{p.tenure?.tenureDisplay || '-'}</strong>
              <p className="bento-sub">
                วันเริ่มดำรงตำแหน่งปัจจุบัน: <strong>{p.tenure?.currentPositionDateThai || '-'}</strong> (คำนวณถึงวาระประจำปี พ.ศ. ๒๕๖๙)
              </p>
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๔. ครบหลักเกณฑ์เลื่อนตำแหน่งสูงขึ้นมาแล้วกี่ปี</span>
              <strong className="bento-value highlight-green">{p.tenure?.eligibilityDisplay || '-'}</strong>
              <p className="bento-sub">{p.tenure?.legalBasis}</p>
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๕. ลำดับอาวุโสที่</span>
              <strong className="bento-value highlight-blue">{p.seniorityDisplay}</strong>
              <p className="bento-sub">
                ระดับ {p.sourceLevel} (บัญชี{p.sourceAccount})
                {p.previousOrder ? ` · ลำดับเดิม ${p.previousOrder}` : ''}
              </p>
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๖. วันเกิด และปีครบเกษียณอายุราชการ (๖๐ ปี)</span>
              <strong className="bento-value highlight-amber">
                {p.retirement ? `ครบเกษียณ พ.ศ. ${p.retirement.retirementYearBE}` : 'ไม่ปรากฏข้อมูลวันเกิด'}
              </strong>
              <p className="bento-sub">
                {p.retirement ? (
                  <>
                    วันเกิด: <strong>{p.retirement.birthDateThai}</strong>{' '}
                    {p.retirement.bornAfterSep30 ? (
                      <span className="after-sep30-tag">เกิดหลัง 30 ก.ย. ได้บวกปีเกษียณเพิ่ม +1 ปี</span>
                    ) : (
                      <span>(เกิดภายใน 30 ก.ย. คำนวณ +60 ปีปกติ)</span>
                    )}{' '}
                    · เหลืออายุราชการอีก {p.retirement.remainingYearsFrom2569} ปี
                  </>
                ) : (
                  'สามารถกรอกวันเกิดเพิ่มเติมในช่องตัวเลือกได้'
                )}
              </p>
            </div>
          </div>

          {/* Rank History Timeline from Seniority Table */}
          {p.rankTimeline?.length > 0 ? (
            <div className="person-timeline-box">
              <strong>ประวัติวันดำรงตำแหน่งแต่ละระดับ (สกัดจากคอลัมน์วันที่ในบัญชีอาวุโส):</strong>
              <div className="person-timeline-pills">
                {p.rankTimeline.map((item) => (
                  <span key={`${item.step}-${item.levelLabel}`} className="timeline-pill">
                    <small>{item.levelLabel}</small> <strong>{item.dateThai}</strong>
                  </span>
                ))}
                {p.retirement ? (
                  <span className="timeline-pill birth-pill">
                    <small>วันเกิด (คอลัมน์ท้ายสุด)</small> <strong>{p.retirement.birthDateThai}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Comparison Summary & Table of Junior Promoted Officers */}
          <div className="person-comparison-section">
            <div className="person-comparison-summary-head">
              <div>
                <h3>
                  สรุปผลเปรียบเทียบคำสั่งแต่งตั้งเลื่อนตำแหน่งสูงขึ้น: มีผู้อาวุโสน้อยกว่าได้รับเลื่อนตำแหน่งสูงขึ้น{' '}
                  <span className="junior-count-highlight">{comp.juniorPromotedCount || 0} คน</span>
                </h3>
                <p>{comp.summaryText}</p>
              </div>
              <div className="comparison-stat-pills">
                <span>ผู้มีรายชื่อในบัญชีทั้งหมด: <strong>{comp.totalSuitablePopulation || '-'} ราย</strong></span>
                <span>ได้เลื่อนตำแหน่งสูงขึ้นในบัญชีนี้: <strong>{comp.totalPromotedInAccount || 0} ราย</strong></span>
                <span className="stat-danger">
                  อาวุโสน้อยกว่าที่ได้เลื่อนสูงขึ้น: <strong>{comp.juniorPromotedCount || 0} ราย</strong>
                </span>
              </div>
            </div>

            {juniors.length > 0 ? (
              <div className="table-scroll">
                <table className="person-comparison-table" aria-label="ตารางรายชื่อผู้อาวุโสน้อยกว่าที่ได้รับการเลื่อนตำแหน่งสูงขึ้น">
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>ยศ ชื่อ – นามสกุล</th>
                      <th>ลำดับอาวุโส</th>
                      <th>เทียบกับผู้ค้นหา</th>
                      <th>ตำแหน่งเดิม</th>
                      <th>ตำแหน่งใหม่ที่ได้รับเลื่อนสูงขึ้น</th>
                      <th>วันครองระดับปัจจุบัน</th>
                      <th>วันเกิด / ปีครบเกษียณ</th>
                      <th>อ้างอิง PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {juniors.map((j, idx) => (
                      <tr key={`${j.name}-${j.seniorityOrder}`}>
                        <td className="center-cell">{idx + 1}</td>
                        <td>
                          <strong>{j.fullNameWithRank}</strong>
                        </td>
                        <td className="center-cell">
                          <span className="order-badge-red">
                            ลำดับที่ {j.seniorityOrder}
                            {j.totalSuitablePopulation ? ` / ${j.totalSuitablePopulation}` : ''}
                          </span>
                        </td>
                        <td className="center-cell">
                          <span className="gap-text">อาวุโสน้อยกว่า {j.orderGap} ลำดับ</span>
                        </td>
                        <td>{j.currentPosition || '-'}</td>
                        <td>
                          <strong className="promoted-pos-text">{j.newPosition || '-'}</strong>
                        </td>
                        <td className="center-cell">
                          {j.currentPositionDateThai || j.currentPositionDate || '-'}
                        </td>
                        <td className="center-cell">
                          {j.retirementYearBE ? (
                            <>
                              <strong>พ.ศ. {j.retirementYearBE}</strong>
                              <br />
                              <small>
                                ({j.birthDateThai || j.birthDate}
                                {j.bornAfterSep30 ? ' · +1 ปี' : ''})
                              </small>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="center-cell">
                          {j.seniorityPdfPage ? (
                            <a
                              href={`/api/analysis/knowledge/source?name=seniority_2569_round4_2026-08-07_CURRENT.pdf#page=${j.seniorityPdfPage}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              อาวุโส น.{j.seniorityPdfPage}
                            </a>
                          ) : null}
                          {j.appointmentPdfPage ? (
                            <>
                              {' · '}
                              <a
                                href={`/api/analysis/knowledge/source?name=appointments_2569.pdf#page=${j.appointmentPdfPage}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                คำสั่ง น.{j.appointmentPdfPage}
                              </a>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-junior-notice">
                {p.seniorityOrder
                  ? `ไม่ปรากฏผู้ที่มีลำดับอาวุโสน้อยกว่าลำดับที่ ${p.seniorityOrder} ได้รับการเลื่อนตำแหน่งสูงขึ้นในระดับ ${p.sourceLevel} (บัญชี${p.sourceAccount})`
                  : 'กรุณาเลือกรายชื่อจากฐานข้อมูล หรือระบุลำดับอาวุโสในตัวเลือกจำลอง เพื่อแสดงตารางรายชื่อผู้อาวุโสน้อยกว่าที่ได้รับการเลื่อนตำแหน่งสูงขึ้น'}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
