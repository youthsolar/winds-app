// 部落格資料來源：WordPress（wp.winds.tw）——2026-09-29 WP 後台遷移
// 只在 WINDS_BLOG_SOURCE=wp 時啟用（content.config.ts 判斷）；平常照舊讀 src/content/blog/*.md
// 規則：網址一律用 winds_source_slug（WP 代稱會去尾「-」且有 200 字元上限），沒有才用 WP slug
import type { Loader, LoaderContext } from 'astro/loaders';
import { glob } from 'astro/loaders';
import GithubSlugger from 'github-slugger';

const SITE = 'https://winds.tw';

const decode = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
   .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

// 目錄用的標題清單（與 Astro markdown 的 headings 同格式：depth／slug／text）
function headingsOf(html: string) {
  const out: { depth: number; slug: string; text: string }[] = [];
  // id 不一定是第一個屬性（WP 的小標是 <h2 class="wp-block-heading" id="…">）
  for (const m of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g)) {
    const id = m[2].match(/\bid="([^"]*)"/);
    if (id) out.push({ depth: Number(m[1]), slug: id[1], text: decode(m[3].replace(/<[^>]+>/g, '')) });
  }
  return out;
}

// 文末 #關鍵字段（跟 astro.config.mjs 的 remarkStripTrailingPromo 同一條）
const TAGS_ONLY = /^(?:#[^#\s]+){3,}$/;
const isTagsText = (t: string) => TAGS_ONLY.test(t.replace(/\s+/g, ''));

/* 在 WP 編輯器裡新寫／改過的內容才需要的整理（2026-09-29）。
   匯入的 456 篇是 winds.tw 同一套 markdown 流程產出的成品，這幾條對它們全都不會動到（整站建置比對過）。
   ① 站內連結：編輯器插的是 wp.winds.tw；文章連結換成 winds.tw 的代稱，其他頁照路徑換網域；上傳的檔案（wp-content）留在 WP
   ② 小標補錨點：目錄與 #連結要用；跟 Astro markdown 一樣用 github-slugger，撞名加 -1、-2
   ③ 「相關推薦」小標以後整段不上站（markdown 剝除規則第①條；winds.tw 頁面自己有「為你推薦」），標籤段搬回文末
   ④ 文末 #標籤段掛 class、每個標籤各包一層（跟 markdown 版相同輸出；data-nocjk 讓 cjk-wrap.js 別插 <wbr>） */
function tidyWpHtml(html: string, postIdBySlug: Map<string, string>): string {
  let h = html.replace(/\s+data-sd-block-id="[^"]*"/g, '');   // 某外掛在輸出時加的標記，前台用不到
  h = h.replace(/\b(href|src)="https?:\/\/wp\.winds\.tw\/(?!wp-content\/)([^"]*)"/g, (_m, attr, path) => {
    const m = path.match(/^blog\/([^/?#]+)\/?([?#].*)?$/);
    const id = m && postIdBySlug.get(decodeURIComponent(m[1]));
    return `${attr}="${SITE}/${id ? `blog/${id}/${m[2] || ''}` : path}"`;
  });
  const used = new Set([...h.matchAll(/<h[1-6]\s[^>]*\bid="([^"]*)"/g)].map((m) => m[1]));
  const slugger = new GithubSlugger();
  h = h.replace(/<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (all, lvl, attrs = '', inner) => {
    if (/\bid="/.test(attrs)) return all;
    const text = decode(inner.replace(/<[^>]+>/g, ''));
    let id = slugger.slug(text);
    while (id && used.has(id)) id = slugger.slug(text);
    if (!id) return all;
    used.add(id);
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
  const cut = h.search(/<h([1-6])\b[^>]*>(?:(?!<\/h\1>)[\s\S])*?相關推薦/);
  if (cut >= 0) {
    const tail = h.slice(cut);
    h = h.slice(0, cut).replace(/\s*<hr\b[^>]*\/?>\s*$/, '').trimEnd();   // 緊接在前面的分隔線一起拿掉
    const tags = [...tail.matchAll(/<p(?:\s[^>]*)?>([^<]*)<\/p>/g)].filter((m) => isTagsText(decode(m[1]))).map((m) => m[0]);
    if (tags.length) h += '\n' + tags.join('\n');
  }
  h = h.replace(/<p(?:\s[^>]*)?>([^<]*)<\/p>/g, (all, inner) => {   // WP 的段落是 <p class="wp-block-paragraph">
    const text = decode(inner);
    if (!isTagsText(text)) return all;
    return `<p class="post-tags" data-nocjk="true">${text.split(/\s+/).filter(Boolean).map((t) => `<span>${t}</span>`).join(' ')}</p>`;
  });
  return h;
}

async function loadFromWp({ store, parseData, logger }: LoaderContext) {
  const site = process.env.WP_SITE, user = process.env.WP_USER, pass = process.env.WP_APP_PASSWORD;
  if (!site || !user || !pass) throw new Error('WINDS_BLOG_SOURCE=wp 需要 WP_SITE／WP_USER／WP_APP_PASSWORD');
  const headers = { Authorization: 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64'), 'User-Agent': 'winds-build/1.0' };
  const get = async (path: string) => {
    const r = await fetch(site + '/wp-json' + path, { headers });
    if (!r.ok) throw new Error(`WP ${path} → ${r.status}`);
    return { data: await r.json(), pages: Number(r.headers.get('X-WP-TotalPages') || '1') };
  };
  const all = async (path: string) => {
    const first = await get(`${path}&per_page=100&page=1`);
    let items = first.data as any[];
    for (let p = 2; p <= first.pages; p++) items = items.concat((await get(`${path}&per_page=100&page=${p}`)).data);
    return items;
  };
  const cats = new Map((await all('/wp/v2/categories?_fields=id,name')).map((c: any) => [c.id, decode(c.name)]));
  // content.rendered：WP 把區塊、嵌入（YouTube）、短代碼都轉成成品 HTML 再給；匯入的文章 rendered 與原文逐字相同（Code Snippets #7 關掉了 WP 的自動加工）
  const posts = await all('/wp/v2/posts?context=edit&status=publish,draft&_fields=id,slug,status,date_gmt,title,excerpt,content,categories,meta');
  // 照原本檔名順序放進資料庫（glob 讀檔的順序）：推薦文章在分數相同時依序挑選，順序不同會挑到別篇
  const idOf = (p: any) => (p.meta?.winds_source_slug || decodeURIComponent(p.slug)) as string;
  posts.sort((a: any, b: any) => (idOf(a) < idOf(b) ? -1 : idOf(a) > idOf(b) ? 1 : 0));
  const postIdBySlug = new Map(posts.map((p: any) => [decodeURIComponent(p.slug), idOf(p)]));
  store.clear();
  for (const p of posts) {
    const m = p.meta || {};
    const id = idOf(p);
    const json = (s: string, d: any) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
    const opt = (s: string) => (s ? s : undefined);
    // 表情符號在 GoDaddy 資料庫只能存成 &#x…; 實體（存檔時由 Code Snippets #10 轉），讀回來還原成字元（與原本 markdown 輸出逐字相同）
    const html = tidyWpHtml(String(p.content.rendered).replace(/&#x(1[0-9a-f]{4});/gi, (_: string, h: string) => String.fromCodePoint(parseInt(h, 16))), postIdBySlug);
    // 分類：用 WP 的分類（匯入時已照 winds_category 建好並指派，全部一致）；沒選分類才退回 winds_category
    const wpCategory = (p.categories || []).map((c: number) => cats.get(c)).find((n: string | undefined) => n && n !== 'Uncategorized');
    const data = await parseData({
      id,
      data: {
        title: decode(p.title.raw),
        description: decode(p.excerpt.raw),
        pubDate: new Date(p.date_gmt + 'Z'),
        updatedDate: opt(m.winds_updated_date),
        heroImage: opt(m.winds_hero_image),
        tags: json(m.winds_tags_json, []),
        author: m.winds_author || '找風問幸福',
        seoTitle: opt(m.winds_seo_title),
        ogImage: opt(m.winds_og_image),
        llmDescription: opt(m.winds_llm_description),
        category: wpCategory || opt(m.winds_category),
        relatedServices: json(m.winds_related_services_json, []),
        faq: json(m.winds_faq_json, []),
        draft: p.status !== 'publish',
        esSource: opt(m.winds_es_source),
      },
    });
    store.set({ id, data, body: html, rendered: { html, metadata: { headings: headingsOf(html) } } });
  }
  logger.info(`WP 部落格 ${posts.length} 篇`);
}

export function wpBlogLoader(): Loader {
  return {
    name: 'wp-blog-loader',
    async load(ctx) {
      try {
        await loadFromWp(ctx);
      } catch (e) {
        // WP 存檔觸發的重建（GitHub Actions 設 WINDS_BLOG_STRICT）要失敗給人看，不能默默拿舊內容上線
        if (process.env.WINDS_BLOG_STRICT) throw e;
        // WP 抓不到（GoDaddy 掛、防火牆擋）不能讓整站建置失敗：先沿用上次建置抓到的（.astro/data-store.json），
        // 全新環境（CI）沒有上次的就改讀程式碼裡的 markdown 備份——內容會比 WP 舊，但網站照常上線
        const kept = ctx.store.keys().length;
        if (kept) { ctx.logger.error(`WP 抓不到（${e}）：沿用上次建置抓到的 ${kept} 篇`); return; }
        ctx.logger.error(`WP 抓不到（${e}）：改讀程式碼裡的 markdown 備份 src/content/blog（內容可能較舊）`);
        await glob({ pattern: '**/*.md', base: './src/content/blog' }).load(ctx);
      }
    },
  };
}
