// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * 剝掉文章 markdown 結尾 Content-Alchemy pipeline 埋入的促銷區塊
 * （「## 💫 相關推薦」+ 法器連結 + 「✨ 免費占卜 CTA」）。
 * 這段跟新版文章頁模板的「為你推薦 / 文末 CTA」面板重複，且含 emoji/「免費」/外連紅線。
 * build 時從 mdast 移除：找含「相關推薦」的標題（或免費占卜 CTA 段），連同其前的 --- 砍到文末。
 * 不改 346 個 source 檔、可逆；pipeline 之後若再加也會在 build 被剝。
 */
function remarkStripTrailingPromo() {
  const EMOJI = /\p{Extended_Pictographic}/u;               // 任何 emoji（真案例內文不會有）
  const KW = ['相關推薦', '立即預約', '立即開始', '免費占卜', '預約諮詢', '想更深入了解', '走到了瓶頸', '一對一靈性諮詢'];
  const PROMO_HOST = /(?:app\.)?winds\.tw|easy\.co|zijiawangzijia|easystore/i;
  return (tree) => {
    const ch = tree.children || [];
    const flat = (n, acc) => {
      if (n.value) acc.text += n.value;
      if (n.type === 'link' && n.url) acc.urls.push(n.url);
      (n.children || []).forEach((c) => flat(c, acc));
      return acc;
    };
    const isPromo = (n) => {
      if (n.type !== 'heading' && n.type !== 'paragraph') return false;
      const a = flat(n, { text: '', urls: [] });
      return EMOJI.test(a.text) || KW.some((k) => a.text.includes(k)) || a.urls.some((u) => PROMO_HOST.test(u));
    };
    let cut = -1;
    for (let i = 0; i < ch.length; i++) { if (isPromo(ch[i])) { cut = i; break; } }
    if (cut >= 0) {
      let start = cut;
      if (start > 0 && ch[start - 1].type === 'thematicBreak') start -= 1;
      ch.splice(start);
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://winds.tw',
  output: 'static',
  redirects: { '/': '/home/' },  // apex 首頁＝winds-app /home（有 DS nav/footer）；取代 winds-home 臨時頁（直接帶斜線省一跳）
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
      filter: (page) => !page.includes('/auth/') && !page.includes('/history'),
      customPages: [
        'https://winds.tw/home',
        'https://winds.tw/delivery',
        'https://winds.tw/share',
        'https://winds.tw/spirit',
      ],
    }),
  ],
});