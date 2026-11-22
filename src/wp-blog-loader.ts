// 部落格資料來源：WordPress（wp.winds.tw）——2026-09-29 WP 後台遷移
// 預設就讀 WP（content.config.ts 判斷）；只有 WINDS_BLOG_SOURCE=md 才讀 src/content/blog/*.md 備份
// 帳密：GitHub Actions 用環境變數；本機沒設環境變數就讀 ~/.claude/secrets/godaddy-wp.env
// 規則：網址一律用 winds_source_slug（WP 代稱會去尾「-」且有 200 字元上限），沒有才用 WP slug
import type { Loader, LoaderContext } from 'astro/loaders';
import { glob } from 'astro/loaders';
import GithubSlugger from 'github-slugger';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { BLOG_REDIRECTS, TEACHER_LP } from './data/blog-redirects';
import MD_IMAGES from './data/blog-md-images.json';

const SITE = 'https://winds.tw';

/** 本機的 WP 帳密檔（一行一個 KEY=VALUE）；沒有這個檔（例如 GitHub Actions）就回空的 */
function localWpEnv(): Record<string, string> {
  const p = join(homedir(), '.claude', 'secrets', 'godaddy-wp.env');
  if (!existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

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
    // 2026-11-22 部落格體檢（Jeffery 拍板）：文末 #標籤段不上站——不能點、擠在文末按鈕前面，給搜尋／AI 看也只是一串關鍵字
    return isTagsText(text) ? '' : all;
  });
  h = h.replace(/\s*<p class="post-tags"[^>]*>[\s\S]*?<\/p>/g, '');   // WP 裡已經包好的 #標籤段（匯入的 407 篇都是這種）
  return enrichHtml(h);
}

/* 2026-11-22 部落格第三批（Jeffery 拍板「文章主角是哪位就寫哪位」）：署名「找風問幸福」或「風易揚老師」的文章，
   署名改成內文出現最多次的老師（跟 [...slug].astro 文末「預約○○老師」同一套算法），一位都沒提到的寫風易揚老師。
   建站時才算、不寫進 WP：之後把文章內文換成別的老師，署名、文末預約、老師頁列出的文章會一起跟著換。
   WP 裡手動署名成其他老師（芊蘭、風賜靈…）的照舊。 */
function authorOf(wpAuthor: string | undefined, html: string): string {
  if (wpAuthor && wpAuthor !== '找風問幸福' && wpAuthor !== '風易揚老師') return wpAuthor;
  let best = '', bestCount = 0;
  for (const t of Object.keys(TEACHER_LP)) {
    const count = html.split(t).length - 1;
    if (count > bestCount) { bestCount = count; best = t; }
  }
  return best ? `${best}老師` : '風易揚老師';
}
/* 2026-11-22 部落格體檢（Jeffery 拍板）：建站時才加，不寫進 WP——之後把文章換成別的老師，連結會跟著內文走。
   ① 連到「已下架轉項目頁」文章的連結，直接改連目的地（對照表 src/data/blog-redirects.ts）
   ② 內文「預約／找○○老師」的老師名字連到該老師預約頁；每位老師每篇只連第一次，已在連結裡的不動
   ③ 內文圖有 900 寬縮小版的，加 srcset 讓手機讀小圖（縮小版清單 src/data/blog-md-images.json，沒在清單上的照舊） */
const MD = new Set<string>(MD_IMAGES as string[]);
const TEACHER_RE = new RegExp(`(預約|找)(${Object.keys(TEACHER_LP).join('|')})老師`, 'g');
function enrichHtml(html: string): string {
  let h = html.replace(/\bhref="(?:https?:\/\/(?:www\.)?winds\.tw)?\/blog\/([^/"?#]+)\/?"/g, (all, slug) => {
    let key = slug; try { key = decodeURIComponent(slug); } catch {}
    const to = BLOG_REDIRECTS[key];
    return to ? `href="${to}"` : all;
  });
  const linked = new Set<string>();
  let inA = 0, inH = 0, inS = 0;
  h = h.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part)) inA++; else if (/^<\/a>/i.test(part)) inA = Math.max(0, inA - 1);
      else if (/^<h[1-6][\s>]/i.test(part)) inH++; else if (/^<\/h[1-6]>/i.test(part)) inH = Math.max(0, inH - 1);
      else if (/^<(script|style)[\s>]/i.test(part)) inS++; else if (/^<\/(script|style)>/i.test(part)) inS = Math.max(0, inS - 1);
      return part;
    }
    if (inA || inH || inS) return part;
    return part.replace(TEACHER_RE, (all, verb, name) => {
      if (linked.has(name)) return all;
      linked.add(name);
      return `${verb}<a href="/lp/${TEACHER_LP[name]}/">${name}老師</a>`;
    });
  }).join('');
  h = h.replace(/<img\b([^>]*?)\ssrc="https:\/\/cdn\.winds\.tw\/blog-v2\/([^"/]+)\.jpg"([^>]*)>/g, (all, pre, name, post) => {
    if (!MD.has(name) || /\bsrcset=/.test(pre + post)) return all;
    return `<img${pre} src="https://cdn.winds.tw/blog-v2/${name}.jpg" srcset="https://cdn.winds.tw/blog-v2/${name}-md.jpg 900w, https://cdn.winds.tw/blog-v2/${name}.jpg 1536w" sizes="(max-width: 760px) 100vw, 720px"${post}>`;
  });
  return h;
}

async function loadFromWp({ store, parseData, logger }: LoaderContext) {
  const local = localWpEnv();
  const site = process.env.WP_SITE || local.WP_SITE, user = process.env.WP_USER || local.WP_USER, pass = process.env.WP_APP_PASSWORD || local.WP_APP_PASSWORD;
  if (!site || !user || !pass) throw new Error('部落格要讀 WP：需要 WP_SITE／WP_USER／WP_APP_PASSWORD（環境變數，或本機 ~/.claude/secrets/godaddy-wp.env）');
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
  const posts = await all('/wp/v2/posts?context=edit&status=publish,draft&_fields=id,slug,status,date_gmt,modified_gmt,title,excerpt,content,categories,meta');
  // 照原本檔名順序放進資料庫（glob 讀檔的順序）：推薦文章在分數相同時依序挑選，順序不同會挑到別篇
  const idOf = (p: any) => (p.meta?.winds_source_slug || decodeURIComponent(p.slug)) as string;
  posts.sort((a: any, b: any) => (idOf(a) < idOf(b) ? -1 : idOf(a) > idOf(b) ? 1 : 0));
  const postIdBySlug = new Map(posts.map((p: any) => [decodeURIComponent(p.slug), idOf(p)]));
  store.clear();
  const lastmod: Record<string, string> = {};
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
        // 沒手填更新日就用 WP 的最後修改時間（11/22：換圖、格式重整都沒反映到「更新日」，Google 不知道文章改過）
        updatedDate: opt(m.winds_updated_date) || (p.modified_gmt ? new Date(p.modified_gmt + 'Z') : undefined),
        heroImage: opt(m.winds_hero_image),
        tags: json(m.winds_tags_json, []),
        author: authorOf(m.winds_author, html),
        seoTitle: opt(m.winds_seo_title),
        ogImage: opt(m.winds_og_image),
        llmDescription: opt(m.winds_llm_description),
        category: wpCategory || opt(m.winds_category),
        relatedServices: json(m.winds_related_services_json, []),
        faq: json(m.winds_faq_json, []),
        draft: p.status !== 'publish' || id in BLOG_REDIRECTS,   // 對照表上的已轉項目頁（11/22）
        esSource: opt(m.winds_es_source),
      },
    });
    store.set({ id, data, body: html, rendered: { html, metadata: { headings: headingsOf(html) } } });
    if (p.status === 'publish' && !(id in BLOG_REDIRECTS)) lastmod[id] = (p.modified_gmt || p.date_gmt) + 'Z';
  }
  // 網站地圖的更新日（astro.config.mjs 的 sitemap serialize 讀這份；建站最後才產網站地圖，讀得到）
  try { mkdirSync('.astro', { recursive: true }); writeFileSync('.astro/blog-lastmod.json', JSON.stringify(lastmod)); } catch {}
  logger.info(`WP 部落格 ${posts.length} 篇`);
}

export function wpBlogLoader(): Loader {
  return {
    name: 'wp-blog-loader',
    async load(ctx) {
      try {
        await loadFromWp(ctx);
      } catch (e) {
        // WP 抓不到就讓建置失敗、不上線（10/2 起本機也一樣）：默默拿舊內容上線，部落格就會退回舊版而沒人發現。
        // 真的要在 WP 掛掉時照常上線，才明確設 WINDS_BLOG_STRICT=0（或 WINDS_BLOG_SOURCE=md，部落格會退回 9/30）
        if (process.env.WINDS_BLOG_STRICT !== '0') {
          throw new Error(`部落格讀不到 WP，這次不建置（避免把舊文章上線）：${e}｜先確認 wp.winds.tw；真的要照常上線才設 WINDS_BLOG_STRICT=0`);
        }
        // WINDS_BLOG_STRICT=0：先沿用上次建置抓到的（.astro/data-store.json），
        // 全新環境沒有上次的就改讀程式碼裡的 markdown 備份——內容會比 WP 舊，但網站照常上線
        const kept = ctx.store.keys().length;
        if (kept) { ctx.logger.error(`WP 抓不到（${e}）：沿用上次建置抓到的 ${kept} 篇`); return; }
        ctx.logger.error(`WP 抓不到（${e}）：改讀程式碼裡的 markdown 備份 src/content/blog（內容可能較舊）`);
        await glob({ pattern: '**/*.md', base: './src/content/blog' }).load(ctx);
      }
    },
  };
}
