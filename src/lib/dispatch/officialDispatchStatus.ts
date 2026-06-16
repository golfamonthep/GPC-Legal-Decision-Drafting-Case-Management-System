export enum OfficialDispatchStatus {
  NOT_STARTED = 'NOT_STARTED',
  PREPARING_NOTICE = 'PREPARING_NOTICE',
  NOTICE_READY = 'NOTICE_READY',
  DISPATCHED = 'DISPATCHED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RETURNED_UNDELIVERED = 'RETURNED_UNDELIVERED',
  RE_DISPATCH_REQUIRED = 'RE_DISPATCH_REQUIRED',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

export const OFFICIAL_DISPATCH_LABELS: Record<OfficialDispatchStatus, string> = {
  [OfficialDispatchStatus.NOT_STARTED]: 'ยังไม่เริ่ม',
  [OfficialDispatchStatus.PREPARING_NOTICE]: 'อยู่ระหว่างจัดทำหนังสือแจ้งผล',
  [OfficialDispatchStatus.NOTICE_READY]: 'หนังสือแจ้งผลพร้อมส่ง',
  [OfficialDispatchStatus.DISPATCHED]: 'ส่งแจ้งผลแล้ว',
  [OfficialDispatchStatus.ACKNOWLEDGED]: 'รับทราบแล้ว',
  [OfficialDispatchStatus.RETURNED_UNDELIVERED]: 'ส่งไม่สำเร็จ/ตีกลับ',
  [OfficialDispatchStatus.RE_DISPATCH_REQUIRED]: 'ต้องส่งใหม่',
  [OfficialDispatchStatus.COMPLETED]: 'เสร็จสิ้นการแจ้งผล',
  [OfficialDispatchStatus.ON_HOLD]: 'พักการดำเนินการ',
};

export enum CourtFollowupStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  WAITING_FOR_FILING_PERIOD = 'WAITING_FOR_FILING_PERIOD',
  FILING_PERIOD_ACTIVE = 'FILING_PERIOD_ACTIVE',
  NO_COURT_CASE_REPORTED = 'NO_COURT_CASE_REPORTED',
  COURT_CASE_FILED = 'COURT_CASE_FILED',
  COURT_CASE_IN_PROGRESS = 'COURT_CASE_IN_PROGRESS',
  COURT_JUDGMENT_RECEIVED = 'COURT_JUDGMENT_RECEIVED',
  COURT_FOLLOWUP_COMPLETED = 'COURT_FOLLOWUP_COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

export const COURT_FOLLOWUP_LABELS: Record<CourtFollowupStatus, string> = {
  [CourtFollowupStatus.NOT_APPLICABLE]: 'ไม่เกี่ยวข้อง',
  [CourtFollowupStatus.WAITING_FOR_FILING_PERIOD]: 'รอเริ่มนับระยะเวลาฟ้องคดี',
  [CourtFollowupStatus.FILING_PERIOD_ACTIVE]: 'อยู่ในระยะเวลาฟ้องคดี',
  [CourtFollowupStatus.NO_COURT_CASE_REPORTED]: 'ยังไม่มีรายงานการฟ้องคดี',
  [CourtFollowupStatus.COURT_CASE_FILED]: 'มีการฟ้องคดีต่อศาลแล้ว',
  [CourtFollowupStatus.COURT_CASE_IN_PROGRESS]: 'อยู่ระหว่างดำเนินคดีศาลปกครอง',
  [CourtFollowupStatus.COURT_JUDGMENT_RECEIVED]: 'ได้รับคำพิพากษา/คำสั่งศาลแล้ว',
  [CourtFollowupStatus.COURT_FOLLOWUP_COMPLETED]: 'เสร็จสิ้นการติดตามศาล',
  [CourtFollowupStatus.ON_HOLD]: 'พักการติดตาม',
};
