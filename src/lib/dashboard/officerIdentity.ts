const rank = /(?:ว่าที่\s*)?(?:(?:พล|พ|ร)\s*\.?\s*ต\s*\.?\s*(?:ท|อ|ต)\s*\.?|จ\.?\s*ส\.?\s*ต\.?|ด\.?\s*ต\.?)(?:\s*(?:หญิง|ญ\.?))?/gu;

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
      const clean = line.replace(/\([^)]*\)/g, ' ').replace(/[\u200b]+/g, ' ').replace(/\s+/g, ' ').trim();
      const words = clean.split(' ').filter(Boolean);
      if (words.length === 1) {
        if (old) pending = '';
        else if (!found.length) pending = pending ? `${pending} ${clean}` : clean;
      } else if (words.length === 2) {
        if (pending && !found.length && pending.split(' ').length === 1) pending = '';
        if (!old) found.push(clean);
        pending = '';
      }
    }
    if (!found.length && pending.split(' ').length === 2) found.push(pending);
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
  if (left.length !== 2 || right.length !== 2) return false;
  if (left[0].length < 4 || right[0].length < 4 || left[1].length < 4 || right[1].length < 4) return false;
  return left[1] === right[1] && oneEditApart(left[0], right[0]) ||
    left[0] === right[0] && oneEditApart(left[1], right[1]);
}

export function buildOfficerDirectory(rawNames: Array<string | null | undefined>) {
  const counts = new Map<string, number>();
  for (const raw of rawNames) for (const name of parseCurrentNames(raw)) counts.set(name, (counts.get(name) ?? 0) + 1);
  const ordered = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th')).map(([name]) => name);
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
      return [...new Set(parseCurrentNames(raw).map(name => {
        if (canonical.has(name)) return canonical.get(name)!;
        const matches = anchors.filter(anchor => likelySamePerson(name, anchor));
        return matches.length === 1 ? matches[0] : name;
      }))];
    },
  };
}
