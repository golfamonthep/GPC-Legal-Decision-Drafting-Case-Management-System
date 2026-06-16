import type { Case, CaseEvent } from '@/generated/prisma';
import { DataQualityIssue, DataQualitySeverity, DataQualityCategory } from './types';
import { isClosedOrRedCase, hasRedCaseNumber } from '../caseStatus';

export function detectCaseDataQualityIssues(
  caseData: any
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  const addIssue = (
    category: DataQualityCategory,
    severity: DataQualitySeverity,
    title: string,
    description: string,
    fieldName?: string,
    currentValue?: string | null,
    recommendedAction?: string
  ) => {
    // Generate deterministic ID
    const id = `${caseData.id}_${title.replace(/\s+/g, '_')}`;
    issues.push({
      id,
      caseId: caseData.id,
      category,
      severity,
      title,
      description,
      fieldName,
      currentValue,
      recommendedAction,
      caseBlackNumber: caseData.blackNumber,
      caseRedNumber: caseData.redNumber,
      caseType: caseData.type,
      petitionerName: caseData.petitionerName,
      respondentName: caseData.respondentName,
      subject: caseData.subject,
      legalOfficerName: caseData.legalOfficerName,
      ownerId: caseData.ownerId,
    });
  };

  // A. Missing required or important fields
  if (!caseData.blackNumber || caseData.blackNumber.trim() === '') {
    addIssue('MISSING_FIELDS', 'HIGH', 'ไม่มีเรื่องดำ', 'สำนวนไม่มีเลขเรื่องดำ ซึ่งเป็นข้อมูลจำเป็น', 'blackNumber', null, 'เพิ่มเลขเรื่องดำ');
  }

  // Red number missing is covered in status consistency if it's completed
  if (!caseData.petitionerName || caseData.petitionerName.trim() === '-' || caseData.petitionerName.trim() === '') {
    addIssue('MISSING_FIELDS', 'HIGH', 'ไม่มีชื่อผู้ร้องทุกข์/ผู้อุทธรณ์', 'สำนวนไม่มีชื่อผู้ร้องหรือผู้อุทธรณ์', 'petitionerName', caseData.petitionerName, 'ระบุชื่อผู้ร้องทุกข์/ผู้อุทธรณ์');
  }

  if (!caseData.respondentName || caseData.respondentName.trim() === '-' || caseData.respondentName.trim() === '') {
    addIssue('MISSING_FIELDS', 'MEDIUM', 'ไม่มีคู่กรณี', 'สำนวนไม่มีคู่กรณี', 'respondentName', caseData.respondentName, 'ระบุคู่กรณี');
  }

  if (!caseData.subject || caseData.subject.trim() === '-' || caseData.subject.trim() === '') {
    addIssue('MISSING_FIELDS', 'HIGH', 'ไม่มีเรื่อง', 'สำนวนไม่มีชื่อเรื่อง', 'subject', caseData.subject, 'ระบุชื่อเรื่อง');
  }

  // Only complain about receivedDate if not closed
  if (!caseData.receivedDate && !isClosedOrRedCase(caseData.currentStatus)) {
    addIssue('MISSING_FIELDS', 'HIGH', 'ไม่มีวันที่รับเรื่อง', 'สำนวนที่ยังไม่เสร็จสิ้นควรมีวันที่รับเรื่อง', 'receivedDate', null, 'ระบุวันที่รับเรื่อง');
  }

  if (!caseData.legalOfficerId && !caseData.legalOfficerName) {
    addIssue('MISSING_FIELDS', 'MEDIUM', 'ไม่มีนิติกร', 'สำนวนยังไม่ได้มอบหมายนิติกรเจ้าของสำนวน', 'legalOfficerId', null, 'มอบหมายนิติกร');
  }

  if (!caseData.currentStatus || caseData.currentStatus.trim() === '') {
    addIssue('MISSING_FIELDS', 'HIGH', 'ไม่มีสถานะ', 'สำนวนไม่มีสถานะการดำเนินการ', 'currentStatus', caseData.currentStatus, 'อัปเดตสถานะ');
  }

  if (!caseData.ownerId) {
    addIssue('MISSING_FIELDS', 'MEDIUM', 'ไม่มีกรรมการเจ้าของสำนวน', 'สำนวนยังไม่มีกรรมการเจ้าของสำนวน', 'ownerId', null, 'มอบหมายกรรมการ');
  }

  // B. Status consistency
  const isCompleted = isClosedOrRedCase(caseData.currentStatus);
  const hasRedNo = hasRedCaseNumber(caseData.redNumber);

  if (hasRedNo && !isCompleted) {
    addIssue('STATUS_CONSISTENCY', 'CRITICAL', 'มีเลขเรื่องแดงแต่สถานะยังไม่เสร็จสิ้น', `สถานะปัจจุบันคือ "${caseData.currentStatus}" แต่มีเลขเรื่องแดงแล้ว`, 'currentStatus', caseData.currentStatus, 'อัปเดตสถานะเป็นเสร็จสิ้น');
  }

  if (isCompleted && !hasRedNo) {
    addIssue('STATUS_CONSISTENCY', 'CRITICAL', 'สถานะเสร็จสิ้นแต่ไม่มีเลขเรื่องแดง', `สถานะคือเสร็จสิ้นแต่ไม่มีเลขเรื่องแดง`, 'redNumber', caseData.redNumber, 'ระบุเลขเรื่องแดง');
  }

  if (caseData.currentStatus && caseData.currentStatus.includes('แดงแล้ว') && !hasRedNo) {
    addIssue('STATUS_CONSISTENCY', 'CRITICAL', 'ระบุว่า "แดงแล้ว" แต่ไม่มีเลขแดงจริง', `สถานะระบุว่าแดงแล้ว แต่ช่องเลขเรื่องแดงว่างเปล่า`, 'redNumber', null, 'ระบุเลขเรื่องแดง');
  }

  // C. Date quality
  if (caseData.receivedDate && caseData.meetingDate) {
    if (caseData.meetingDate < caseData.receivedDate) {
      addIssue('DATE_QUALITY', 'HIGH', 'วันประชุมอยู่ก่อนวันที่รับเรื่อง', 'วันที่รับเรื่องและวันประชุมไม่สัมพันธ์กัน', 'meetingDate', caseData.meetingDate.toISOString(), 'ตรวจสอบวันที่รับเรื่องและวันประชุม');
    }
  }

  // E. Workflow risk
  if (caseData.events && caseData.events.length === 0) {
    addIssue('WORKFLOW_RISK', 'MEDIUM', 'ไม่มี CaseEvent หลังนำเข้า', 'สำนวนนี้ไม่มีประวัติการดำเนินการในระบบ', 'events', null, 'ตรวจสอบการดำเนินการล่าสุด');
  }

  if (caseData.receivedDate && !isCompleted) {
    const ageInDays = (new Date().getTime() - caseData.receivedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 365) {
      addIssue('WORKFLOW_RISK', 'HIGH', 'สำนวนเก่ามากแต่ยังไม่เสร็จ', 'สำนวนมีอายุเกิน 1 ปี แต่ยังไม่เสร็จสิ้น', 'currentStatus', caseData.currentStatus, 'ตรวจสอบและอัปเดตความคืบหน้า');
    }
  }

  return issues;
}
