// 找出全站用到的 Phosphor 圖示名稱（subset.py 與 check.mjs 共用這份規則）。
// 認得兩種寫法：class 裡直接寫 ph-名稱；或資料裡寫 icon: '名稱' 再拼成 ph-${icon}。
// 其他拼法（例如 'ph-' + 變數）抓不到，新增時請改成上面兩種之一。
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

export function usedIcons() {
  const names = new Set();
  for (const d of DIRS) {
    for (const f of walk(join(ROOT, d), [])) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/\bph-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) if (!WEIGHTS.has(m[1])) names.add(m[1]);
      for (const m of s.matchAll(/\bicon\s*:\s*['"]([a-z0-9]+(?:-[a-z0-9]+)*)['"]/g)) names.add(m[1]);
    }
  }
  return names;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log([...usedIcons()].sort().join('\n'));
