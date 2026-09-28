// 部落格資料來源：WordPress（wp.winds.tw）——2026-09-29 WP 後台遷移
// 只在 WINDS_BLOG_SOURCE=wp 時啟用（content.config.ts 判斷）；平常照舊讀 src/content/blog/*.md
// 規則：網址一律用 winds_source_slug（WP 代稱會去尾「-」且有 200 字元上限），沒有才用 WP slug
import type { Loader } from 'astro/loaders';

const decode = (s: string) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
   .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

// 目錄用的標題清單（與 Astro markdown 的 headings 同格式：depth／slug／text）
function headingsOf(html: string) {
  const out: { depth: number; slug: string; text: string }[] = [];
  for (const m of html.matchAll(/<h([1-6])\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g)) {
    out.push({ depth: Number(m[1]), slug: m[2], text: decode(m[3].replace(/<[^>]+>/g, '')) });
  }
  return out;
}

export function wpBlogLoader(): Loader {
  return {
    name: 'wp-blog-loader',
    async load({ store, parseData, logger }) {
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
      const posts = await all('/wp/v2/posts?context=edit&status=publish,draft&_fields=id,slug,status,date_gmt,title,excerpt,content,categories,meta');
      // 照原本檔名順序放進資料庫（glob 讀檔的順序）：推薦文章在分數相同時依序挑選，順序不同會挑到別篇
      const idOf = (p: any) => (p.meta?.winds_source_slug || decodeURIComponent(p.slug)) as string;
      posts.sort((a: any, b: any) => (idOf(a) < idOf(b) ? -1 : idOf(a) > idOf(b) ? 1 : 0));
      store.clear();
      for (const p of posts) {
        const m = p.meta || {};
        const id: string = m.winds_source_slug || decodeURIComponent(p.slug);
        const json = (s: string, d: any) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
        const opt = (s: string) => (s ? s : undefined);
        // 表情符號在 GoDaddy 資料庫只能存成 &#x…; 實體，讀回來還原成字元（與原本 markdown 輸出逐字相同）
        const html: string = String(p.content.raw).replace(/&#x(1[0-9a-f]{4});/gi, (_: string, h: string) => String.fromCodePoint(parseInt(h, 16)));
        const data = await parseData({
          id,
          data: {
            title: p.title.raw,
            description: p.excerpt.raw,
            pubDate: new Date(p.date_gmt + 'Z'),
            updatedDate: opt(m.winds_updated_date),
            heroImage: opt(m.winds_hero_image),
            tags: json(m.winds_tags_json, []),
            author: m.winds_author || '找風問幸福',
            seoTitle: opt(m.winds_seo_title),
            ogImage: opt(m.winds_og_image),
            llmDescription: opt(m.winds_llm_description),
            // 從 winds.tw 匯入的文章照原始分類（原本沒有分類的就維持沒有，WP 規定的「其他」不算）；WP 上新寫的才用 WP 分類
            category: m.winds_source_slug ? opt(m.winds_category) : cats.get(p.categories?.[0]),
            relatedServices: json(m.winds_related_services_json, []),
            faq: json(m.winds_faq_json, []),
            draft: p.status !== 'publish',
            esSource: opt(m.winds_es_source),
          },
        });
        store.set({ id, data, body: html, rendered: { html, metadata: { headings: headingsOf(html) } } });
      }
      logger.info(`WP 部落格 ${posts.length} 篇`);
    },
  };
}
