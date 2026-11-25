// 自架中文字型（2026-11-25 測試版）：把 @fontsource 的 Noto Serif TC／Noto Sans TC 複製到 public/fonts/<版本>/，
// 產兩支 CSS：all.css（全部 swap，跟原本 Google 一樣）、heading-block.css（宋體 500–700 用 block，給登入類頁面，
// 對應 BaseLayout 的 headingFontBlock）。切片（unicode-range）跟 Google 字型一模一樣，每頁只下載用到的字。
// public/fonts/ 不進版控，每次建置重產。
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const pkgDir = (name) => dirname(require.resolve(`@fontsource/${name}/package.json`));
const VERSION = JSON.parse(readFileSync(join(pkgDir('noto-serif-tc'), 'package.json'), 'utf8')).version;
const OUT = join(ROOT, 'public', 'fonts', VERSION);
const FAMILIES = [
  { pkg: 'noto-serif-tc', weights: [300, 400, 500, 600, 700] },
  { pkg: 'noto-sans-tc', weights: [400, 500, 600, 700] },
];

rmSync(join(ROOT, 'public', 'fonts'), { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
let files = 0;
const faces = { swap: [], block: [] };
for (const { pkg, weights } of FAMILIES) {
  for (const w of weights) {
    const css = readFileSync(join(pkgDir(pkg), `${w}.css`), 'utf8');
    for (const block of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
      const m = block.match(/url\(\.\/files\/([^)]+\.woff2)\)/);
      if (!m) continue;
      if (!existsSync(join(OUT, m[1]))) { copyFileSync(join(pkgDir(pkg), 'files', m[1]), join(OUT, m[1])); files++; }
      const face = block
        .replace(/src:[^;]+;/, `src: url(./${m[1]}) format('woff2');`)
        .replace(/\s*\/\*[^*]*\*\//g, '');
      faces.swap.push(face);
      const heavySerif = pkg === 'noto-serif-tc' && w >= 500;
      faces.block.push(heavySerif ? face.replace(/font-display:\s*swap/, 'font-display: block') : face);
    }
  }
}
const head = `/* 自動產生：scripts/fonts/build.mjs（@fontsource ${VERSION}）。別手改。 */\n`;
writeFileSync(join(OUT, 'all.css'), head + faces.swap.join('\n') + '\n');
writeFileSync(join(OUT, 'heading-block.css'), head + faces.block.join('\n') + '\n');
for (const f of ['src/layouts/BaseLayout.astro', 'src/components/FunnelDocument.astro']) {
  if (!readFileSync(join(ROOT, f), 'utf8').includes(`const FONT_VER = '${VERSION}';`)) {
    console.error(`\n✗ ${f} 的 FONT_VER 不是 ${VERSION}（@fontsource 版本換了？），請一起改\n`); process.exit(1);
  }
}
console.log(`fonts: ${VERSION}，${files} 個字型檔，${faces.swap.length} 組 @font-face`);
