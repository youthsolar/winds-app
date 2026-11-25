// 建置前檢查：程式裡用到的圖示都要在縮過的字型裡，否則客人會看到空白方框。
// 擋下來時照提示重跑 subset.py 再建置。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, usedIcons } from './used.mjs';

const kept = new Set(JSON.parse(readFileSync(join(ROOT, 'scripts/icons/kept.json'), 'utf8')));
const full = readFileSync(join(ROOT, 'scripts/icons/full/phosphor-regular.css'), 'utf8');
const all = new Set([...full.matchAll(/\.ph\.ph-([a-z0-9-]+):before/g)].map((m) => m[1]));
const missing = [...usedIcons()].filter((n) => all.has(n) && !kept.has(n));
if (missing.length) {
  console.error(`\n✗ 有新圖示還沒放進縮過的字型：${missing.join(', ')}\n  請跑：pip install fonttools brotli && python3 scripts/icons/subset.py\n`);
  process.exit(1);
}
