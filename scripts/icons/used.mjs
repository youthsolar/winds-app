// 找出全站用到的 Phosphor 圖示名稱（subset.py 與 check.mjs 共用這份規則）。
// 規則（寧多勿漏）：class 裡的 ph-名稱，加上全站任何加引號的字串只要剛好是 Phosphor 圖示名稱就保留
// （涵蓋 ic("名稱")、三元式、陣列、JSON 的 "icon": "名稱"…）。多收幾個沒用到的字只多幾 KB。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIRS = ['src', 'public/assets'];
const EXT = /\.(astro|ts|tsx|js|mjs|html|md|mdx|json|css)$/;
const SKIP = /(^|\/)(phosphor-[a-z]+\.css|node_modules)$/;
const WEIGHTS = new Set(['thin', 'light', 'bold', 'fill', 'duotone']);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const FULL_CSS = join(ROOT, 'scripts/icons/full/phosphor-regular.css');
export const ALL = new Set([...readFileSync(FULL_CSS, 'utf8').matchAll(/\.ph\.ph-([a-z0-9-]+):before/g)].map((m) => m[1]));

export function usedIcons() {
  const names = new Set();
  for (const d of DIRS) {
    for (const f of walk(join(ROOT, d), [])) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/\bph-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) if (!WEIGHTS.has(m[1])) names.add(m[1]);
      for (const m of s.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g)) if (ALL.has(m[1])) names.add(m[1]);
    }
  }
  return names;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log([...usedIcons()].sort().join('\n'));
