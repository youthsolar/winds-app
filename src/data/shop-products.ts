// 法器目錄的資料來源——2026-09-29 WP 後台遷移
// 建置時 PUBLIC_WINDS_SHOP_SOURCE=wp 就讀 WooCommerce（wp.winds.tw 的 Store API，公開、不用金鑰）；
// 平常照舊讀 api.winds.tw /shop-products（D1 service_catalog）。兩邊回傳同一個形狀，/shop 與 /shop/[id] 不用改讀法。
// 價格以結帳頁（Woo）實收為準，這裡只是展示；目錄在邊緣快取 5 分鐘（跟原本瀏覽器快取一致）。
export const SHOP_FROM_WP = import.meta.env.PUBLIC_WINDS_SHOP_SOURCE === 'wp';
export const WP_CHECKOUT = 'https://wp.winds.tw/checkout/';

export type ShopVariant = { vid?: number; title: string; price: number };
export type ShopProduct = {
  id: string; wooId?: number; name: string; price: number; image: string; images: string[]; url: string;
  category: string; desc: string; page_html: string; variants: ShopVariant[];
};

// 表情符號在 GoDaddy 資料庫只能存成 &#x1f3ee; 這種數字實體（WP 存檔時自動轉），讀回來還原成字元；HTML 本身（&lt; &amp;）不動
const decodeNumeric = (s: string) => String(s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
const decode = (s: string) => decodeNumeric(s)
  .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

async function wooGet(path: string, signal?: AbortSignal) {
  const r = await fetch('https://wp.winds.tw/wp-json/wc/store/v1' + path, { signal, headers: { 'User-Agent': 'winds-web/1.0' }, cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
  if (!r.ok) throw new Error(`Woo ${path} → ${r.status}`);
  return { data: await r.json(), pages: Number(r.headers.get('X-WP-TotalPages') || '1') };
}

// Store API 的金額是「最小單位的字串」（TWD 設 0 位小數＝原數）
const money = (p: any) => Number(p?.price || 0) / 10 ** Number(p?.currency_minor_unit || 0);

export async function fetchWooProducts(signal?: AbortSignal): Promise<ShopProduct[]> {
  const first = await wooGet('/products?status=publish&per_page=100&page=1', signal);
  let items: any[] = first.data;
  for (let p = 2; p <= first.pages; p++) items = items.concat((await wooGet(`/products?status=publish&per_page=100&page=${p}`, signal)).data);
  const out: ShopProduct[] = [];
  for (const p of items) {
    let variants: ShopVariant[] = [];
    if (p.type === 'variable' && p.variations?.length) {
      // 款式名稱照母商品的 variations（有屬性值、順序＝後台順序）；價格要另外抓每個款式
      const priced = new Map(((await wooGet(`/products?type=variation&parent=${p.id}&per_page=100`, signal)).data as any[]).map((v) => [v.id, money(v.prices)]));
      variants = p.variations.filter((v: any) => priced.has(v.id))
        .map((v: any) => ({ vid: v.id, title: decode((v.attributes || []).map((a: any) => a.value).join(' / ')), price: priced.get(v.id) as number }));
    }
    const es = /^ES-(\d+)$/.exec(p.sku || '');
    const id = es ? es[1] : String(p.id);   // EasyStore 搬來的沿用原編號（網址不變）；WP 新上架的用 Woo 編號
    const images = (p.images || []).map((i: any) => i.src as string);
    out.push({
      id, wooId: p.id, name: decode(p.name), price: variants.length ? Math.min(...variants.map((v) => v.price)) : money(p.prices),
      image: images[0] || '', images, url: `https://winds.tw/shop/${id}/`,
      category: decode(p.categories?.[0]?.name || ''), desc: decodeNumeric(p.short_description), page_html: decodeNumeric(p.description), variants,
    });
  }
  return out;
}

// 讀不到回 null（呼叫端各自決定 503／重試頁）；timeoutMs 連讀內容一起算
export async function getShopProducts(timeoutMs?: number): Promise<ShopProduct[] | null> {
  const ac = new AbortController();
  const t = timeoutMs ? setTimeout(() => ac.abort(), timeoutMs) : null;
  try {
    if (SHOP_FROM_WP) return await fetchWooProducts(ac.signal);
    const r = await fetch('https://api.winds.tw/shop-products', { signal: ac.signal });
    if (!r.ok) return null;
    return ((await r.json()).products || []) as ShopProduct[];
  } catch {
    return null;
  } finally {
    if (t) clearTimeout(t);
  }
}
