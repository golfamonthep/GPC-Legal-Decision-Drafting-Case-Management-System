import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RegistryRedBadge } from '../components/RegistryRedBadge';

test('advanced search red badge preserves arbitrary completion text, never a stale extracted number', () => {
  const completed = renderToStaticMarkup(createElement(RegistryRedBadge, { record: { registryRedText: 'แดงแล้ว (รอเลข)', redNumber: null } }));
  assert.match(completed, /แดง: แดงแล้ว \(รอเลข\)/);
  const pending = renderToStaticMarkup(createElement(RegistryRedBadge, { record: { registryRedText: '  ', redNumber: '999/69' } }));
  assert.match(pending, /ไม่มีเรื่องแดง/);
  assert.doesNotMatch(pending, /999/);
});
