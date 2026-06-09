// 內容→商品 推薦：部落格文章底部推薦法器/服務，連到購買頁
// 來源：D1 service_catalog 的 live 項目（2026-06-10 健檢後，連結皆 200）
// 注意：只放已上架/可購買的項目；ES 連 zijiawangzijia.easy.co，SB 連 app.winds.tw/services
export interface Rec { name: string; price: number; url: string; source: 'easystore' | 'simplybook'; }

// 主題分組（依文章分類對應）
const T: Record<string, Rec[]> = {
  love: [
    { name: '愛情復合與捍衛符令', price: 1200, url: 'https://zijiawangzijia.easy.co/products/lovesaving', source: 'easystore' },
    { name: '月老星君親傳：五合調靈秘術', price: 36000, url: 'https://app.winds.tw/services/21/', source: 'simplybook' },
    { name: '婚姻類元辰宮修補', price: 9600, url: 'https://app.winds.tw/services/25/', source: 'simplybook' },
  ],
  peach: [
    { name: '太上老君師尊親傳：緣分綁線法手環', price: 1860, url: 'https://zijiawangzijia.easy.co/products/popularity', source: 'easystore' },
    { name: '正宗白靈狐仙桃花法', price: 18000, url: 'https://app.winds.tw/services/23/', source: 'simplybook' },
    { name: '十殿轉輪王法授：人緣桃花法', price: 16600, url: 'https://app.winds.tw/services/24/', source: 'simplybook' },
  ],
  cutpeach: [
    { name: '閻王殿判書觀：婚姻中斬偏桃', price: 26000, url: 'https://app.winds.tw/services/28/', source: 'simplybook' },
    { name: '愛情復合與捍衛符令', price: 1200, url: 'https://zijiawangzijia.easy.co/products/lovesaving', source: 'easystore' },
  ],
  yuanchen: [
    { name: '元辰宮代觀：知運勢', price: 7600, url: 'https://app.winds.tw/services/17/', source: 'simplybook' },
    { name: '元辰宮全修補', price: 16000, url: 'https://app.winds.tw/services/38/', source: 'simplybook' },
  ],
  wealth: [
    { name: '武財神師尊親傳：五路財神金龍板', price: 6800, url: 'https://zijiawangzijia.easy.co/products/dragonball', source: 'easystore' },
    { name: '元辰運財與防破符令', price: 2600, url: 'https://zijiawangzijia.easy.co/products/yuanchen-wealth-protection', source: 'easystore' },
    { name: '天官財神法', price: 12800, url: 'https://app.winds.tw/services/31/', source: 'simplybook' },
  ],
  tarot: [
    { name: '天授通靈塔羅', price: 2600, url: 'https://app.winds.tw/services/52/', source: 'simplybook' },
    { name: '命書籤詩問事：問事件', price: 2000, url: 'https://app.winds.tw/services/19/', source: 'simplybook' },
  ],
  fate: [
    { name: '通靈水鏡法：查因果', price: 4200, url: 'https://app.winds.tw/services/18/', source: 'simplybook' },
    { name: '淨化辟邪與安神符令', price: 2300, url: 'https://zijiawangzijia.easy.co/products/spirits', source: 'easystore' },
    { name: '命書籤詩問事：問事件', price: 2000, url: 'https://app.winds.tw/services/19/', source: 'simplybook' },
  ],
};

// 部落格分類 → 主題
const CAT_THEME: Record<string, string[]> = {
  '感情挽回': ['love'], '感情和合': ['love'], '兩性關係': ['love'],
  '桃花運': ['peach'], '斬桃花': ['cutpeach'],
  '元辰宮': ['yuanchen'],
  '財運': ['wealth'], '開運招財': ['wealth'],
  '塔羅': ['tarot'], '塔羅牌': ['tarot'],
  '星座': ['fate'], '星座運勢': ['fate'], '命理': ['fate'], '命理占卜': ['fate'], '其他': ['fate'],
};

// 取文章對應推薦（最多 3 筆，去重）
export function pickRecs(category?: string, max = 3): Rec[] {
  const themes = (category && CAT_THEME[category]) || ['fate', 'love'];
  const out: Rec[] = []; const seen = new Set<string>();
  for (const th of themes) for (const r of (T[th] || [])) { if (!seen.has(r.url)) { seen.add(r.url); out.push(r); } }
  // 補滿
  if (out.length < max) for (const th of ['love', 'wealth', 'fate']) for (const r of (T[th] || [])) { if (out.length >= max) break; if (!seen.has(r.url)) { seen.add(r.url); out.push(r); } }
  return out.slice(0, max);
}
