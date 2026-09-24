import { defineMiddleware } from 'astro:middleware';
import esRedirects from './data/es-redirects.json';
import { env } from 'cloudflare:workers';

// EasyStore（shop.winds.tw）舊網址 → winds.tw 新位置；2026-09-03 內容搬遷後啟用。
// 只攔 ES 專屬路徑前綴（winds.tw 本站沒有這些路徑），shop.winds.tw 路由掛上本 worker 後其餘一律導回 /shop/。
const MAP = new Map<string, string>(esRedirects as [string, string][]);
const ES_PREFIX = /^\/(blogs|pages|products|collections|cart|checkout|search)(\/|$)/;
const BASE = 'https://winds.tw';

/* 純文字版（2026-09-24）：任何頁面網址尾巴加 /text/ → 取同一頁的伺服器輸出，拆掉 script／style／nav／svg／iframe 只留文案，
   給不跑 JavaScript 的讀取端（ChatGPT 的網頁工具連 winds.tw 4KB 純頁都說 not accessible，先備一條穩的路＋供合成 MD）。
   noindex、canonical 指回原頁，不搶索引。原頁若不是 HTML 或非 200 就原樣回。 */
const TEXT_RE = /^(\/.*?)\/text\/?$/;
function stripBlock(h: string, open: string): string {
  const i = h.indexOf(open); if (i < 0) return h;
  const re = /<div\b|<\/div>/gi; re.lastIndex = i; let depth = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(h))) { depth += m[0][1] === '/' ? -1 : 1; if (depth === 0) return h.slice(0, i) + h.slice(m.index + m[0].length); }
  return h;
}
function toText(html: string, canon: string): string {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer class="zf-footer"[\s\S]*?<\/footer>/gi, '')
    .replace(/<select[\s\S]*?<\/select>/gi, '')
    .replace(/<textarea[\s\S]*?<\/textarea>/gi, '')
    .replace(/<p class="lw-hex-line lw-hex-line-desk"[^>]*>[\s\S]*?<\/p>/gi, '') // 主題卦頁：同一句桌機／手機各一份，CSS 只顯示一份，文字版只留一份
    .replace(/<span\b/gi, ' <span') // 行內標籤（chip）之間補空白，免得三個標籤黏成一句
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const head = '<meta name="robots" content="noindex,follow"><link rel="canonical" href="' + canon + '">' +
    '<style>body{margin:0;background:#FBF8F3;color:#2B2622;font-family:"Noto Serif TC","Songti TC",serif;line-height:1.85;max-width:680px;padding:28px 20px 56px;margin:0 auto}h1{font-size:26px;font-weight:500;line-height:1.3}h2{font-size:20px;font-weight:500}h3{font-size:16px;font-weight:500}p,li{font-size:15.5px}a{color:#B4746A}button{display:none}.text-note{margin-top:40px;padding-top:16px;border-top:1px solid #E6DED6;font-size:13px;color:#8A7F76}</style>';
  h = stripBlock(h, '<div class="wc-root"'); // 右下角風小編小工具（巢狀 div，用深度計數切掉）
  h = h.replace(/<\/head>/i, head + '</head>');
  h = h.replace(/<\/body>/i, '<p class="text-note">這一頁是 <a href="' + canon + '">' + canon + '</a> 的文字版，只有文案、沒有功能。</p></body>');
  return h;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { host, pathname } = ctx.url;
  const tm = host !== 'shop.winds.tw' && TEXT_RE.exec(pathname);
  if (tm) {
    const base = (tm[1] || '/') + (tm[1] ? '/' : '');
    // 站是 output:'static'＋少數 prerender=false：預先產好的頁在 ASSETS（next() 改寫不到會 500），SSR 頁才走 next(base)
    let res: Response | null = null;
    const assets = (env as any).ASSETS; // Astro v6：locals.runtime.env 已移除，改從 cloudflare:workers 拿 binding
    if (assets) { const a = await assets.fetch(new Request(new URL(base, ctx.url))); if (a.status === 200) res = a; }
    if (!res) { try { res = await next(base); } catch { return new Response('Not Found', { status: 404 }); } }
    const ct = res.headers.get('content-type') || '';
    if (res.status !== 200 || !ct.includes('text/html')) return res;
    const html = toText(await res.text(), BASE + base);
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate', 'x-robots-tag': 'noindex' } });
  }
  const isShopHost = host === 'shop.winds.tw';
  if (!isShopHost && !ES_PREFIX.test(pathname)) return next();

  const p = pathname.replace(/\/+$/, '') || '/';
  let to = MAP.get(p);
  if (!to) {
    if (p.startsWith('/blogs')) to = '/blog/';
    else if (p.startsWith('/pages')) to = '/';
    else if (ES_PREFIX.test(p)) to = '/shop/';
    else if (isShopHost) to = '/shop/';
  }
  if (!to) return next();
  return new Response(null, { status: 301, headers: { Location: BASE + encodeURI(to) } });
});
