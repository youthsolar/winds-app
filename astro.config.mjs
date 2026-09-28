// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// 2026-09-28：/services/[slug]、/shop/、/shop/[id] 改成每次請求即時讀（prerender=false），sitemap 外掛不會自動收它 →
// build 時抓一次目錄補進 customPages。抓不到就讓 build 失敗（跟原本 getStaticPaths 抓不到一樣顯性），不發一份少了項目頁的 sitemap。
async function servicePages() {
  const get = async (p) => { const r = await fetch('https://api.winds.tw' + p); if (!r.ok) throw new Error(`sitemap：${p} 回 ${r.status}`); return r.json(); };
  const [sb, es] = await Promise.all([get('/sb-services'), get('/shop-products')]);
  return [
    ...(sb.services || []).filter((x) => x && x.name).map((x) => `https://winds.tw/services/sb-${x.id}/`),
    ...(es.products || []).filter((x) => x && x.name).map((x) => `https://winds.tw/services/es-${x.id}/`),
    // /shop/ 與 /shop/<id>/ 同日也改成即時讀，一起補
    'https://winds.tw/shop/',
    ...(es.products || []).filter((x) => x && x.name).map((x) => `https://winds.tw/shop/${x.id}/`),
  ];
}
const SERVICE_PAGES = await servicePages();

/**
 * 剝掉文章 markdown 結尾 Content-Alchemy pipeline 埋入的促銷區塊
 * （「## 💫 相關推薦」+ 法器連結 + 「✨ 免費占卜 CTA」）。
 * 這段跟新版文章頁模板的「為你推薦 / 文末 CTA」面板重複，且含 emoji/「免費」/外連紅線。
 * build 時從 mdast 移除：找含「相關推薦」的標題（或免費占卜 CTA 段），連同其前的 --- 砍到文末。
 * 不改 346 個 source 檔、可逆；pipeline 之後若再加也會在 build 被剝。
 * 例外：文末純 #關鍵字段（SEO/GEO/AEO）不剝，會搬回文末保留。
 */
function remarkStripTrailingPromo() {
  const EMOJI = /\p{Extended_Pictographic}/u;               // 任何 emoji（真案例內文不會有）
  const KW = ['相關推薦', '立即預約', '立即開始', '免費占卜', '預約諮詢', '想更深入了解', '走到了瓶頸', '一對一靈性諮詢'];
  const PROMO_HOST = /(?:app\.)?winds\.tw|easy\.co|zijiawangzijia|easystore/i;
  const TAGS_ONLY = /^(?:#[^#\s]+){3,}$/;                  // 文末 #關鍵字段（SEO/GEO 用，不剝）
  return (tree) => {
    const ch = tree.children || [];
    const flat = (n, acc) => {
      if (n.value) acc.text += n.value;
      if (n.type === 'link' && n.url) acc.urls.push(n.url);
      (n.children || []).forEach((c) => flat(c, acc));
      return acc;
    };
    const isTags = (n) =>
      n.type === 'paragraph' && TAGS_ONLY.test(flat(n, { text: '', urls: [] }).text.replace(/\s+/g, ''));
    const isPromo = (n) => {
      if (n.type !== 'heading' && n.type !== 'paragraph') return false;
      if (isTags(n)) return false;
      const a = flat(n, { text: '', urls: [] });
      return EMOJI.test(a.text) || KW.some((k) => a.text.includes(k)) || a.urls.some((u) => PROMO_HOST.test(u));
    };
    /* 2026-09-28（gpt-6-astra 體檢）：原本「第一個像促銷的段落」就開始往後砍到文末——正文裡出現「想更深入了解」
       「預約諮詢」或任何表情符號（💡、😂）就被當成起點，blog-257／258／275／marriagerestoration 正文幾乎全空，
       另有 4 篇被砍掉一半以上。改成只剝「明確標記」的文末區塊：
         ① 有「相關推薦」標題 → 從那裡剝（Content-Alchemy 的固定格式）
         ② 否則從文末往回，只剝最後面連在一起的促銷段落／站內連結清單／分隔線，碰到一般正文就停
       全站比對：432 篇結果不變；24 篇不同＝8 篇救回被誤砍的正文、16 篇保留作者自己的結語段。
       （同日複核再修：往回找遇到分隔線就停、清單只在分隔線圍起的區塊內才剝，見下方） */
    const isPromoList = (n) => {
      if (n.type !== 'list') return false;
      const a = flat(n, { text: '', urls: [] });
      return a.urls.length > 0 && a.urls.every((u) => PROMO_HOST.test(u));
    };
    let cut = -1;
    for (let i = 0; i < ch.length; i++) {
      if (ch[i].type === 'heading' && flat(ch[i], { text: '', urls: [] }).text.includes('相關推薦')) { cut = i; break; }
    }
    if (cut < 0) {
      /* 2026-09-28（gpt-6-astra 剝除器第四輪複核）改成照真實促銷的結構判斷，不再靠「跳過幾條分隔線」的特例：
         ① 略過文末標籤與收尾分隔線 ② 只看最後一個區塊（碰到分隔線就停，不越界）
         ③ 區塊內全部是促銷段落／站內連結清單，而且至少有一段「帶本站連結」的促銷（CTA）才剝——只有關鍵字或只有清單都不算
         ④ 沒有起始分隔線時，只剝最後連續的促銷段落（不含清單），同樣要有 CTA
         全站 456 篇與上一版結果完全相同；8 個合成情境（含複核抓到的引用句＋參考清單）皆正確。 */
      const isCTA = (n) => (n.type === 'paragraph' || n.type === 'heading') && !isTags(n)
        && flat(n, { text: '', urls: [] }).urls.some((u) => PROMO_HOST.test(u) || /^\/(?!\/)/.test(u));   // 站內相對路徑（/booking/）也算本站連結
      let end = ch.length;
      while (end > 0 && (isTags(ch[end - 1]) || ch[end - 1].type === 'thematicBreak')) end--;
      let i = end;
      while (i > 0 && ch[i - 1].type !== 'thematicBreak') i--;
      const block = ch.slice(i, end);
      if (i > 0 && block.length && block.every((n) => isPromo(n) || isPromoList(n)) && block.some(isCTA)) {
        cut = i - 1;
      } else {
        let k = end;
        while (k > i && isPromo(ch[k - 1])) k--;
        if (k < end && ch.slice(k, end).some(isCTA)) cut = k;
      }
    }
    if (cut >= 0) {
      let start = cut;
      if (start > 0 && ch[start - 1].type === 'thematicBreak') start -= 1;
      const tags = ch.splice(start).filter(isTags);
      if (tags.length) ch.push(...tags);   // 促銷剝掉，文末標籤段搬回來
    }
    ch.forEach((n) => {                    // 標籤段：掛 class 給樣式用；data-nocjk 讓 cjk-wrap.js 別插 <wbr>
      if (!isTags(n)) return;
      const list = flat(n, { text: '', urls: [] }).text.split(/\s+/).filter(Boolean);
      n.data = n.data || {};
      n.data.hProperties = { className: ['post-tags'], 'data-nocjk': 'true' };
      // 每個標籤各自包一層 span：Chrome 的 keep-all 不擋「# 接中文」的斷點，只有 nowrap 擋得住
      n.data.hChildren = list.flatMap((t, i) => {
        const el = { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: t }] };
        return i ? [{ type: 'text', value: ' ' }, el] : [el];
      });
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://winds.tw',
  output: 'static',
  redirects: { '/home': '/' },  // root flip（2026-07-09）：首頁＝winds.tw/，舊 /home 301 回根
  markdown: {
    remarkPlugins: [remarkStripTrailingPromo],
  },
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      customPages: SERVICE_PAGES,
      // home/share/spirit 皆已是真實 Astro 頁，會自動帶入（含 trailing slash）；
      // 舊 customPages 的無斜線版本會造成重複條目，已移除
      // 2026-09-02：私人／功能頁不進 sitemap（登入牆後或無獨立內容，屬稀薄頁）
      filter: (page) => ![
        '/auth/', '/history', '/account/', '/login/',
        '/report/', '/share/', '/bookings/', '/booking-chat/',
        // 這兩頁掛 noindex（JS 殼、可爬內容不足），留在 sitemap 等於自己跟自己打架
        '/divination/', '/spirit/', '/teacher-ziwei/',
        // 內部 CRM（2026-09-03），密碼閘＋noindex，絕不進 sitemap
        '/crm/',
        // 一頁式 dev 預覽（2026-09-03），noindex
        '/lp/',
        // 訂單狀態頁（2026-09-28）：個人訂單查詢，noindex
        '/shop/order/',
      ].some((x) => page.includes(x)),
    }),
  ],
});