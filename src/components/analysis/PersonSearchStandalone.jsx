'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PersonSearch from './PersonSearch';
import './workbench.css';

export const PERSON_SEARCH_TRANSFER_KEY = 'gpc_person_search_transfer';

export default function PersonSearchStandalone() {
  const router = useRouter();

  function handleApplyToAnalysis(profile) {
    const comp = profile.comparison || {};
    const juniors = comp.juniorPromotedOfficers || [];
    const juniorNames = juniors
      .slice(0, 15)
      .map((j) => `${j.fullNameWithRank} (อาวุโสลำดับที่ ${j.seniorityOrder})`)
      .join(', ');
    const summaryLine = [
      `ผู้ร้อง/ผู้รับการตรวจสอบ: ${profile.fullNameWithRank}`,
      `ตำแหน่งปัจจุบัน: ${profile.currentPosition || '-'} (ดำรงตำแหน่ง ${profile.tenure?.tenureDisplay || '-'})`,
      profile.positionBeforeOrder && profile.isAppointedInOrder2569
        ? `ตำแหน่งเดิมก่อนแต่งตั้ง: ${profile.previousRank ? `${profile.previousRank} · ` : ''}${profile.positionBeforeOrder}`
        : '',
      `การครบเกณฑ์เลื่อนตำแหน่งสูงขึ้น: ${profile.tenure?.eligibilityDisplay || '-'}`,
      `ลำดับอาวุโส: ${profile.seniorityDisplay || '-'}`,
      profile.retirement
        ? `วันเกิด: ${profile.retirement.birthDateThai} · ครบเกษียณ พ.ศ. ${profile.retirement.retirementYearBE}${profile.retirement.bornAfterSep30 ? ' (เกิดหลัง 30 ก.ย. +1 ปี)' : ''}`
        : '',
      `ผลเปรียบเทียบ: มีผู้อาวุโสน้อยกว่าได้รับเลื่อนตำแหน่งสูงขึ้นจำนวน ${comp.juniorPromotedCount || 0} คน${juniorNames ? ` ได้แก่ ${juniorNames}${juniors.length > 15 ? ' เป็นต้น' : ''}` : ''}`,
    ]
      .filter(Boolean)
      .join('\n');

    const payload = {
      title: `วิเคราะห์การแต่งตั้งและเปรียบเทียบอาวุโส ${profile.fullNameWithRank}`,
      subject_name: profile.name,
      fullNameWithRank: profile.fullNameWithRank,
      rank_position: profile.currentPosition || '',
      level: profile.sourceLevel || '',
      account: profile.sourceAccount || '',
      summaryLine,
    };

    try {
      window.sessionStorage.setItem(PERSON_SEARCH_TRANSFER_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors cleanly
    }
    router.push('/analysis?from=person-search');
  }

  return (
    <section className="analysis-workbench" style={{ paddingBottom: '2rem' }}>
      <PersonSearch onApplyToAnalysis={handleApplyToAnalysis} />
    </section>
  );
}
