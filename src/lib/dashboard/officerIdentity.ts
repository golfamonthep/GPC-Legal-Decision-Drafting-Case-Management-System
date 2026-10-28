const rank = /(?:ว่าที่\s*)?(?:(?:พล|พ|ร)\s*\.?\s*ต\s*\.?\s*(?:ท|อ|ต)\s*\.?|จ\.?\s*ส\.?\s*ต\.?|ด\.?\s*ต\.?)(?:\s*(?:หญิง|ญ\.?))?/gu;

export const CANONICAL_OFFICERS = [
  { name: 'พิจักษณ์กร โปตระนันทน์', rank: 'พ.ต.ท.' },
  { name: 'สุรพัตร์ วัลลา', rank: 'พ.ต.ท.' },
  { name: 'สลิลดา ธีระวัฒน์', rank: 'พ.ต.ต.หญิง' },
  { name: 'ชญาณ์พิมพ์ บัวดิษฐ์เดชา', rank: 'พ.ต.ต.หญิง' },
  { name: 'ธีรพงษ์ มั่นประสิทธิ์', rank: 'พ.ต.ต.' },
  { name: 'สุพัฒน์ โชติไกรสิทธิ์', rank: 'พ.ต.ท.' },
  { name: 'กรรพี วีระเดช', rank: 'ร.ต.อ.' },
  { name: 'พีระชัย ลือวงศ์ประยูร', rank: 'ร.ต.อ.' },
  { name: 'ธัญสิริ โฆษิตอนันต์', rank: 'ร.ต.อ.หญิง' },
  { name: 'มัชฌิมา ร่มรุกข์', rank: 'พ.ต.ต.หญิง' },
  { name: 'จิรายุส คำมีศรี', rank: 'พ.ต.ท.' },
  { name: 'เกียรติขจร โถวิเชียร', rank: 'พ.ต.ท.' },
  { name: 'ชรินทร์ พันธชิต', rank: 'พ.ต.ท.' },
  { name: 'วัฒนา สุระพัฒน์', rank: 'ว่าที่ พ.ต.ท.' },
  { name: 'ณัฐ ธีระวัฒน์', rank: 'ร.ต.ท.' },
  { name: 'พิชญรัช ระวังวงศ์', rank: 'ว่าที่ ร.ต.ท.' },
  { name: 'ศิริลักษณ์ กองจักร', rank: 'ว่าที่ ร.ต.ต.หญิง' },
  { name: 'ปราโมทย์ พุ่มบรรเทา', rank: '' },
] as const;

export const CANONICAL_OFFICER_RANKS = new Map<string, string>(
  CANONICAL_OFFICERS.map(o => [o.name, o.rank])
);

const confirmedAliases = new Map([
  ['ชญาณทิพย์ บัวดิษฐ์เดชา', 'ชญาณ์พิมพ์ บัวดิษฐ์เดชา'],
  ['พิจักษ์กร โปตระนันท์', 'พิจักษณ์กร โปตระนันทน์'],
  ['สุรพัฒน์ วัลลา', 'สุรพัตร์ วัลลา'],
  ['สุรพัตล์ วัลลา', 'สุรพัตร์ วัลลา'],
  ['สลิตา ธีระวัฒน์', 'สลิลดา ธีระวัฒน์'],
  ['ธีรงษ์ มั่นประสาทธิ์', 'ธีรพงษ์ มั่นประสิทธิ์'],
  ['สุพัฒน์ ชติไกรสิทธิ์', 'สุพัฒน์ โชติไกรสิทธิ์'],
  ['กรรรพี วีระเดช', 'กรรพี วีระเดช'],
  ['กรรพี วรวีรเดชอาร์ม', 'กรรพี วีระเดช'],
  ['พีระชัย สือวงศ์ประยูร', 'พีระชัย ลือวงศ์ประยูร'],
  ['มัชณิมา ร่มรุกข์', 'มัชฌิมา ร่มรุกข์'],
  ['จีรายุส คำมีศรี', 'จิรายุส คำมีศรี'],
  ['เกรียติขจร โถวิเชียร', 'เกียรติขจร โถวิเชียร'],
  ['ณัฐ ธีรวัฒน์', 'ณัฐ ธีระวัฒน์'],
  ['ศิริลักษณ์ กองจักร์', 'ศิริลักษณ์ กองจักร'],
  ['ปราโมท พุ่มบรรเทา', 'ปราโมทย์ พุ่มบรรเทา'],
]);

function canonicalName(name: string) {
  return confirmedAliases.get(name) ?? name;
}

function parseCurrentNames(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  // A successor mentioned only by a first name cannot safely be attributed a case.
  if (/รับช่วงต่อ/.test(raw) && !/\(ใหม่\)/.test(raw) && !/[^\s()]+\s+[^\s()]+\s+รับช่วงต่อ/.test(raw)) return [];
  const withoutNotes = raw.replace(/\r/g, '')
    .replace(/\((?!\s*(?:เก่า|ใหม่)\s*\))[^)]*\)/g, ' ');
  const withoutHelpers = withoutNotes.split('\n').map(line => {
    const marker = /ผู้ช่วย|ช่วยฯ|ช่วยงาน/.exec(line);
    if (!marker) return line;
    const before = line.slice(0, marker.index);
    const after = line.slice(marker.index + marker[0].length);
    const hasHelperName = after.trim().split(/\s+/).length >= 2;
    const hasOwnerName = before.trim().split(/\s+/).length >= 2;
    return hasOwnerName && (hasHelperName || /(?:พล|พ|ร)\s*\.?\s*ต\s*\.?/u.test(after)) ? before : '';
  }).join('\n');
  const separated = withoutHelpers
    .replace(/\s*รับช่วงต่อ[^\n]*/g, ' ')
    .replace(rank, '|');
  const parts = separated.split(/[+|,;]+/);
  const names = parts.flatMap(part => {
    const found: string[] = [];
    let pending = '';
    for (const line of part.split(/\n+/)) {
      if (/ผู้ช่วย|ช่วยฯ|ช่วยงาน/.test(line)) continue;
      const old = /\(\s*เก่า\s*\)/.test(line);
      const clean = line.replace(/\([^)]*\)/g, ' ').replace(/[\u200b]+/g, ' ').replace(/\s+/g, ' ').trim()
        .replace(/^(?:(?:นาย|นางสาว|นาง|น\.\s*ส\.|ดร\.)|(?:พัน|ร้อย|พล)ตำรวจ(?:เอก|โท|ตรี))\s+/u, '');
      const words = clean.split(' ').filter(Boolean);
      if (words.length === 1) {
        if (old) pending = '';
        else if (!found.length) pending = pending ? `${pending} ${clean}` : clean;
      } else if (words.length === 2 || words.length === 3) {
        if (pending && !found.length && pending.split(' ').length === 1) pending = '';
        if (!old) found.push(clean);
        pending = '';
      }
    }
    if (!found.length && [2, 3].includes(pending.split(' ').length)) found.push(pending);
    return found;
  });
  return [...new Set(names)];
}

function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let left = 0, right = 0, changes = 0;
  while (left < a.length && right < b.length) {
    if (a[left] === b[right]) { left++; right++; continue; }
    if (++changes > 1) return false;
    if (a.length >= b.length) left++;
    if (b.length >= a.length) right++;
  }
  return changes + Number(left < a.length || right < b.length) <= 1;
}

function likelySamePerson(a: string, b: string) {
  const left = a.split(' '), right = b.split(' ');
  if (left.length < 2 || left.length > 3 || right.length < 2 || right.length > 3) return false;
  const leftSurname = left.at(-1)!, rightSurname = right.at(-1)!;
  if (left[0].length < 4 || right[0].length < 4 || leftSurname.length < 4 || rightSurname.length < 4) return false;
  return leftSurname === rightSurname && oneEditApart(left[0], right[0]) ||
    left[0] === right[0] && oneEditApart(leftSurname, rightSurname);
}

export function buildOfficerDirectory(rawNames: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const raw of rawNames) for (const parsed of parseCurrentNames(raw)) {
    const name = canonicalName(parsed);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const ordered = [...counts].sort((a, b) => b[1] - a[1] || a[0].split(' ').length - b[0].split(' ').length || a[0].localeCompare(b[0], 'th')).map(([name]) => name);
  const canonical = new Map<string, string>();
  const anchors: string[] = [];
  for (const name of ordered) {
    const matches = anchors.filter(anchor => likelySamePerson(name, anchor));
    const resolved = matches.length === 1 ? matches[0] : name;
    canonical.set(name, resolved);
    if (matches.length !== 1) anchors.push(name);
  }
  return {
    current(raw: string | null | undefined) {
      return [...new Set(parseCurrentNames(raw).map(canonicalName).map(name => {
        if (canonical.has(name)) return canonical.get(name)!;
        const matches = anchors.filter(anchor => likelySamePerson(name, anchor));
        return matches.length === 1 ? matches[0] : name;
      }))];
    },
    primary(raw: string | null | undefined) {
      const names = this.current(raw);
      return names.length > 0 ? names[0] : null;
    },
  };
}
