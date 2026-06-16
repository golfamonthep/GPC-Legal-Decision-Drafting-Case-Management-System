import { addDays, differenceInDays } from 'date-fns';

export interface CourtDeadlineInfo {
  acknowledgementDate: Date | null;
  filingDeadlineDate: Date | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  isNearDeadline30: boolean;
  isNearDeadline15: boolean;
  isNearDeadline7: boolean;
  urgencyLevel: 'OVERDUE' | 'NEAR_DUE_7' | 'NEAR_DUE_15' | 'NEAR_DUE_30' | 'NORMAL' | 'NOT_APPLICABLE' | 'COMPLETED';
}

export const COURT_DEADLINE_WARNING = "วันครบกำหนดฟ้องคดีเป็นค่าที่ระบบคำนวณเพื่อช่วยติดตามงาน ต้องตรวจสอบตามกฎหมายและข้อเท็จจริงของแต่ละสำนวนก่อนใช้จริง";

export function calculateFilingDeadline(
  acknowledgementDateStr: string | null | undefined, 
  filingPeriodDays: number = 90,
  followupStatus?: string
): CourtDeadlineInfo {
  if (!acknowledgementDateStr) {
    return {
      acknowledgementDate: null,
      filingDeadlineDate: null,
      daysRemaining: null,
      isOverdue: false,
      isNearDeadline30: false,
      isNearDeadline15: false,
      isNearDeadline7: false,
      urgencyLevel: 'NOT_APPLICABLE'
    };
  }

  const acknowledgementDate = new Date(acknowledgementDateStr);
  const filingDeadlineDate = addDays(acknowledgementDate, filingPeriodDays);
  const now = new Date();
  
  // Set time to end of day for deadline
  filingDeadlineDate.setHours(23, 59, 59, 999);
  
  // differenceInDays returns positive if deadline is in future, negative if past
  const daysRemaining = differenceInDays(filingDeadlineDate, now);
  
  const isOverdue = daysRemaining < 0;
  const isNearDeadline30 = daysRemaining >= 0 && daysRemaining <= 30;
  const isNearDeadline15 = daysRemaining >= 0 && daysRemaining <= 15;
  const isNearDeadline7 = daysRemaining >= 0 && daysRemaining <= 7;

  let urgencyLevel: CourtDeadlineInfo['urgencyLevel'] = 'NORMAL';
  
  if (followupStatus === 'COURT_FOLLOWUP_COMPLETED' || followupStatus === 'NOT_APPLICABLE') {
    urgencyLevel = followupStatus === 'COURT_FOLLOWUP_COMPLETED' ? 'COMPLETED' : 'NOT_APPLICABLE';
  } else if (isOverdue) {
    urgencyLevel = 'OVERDUE';
  } else if (isNearDeadline7) {
    urgencyLevel = 'NEAR_DUE_7';
  } else if (isNearDeadline15) {
    urgencyLevel = 'NEAR_DUE_15';
  } else if (isNearDeadline30) {
    urgencyLevel = 'NEAR_DUE_30';
  }

  return {
    acknowledgementDate,
    filingDeadlineDate,
    daysRemaining,
    isOverdue,
    isNearDeadline30,
    isNearDeadline15,
    isNearDeadline7,
    urgencyLevel
  };
}

export function getUrgencyLevelLabel(level: string): string {
  switch (level) {
    case 'OVERDUE': return 'ครบกำหนดแล้ว';
    case 'NEAR_DUE_7': return 'เหลือไม่เกิน 7 วัน';
    case 'NEAR_DUE_15': return 'เหลือไม่เกิน 15 วัน';
    case 'NEAR_DUE_30': return 'เหลือไม่เกิน 30 วัน';
    case 'NORMAL': return 'อยู่ในระยะติดตามปกติ';
    case 'COMPLETED': return 'ติดตามเสร็จสิ้น';
    case 'NOT_APPLICABLE': return 'ไม่เกี่ยวข้อง';
    default: return level;
  }
}
