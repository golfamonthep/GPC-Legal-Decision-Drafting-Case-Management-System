# DOCX Template Setup Guide

This document explains how to set up and use the DOCX template system for exporting formal ก.พ.ค.ตร. decision documents.

## Template Location
The system looks for a sanitized template at the following path:
`templates/docx/gpc-decision-template.docx`

**Important:** Do not commit real official decision samples that contain personal data. Place any private testing samples inside `templates/docx/private/` which is ignored by git.

## Supported Placeholders

### Case Metadata
- `{{caseType}}` - ประเภทเรื่อง (e.g., อุทธรณ์, ร้องทุกข์)
- `{{blackCaseNumber}}` - หมายเลขคดีดำ
- `{{redCaseNumber}}` - หมายเลขคดีแดง
- `{{decisionDate}}` - วันที่ตัดสิน (Thai Buddhist Era format)
- `{{receivedDate}}` - วันที่รับเรื่อง (Thai Buddhist Era format)
- `{{petitionerLabel}}` - ผู้อุทธรณ์ / ผู้ร้องทุกข์
- `{{petitionerName}}` - ชื่อผู้ร้อง
- `{{counterpartyLabel}}` - คู่กรณีในอุทธรณ์ / คู่กรณีในการร้องทุกข์
- `{{counterpartyName}}` - ชื่อคู่กรณี
- `{{subject}}` - เรื่อง
- `{{legalOfficerName}}` - ชื่อนิติกร
- `{{committeeOwnerName}}` - ชื่อกรรมการเจ้าของสำนวน
- `{{status}}` - สถานะ
- `{{decisionResult}}` - ผลคำวินิจฉัย

### Draft Sections
The system maps existing section types to these placeholders:
- `{{section_summary}}` - สรุปคำร้องทุกข์ / สรุปอุทธรณ์
- `{{section_request}}` - คำขอของผู้ร้องทุกข์ / คำขอของผู้อุทธรณ์
- `{{section_counterparty_statement}}` - คำแก้ของคู่กรณี
- `{{section_facts}}` - ข้อเท็จจริงรับฟังได้
- `{{section_jurisdiction}}` - อำนาจและเงื่อนไขการพิจารณา
- `{{section_issues}}` - ประเด็นที่ต้องวินิจฉัย
- `{{section_laws}}` - ข้อกฎหมายที่เกี่ยวข้อง
- `{{section_analysis}}` - พิเคราะห์
- `{{section_decision_result}}` - ผลคำวินิจฉัย
- `{{section_court_right}}` - สิทธิฟ้องคดีต่อศาลปกครองสูงสุด
- `{{section_signatures}}` - ส่วนลงนาม

### System Placeholders
- `{{systemDraftWarning}}` - Warning message for unreviewed drafts.

## Testing the Export
1. Ensure `gpc-decision-template.docx` is placed in `templates/docx/`.
2. Go to a case draft page in the web app.
3. Click the "ส่งออก DOCX" button.
4. If the template is present, the file will be generated using `docxtemplater`. Otherwise, it will fallback to a basic programmatic format.
