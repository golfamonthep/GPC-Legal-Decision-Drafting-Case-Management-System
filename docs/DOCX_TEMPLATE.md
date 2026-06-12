# DOCX Template Export

This system supports exporting decision drafts to a formatted DOCX document using a pre-defined template.

## Template Location

The sanitized official template should be placed exactly at:
`templates/docx/gpc-decision-template.docx`

**WARNING:** Do NOT commit real personal-data samples or actual unsanitized decision files to the repository. If you have private test data, place it in `templates/docx/private/` which is ignored by Git.

## Supported Placeholders

You can use the following placeholders in your DOCX template. The system will replace them with the actual case and draft data.

### Case Metadata
* `{{caseType}}` - ประเภทคดี (ร้องทุกข์ / อุทธรณ์)
* `{{blackCaseNumber}}` - หมายเลขคดีดำ
* `{{redCaseNumber}}` - หมายเลขคดีแดง
* `{{decisionDate}}` - วันที่วินิจฉัย (Thai format)
* `{{receivedDate}}` - วันที่รับเรื่อง (Thai format)
* `{{petitionerLabel}}` - ป้ายกำกับผู้ร้อง (ผู้อุทธรณ์ / ผู้ร้องทุกข์)
* `{{petitionerName}}` - ชื่อผู้ร้อง
* `{{counterpartyLabel}}` - ป้ายกำกับคู่กรณี (คู่กรณีในอุทธรณ์ / คู่กรณีในการร้องทุกข์)
* `{{counterpartyName}}` - ชื่อคู่กรณี
* `{{subject}}` - เรื่อง
* `{{legalOfficerName}}` - ชื่อนิติกรเจ้าของสำนวน
* `{{committeeOwnerName}}` - ชื่อกรรมการเจ้าของสำนวน
* `{{status}}` - สถานะคดี
* `{{decisionResult}}` - ผลคำวินิจฉัย

### Draft Sections
* `{{section_summary}}` - สรุปคำร้อง/อุทธรณ์
* `{{section_request}}` - คำขอของผู้ร้อง/ผู้อุทธรณ์
* `{{section_counterparty_statement}}` - คำแก้ของคู่กรณี
* `{{section_facts}}` - ข้อเท็จจริงรับฟังได้
* `{{section_jurisdiction}}` - อำนาจและเงื่อนไขการพิจารณา
* `{{section_issues}}` - ประเด็นที่ต้องวินิจฉัย
* `{{section_laws}}` - ข้อกฎหมายที่เกี่ยวข้อง
* `{{section_analysis}}` - พิเคราะห์ (เหตุผลวินิจฉัย)
* `{{section_decision_result}}` - ผลคำวินิจฉัย
* `{{section_court_right}}` - สิทธิฟ้องคดีต่อศาลปกครองสูงสุด
* `{{section_signatures}}` - ส่วนลงนาม

### System Notifications
* `{{systemDraftWarning}}` - ข้อความแจ้งเตือนร่างเอกสารเพื่อตรวจทาน

## Missing Template Fallback

If the `gpc-decision-template.docx` file is missing, the system will not fail. Instead, it will automatically fallback to the legacy programmatic DOCX export mode.

## How to Test Export

1. Place your template in `templates/docx/gpc-decision-template.docx`.
2. Go to any case draft.
3. Click "ส่งออกตามแม่แบบคำวินิจฉัย".
4. The downloaded DOCX should contain your template with data filled in.
