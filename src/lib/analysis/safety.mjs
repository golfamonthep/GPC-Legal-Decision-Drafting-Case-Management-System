import { createHash } from 'node:crypto';
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
export function assertOwner(row, actor) {
  if (!row) fail('ไม่พบงานวิเคราะห์', 404);
  if (actor.role !== 'ADMIN' && row.ownerKey !== actor.id) fail('ไม่มีสิทธิ์ในงานวิเคราะห์นี้', 403);
}
export function assertAssignment(c, actor) {
  if (!c) fail('ไม่พบสำนวน', 404);
  if (actor.role === 'ADMIN') return;
  if (
    actor.role === 'COMMISSIONER' &&
    (c.ownerId === actor.id || (!c.ownerId && actor.name && c.committeeOwnerName === actor.name))
  )
    return;
  if (
    actor.role === 'LEGAL_OFFICER' &&
    (c.legalOfficerId === actor.id || (!c.legalOfficerId && actor.name && c.legalOfficerName === actor.name))
  )
    return;
  fail('ต้องเป็นผู้รับผิดชอบสำนวนนี้', 403);
}

export function inferMissingInputFields(data) {
  const combined = [
    data.rank_position,
    data.subject_name,
    data.title,
    data.claim,
    data.issues,
    data.response,
    data.unit_name,
  ]
    .filter(Boolean)
    .join(' ');

  if (!data.analysis_tier) {
    if (
      /(รอง\s*ผบก\.|รองผู้บังคับการ|ผกก\.|ผู้กำกับการ|รอง\s*ผกก\.|สวญ\.|สารวัตรใหญ่|สว\.|สารวัตร|รอง\s*สว\.|พ\.ต\.[อทต]\.|ร\.ต\.[อทต]\.)/.test(
        combined,
      ) &&
      !/(เลื่อนเป็น\s*ผบก\.|ขึ้น\s*ผบก\.|ระดับ\s*ผบก\.\s*ขึ้นไป|พล\.ต\.[อทต]\.|ผบช\.|จตร\.|ผู้ช่วย\s*ผบ\.ตร\.|รอง\s*ผบ\.ตร\.)/.test(
        combined,
      )
    ) {
      data.analysis_tier = 'sub_general_to_inspector';
    } else if (
      /(พล\.ต\.[อทต]\.|ผบ\.ตร\.|รอง\s*ผบ\.ตร\.|จตช\.|ผู้ช่วย\s*ผบ\.ตร\.|รอง\s*จตช\.|ผบช\.|จตร\.|รอง\s*ผบช\.|รอง\s*จตร\.|ผบก\.|ผู้บังคับการ)/.test(
        combined,
      )
    ) {
      data.analysis_tier = 'general';
    }
  }

  const isRotation = /(สับเปลี่ยน|หมุนเวียน|โยกย้าย|ระดับเท่าเดิม|ย้ายออกนอกหน่วย)/.test(combined);

  if (!data.level && combined) {
    if (/(รอง\s*ผบ\.ตร\.|จตช\.)/.test(combined)) {
      data.level = 'ผู้ช่วย ผบ.ตร. / รอง จตช. เลื่อนเป็น รอง ผบ.ตร. / จตช.';
    } else if (/(ผู้ช่วย\s*ผบ\.ตร\.|รอง\s*จตช\.)/.test(combined)) {
      data.level = 'ผบช. / จตร. เลื่อนเป็น ผู้ช่วย ผบ.ตร. / รอง จตช.';
    } else if (/(ผบช\.|ผู้บัญชาการ|จตร\.)/.test(combined) && !/รอง\s*(ผบช\.|ผู้บัญชาการ|จตร\.)/.test(combined)) {
      data.level = 'รอง ผบช. / รอง จตร. เลื่อนเป็น ผบช. / จตร.';
    } else if (/รอง\s*(ผบช\.|ผู้บัญชาการ|จตร\.)/.test(combined)) {
      data.level = 'ผบก. เลื่อนเป็น รอง ผบช. / รอง จตร.';
    } else if (/(เลื่อน.*เป็น\s*ผบก\.|ขึ้น\s*ผบก\.|แต่งตั้งดำรงตำแหน่ง\s*ผบก\.)/.test(combined)) {
      data.level = 'รอง ผบก. เลื่อนเป็น ผบก.';
    } else if (/(เลื่อน.*เป็น\s*รอง\s*ผบก\.|ขึ้น\s*รอง\s*ผบก\.)/.test(combined)) {
      data.level = 'รอง ผบก. (เลื่อนจาก ผกก.)';
    } else if (/(เลื่อน.*เป็น\s*ผกก\.|ขึ้น\s*ผกก\.)/.test(combined)) {
      data.level = 'ผกก. (เลื่อนจาก รอง ผกก.)';
    } else if (/(เลื่อน.*เป็น\s*(รอง\s*ผกก\.|สวญ\.)|ขึ้น\s*(รอง\s*ผกก\.|สวญ\.))/.test(combined)) {
      data.level = 'รอง ผกก. / สวญ. (เลื่อนจาก สว.)';
    } else if (/(เลื่อน.*เป็น\s*สว\.|ขึ้น\s*สว\.)/.test(combined)) {
      data.level = 'สว. (เลื่อนจาก รอง สว.)';
    } else if (/รอง\s*(ผบก\.|ผู้บังคับการ)/.test(combined)) {
      if (data.analysis_tier === 'general') {
        data.level = 'รอง ผบก. / เทียบเท่า';
      } else {
        data.level = isRotation ? 'รอง ผบก. (สับเปลี่ยนหมุนเวียนระดับเท่าเดิม)' : 'รอง ผบก. (เลื่อนจาก ผกก.)';
      }
    } else if (/(ผกก\.|ผู้กำกับการ)/.test(combined) && !/รอง\s*(ผกก\.|ผู้กำกับการ)/.test(combined)) {
      if (isRotation || /หัวหน้าสถานี/.test(combined)) {
        data.level = 'ผกก. (สับเปลี่ยนหมุนเวียนระดับเท่าเดิม)';
      } else {
        data.level = 'รอง ผบก. (เลื่อนจาก ผกก.)';
      }
    } else if (/(รอง\s*ผกก\.|รองผู้กำกับการ|สวญ\.|สารวัตรใหญ่)/.test(combined)) {
      data.level = isRotation
        ? 'รอง ผกก. / สวญ. (สับเปลี่ยนหมุนเวียนระดับเท่าเดิม)'
        : 'ผกก. (เลื่อนจาก รอง ผกก.)';
    } else if (/(รอง\s*สว\.|รองสารวัตร|ร\.ต\.[อทต]\.)/.test(combined)) {
      data.level = 'สว. (เลื่อนจาก รอง สว.)';
    } else if (/(สว\.|สารวัตร|พ\.ต\.ต\.)/.test(combined)) {
      data.level = isRotation ? 'สว. (สับเปลี่ยนหมุนเวียนระดับเท่าเดิม)' : 'รอง ผกก. / สวญ. (เลื่อนจาก สว.)';
    } else if (/พ\.ต\.อ\./.test(combined)) {
      data.level = data.analysis_tier === 'general' ? 'รอง ผบก. / เทียบเท่า' : 'รอง ผบก. (เลื่อนจาก ผกก.)';
    } else if (/พ\.ต\.ท\./.test(combined)) {
      data.level = 'ผกก. (เลื่อนจาก รอง ผกก.)';
    }
  }

  if (data.analysis_tier === 'sub_general_to_inspector') {
    if (!data.appointment_motion && combined) {
      if (/หัวหน้าสถานี/.test(combined)) data.appointment_motion = 'station_chief_transfer';
      else if (/ข้ามหน่วย/.test(combined)) data.appointment_motion = 'cross_unit_transfer';
      else if (isRotation) data.appointment_motion = 'rotation_equal';
      else data.appointment_motion = 'promotion';
    }
    if (!data.unit_type && combined) {
      if (/(ภ\.[๑-๙1-9]|ตำรวจภูธรภาค|บช\.น\.|บช\.ก\.|สตม\.|บช\.ปส\.|บช\.สอท\.|ตชด\.|บช\.ทท\.|บช\.ส\.|สพฐ\.)/.test(combined)) {
        data.unit_type = 'non_opb_bch';
      } else if (/(สยศ\.|สกพ\.|สงป\.|สกบ\.|สทส\.|กมค\.|จต\.|สตร\.|วน\.|ตท\.|รพ\.ตร\.|บช\.ศ\.|รร\.นรต\.|สง\.ผบ\.ตร\.)/.test(combined)) {
        data.unit_type = 'opb_unit';
      }
    }
  }

  if (!data.title) {
    const parts = [
      data.external_case_ref ? `สำนวน ${data.external_case_ref}` : '',
      [data.rank_position, data.subject_name].filter(Boolean).join(' '),
      data.level || '',
    ].filter(Boolean);
    if (parts.length) {
      data.title = `วิเคราะห์การแต่งตั้ง · ${parts.join(' · ')}`.slice(0, 180);
    } else if (data.claim) {
      data.title = `วิเคราะห์การแต่งตั้ง · ${data.claim.slice(0, 80)}`;
    } else if (data.issues) {
      data.title = `วิเคราะห์การแต่งตั้ง · ${data.issues.slice(0, 80)}`;
    } else {
      data.title = 'งานวิเคราะห์การแต่งตั้งข้าราชการตำรวจ (ข้อมูลเบื้องต้น)';
    }
  }

  return data;
}

export function cleanInput(p, old) {
  const data = { ...old };
  for (const f of [
    'title',
    'external_case_ref',
    'subject_name',
    'rank_position',
    'analysis_tier',
    'level',
    'account',
    'appointment_motion',
    'unit_type',
    'unit_name',
    'annex_status',
    'claim',
    'response',
    'issues',
  ]) {
    if (f in p) {
      if (typeof p[f] !== 'string' || p[f].length > 60000) fail('ข้อมูลช่อง ' + f + ' ไม่ถูกต้อง');
      data[f] = p[f].trim();
    }
  }
  const hasPrevIdentity = Boolean(old.subject_name || old.level || old.account);
  if (
    hasPrevIdentity &&
    (data.subject_name !== old.subject_name || data.level !== old.level || data.account !== old.account)
  ) {
    const removed = new Set((data.references || []).filter((r) => r.kind === 'seniority').map((r) => r.id));
    data.facts = (data.facts || []).map((f) =>
      f.citations.some((x) => removed.has(x)) ? { ...f, status: 'unresolved' } : f,
    );
    data.manual_seniority = null;
    data.references = (data.references || []).filter((r) => r.kind !== 'seniority');
    data.vacancies = null;
  }
  inferMissingInputFields(data);
  return data;
}
export function validateCitations(ids, j) {
  const allowed = new Set([
    ...j.data.references.filter((r) => r.reviewed && r.role !== 'reference_only').map((r) => r.id),
    ...j.documents.filter((d) => d.data.reviewed).map((d) => 'doc-' + d.id),
  ]);
  if (!Array.isArray(ids) || ids.some((x) => !allowed.has(x))) fail('ต้องอ้างหลักฐานที่ตรวจแล้วของงานนี้');
}
export function invalidateDocument(j, id) {
  const affected = new Set([
    'doc-' + id,
    ...j.data.references.filter((r) => r.document_id === id).map((r) => r.id),
  ]);
  j.data.references = j.data.references.map((r) => (r.document_id === id ? { ...r, reviewed: false } : r));
  j.data.facts = j.data.facts.map((f) =>
    f.citations.some((x) => affected.has(x)) ? { ...f, status: 'unresolved' } : f,
  );
  if (
    j.data.vacancies &&
    (affected.has(j.data.vacancies.vacancy_reference) || affected.has(j.data.vacancies.rule_reference))
  )
    j.data.vacancies = null;
}
export function boundedAppend(items, value) {
  if (items.length >= 200) fail('ประวัติงานถึงขีดจำกัด กรุณาสร้างงานต่อเนื่องใหม่ (ไม่ลบประวัติเดิม)', 409);
  items.unshift(value);
}
export function invalidateSource(j, id) {
  j.data.facts = j.data.facts.map((f) => (f.citations.includes(id) ? { ...f, status: 'unresolved' } : f));
  if (
    j.data.vacancies &&
    (j.data.vacancies.vacancy_reference === id || j.data.vacancies.rule_reference === id)
  )
    j.data.vacancies = null;
}
export function assertSameOrigin(origin, host, production) {
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    fail('Origin ไม่ถูกต้อง', 403);
  }
  if (
    !host ||
    parsed.host !== host.toLowerCase() ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    (production ? parsed.protocol !== 'https:' : !['http:', 'https:'].includes(parsed.protocol))
  )
    fail('Origin ไม่ถูกต้อง', 403);
}
