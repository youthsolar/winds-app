// 活動頁主題卦（2026-09-06）：依發文主題分頁（愛情卦／財運卦／運勢卦），同一個版型，主題只是一份設定。
// 每一則貼文一卦，不是每週一卦：Jeffery 在 TG 打「財運卦 <話題>」那一刻起卦、審核卡過字後由 worker 存進 D1，
// 頁面即時讀 api.winds.tw/topic-gua（見 fetchTopicGua），他一發就換。加主題＝這裡加一筆 ＋ src/pages/<path>/ 兩支薄殼頁 ＋ worker GUA_TOPICS 加同名。
export interface GuaTopic {
  key: string;        // 也是 /gua?topic=、/go/<key>、/topic-gua?topic= 的值
  path: string;       // 網址段：/<path>/
  label: string;      // 主題名（給標題與分享）
  eyebrow: string;    // 眉題前綴（「這一卦」）
  kicker: string;     // 三種狀況卡的小標
  ctaTitle: string;
  ctaLead: string;
  shareTitle: string;
  shareBtn: string;   // 分享鈕字（10/22 各主題分開）
  descTail: string;   // meta description 收尾
  emptyH1: string;    // 還沒有當期內容時的標題
  emptyLede: string;
}

const EMPTY_LEDE = '老師這一卦還沒出。想現在就知道自己的，往下點一下，起卦以你點下去的那一刻為準。';

export const TOPICS: Record<string, GuaTopic> = {
  love: {   // 2026-10-14 跟好愛交換網址（原 /love-gua）
    key: 'love', path: 'love', label: '愛情', eyebrow: '這一卦', kicker: '你現在的狀況',
    ctaTitle: '抽屬於你的一卦',
    ctaLead: '帶著你在意的感情問題，起屬於你的一卦，不用登入，也不用填生日。',
    shareTitle: '愛情卦', shareBtn: '把這個愛情起卦入口分享給你想起的人',
    descTail: '想釐清感情上的疑問，就來找風問幸福，起屬於自己的一卦，不用登入。',
    emptyH1: '關於感情，先起屬於你的一卦', emptyLede: '想看看自己的感情問題，可以先起一卦，從此刻最在意的事開始。',
  },
  wealth: {
    key: 'wealth', path: 'wealth-gua', label: '財運', eyebrow: '這一卦', kicker: '這一卦對不同收入情境，有以下幾項提醒。',
    ctaTitle: '為自己的財運起一卦',
    ctaLead: '同樣是錢的事，每個人在意的問題不同；帶著自己的財務疑問起一卦，不用登入，也不用填生日。',
    shareTitle: '財運卦', shareBtn: '把這份財運提醒分享給朋友',
    descTail: '風易揚老師的解卦；點一下就能抽你自己的財運一卦，不用登入。',
    emptyH1: '財運卦，還在路上', emptyLede: EMPTY_LEDE,
  },
  fortune: {
    key: 'fortune', path: 'fortune-gua', label: '運勢', eyebrow: '這一卦', kicker: '這一卦先顧哪一頭',
    ctaTitle: '抽你自己的一卦',
    ctaLead: '老師這一卦是給大家的提醒，你也可以為自己在意的事起一卦，不用登入，也不用填生日。',
    shareTitle: '運勢卦', shareBtn: '把這一卦分享給需要提醒的朋友',
    descTail: '風易揚老師的解卦；點一下就能抽你自己的一卦，不用登入。',
    emptyH1: '運勢卦，還在路上', emptyLede: EMPTY_LEDE,
  },
};

export interface GuaData {
  id: string; posted_label: string; posted_long: string; status: string;
  hex: { char: string; name: string; sub: string };
  h1: string; lede: string; line: string; tags: string[];
  states: { char: string; title: string; line: string }[];
  quote: string;
  og_url?: string | null;   // 那一卦的 1200×630 連結卡；worker 確認 R2 有圖才給，沒有就退回通用 og-default
  prev?: { id: string; label: string } | null;
}

const API = 'https://api.winds.tw';

// 即時讀最新一卦（或指定篇）。讀不到（還沒發、worker 掛了）回 null，頁面走空狀態但抽一卦的鈕照常。
// 2026-09-28（Codex 體檢）：多回 failed——worker 故障不能當成「還沒發」（首頁會把空狀態公開快取、單篇會被轉去最新篇）
export async function fetchTopicGua(topicKey: string, id?: string): Promise<{ data: GuaData | null; isCurrent: boolean; failed?: boolean }> {
  try {
    const url = `${API}/topic-gua?topic=${encodeURIComponent(topicKey)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { data: null, isCurrent: !id, failed: true };
    const j = await r.json() as { ok: boolean; item: any; prev: any; latest_id: number | null };
    if (!j.ok) return { data: null, isCurrent: !id, failed: true };
    if (!j.item) return { data: null, isCurrent: !id };
    const it = j.item;
    return {
      data: { id: String(it.id), posted_label: it.posted_label, posted_long: it.posted_long, status: it.status, hex: it.hex, h1: it.h1, lede: it.lede, line: it.line, tags: it.tags || [], states: it.states || [], quote: it.quote, og_url: it.og_url || null, prev: j.prev ? { id: String(j.prev.id), label: j.prev.label } : null },
      isCurrent: !id || Number(id) === Number(j.latest_id),
    };
  } catch {
    return { data: null, isCurrent: !id, failed: true };
  }
}
