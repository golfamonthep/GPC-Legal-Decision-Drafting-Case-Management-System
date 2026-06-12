export enum PostMeetingFollowupStatus {
  NOT_STARTED = 'NOT_STARTED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REVISION_IN_PROGRESS = 'REVISION_IN_PROGRESS',
  REVISED_PENDING_REVIEW = 'REVISED_PENDING_REVIEW',
  FINAL_REVIEW = 'FINAL_REVIEW',
  READY_FOR_RED_NUMBER = 'READY_FOR_RED_NUMBER',
  RED_NUMBER_RECORDED = 'RED_NUMBER_RECORDED',
  READY_FOR_SIGNATURE = 'READY_FOR_SIGNATURE',
  SIGNED = 'SIGNED',
  FINALIZED = 'FINALIZED',
  CLOSED = 'CLOSED',
  ON_HOLD = 'ON_HOLD',
}

export const POST_MEETING_FOLLOWUP_LABELS: Record<PostMeetingFollowupStatus, string> = {
  [PostMeetingFollowupStatus.NOT_STARTED]: 'ยังไม่เริ่ม',
  [PostMeetingFollowupStatus.REVISION_REQUIRED]: 'ต้องแก้ไขร่าง',
  [PostMeetingFollowupStatus.REVISION_IN_PROGRESS]: 'อยู่ระหว่างแก้ไขร่าง',
  [PostMeetingFollowupStatus.REVISED_PENDING_REVIEW]: 'แก้ไขแล้วรอตรวจ',
  [PostMeetingFollowupStatus.FINAL_REVIEW]: 'ตรวจร่างฉบับสุดท้าย',
  [PostMeetingFollowupStatus.READY_FOR_RED_NUMBER]: 'พร้อมออกเลขแดง',
  [PostMeetingFollowupStatus.RED_NUMBER_RECORDED]: 'บันทึกเลขแดงแล้ว',
  [PostMeetingFollowupStatus.READY_FOR_SIGNATURE]: 'พร้อมเสนอ/ลงนาม',
  [PostMeetingFollowupStatus.SIGNED]: 'ลงนามแล้ว',
  [PostMeetingFollowupStatus.FINALIZED]: 'เสร็จสิ้นฉบับสมบูรณ์',
  [PostMeetingFollowupStatus.CLOSED]: 'ปิดสำนวน',
  [PostMeetingFollowupStatus.ON_HOLD]: 'พักการดำเนินการ',
};
