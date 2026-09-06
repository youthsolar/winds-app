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
  descTail: string;   // meta description 收尾
  emptyH1: string;    // 還沒有當期內容時的標題
  emptyLede: string;
}

const EMPTY_LEDE = '老師這一卦還沒出。想現在就知道自己的，往下點一下，起卦以你點下去的那一刻為準。';

export const TOPICS: Record<string, GuaTopic> = {
  love: {
    key: 'love', path: 'love-gua', label: '愛情', eyebrow: '這一卦', kicker: '你現在的狀況',
    ctaTitle: '抽屬於你的一卦',
    ctaLead: '同一件事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '愛情卦',
    descTail: '風易揚老師的解卦；點一下就能抽屬於你的一卦，不用登入。',
    emptyH1: '愛情卦，還在路上', emptyLede: EMPTY_LEDE,
  },
  wealth: {
    key: 'wealth', path: 'wealth-gua', label: '財運', eyebrow: '這一卦', kicker: '你現在的狀況',
    ctaTitle: '抽你自己的財運一卦',
    ctaLead: '同樣是錢的事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '財運卦',
    descTail: '風易揚老師的解卦；點一下就能抽你自己的財運一卦，不用登入。',
    emptyH1: '財運卦，還在路上', emptyLede: EMPTY_LEDE,
  },
  fortune: {
    key: 'fortune', path: 'fortune-gua', label: '運勢', eyebrow: '這一卦', kicker: '這週先顧哪一頭',
    ctaTitle: '抽你自己的一卦',
    ctaLead: '老師這一卦人人一樣，你的那一卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '運勢卦',
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
  prev?: { id: string; label: string } | null;
}

const API = 'https://api.winds.tw';

// 即時讀最新一卦（或指定篇）。讀不到（還沒發、worker 掛了）回 null，頁面走空狀態但抽一卦的鈕照常。
export async function fetchTopicGua(topicKey: string, id?: string): Promise<{ data: GuaData | null; isCurrent: boolean }> {
  try {
    const url = `${API}/topic-gua?topic=${encodeURIComponent(topicKey)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const j = await r.json() as { ok: boolean; item: any; prev: any; latest_id: number | null };
    if (!j.ok || !j.item) return { data: null, isCurrent: !id };
    const it = j.item;
    return {
      data: { id: String(it.id), posted_label: it.posted_label, posted_long: it.posted_long, status: it.status, hex: it.hex, h1: it.h1, lede: it.lede, line: it.line, tags: it.tags || [], states: it.states || [], quote: it.quote, prev: j.prev ? { id: String(j.prev.id), label: j.prev.label } : null },
      isCurrent: !id || Number(id) === Number(j.latest_id),
    };
  } catch {
    return { data: null, isCurrent: !id };
  }
}
