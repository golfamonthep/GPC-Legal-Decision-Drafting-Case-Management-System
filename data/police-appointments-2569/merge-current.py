from pathlib import Path
import json,hashlib,shutil,csv,collections,sqlite3
from pypdf import PdfReader
import openpyxl
root=Path(r'C:\APP\data\police-appointments-2569'); out=root/'CURRENT'
old=Path(r'C:\Users\polic\Documents\Codex\2026-09-17\new-chat-2\ฐานข้อมูลรวม\ชุดอัปโหลด-GPT-พร้อมใช้')
one=out/'1-เนื้อหาหลักและดัชนี'; two=out/'2-รายการแก้ไขและต้นฉบับ'; three=out/'3-กฎและผลวิเคราะห์ปัจจุบัน'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
readj=lambda p:json.loads(p.read_text('utf-8-sig'))
def write(p,t): p.write_text(t,encoding='utf-8')
def writej(p,t): write(p,json.dumps(t,ensure_ascii=False,indent=2)+'\n')
for f in readj(old/'1-เนื้อหาหลักและดัชนี'/'SOURCE_BUNDLE_MANIFEST.json')['files']:
    assert sha(next(old.rglob(f['file'])))==f['sha256']
for f in readj(old/'2-รายการแก้ไขและต้นฉบับ'/'PDF_SOURCE_MANIFEST.json')['files']:
    assert sha(old/'2-รายการแก้ไขและต้นฉบับ'/f['file'])==f['sha256']
for name in ('SKILL-CURRENT','CODEX-HANDOFF-CURRENT'):
    p=Path(r'C:\Users\polic\Downloads')/(name+'.txt.docx')
    write(three/(name+'.txt'),p.read_bytes().decode('cp874'))
    shutil.copy2(p,root/'archive'/p.name)
workbook=three/'วิเคราะห์การเลื่อนตำแหน่งตำรวจ-2569_CURRENT.xlsx'
w=openpyxl.load_workbook(workbook,data_only=True)
wr=[(i,list(r)) for i,r in enumerate(w['การแต่งตั้งนายพลวาระ 2569'].iter_rows(min_row=6,values_only=True),6) if r[3]]
assert len(wr)==184
assert sha(workbook)==sha(Path(r'C:\Users\polic\Downloads')/workbook.name)
t=(old/'1-เนื้อหาหลักและดัชนี'/'04-ข้อมูลการแต่งตั้ง.md').read_text('utf-8-sig')
records=[json.loads(x) for x in t.splitlines() if x.startswith('{')]
keep=['document_id','record_type','source_sheet','source_row','ข้อที่','ยศเดิม','ชื่อ–นามสกุล','ตำแหน่งเดิม','ตำแหน่งใหม่','ระดับเดิม','ระดับใหม่','ลักษณะการแต่งตั้ง','หน้า PDF']
clean=[]; idx=[]
for i,r in enumerate(records,1):
    a={k:r.get(k) for k in keep}
    a.update(paragraph_id=f'police-appointments-2569-appointment-{i:04d}',source_pdf='appointments_2569.pdf',appointment_verification_status='INHERITED_OLD_BUNDLE_NOT_REVERIFIED',seniority_source_pdf='seniority_2569_round4_2026-08-07_CURRENT.pdf',seniority_order=None,total_suitable_population=None,seniority_display=None,source_account=None,source_level=None,source_pdf_page=None,verification_status='UNRESOLVED_SOURCE_GAP',actual_vacancies=None,seniority_quota=None,knowledge_ability_quota=None,analytical_group=None)
    clean.append(a)
    idx.append({'document_id':a['document_id'],'paragraph_id':a['paragraph_id'],'kind':'appointment','canonical_file':'04-ข้อมูลการแต่งตั้ง.md','source_pdf':'appointments_2569.pdf','page_start':a['หน้า PDF'],'page_end':a['หน้า PDF'],'search_text':' '.join(str(a[k]) for k in keep if a.get(k) is not None),'content_role':'search_index_only_not_authority'})
counts=collections.Counter(r['ลักษณะการแต่งตั้ง'] for r in clean)
assert len(clean)==281 and counts['เลื่อนระดับ']==184 and counts['ระดับเดิม']==97
assert len({r['ข้อที่'] for r in clean})==281
write(one/'04-ข้อมูลการแต่งตั้ง.md','# ข้อมูลการแต่งตั้งตำรวจ วาระ 2569 ปัจจุบัน\n\nรายการแต่งตั้งจากฐานเดิม 281 ราย PDF แต่งตั้งและพระราชทานยศตรงกับไฟล์ปัจจุบันด้วย SHA-256 สถานะตรวจเนื้อหาเดิมเป็น inherited ยังไม่ได้ตรวจภาพซ้ำในรอบนี้\n\nตัดลำดับอาวุโสและผลจับคู่รุ่นเก่าออกแล้ว workbook ปัจจุบันเก็บไว้ครบ แต่ลำดับต้องตรวจภาพ PDF ครั้งที่ 4 ก่อนยืนยัน ข้อมูลที่ยังไม่มีแหล่งยืนยันเป็น UNRESOLVED_SOURCE_GAP\n\n## รายการแต่งตั้งทั้งหมด\n\n```jsonl\n'+''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in clean)+'```\n')
write(one/'05-ดัชนีค้นหา-การแต่งตั้ง.jsonl',''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in idx))
seniority=two/'seniority_2569_round4_2026-08-07_CURRENT.pdf'
pr=PdfReader(seniority); pages=[]; si=[]
for n,p in enumerate(pr.pages,1):
    txt=p.extract_text() or ''; pid=f'seniority-2569-round4-page-{n:03d}'
    r={'paragraph_id':pid,'source_pdf':seniority.name,'source_pdf_page':n,'verification_status':'TEXT_LAYER_UNVERIFIED' if txt.strip() else 'UNRESOLVED_SOURCE_GAP','text':txt}
    pages.append(r)
    si.append({'document_id':'seniority_2569_round4','paragraph_id':pid,'kind':'source_page','canonical_file':'03-ข้อมูลอาวุโส.md','source_pdf':seniority.name,'page_start':n,'page_end':n,'search_text':txt,'verification_status':r['verification_status'],'content_role':'search_index_only_not_authority'})
write(one/'03-ข้อมูลอาวุโส.md','# ข้อมูลอาวุโส 2569 ครั้งที่ 4 ปัจจุบัน\n\nแหล่งเดียว: '+seniority.name+'\n\nข้อความจาก text layer ของ PDF ปัจจุบันแยกหน้าจริง ยังไม่ได้ตรวจภาพ ไม่ใช่บัญชีบุคคลที่ยืนยันแล้ว ห้ามยืนยันชื่อ ลำดับ จำนวนผู้เหมาะสม หรือผลจับคู่โดยไม่ตรวจภาพ ห้าม fallback ไปอาวุโสรุ่นเก่า ยังไม่ยืนยันขอบเขตระดับ/บัญชีหรือ x จาก y\n\n'+''.join('## หน้า PDF '+str(r['source_pdf_page'])+'\n\n```json\n'+json.dumps(r,ensure_ascii=False,indent=2)+'\n```\n\n' for r in pages))
write(one/'05-ดัชนีค้นหา-อาวุโส.jsonl',''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in si))
with (old/'2-รายการแก้ไขและต้นฉบับ'/'06-รายการแก้ไขรวม.csv').open(encoding='utf-8-sig',newline='') as f:
    cr=csv.DictReader(f); fields=cr.fieldnames; allcr=list(cr)
activecr=[r for r in allcr if r['dataset_group']!='การแต่งตั้ง-2569']
with (two/'06-รายการแก้ไขรวม.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cw=csv.DictWriter(f,fieldnames=fields); cw.writeheader(); cw.writerows(activecr)
oldmeta=(old/'1-เนื้อหาหลักและดัชนี'/'00-แหล่งที่มาและเมทาดาทา.md').read_text('utf-8-sig').split('## การแต่งตั้ง-2569')[0]
write(one/'00-แหล่งที่มาและเมทาดาทา.md','# สถานะฐานข้อมูลปัจจุบัน 9 ตุลาคม 2569\n\nกฎหมายและคำวินิจฉัยคงจากฐานเดิม hash ตรง สถานะตรวจเนื้อหาเป็น inherited ไม่ได้ตรวจภาพใหม่ เอกสารตัวอย่างเป็น reference_only ห้ามปะปนข้อเท็จจริงข้ามคดี\n\n'+oldmeta+'## การแต่งตั้งและอาวุโสปัจจุบัน\n\n'+json.dumps({'appointment_count':281,'promoted_count':184,'same_level_count':97,'exclusive_seniority_source':seniority.name,'seniority_page_count':63,'seniority_parse_status':'PAGE_TEXT_ONLY_PENDING_VISUAL_ACCOUNT_AND_PERSON_VERIFICATION','old_seniority_status':'SUPERSEDED_EXCLUDED_FROM_ACTIVE_BUNDLE','workbook':workbook.name,'workbook_status':'USER_CURRENT_ANALYSIS_PRESERVED_NOT_REVERIFIED','actual_vacancies_status':'UNRESOLVED_SOURCE_GAP'},ensure_ascii=False,indent=2)+'\n')
write(out/'PROJECT-INSTRUCTIONS-คัดลอกไปวางในโปรเจกต์.md','''# กฎฐานข้อมูลปัจจุบัน

ใช้ SKILL-CURRENT.txt และ CODEX-HANDOFF-CURRENT.txt เป็นกฎปัจจุบัน โดยกฎล่าสุดมีผลเหนือข้อความขัดกันจากรุ่นเก่า

Strict Source Isolation ใช้เฉพาะ Approved Source Set ที่ผู้ใช้ส่ง ห้ามใช้ model memory แชตอื่น project อื่น เว็บ connector ภายนอก personal context หรือความรู้ทั่วไปเป็นข้อเท็จจริง กฎหมาย หรือหลักฐาน หากข้อมูลไม่พอ ระบุสิ่งที่ขาด หยุดส่วนที่ต้องพึ่งข้อมูลนั้น การใช้ภายนอกต้องได้รับอนุญาตเป็นรายกรณี

อาวุโส 2569 ใช้ seniority_2569_round4_2026-08-07_CURRENT.pdf เพียงแหล่งเดียว ห้าม fallback ไป seniority_2569.pdf หรือ derived/crosswalk รุ่นเก่า 03 และดัชนีใหม่เป็นข้อความ PDF แยกหน้า ยังไม่ใช่บัญชีบุคคลที่ยืนยัน ต้องตรวจภาพ PDF ก่อนยืนยันชื่อ ลำดับ และขอบเขตบัญชี หากยืนยันไม่ได้ให้ UNRESOLVED_SOURCE_GAP ห้ามเดา

ตรวจ SOURCE_BUNDLE_MANIFEST.json และ hash ก่อนใช้ หากเครื่องมือคำนวณไม่ได้ให้ระบุว่ายังไม่ได้ตรวจ fingerprint อิสระ หากไฟล์เปลี่ยนให้ SOURCE_CHANGED_RECONCILIATION_REQUIRED ดัชนีใช้ recall เท่านั้น ต้องอ่าน canonical และตรวจ PDF เมื่อยืนยันข้อเท็จจริงสำคัญ

workbook คือผลวิเคราะห์ปัจจุบันที่ผู้ใช้ส่ง เก็บเนื้อหาเดิมไว้ครบ แต่ห้ามกล่าวว่าตรวจลำดับกับ PDF ครั้งที่ 4 แล้วเพียงเพราะมีค่าใน workbook จำนวนผู้เหมาะสมทั้งหมดและ x จาก y ยังต้องตรวจฐานอาวุโสปัจจุบัน actual_vacancies ต้องมี source ห้ามใช้จำนวนผู้ได้รับแต่งตั้งแทน สูตร CEILING(actual_vacancies*0.50) ใช้เฉพาะกรณีที่หลักเกณฑ์ 50% ใช้บังคับ

One chat = one active case ข้อเท็จจริงเฉพาะคดีห้ามข้ามคดี เอกสารเฉพาะคดีไม่มี case_id ให้ quarantine คำวินิจฉัยตัวอย่างเป็น reference_only ใช้เพื่อโครง เหตุผล ภาษา ห้ามใส่ชื่อคดีตัวอย่างในเนื้อหลักคดีใหม่ ข้อกล่าวอ้างไม่ใช่ข้อเท็จจริงที่พิสูจน์แล้ว

“พิเคราะห์แล้วเห็นว่า” ใช้กฎหมายและหลักเกณฑ์ “พิจารณาแล้วเห็นว่า” ใช้ข้อเท็จจริง การปรับบท การเปรียบเทียบ และดุลยพินิจ
''')
write(out/'README-เริ่มตรงนี้.md','''# ฐานข้อมูลรวมปัจจุบัน วาระ 2569

รวมฐานเดิมกับ PDF กฎ handoff และ workbook ปัจจุบันที่ผู้ใช้ส่ง ณ 9 ตุลาคม 2569 เป็นฐานข้อมูลในเครื่อง ไม่มีการอัปโหลดภายนอก

- 1-เนื้อหาหลักและดัชนี: กฎหมาย คำวินิจฉัย รายการแต่งตั้ง 281 ราย และข้อความอาวุโส PDF ครั้งที่ 4 แยกหน้า
- 2-รายการแก้ไขและต้นฉบับ: correction ที่ไม่เกี่ยวกับผลจับคู่อาวุโสเดิม และ PDF ต้นทาง 7 แหล่ง
- 3-กฎและผลวิเคราะห์ปัจจุบัน: กฎล่าสุด handoff และ workbook ที่คงไบต์เดิม

ฐาน SQLite รวมอยู่ ../current-database.sqlite3 มี PDF ต้นฉบับ รายการแต่งตั้ง ข้อความอาวุโสปัจจุบันแยกหน้า แถว workbook และไฟล์เนื้อหาหลักสำหรับค้นคืน

สำเนาฐานเดิมอยู่ ../archive/bundle-2026-09-25 แยกจากชุด active ห้ามใช้บัญชีอาวุโสหรือ crosswalk รุ่นเก่าเพื่อยืนยันปัจจุบัน ต้นฉบับฐานเดิมไม่ถูกแก้ไข

การรวมแหล่งข้อมูลเสร็จแล้ว แต่การตรวจภาพรายบุคคล ขอบเขตบัญชี จำนวนผู้เหมาะสม x จาก y และ actual vacancies ยังไม่เสร็จ ดู QA-REPORT.md และ CHANGELOG.md
''')
write(out/'CHANGELOG.md','''# รายการเปลี่ยนแปลง 9 ตุลาคม 2569

- สำรองฐานเดิมทั้งชุดและตรวจ hash ตาม manifest เดิม
- คงกฎหมายและคำวินิจฉัยเดิม แก้ canonical_file ในดัชนีให้ตรงกับชื่อไฟล์ปัจจุบัน
- เก็บรายการแต่งตั้ง 281 ราย ตัด field ลำดับอาวุโสและผลจับคู่รุ่นเก่า
- สร้าง 03 และดัชนีอาวุโสใหม่จาก PDF ครั้งที่ 4 เท่านั้น
- ตัดดัชนี promotion_by_seniority และ summary รุ่นเก่าที่ปะปนข้อมูลอาวุโส
- correction การแต่งตั้งเดิม 74 รายการคงใน archive เท่านั้น รอตรวจ provenance ใหม่
- รวม PDF ปัจจุบัน กฎ handoff และ workbook โดยคงเนื้อหา workbook เดิม
- สร้าง SQLite รวม พร้อม manifest และ hash ปัจจุบัน
''')
empty=[r['source_pdf_page'] for r in pages if not r['text'].strip()]
write(out/'QA-REPORT.md',f'''# ผลตรวจฐานข้อมูลรวมปัจจุบัน

## ตรวจแล้ว

- canonical เดิม 10 ไฟล์และ PDF เดิม 7 ไฟล์ hash ตรงตาม manifest เดิม
- PDF แต่งตั้งและพระราชทานยศที่ส่งล่าสุดตรงกับฐานเดิมทุกไบต์
- รายการแต่งตั้ง 281 ราย เลื่อนระดับ 184 ราย ระดับเดิม 97 ราย
- workbook คงไบต์เดิม มีรายละเอียดผู้เลื่อนระดับ 184 ราย
- PDF อาวุโสปัจจุบัน 63 หน้า ดึงข้อความจากไฟล์ใหม่เท่านั้น
- รายการแต่งตั้งและดัชนี active ไม่ใช้ลำดับหรือ crosswalk รุ่นเก่า
- ตรวจความตรงกันของ hash และ BLOB และ SQLite integrity

## ยังรอยืนยัน

- ยังไม่ได้ตรวจภาพ PDF เพื่อยืนยันชื่อ ลำดับ และขอบเขตบัญชี
- หน้าไม่มี text layer: {empty} ต้องตรวจภาพ
- ยังไม่ยืนยัน total_suitable_population และ “ลำดับที่ x จากทั้งหมด y”
- actual_vacancies ยังไม่มี source ยืนยัน จึงไม่คำนวณโควตาหรือ analytical_group ใหม่
- ลำดับอาวุโสใน workbook ยังไม่ได้ตรวจซ้ำกับ PDF ครั้งที่ 4
- สถานะตรวจเนื้อหากฎหมาย คำวินิจฉัย และแต่งตั้งเดิมเป็น inherited ไม่ใช่การตรวจภาพรอบใหม่
- คำวินิจฉัยตัวอย่างเป็น reference_only ห้ามใช้ข้อเท็จจริงข้ามคดี
''')
pdfs=sorted(two.glob('*.pdf'))
assert len(pdfs)==7 and not (two/'seniority_2569.pdf').exists()
for name in ('appointments_2569.pdf','appointment_ranks.pdf'):
    assert sha(two/name)==sha(old/'2-รายการแก้ไขและต้นฉบับ'/name)
writej(two/'PDF_SOURCE_MANIFEST.json',{'purpose':'current PDFs for source verification','files':[{'file':p.name,'sha256':sha(p),'bytes':p.stat().st_size,'page_count':len(PdfReader(p).pages),'role':'reference_only' if p.name.startswith('precedent_') else 'active_source'} for p in pdfs]})
for p in one.glob('05-*.jsonl'):
    for line in p.read_text('utf-8').splitlines(): assert (one/json.loads(line)['canonical_file']).is_file()
dbpath=root/'current-database.sqlite3'
with sqlite3.connect(dbpath) as db:
    db.executescript('CREATE TABLE IF NOT EXISTS source_documents (filename TEXT PRIMARY KEY,sha256 TEXT NOT NULL,page_count INTEGER,role TEXT,raw_pdf BLOB); CREATE TABLE IF NOT EXISTS appointments (appointment_number INTEGER PRIMARY KEY,record_json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS seniority_pages (pdf_page INTEGER PRIMARY KEY,record_json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS workbook_promotions (source_row INTEGER PRIMARY KEY,record_json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS bundle_files (relative_path TEXT PRIMARY KEY,sha256 TEXT NOT NULL,raw_content BLOB NOT NULL);')
    for p in pdfs: db.execute('INSERT OR REPLACE INTO source_documents VALUES (?,?,?,?,?)',(p.name,sha(p),len(PdfReader(p).pages),'reference_only' if p.name.startswith('precedent_') else 'active_source',p.read_bytes()))
    for r in clean: db.execute('INSERT OR REPLACE INTO appointments VALUES (?,?)',(int(r['ข้อที่']),json.dumps(r,ensure_ascii=False)))
    for r in pages: db.execute('INSERT OR REPLACE INTO seniority_pages VALUES (?,?)',(r['source_pdf_page'],json.dumps(r,ensure_ascii=False)))
    for n,r in wr: db.execute('INSERT OR REPLACE INTO workbook_promotions VALUES (?,?)',(n,json.dumps({'cells':r,'source_workbook':workbook.name,'status':'USER_CURRENT_ANALYSIS_NOT_REVERIFIED'},ensure_ascii=False)))
    for p in out.rglob('*'):
        if p.is_file(): db.execute('INSERT OR REPLACE INTO bundle_files VALUES (?,?,?)',(p.relative_to(out).as_posix(),sha(p),p.read_bytes()))
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    for table,count in [('appointments',281),('seniority_pages',63),('workbook_promotions',184),('source_documents',7)]: assert db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0]==count
    for h,b in db.execute('SELECT sha256,raw_pdf FROM source_documents'): assert hashlib.sha256(b).hexdigest()==h
files=[{'file':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file() and p.name!='SOURCE_BUNDLE_MANIFEST.json']
fingerprint=hashlib.sha256('\n'.join(f"{f['file']}\0{f['bytes']}\0{f['sha256']}" for f in files).encode()).hexdigest()
writej(one/'SOURCE_BUNDLE_MANIFEST.json',{'bundle_id':'police-current-source-bundle','version':'2026-10-09','files':files,'bundle_fingerprint':fingerprint,'fingerprint_algorithm':'SHA-256 over sorted relative_path NUL bytes NUL file_sha256 rows joined by LF','exclusive_seniority_source':seniority.name,'superseded_excluded':['seniority_2569.pdf','old seniority canonical/index','old crosswalk fields and promotion_by_seniority index'],'sqlite_database':str(dbpath),'sqlite_sha256':sha(dbpath),'status':'MERGED_CURRENT_SOURCES_PENDING_PERSON_LEVEL_VERIFICATION'})
for f in files: assert sha(out/f['file'])==f['sha256']
print(json.dumps({'current_bundle':str(out),'database':str(dbpath),'files_registered':len(files),'appointments':len(clean),'workbook_promotions':len(wr),'seniority_pages':len(pages),'empty_text_pages':empty,'hash_checks':'PASS','sqlite_integrity':'ok'},ensure_ascii=False,indent=2))
