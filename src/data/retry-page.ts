// 商品頁／元辰財庫頁讀不到商品目錄時回的 503 頁（2026-09-28，gpt-6-astra 複核）。
// 原本只回一行純文字；從綠界門市地圖選完店回來剛好遇到的話，客人不知道選好的門市還在不在。
// 填的資料存在 sessionStorage、門市在網址參數裡，重新整理就能接著用，這頁就是把這件事講清楚＋給一顆重新整理。
export function retryPage(): Response {
  const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>稍等一下｜找風問幸福</title>
<style>
:root{--bg:#FBF8F3;--ink:#2E2823;--muted:#6E6359;--accent:#C18C84}
@media (prefers-color-scheme:dark){:root{--bg:#1F1B18;--ink:#F3EDE6;--muted:#B9AEA3}}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Noto Serif TC",serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
main{max-width:420px;text-align:center}
h1{font-size:22px;font-weight:500;margin:0 0 10px}
p{font-size:15px;line-height:1.8;color:var(--muted);margin:0 0 22px}
button{font:inherit;font-size:15px;padding:12px 26px;border-radius:999px;border:0;background:var(--accent);color:#fff;cursor:pointer}
</style></head>
<body><main><h1>暫時讀不到商品資料</h1>
<p>是我們這邊的問題。你填的資料和選好的門市都還在，過一下再按重新整理就能接著付款。</p>
<button type="button" onclick="location.reload()">重新整理</button></main></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '30' } });
}
