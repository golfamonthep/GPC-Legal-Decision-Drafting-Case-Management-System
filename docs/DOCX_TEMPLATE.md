# DOCX Template Export

This system supports exporting decision drafts to a formatted DOCX document using a pre-defined template or a programmatic fallback.

## Template Location

The sanitized official template should be placed exactly at:
`templates/docx/gpc-decision-template.docx`

> [!WARNING]
> **Data Privacy Rules:**
> 1. Do NOT commit real personal-data samples or actual unsanitized decision files to the repository.
> 2. If you have private test data for comparison, place it in `templates/docx/private/` which is ignored by Git.
> 3. Do NOT commit `.env` files with production or sensitive database URLs.

## Template Design Guidelines

When creating or modifying the template in Microsoft Word, follow these exact manual settings to match the official ก.พ.ค.ตร. style:

**Page Setup:**
* Paper Size: A4 Portrait
* Margins: Top 2.5 cm, Bottom 2.0 cm, Left 3.0 cm, Right 2.0 cm

**Typography:**
* Font Family: TH Sarabun New
* Body Text: 16 pt (regular)
* Headings (Main): 18 pt (bold)
* Section Headings: 16 pt (bold)

**Paragraph Styles:**
* Line Spacing: Standard for Thai official documents, avoiding excessive gaps or cramped paragraphs (e.g., Exactly 16 pt or Multiple 1.15).
* Spacing After Paragraph: 6 pt to separate paragraphs slightly.
* First-line Indentation: Set to ~1.5 cm for paragraph body texts to ensure readability.

**Alignment and Spacing:**
* Case Numbers (เรื่องดำ / เรื่องแดง): Align right using a clean block or right-tab stops.
* Party Block (ผู้ร้อง / คู่กรณี): Neatly aligned using tabs or invisible tables.
* Signature Spacing: Leave ~3-4 empty lines before role text to accommodate physical signatures. Do not invent committee names if unknown.

## Supported Placeholders

You can use the following placeholders in your DOCX template. The system will replace them with the actual case and draft data.

### Case Metadata
* `{{caseType}}` - ประเภทคดี (ร้องทุกข์ / อุทธรณ์)
* `{{blackCaseNumber}}` - หมายเลขคดีดำ
* `{{redCaseNumber}}` - หมายเลขคดีแดง
* `{{decisionDate}}` - วันที่วินิจฉัย (Thai format, e.g. "2 พ.ค. 2569")
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
* `{{systemDraftWarning}}` - ข้อความแจ้งเตือนร่างเอกสารเพื่อตรวจทาน (Ensure this is visibly separated from the official body).

## Missing Template Fallback

If the `gpc-decision-template.docx` file is missing, the system will not fail. Instead, it will automatically fallback to the programmatic DOCX export mode. This mode generates a Word document with the recommended styles, fonts (TH Sarabun New), margins, and layout as hardcoded in the codebase.

## How to Test Export & Compare

1. Place your template in `templates/docx/gpc-decision-template.docx`.
2. Go to any case draft.
3. If no draft exists for the case, the system will show "ยังไม่มีร่างคำวินิจฉัยสำหรับส่งออก" and disable the export.
4. If a draft has text, click "ส่งออกตามแม่แบบคำวินิจฉัย".
5. The downloaded DOCX should contain your template with data filled in.
6. Open the exported DOCX side-by-side with an official sanitized sample to verify alignment, margins, font sizes, and layout.
