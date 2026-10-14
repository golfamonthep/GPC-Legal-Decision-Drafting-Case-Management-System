import { readFile, writeFile } from 'node:fs/promises';
import postcss from 'postcss';
import prefix from 'postcss-prefix-selector';

// Mechanical vendor transform: prevent Bootstrap resets/utilities leaking into GPC's other pages.
const source = new URL('../node_modules/@tabler/core/dist/css/tabler.min.css', import.meta.url);
const target = new URL('../src/app/tabler-scoped.css', import.meta.url);
const vendor = postcss.parse(await readFile(source, 'utf8'));
vendor.walkRules(rule => {
  // Keep Tabler design tokens, not its document/body layout reset.
  if (rule.selector.split(',').some(selector => /^(?:html|body|:root)(?:$|[\s:\[])/.test(selector.trim()))) {
    rule.walkDecls(decl => { if (!decl.prop.startsWith('--')) decl.remove(); });
    if (!rule.nodes.length) rule.remove();
  }
});
const result = await postcss([prefix({ prefix: '.gpc-tabler' })]).process(vendor, { from: source.pathname, map: false });
const css = result.css.replace(/\/\*# sourceMappingURL=[^*]*\*\//g, '').replace(/@charset [^;]+;/, '');
await writeFile(target, `/* Generated from @tabler/core 1.6.1 (MIT); npm run styles:tabler. */\n@layer components {\n${css}\n}\n`);
