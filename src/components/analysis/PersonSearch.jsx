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
  { label: 'พลตำรวจโท อาชยน ไกรทอง', name: 'อาชยน ไกรทอง' },
  { label: 'พลตำรวจเอก ณพวัฒน์ อารยางกูร', name: 'ณพวัฒน์ อารยางกูร' },
  { label: 'พันตำรวจเอก ชิตภพ โตเหมือน', name: 'ชิตภพ โตเหมือน' },
];

export default function PersonSearch({ onApplyToAnalysis }) {
  const [query, setQuery] = useState('อาชยน ไกรทอง');
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
  const [tableTab, setTableTab] = useState('junior'); // 'junior' | 'all_promoted' | 'all_appointed'
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

      const nextComp = data?.profile?.comparison;
      if (nextComp) {
        if (nextComp.juniorPromotedCount > 0) {
          setTableTab('junior');
        } else if ((nextComp.totalPromotedInAccount || nextComp.allPromotedInAccount?.length || 0) > 0) {
          setTableTab('all_promoted');
        } else {
          setTableTab('all_appointed');
        }
      }
    } catch (e) {
      setError(e.message || 'ไม่สามารถดึงข้อมูลจากฐานข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch({ q: 'อาชยน ไกรทอง' });
    }, 0);
    return () => clearTimeout(timer);
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

    let targetRows = [];
    let sectionTitle = '';
    if (tableTab === 'junior') {
      targetRows = comp.juniorPromotedOfficers || [];
      sectionTitle = `๗. รายชื่อผู้อาวุโสน้อยกว่าที่ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้น (${comp.juniorPromotedCount || 0} คน)`;
    } else if (tableTab === 'all_promoted') {
      targetRows = comp.allPromotedInAccount || [];
      sectionTitle = `๗. รายชื่อผู้ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้นทั้งหมดในระดับ ${p.sourceLevel} (${comp.totalPromotedInAccount || comp.allPromotedInAccount?.length || 0} คน)`;
    } else {
      targetRows = comp.allAppointedInLevel || [];
      sectionTitle = `๗. รายชื่อผู้ได้รับการแต่งตั้งทั้งหมดในระดับ ${p.sourceLevel} (${comp.totalAppointedInLevel || comp.allAppointedInLevel?.length || 0} คน · รวมเลื่อนระดับและสับเปลี่ยนหมุนเวียน)`;
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = targetRows.length
      ? targetRows
          .map(
            (j, idx) => `
          <tr style="${j.relationTag === 'target' ? 'background:#eff6ff;' : j.relationTag === 'junior' ? 'background:#fff1f2;' : ''}">
            <td style="text-align:center;">${idx + 1}</td>
            <td style="font-weight:700;">
              ${j.fullNameWithRank || j.name}
              ${j.relationTag === 'target' ? ' <span style="color:#1d4ed8;font-size:11px;">[ผู้ค้นหา]</span>' : ''}
              ${j.relationTag === 'junior' ? ' <span style="color:#b91c1c;font-size:11px;">[อาวุโสน้อยกว่า]</span>' : ''}
              ${j.relationTag === 'rotation' ? ' <span style="color:#047857;font-size:11px;">[หมุนเวียน]</span>' : ''}
            </td>
            <td style="text-align:center;font-weight:700;color:#991b1b;">
              ${j.seniorityOrder ? `ลำดับที่ ${j.seniorityOrder}${j.totalSuitablePopulation ? ` / ${j.totalSuitablePopulation}` : ''}` : '-'}
            </td>
            <td style="text-align:center;">
              ${j.relationTag === 'junior' ? `อาวุโสน้อยกว่า ${j.orderGap} ลำดับ` : j.relationTag === 'senior' ? `อาวุโสสูงกว่า ${Math.abs(j.orderGap)} ลำดับ` : j.relationTag === 'target' ? 'เจ้าของประวัติ' : j.relationTag === 'rotation' ? 'สับเปลี่ยนหมุนเวียน' : '-'}
            </td>
            <td>${j.positionBeforeOrder || '-'}</td>
            <td style="font-weight:600;color:${j.appointmentType === 'เลื่อนระดับ' ? '#1e3a8a' : '#047857'};">${j.currentPosition || j.newPosition || '-'}</td>
            <td style="text-align:center;">${j.appointmentType || '-'}${j.promotionGroup && j.promotionGroup !== 'สับเปลี่ยนหมุนเวียน' ? `<br/><span style="font-size:10.5px;color:#1e40af;font-weight:600;">${j.promotionGroup}</span>` : ''}</td>
            <td style="text-align:center;">${j.currentPositionDateThai || j.currentPositionDate || '-'}</td>
            <td style="text-align:center;">${j.retirementYearBE ? `พ.ศ. ${j.retirementYearBE}${j.bornAfterSep30 ? ' (+1 ปี)' : ''}` : '-'}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="9" style="text-align:center;padding:16px;">ไม่พบรายการแต่งตั้งในเงื่อนไขนี้</td></tr>`;

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
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Sarabun', sans-serif; color: #0f172a; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #991b1b; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 18px; color: #7f1d1d; }
    .header p { margin: 2px 0 0; font-size: 12px; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
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
      <p>พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร. · ฐานข้อมูลอ้างอิง: การแต่งตั้งข้าราชการตำรวจระดับ ผบช. ลงมาถึง ผบก. วาระประจำปี 2569</p>
    </div>
    <div style="text-align:right;font-size:11px;color:#475569;">
      วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <div class="grid">
    <div class="card" style="grid-column: span 2;">
      <div class="card-label">๑. ยศ ชื่อ – นามสกุล ตำแหน่งปัจจุบัน และตำแหน่งเดิมก่อนแต่งตั้ง</div>
      <div class="card-val">${p.currentPosition || '-'}</div>
      <div class="card-sub"><strong>ยศและชื่อเต็ม:</strong> ${p.fullNameWithRank}${p.rankPromoted && p.previousRank ? ` (เลื่อนยศจาก ${p.previousRank} ➔ ${p.rank})` : ''}</div>
      ${p.positionBeforeOrder && p.isAppointedInOrder2569 ? `<div class="card-sub" style="color:#15803d;"><strong>ตำแหน่งเดิม (ก่อนแต่งตั้ง):</strong> ${p.previousRank ? `${p.previousRank} · ` : ''}${p.positionBeforeOrder} (ระดับ ${p.sourceLevel} · ข้อที่ ${p.appointmentNumber || '-'})</div>` : ''}
      ${p.previousPosition ? `<div class="card-sub"><strong>ประวัติระดับก่อนหน้า:</strong> ${p.previousPosition}</div>` : ''}
    </div>
    <div class="card">
      <div class="card-label">๒. ระยะเวลาดำรงตำแหน่ง (อายุครองตำแหน่ง)</div>
      <div class="card-val">${p.tenure?.tenureDisplay || '-'}</div>
      <div class="card-sub">วันเริ่มดำรงตำแหน่ง: <strong>${p.tenure?.currentPositionDateThai || p.tenure?.currentPositionDate || '-'}</strong> (คำนวณถึงวาระประจำปี พ.ศ. ๒๕๖๙)</div>
      ${p.tenure?.isPromotedToHigherLevel ? `<div class="card-sub" style="color:#047857;">(อายุครองตำแหน่งระดับเดิม ${p.sourceLevel} ก่อนได้รับการแต่งตั้งเลื่อนระดับ)</div>` : ''}
    </div>
    <div class="card">
      <div class="card-label">๓. ครบหลักเกณฑ์เลื่อนตำแหน่งสูงขึ้นมาแล้วกี่ปี</div>
      <div class="card-val" style="color:#047857;">${p.tenure?.isPromotedToHigherLevel ? `ครบเกณฑ์และได้เลื่อนเป็น ${p.tenure.currentLevel} แล้ว (วาระ ๒๕๖๙)` : (p.tenure?.eligibilityDisplay || '-')}</div>
      <div class="card-sub"><strong>ตามตำแหน่งปัจจุบัน (${p.tenure?.currentLevel || p.sourceLevel || '-'}):</strong> ${p.tenure?.currentLegalBasis || p.tenure?.legalBasis || ''}</div>
      ${p.tenure?.isPromotedToHigherLevel ? `<div class="card-sub"><strong>เกณฑ์ระดับเดิม (${p.sourceLevel}):</strong> ${p.tenure?.eligibilityDisplay || '-'}</div>` : ''}
    </div>
    <div class="card">
      <div class="card-label">๔. ลำดับอาวุโสในบัญชี</div>
      <div class="card-val" style="color:#1e40af;">${p.seniorityDisplay}</div>
      <div class="card-sub">ระดับ ${p.sourceLevel} (บัญชี${p.sourceAccount}) · ${p.previousOrder ? `ลำดับอาวุโสเดิม: ${p.previousOrder} · ` : ''}${p.seniorityPdfPage ? `อ้างอิงไฟล์บัญชีอาวุโส หน้า ${p.seniorityPdfPage}` : ''}</div>
    </div>
    <div class="card">
      <div class="card-label">๕. วันเดือนปีเกิด และปีครบเกษียณอายุราชการ (๖๐ ปี)</div>
      <div class="card-val" style="color:#7c2d12;">${p.retirement ? `ครบเกษียณ พ.ศ. ${p.retirement.retirementYearBE}` : 'ไม่ปรากฏข้อมูลวันเกิด'}</div>
      <div class="card-sub">${p.retirement ? `เกิดวันที่ ${p.retirement.birthDateThai} ${p.retirement.bornAfterSep30 ? '(เกิดหลัง 30 ก.ย. ได้บวกปีเกษียณเพิ่ม +1 ปี)' : '(เกิดภายใน 30 ก.ย. คำนวณปีเกษียณปกติ)'} · เหลืออายุราชการ ${p.retirement.remainingYearsFrom2569} ปี` : '-'}</div>
    </div>
    <div class="card" style="grid-column: 1 / -1; background: #f8fafc; border: 1.5px solid #94a3b8; padding: 12px 14px;">
      <div class="card-label">๖. เกณฑ์กลุ่มการเลื่อนตำแหน่งสูงขึ้น และข้อมูลตำแหน่งว่าง (การตัดโควตาอาวุโส ${p.quotaAssessment?.quotaRatioPct || 50}%)</div>
      <div class="card-val" style="color:${p.quotaAssessment?.groupKey === 'seniority_50' || p.quotaAssessment?.groupKey === 'seniority_100' ? '#047857' : '#1e40af'}; font-size: 16px; margin-bottom: 8px;">
        ${p.quotaAssessment?.groupLabel || '-'}
      </div>

      <!-- 3 Highlight Tiles -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: #ffffff;">
          <div style="font-size: 11px; color: #475569; font-weight: 700;">๑. ตำแหน่งว่างทั้งหมด</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 2px 0;">${p.quotaAssessment?.totalVacancies || 0} ตำแหน่ง</div>
          <div style="font-size: 10.5px; color: #64748b;">เทียบจากผู้ได้รับเลื่อนสูงขึ้นจริง</div>
        </div>
        <div style="border: 1.5px solid #86efac; border-radius: 6px; padding: 8px 10px; background: #f0fdf4;">
          <div style="font-size: 11px; color: #166534; font-weight: 700;">๒. โควตาอาวุโส ${p.quotaAssessment?.quotaRatioPct || 50}%</div>
          <div style="font-size: 16px; font-weight: 700; color: #047857; margin: 2px 0;">ตัดที่ลำดับที่ ${p.quotaAssessment?.seniorityCutoffOrder || '-'}</div>
          <div style="font-size: 10.5px; color: #15803d;">จัดสรร ${p.quotaAssessment?.seniorityQuotaCount || 0} ตำแหน่ง (ลำดับที่ 1–${p.quotaAssessment?.seniorityCutoffOrder || '-'})</div>
        </div>
        <div style="border: 1.5px solid #93c5fd; border-radius: 6px; padding: 8px 10px; background: #eff6ff;">
          <div style="font-size: 11px; color: #1e40af; font-weight: 700;">๓. ${p.quotaAssessment?.is100PercentSeniority ? 'กลุ่มอื่น' : 'เหลือว่างกลุ่มความรู้ความสามารถ'}</div>
          <div style="font-size: 16px; font-weight: 700; color: #1d4ed8; margin: 2px 0;">${p.quotaAssessment?.is100PercentSeniority ? '0 ตำแหน่ง' : `เหลือว่าง ${p.quotaAssessment?.knowledgeQuotaCount || 0} ตำแหน่ง`}</div>
          <div style="font-size: 10.5px; color: #1e40af;">${p.quotaAssessment?.is100PercentSeniority ? 'อาวุโส 100% เต็มจำนวน' : `คัดจากลำดับที่ ${p.quotaAssessment?.knowledgeOrderStart || '-'} ถึง ${p.totalSuitablePopulation || '-'}`}</div>
        </div>
      </div>

      <!-- Detail Explanation Box with Bold Highlights -->
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; font-size: 12px; line-height: 1.6; margin-bottom: 8px;">
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">ข้อมูลตำแหน่งว่างและการตัดโควตา (สรุปรายละเอียด):</div>
        <div style="margin-left: 8px;">
          • <strong>ตำแหน่งว่างทั้งหมด:</strong> ว่างทั้งหมด <strong>${p.quotaAssessment?.totalVacancies || 0} ตำแหน่ง</strong> (ประมวลจากผู้มีรายชื่อในบัญชีนี้ที่ได้รับการแต่งตั้งเลื่อนระดับสูงขึ้นจริง)<br/>
          • <strong>โควตาอาวุโส ${p.quotaAssessment?.quotaRatioPct || 50}% (ตัดที่ลำดับ):</strong> จัดสรรจำนวน <strong>${p.quotaAssessment?.seniorityQuotaCount || 0} ตำแหน่ง</strong> โดย<strong>ตัดโควตาอาวุโสที่ลำดับที่ ${p.quotaAssessment?.seniorityCutoffOrder || '-'}</strong> (ผู้มีลำดับอาวุโสที่ 1 ถึง ${p.quotaAssessment?.seniorityCutoffOrder || '-'} ได้รับแต่งตั้งเลื่อนระดับในกลุ่มอาวุโสครบถ้วนทุกคน)<br/>
          • <strong>${p.quotaAssessment?.is100PercentSeniority ? 'ตำแหน่งคงเหลือกลุ่มอื่น:' : 'เหลือว่างกี่ตำแหน่ง (กลุ่มความรู้ความสามารถ):'}</strong> ${p.quotaAssessment?.is100PercentSeniority ? '<strong>0 ตำแหน่ง</strong> (เนื่องจากต้องพิจารณาเรียงตามลำดับอาวุโส 100% เต็มจำนวนตำแหน่งว่าง)' : `เหลือว่างสำหรับกลุ่มความรู้ความสามารถอีก <strong>${p.quotaAssessment?.knowledgeQuotaCount || 0} ตำแหน่ง</strong> (คัดเลือกจากผู้มีลำดับอาวุโสที่ <strong>${p.quotaAssessment?.knowledgeOrderStart || '-'} ถึง ${p.totalSuitablePopulation || '-'}</strong> โดยคำนึงถึงอาวุโสและความรู้ความสามารถประกอบกัน)`}<br/>
          ${Number.isInteger(p.seniorityOrder) ? `• <strong>สถานะของผู้ค้นหา (${p.fullNameWithRank}):</strong> ลำดับอาวุโสที่ <strong>${p.seniorityOrder}</strong> ➔ ${p.seniorityOrder <= p.quotaAssessment?.seniorityCutoffOrder ? `<span style="color:#047857; font-weight:700;">อยู่ในโควตาอาวุโส ${p.quotaAssessment?.quotaRatioPct || 50}% (ลำดับที่ 1 ถึง ${p.quotaAssessment?.seniorityCutoffOrder})</span>` : `<span style="color:#b45309; font-weight:700;">อยู่ในกลุ่มความรู้ความสามารถ (เกินจุดตัดโควตาอาวุโสลำดับที่ ${p.quotaAssessment?.seniorityCutoffOrder})</span>`}` : ''}
        </div>
      </div>

      <div class="card-sub"><strong>หลักกฎหมายอ้างอิง:</strong> ${p.quotaAssessment?.legalBasis || '-'}</div>
    </div>
  </div>

  ${timelineHtml ? `<div style="margin-bottom:12px;"><strong>ประวัติวันดำรงตำแหน่งในแต่ละระดับ (จากบัญชีอาวุโส):</strong><div style="margin-top:4px;">${timelineHtml}</div></div>` : ''}

  <div class="highlight-box">
    <h2>${sectionTitle}</h2>
    <p style="margin:0;font-size:12.5px;">${comp.summaryText || ''}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center;">ที่</th>
        <th>ยศ ชื่อ – นามสกุล</th>
        <th style="width:95px;text-align:center;">ลำดับอาวุโส</th>
        <th style="width:115px;text-align:center;">เทียบกับผู้ค้นหา</th>
        <th>ตำแหน่งเดิม</th>
        <th>ตำแหน่งใหม่ที่ได้รับแต่งตั้ง</th>
        <th style="width:75px;text-align:center;">ลักษณะ</th>
        <th style="width:85px;text-align:center;">วันครองระดับ</th>
        <th style="width:90px;text-align:center;">ปีครบเกษียณ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>แหล่งข้อมูล: ฐานข้อมูลบัญชีอาวุโสและคำสั่งแต่งตั้งข้าราชการตำรวจ วาระประจำปี พ.ศ. ๒๕๖๙ (รวม ๒๘๑ รายการ)</span>
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
  const allPromoted = comp.allPromotedInAccount || [];
  const allAppointed = comp.allAppointedInLevel || [];

  const displayRows =
    tableTab === 'junior'
      ? juniors
      : tableTab === 'all_promoted'
      ? allPromoted
      : allAppointed;

  return (
    <div className="person-search-panel">
      <div className="person-search-header-box">
        <div>
          <span className="zero-api-badge">
            ฐานข้อมูลอ้างอิง: การแต่งตั้งข้าราชการตำรวจระดับ ผบช. ลงมาถึง ผบก. วาระประจำปี 2569
          </span>
          <h2>ค้นหารายชื่อวิเคราะห์ข้อมูลเบื้องต้น</h2>
          <p className="muted">
            ค้นหาจากชื่อ–นามสกุล ตำแหน่ง หรือลำดับอาวุโส เพื่อดูยศและตำแหน่งปัจจุบัน อายุครองระดับ ปีครบเกษียณ และเปรียบเทียบลำดับอาวุโส
          </p>
        </div>
        {p ? (
          <div className="person-search-actions">
            <button type="button" className="pdf-download-btn" onClick={handlePrintPdf}>
              ดาวน์โหลด PDF / พิมพ์
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

      {/* Search Bar */}
      <form
        className="person-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <div className="person-search-main-row">
          <label className="person-search-input-wrap">
            <span>ชื่อ – นามสกุล ตำแหน่ง หรือลำดับอาวุโส</span>
            <input
              type="search"
              placeholder="พิมพ์ชื่อ นามสกุล ตำแหน่ง หรือเลขลำดับ เช่น อาชยน ไกรทอง, ชิตภพ โตเหมือน, ลำดับที่ 2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button type="submit" className="person-search-submit-btn" disabled={loading}>
            {loading ? 'กำลังค้นหา…' : 'ค้นหา'}
          </button>
          <button
            type="button"
            className="outline"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? 'ซ่อนตัวเลือกเพิ่มเติม' : 'ระบุข้อมูลเพิ่มเติม'}
          </button>
        </div>

        {/* Minimal Quick Samples */}
        <div className="person-search-chips">
          <small>ตัวอย่าง:</small>
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
                max="915"
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

      {/* Clean compact match list when multiple records match */}
      {result?.suggestions?.length > 1 ? (
        <div className="person-suggestions-bar">
          <div className="person-suggestions-head">
            <strong>
              พบ {result.totalMatches} รายการ{result.totalMatches > 12 ? ' (แสดง ๑๒ รายการแรก · พิมพ์ชื่อ/สกุลเพิ่มเพื่อเจาะจง)' : ' (คลิกเพื่อดูข้อมูลวิเคราะห์)'}
            </strong>
          </div>
          <div className="person-suggestions-list">
            {result.suggestions.slice(0, 12).map((s) => (
              <button
                key={`${s.name}-${s.appointmentNumber || s.seniorityOrder || s.sourceLevel}`}
                type="button"
                className={'chip-btn' + (p?.name === s.name ? ' active' : '')}
                onClick={() => selectSuggestion(s)}
              >
                {s.fullNameWithRank} · {s.currentPosition || s.sourceLevel}
                {s.seniorityOrder ? ` (อาวุโส ${s.seniorityOrder})` : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Step 3: Results Presentation (Bento Cards + Multi-Tab Comparison Table) */}
      {p ? (
        <div ref={reportRef} className="person-result-container">
          <div className="person-profile-banner">
            <div>
              <div className="person-profile-badges">
                <span className="badge-tier">บัญชีอาวุโส ครั้งที่ 4: {p.sourceLevel} · {p.sourceAccount}</span>
                <span className={p.isPromotedInOrder2569 ? 'badge-promoted' : 'badge-complainant'}>
                  {p.appointmentType}
                </span>
                {p.quotaAssessment?.shortBadge ? (
                  <span
                    className={
                      p.quotaAssessment.groupKey === 'seniority_50' || p.quotaAssessment.groupKey === 'seniority_100'
                        ? 'badge-promoted'
                        : 'badge-tier'
                    }
                  >
                    {p.quotaAssessment.shortBadge}
                  </span>
                ) : null}
                {p.rankPromoted && p.previousRank ? (
                  <span className="badge-tier">เลื่อนยศจาก {p.previousRank} → {p.rank}</span>
                ) : null}
                {p.seniorityPdfPage ? (
                  <a
                    className="badge-link"
                    href={`/api/analysis/knowledge/source?name=seniority_2569_round4_2026-08-07_CURRENT.pdf#page=${p.seniorityPdfPage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF บัญชีอาวุโส หน้า {p.seniorityPdfPage}
                  </a>
                ) : null}
                {p.appointmentPdfPage ? (
                  <a
                    className="badge-link"
                    href={`/api/analysis/knowledge/source?name=appointments_2569.pdf#page=${p.appointmentPdfPage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF คำสั่งแต่งตั้ง หน้า {p.appointmentPdfPage} (ข้อ {p.appointmentNumber})
                  </a>
                ) : null}
              </div>
              <h3 className="person-profile-name">{p.fullNameWithRank}</h3>
            </div>
            <div className="person-profile-order-box">
              <small>ลำดับอาวุโสที่</small>
              <strong className="order-number-val">
                {p.seniorityOrder ? `${p.seniorityOrder}` : '-'}
                {p.totalSuitablePopulation ? <span> / {p.totalSuitablePopulation}</span> : null}
              </strong>
              {p.previousOrder ? <small>ลำดับอาวุโสเดิม: {p.previousOrder}</small> : null}
            </div>
          </div>

          {/* 6 Structured Info Blocks matching user requirements */}
          <div className="person-bento-grid">
            <div className="person-bento-card person-bento-card-wide">
              <span className="bento-label">๑. ยศ ชื่อ – นามสกุล ตำแหน่งปัจจุบัน และตำแหน่งเดิมก่อนแต่งตั้ง</span>
              <strong className="bento-value">{p.currentPosition || '-'}</strong>
              <p className="bento-sub">
                <strong>ยศและชื่อเต็ม:</strong> {p.fullNameWithRank}
                {p.rankPromoted && p.previousRank ? (
                  <span className="rank-change-inline"> (เลื่อนยศจาก {p.previousRank} ➔ {p.rank})</span>
                ) : null}
              </p>
              {p.positionBeforeOrder && p.isAppointedInOrder2569 ? (
                <p className="bento-sub highlight-blue">
                  <strong>ตำแหน่งเดิม (ก่อนแต่งตั้ง):</strong>{' '}
                  {p.previousRank ? `${p.previousRank} · ` : ''}
                  {p.positionBeforeOrder} (ระดับ {p.sourceLevel} · ข้อที่ {p.appointmentNumber || '-'})
                </p>
              ) : null}
              {p.previousPosition ? (
                <p className="bento-sub">
                  <strong>ประวัติระดับก่อนหน้า:</strong> {p.previousPosition}
                </p>
              ) : null}
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๒. ระยะเวลาดำรงตำแหน่ง (อายุครองตำแหน่ง)</span>
              <strong className="bento-value">{p.tenure?.tenureDisplay || '-'}</strong>
              <p className="bento-sub">
                วันเริ่มดำรงตำแหน่ง: <strong>{p.tenure?.currentPositionDateThai || '-'}</strong> (คำนวณถึงวาระประจำปี พ.ศ. ๒๕๖๙)
              </p>
              {p.tenure?.isPromotedToHigherLevel ? (
                <p className="bento-sub" style={{ color: '#047857' }}>
                  (อายุครองตำแหน่งระดับเดิม {p.sourceLevel} ก่อนได้รับการแต่งตั้งเลื่อนระดับ)
                </p>
              ) : null}
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๓. ครบหลักเกณฑ์เลื่อนตำแหน่งสูงขึ้นมาแล้วกี่ปี</span>
              <strong className="bento-value highlight-green">
                {p.tenure?.isPromotedToHigherLevel
                  ? `ครบเกณฑ์และได้เลื่อนเป็น ${p.tenure.currentLevel} แล้ว (วาระ ๒๕๖๙)`
                  : (p.tenure?.eligibilityDisplay || '-')}
              </strong>
              <p className="bento-sub">
                <strong>ตามตำแหน่งปัจจุบัน ({p.tenure?.currentLevel || p.sourceLevel}):</strong>{' '}
                {p.tenure?.currentLegalBasis || p.tenure?.legalBasis}
                {p.tenure?.isPromotedToHigherLevel && (
                  <>
                    <br />
                    <span>เกณฑ์ระดับเดิม ({p.sourceLevel}): {p.tenure.eligibilityDisplay}</span>
                  </>
                )}
              </p>
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๔. ลำดับอาวุโสในบัญชี</span>
              <strong className="bento-value highlight-blue">{p.seniorityDisplay}</strong>
              <p className="bento-sub">
                ระดับ {p.sourceLevel} (บัญชี{p.sourceAccount})
                {p.previousOrder ? ` · ลำดับเดิม ${p.previousOrder}` : ''}
              </p>
              {p.seniorityPdfPage ? (
                <p className="bento-sub">
                  อ้างอิงไฟล์บัญชีอาวุโส ครั้งที่ ๔ หน้า {p.seniorityPdfPage}
                </p>
              ) : null}
            </div>

            <div className="person-bento-card">
              <span className="bento-label">๕. วันเกิด และปีครบเกษียณอายุราชการ (๖๐ ปี)</span>
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

            {p.quotaAssessment ? (
              <div className="person-bento-card" style={{ gridColumn: '1 / -1' }}>
                <span className="bento-label">
                  ๖. เกณฑ์กลุ่มการเลื่อนตำแหน่งสูงขึ้น และข้อมูลตำแหน่งว่าง (การตัดโควตาอาวุโส {p.quotaAssessment.quotaRatioPct || 50}%)
                </span>
                <strong
                  className={
                    'bento-value ' +
                    (p.quotaAssessment.groupKey === 'seniority_50' || p.quotaAssessment.groupKey === 'seniority_100'
                      ? 'highlight-green'
                      : p.quotaAssessment.groupKey === 'knowledge_promoted'
                        ? 'highlight-blue'
                        : 'highlight-amber')
                  }
                >
                  {p.quotaAssessment.groupLabel}
                </strong>

                {/* 3 Metric Highlight Tiles: ว่างทั้งหมดเท่าใด / โควต้าอาวุโสตัดที่เท่าใด / เหลือว่างกี่ตำแหน่ง */}
                <div className="quota-metric-tiles">
                  <div className="quota-metric-tile tile-total">
                    <span className="quota-metric-title">๑. ตำแหน่งว่างทั้งหมด</span>
                    <strong className="quota-metric-num">{p.quotaAssessment.totalVacancies} ตำแหน่ง</strong>
                    <small className="quota-metric-desc">
                      เทียบจากผู้ได้รับเลื่อนสูงขึ้นจริงในระดับ{p.sourceLevel}
                    </small>
                  </div>
                  <div className="quota-metric-tile tile-seniority">
                    <span className="quota-metric-title">
                      ๒. โควตาอาวุโส {p.quotaAssessment.quotaRatioPct}% (ตัดที่ลำดับ)
                    </span>
                    <strong className="quota-metric-num text-green">
                      ตัดที่ลำดับที่ {p.quotaAssessment.seniorityCutoffOrder || '-'}
                    </strong>
                    <small className="quota-metric-desc">
                      จัดสรรจำนวน {p.quotaAssessment.seniorityQuotaCount} ตำแหน่ง (ลำดับที่ 1 ถึง {p.quotaAssessment.seniorityCutoffOrder})
                    </small>
                  </div>
                  <div className="quota-metric-tile tile-knowledge">
                    <span className="quota-metric-title">
                      {p.quotaAssessment.is100PercentSeniority
                        ? '๓. เหลือว่างกลุ่มอื่น'
                        : '๓. เหลือว่างกลุ่มความรู้ความสามารถ'}
                    </span>
                    <strong className="quota-metric-num text-blue">
                      {p.quotaAssessment.is100PercentSeniority
                        ? '0 ตำแหน่ง'
                        : `เหลือว่าง ${p.quotaAssessment.knowledgeQuotaCount} ตำแหน่ง`}
                    </strong>
                    <small className="quota-metric-desc">
                      {p.quotaAssessment.is100PercentSeniority
                        ? 'พิจารณาเรียงตามลำดับอาวุโส 100% เต็มจำนวน'
                        : `คัดเลือกจากลำดับที่ ${p.quotaAssessment.knowledgeOrderStart} ถึง ${p.totalSuitablePopulation || '-'}`}
                    </small>
                  </div>
                </div>

                {/* Structured Explanation with Bold Bullet Highlights */}
                <div className="quota-explanation-box">
                  <div style={{ fontWeight: 700, color: 'var(--wb-text-main)', marginBottom: '4px' }}>
                    ข้อมูลตำแหน่งว่างและการตัดโควตา (สรุปรายละเอียด):
                  </div>
                  <ul className="quota-exp-list">
                    <li>
                      <strong>ตำแหน่งว่างทั้งหมด:</strong> ว่างทั้งหมด{' '}
                      <strong className="highlight-tag-total">{p.quotaAssessment.totalVacancies} ตำแหน่ง</strong>{' '}
                      (ประมวลจากผู้มีรายชื่อในบัญชีนี้ที่ได้รับการแต่งตั้งเลื่อนระดับสูงขึ้นจริง)
                    </li>
                    <li>
                      <strong>โควตาอาวุโส {p.quotaAssessment.quotaRatioPct}% (ตัดที่ลำดับ):</strong> จัดสรรจำนวน{' '}
                      <strong>{p.quotaAssessment.seniorityQuotaCount} ตำแหน่ง</strong> โดย{' '}
                      <strong className="highlight-tag-seniority">
                        ตัดโควตาอาวุโสที่ลำดับที่ {p.quotaAssessment.seniorityCutoffOrder}
                      </strong>{' '}
                      (ผู้มีลำดับอาวุโสที่ 1 ถึง {p.quotaAssessment.seniorityCutoffOrder} ได้รับแต่งตั้งเลื่อนระดับในกลุ่มอาวุโสครบถ้วนทุกคน)
                    </li>
                    <li>
                      <strong>{p.quotaAssessment.is100PercentSeniority ? 'ตำแหน่งคงเหลือกลุ่มอื่น:' : 'เหลือว่างกี่ตำแหน่ง (กลุ่มความรู้ความสามารถ):'}</strong>{' '}
                      {p.quotaAssessment.is100PercentSeniority ? (
                        <span>
                          เนื่องจากต้องพิจารณาเรียงตามลำดับอาวุโส 100% เต็มจำนวนตำแหน่งว่าง จึง<strong>ไม่มีตำแหน่งคงเหลือสำหรับกลุ่มอื่น</strong>
                        </span>
                      ) : (
                        <span>
                          เหลือว่างสำหรับกลุ่มความรู้ความสามารถอีก{' '}
                          <strong className="highlight-tag-knowledge">{p.quotaAssessment.knowledgeQuotaCount} ตำแหน่ง</strong>{' '}
                          (เปิดให้คัดเลือกจากผู้มีลำดับอาวุโสที่{' '}
                          <strong>
                            {p.quotaAssessment.knowledgeOrderStart} ถึง {p.totalSuitablePopulation || '-'}
                          </strong>{' '}
                          โดยคำนึงถึงอาวุโสและความรู้ความสามารถประกอบกัน)
                        </span>
                      )}
                    </li>
                    {Number.isInteger(p.seniorityOrder) ? (
                      <li style={{ marginTop: '4px', borderTop: '1px dashed var(--wb-border)', paddingTop: '6px' }}>
                        <strong>สถานะของผู้ค้นหา ({p.fullNameWithRank}):</strong> ลำดับอาวุโสที่{' '}
                        <strong>{p.seniorityOrder}</strong>{' '}
                        {p.seniorityOrder <= p.quotaAssessment.seniorityCutoffOrder ? (
                          <span className="text-green-bold">
                            ➔ อยู่ในโควตาอาวุโส {p.quotaAssessment.quotaRatioPct}% (เนื่องจากลำดับที่ {p.seniorityOrder} อยู่ในเกณฑ์ลำดับที่ 1 ถึง {p.quotaAssessment.seniorityCutoffOrder})
                          </span>
                        ) : (
                          <span className="text-amber-bold">
                            ➔ อยู่ในกลุ่มความรู้ความสามารถ (เนื่องจากลำดับที่ {p.seniorityOrder} เกินจุดตัดโควตาอาวุโสลำดับที่ {p.quotaAssessment.seniorityCutoffOrder})
                          </span>
                        )}
                      </li>
                    ) : null}
                  </ul>
                </div>

                <p className="bento-sub" style={{ marginTop: '8px' }}>
                  <strong>หลักกฎหมายอ้างอิง:</strong> {p.quotaAssessment.legalBasis}
                </p>
              </div>
            ) : null}
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

          {/* Comparison Section with 3 Tabs: Junior Promoted / All Promoted in Account / All Appointed in Level */}
          <div className="person-comparison-section">
            <div className="person-comparison-summary-head">
              <div>
                <h3>
                  ผลเปรียบเทียบคำสั่งแต่งตั้งในระดับ {p.sourceLevel}:{' '}
                  {tableTab === 'junior' ? (
                    <>
                      มีผู้อาวุโสน้อยกว่าได้รับเลื่อนสูงขึ้น{' '}
                      <span className="junior-count-highlight">{comp.juniorPromotedCount || 0} คน</span>
                    </>
                  ) : tableTab === 'all_promoted' ? (
                    <>
                      ผู้ได้รับเลื่อนตำแหน่งสูงขึ้นทั้งหมดในบัญชีนี้{' '}
                      <span className="junior-count-highlight">{comp.totalPromotedInAccount || allPromoted.length} คน</span>
                    </>
                  ) : (
                    <>
                      ผู้ได้รับการแต่งตั้งทั้งหมดในระดับนี้{' '}
                      <span className="junior-count-highlight">{comp.totalAppointedInLevel || allAppointed.length} คน</span>
                    </>
                  )}
                </h3>
                <p>{comp.summaryText}</p>
              </div>
              <div className="comparison-stat-pills">
                <span>ผู้มีรายชื่อในบัญชีทั้งหมด: <strong>{comp.totalSuitablePopulation || '-'} ราย</strong></span>
                <span>ตำแหน่งว่าง (ผู้ได้เลื่อนสูงขึ้น): <strong>{comp.totalPromotedInAccount || allPromoted.length} ตำแหน่ง</strong></span>
                {comp.seniorityCutoffOrder ? (
                  <span>
                    ตัดโควตาอาวุโส {comp.quotaRatioPct || 50}% ที่: <strong>ลำดับที่ {comp.seniorityCutoffOrder} ({comp.seniorityQuotaCount} อัตรา)</strong>
                  </span>
                ) : null}
                {comp.knowledgeQuotaCount > 0 && comp.seniorityCutoffOrder ? (
                  <span>
                    กลุ่มความรู้ความสามารถ: <strong>{comp.knowledgeQuotaCount} อัตรา (ลำดับที่ {comp.seniorityCutoffOrder + 1} ขึ้นไป)</strong>
                  </span>
                ) : null}
                <span className="stat-danger">
                  อาวุโสน้อยกว่าที่ได้เลื่อนสูงขึ้น: <strong>{comp.juniorPromotedCount || 0} ราย</strong>
                </span>
                <span>ได้รับการแต่งตั้งทั้งหมดในระดับนี้: <strong>{comp.totalAppointedInLevel || allAppointed.length} ราย</strong></span>
              </div>
            </div>

            {/* 3 View Tabs */}
            <div className="person-comparison-tabs" role="tablist" aria-label="ตัวเลือกแสดงตาราง">
              <button
                type="button"
                role="tab"
                aria-selected={tableTab === 'junior'}
                className={'comp-tab-btn' + (tableTab === 'junior' ? ' active' : '')}
                onClick={() => setTableTab('junior')}
              >
                ๑. ผู้อาวุโสน้อยกว่าที่ได้รับเลื่อนสูงขึ้น ({comp.juniorPromotedCount || 0} คน)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tableTab === 'all_promoted'}
                className={'comp-tab-btn' + (tableTab === 'all_promoted' ? ' active' : '')}
                onClick={() => setTableTab('all_promoted')}
              >
                ๒. ผู้ได้รับเลื่อนตำแหน่งสูงขึ้นทั้งหมดในระดับนี้ ({comp.totalPromotedInAccount || allPromoted.length} คน)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tableTab === 'all_appointed'}
                className={'comp-tab-btn' + (tableTab === 'all_appointed' ? ' active' : '')}
                onClick={() => setTableTab('all_appointed')}
              >
                ๓. ผู้ได้รับการแต่งตั้งทั้งหมดในระดับนี้ (รวมเลื่อนและหมุนเวียน {comp.totalAppointedInLevel || allAppointed.length} คน)
              </button>
            </div>

            {displayRows.length > 0 ? (
              <div className="table-scroll">
                <table className="person-comparison-table" aria-label="ตารางรายชื่อเปรียบเทียบการแต่งตั้ง">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>ลำดับ</th>
                      <th>ยศ ชื่อ – นามสกุล</th>
                      <th style={{ textAlign: 'center' }}>ลำดับอาวุโส</th>
                      <th style={{ textAlign: 'center' }}>เทียบกับผู้ค้นหา</th>
                      <th>ตำแหน่งเดิม (ก่อนแต่งตั้ง)</th>
                      <th>ตำแหน่งปัจจุบัน (ที่ได้รับแต่งตั้ง)</th>
                      <th style={{ textAlign: 'center' }}>ลักษณะการแต่งตั้ง</th>
                      <th style={{ textAlign: 'center' }}>วันครองระดับปัจจุบัน</th>
                      <th style={{ textAlign: 'center' }}>วันเกิด / ปีครบเกษียณ</th>
                      <th style={{ textAlign: 'center' }}>อ้างอิง PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, idx) => (
                      <tr
                        key={`${row.name}-${row.seniorityOrder || row.appointmentNumber || idx}`}
                        className={row.relationTag === 'target' ? 'row-target' : row.relationTag === 'junior' ? 'row-junior' : ''}
                      >
                        <td className="center-cell">{idx + 1}</td>
                        <td>
                          <strong>{row.fullNameWithRank}</strong>
                          {row.relationTag === 'target' ? (
                            <span className="relation-tag target">🎯 ผู้ค้นหา</span>
                          ) : row.relationTag === 'junior' ? (
                            <span className="relation-tag junior">⚠️ อาวุโสน้อยกว่า</span>
                          ) : row.relationTag === 'senior' ? (
                            <span className="relation-tag senior">อาวุโสสูงกว่า</span>
                          ) : row.relationTag === 'rotation' ? (
                            <span className="relation-tag rotation">หมุนเวียน</span>
                          ) : null}
                        </td>
                        <td className="center-cell">
                          {row.seniorityOrder ? (
                            <span className={row.relationTag === 'junior' ? 'order-badge-red' : 'order-badge-normal'}>
                              ลำดับที่ {row.seniorityOrder}
                              {row.totalSuitablePopulation ? ` / ${row.totalSuitablePopulation}` : ''}
                            </span>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td className="center-cell">
                          {row.relationTag === 'junior' ? (
                            <span className="gap-text">อาวุโสน้อยกว่า {row.orderGap} ลำดับ</span>
                          ) : row.relationTag === 'senior' ? (
                            <span className="gap-text-muted">อาวุโสสูงกว่า {Math.abs(row.orderGap)} ลำดับ</span>
                          ) : row.relationTag === 'target' ? (
                            <strong className="highlight-blue">เจ้าของประวัติที่ค้นหา</strong>
                          ) : row.relationTag === 'rotation' ? (
                            <span className="muted">สับเปลี่ยนหมุนเวียน</span>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                        <td>{row.positionBeforeOrder || '-'}</td>
                        <td>
                          <strong className={row.appointmentType === 'เลื่อนระดับ' ? 'promoted-pos-text' : 'rotation-pos-text'}>
                            {row.currentPosition || row.newPosition || '-'}
                          </strong>
                        </td>
                        <td className="center-cell">
                          <span className={row.appointmentType === 'เลื่อนระดับ' ? 'badge-promoted-sm' : 'badge-rotation-sm'}>
                            {row.appointmentType || '-'}
                          </span>
                          {row.promotionGroup && row.promotionGroup !== 'สับเปลี่ยนหมุนเวียน' ? (
                            <div style={{ marginTop: '4px' }}>
                              <small className={row.promotionGroup.includes('อาวุโส') ? 'highlight-green' : 'highlight-blue'}>
                                <strong>{row.promotionGroup}</strong>
                              </small>
                            </div>
                          ) : null}
                        </td>
                        <td className="center-cell">
                          {row.currentPositionDateThai || row.currentPositionDate || '-'}
                        </td>
                        <td className="center-cell">
                          {row.retirementYearBE ? (
                            <>
                              <strong>พ.ศ. {row.retirementYearBE}</strong>
                              <br />
                              <small>
                                ({row.birthDateThai || row.birthDate}
                                {row.bornAfterSep30 ? ' · +1 ปี' : ''})
                              </small>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="center-cell">
                          {row.seniorityPdfPage ? (
                            <a
                              href={`/api/analysis/knowledge/source?name=seniority_2569_round4_2026-08-07_CURRENT.pdf#page=${row.seniorityPdfPage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="pdf-link-btn"
                            >
                              อาวุโส น.{row.seniorityPdfPage}
                            </a>
                          ) : null}
                          {row.appointmentPdfPage ? (
                            <>
                              {' '}
                              <a
                                href={`/api/analysis/knowledge/source?name=appointments_2569.pdf#page=${row.appointmentPdfPage}`}
                                target="_blank"
                                rel="noreferrer"
                                className="pdf-link-btn"
                              >
                                คำสั่ง น.{row.appointmentPdfPage}
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
                {tableTab === 'junior' ? (
                  <>
                    <p>
                      {p.seniorityOrder
                        ? `ในระดับ ${p.sourceLevel} (บัญชี${p.sourceAccount}) ไม่ปรากฏผู้ที่มีลำดับอาวุโสน้อยกว่าลำดับที่ ${p.seniorityOrder} ได้รับการแต่งตั้งเลื่อนตำแหน่งสูงขึ้น`
                        : 'ไม่ปรากฏข้อมูลผู้อาวุโสน้อยกว่าที่ได้รับเลื่อนตำแหน่งสูงขึ้นตามเงื่อนไขนี้'}
                    </p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="outline"
                        onClick={() => setTableTab('all_promoted')}
                      >
                        ดูผู้ได้รับเลื่อนตำแหน่งสูงขึ้นทั้งหมด ({comp.totalPromotedInAccount || allPromoted.length} คน)
                      </button>
                      <button
                        type="button"
                        className="outline"
                        onClick={() => setTableTab('all_appointed')}
                      >
                        ดูผู้ได้รับการแต่งตั้งทั้งหมดในระดับนี้ ({comp.totalAppointedInLevel || allAppointed.length} คน)
                      </button>
                    </div>
                  </>
                ) : (
                  'ไม่พบรายการแต่งตั้งในเงื่อนไขที่เลือก'
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
