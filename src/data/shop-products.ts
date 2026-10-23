// 法器目錄的資料來源——2026-09-29 WP 後台遷移；2026-10-23 商城切 Woo 上線
// 目錄一律讀 api.winds.tw /shop-products：worker 那邊從 WooCommerce（wp.winds.tw）Store API 讀、快取 5 分鐘，
// 網站、首頁、LINE 首頁、服務頁都是同一份；每件帶 wooId／variants[].vid 給商品頁帶去 Woo 結帳。
// 結帳走哪邊由目錄決定：商品帶 wooId（worker 讀 Woo）→ Woo 結帳頁；worker 設 SHOP_SOURCE=d1 回退時目錄沒有 wooId → 自家 /shop-order 結帳。網站這邊沒有第二個開關。
// 價格以結帳頁（Woo）實收為準，這裡只是展示。
export const WP_CHECKOUT = 'https://wp.winds.tw/checkout/';

export type ShopVariant = { id?: number; vid?: number; title: string; price: number };
export type ShopProduct = {
  id: string; wooId?: number; name: string; price: number; image: string; images: string[]; url: string;
  category: string; desc: string; page_html: string; variants: ShopVariant[];
};

// 讀不到回 null（呼叫端各自決定 503／重試頁）；timeoutMs 連讀內容一起算
export async function getShopProducts(timeoutMs?: number): Promise<ShopProduct[] | null> {
  const ac = new AbortController();
  const t = timeoutMs ? setTimeout(() => ac.abort(), timeoutMs) : null;
  try {
    const r = await fetch('https://api.winds.tw/shop-products', { signal: ac.signal });
    if (!r.ok) return null;
    return ((await r.json()).products || []) as ShopProduct[];
  } catch {
    return null;
  } finally {
    if (t) clearTimeout(t);
  }
}
