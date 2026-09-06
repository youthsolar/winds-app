// 活動頁主題家族（2026-09-06）：依發文主題分頁，同一個版型、同一種資料格式，主題只是一份設定。
// 料不在 repo：Jeffery 在 TG 發動「週卦 <主題>」那一刻起卦、審核卡過字後由 worker 存進 D1，
// 頁面即時讀 api.winds.tw/week-topic（見 fetchWeek）。加主題＝這裡加一筆 ＋ src/pages/<path>/ 兩支薄殼頁 ＋ worker WEEK_TOPICS 加同名。
export interface WeekTopic {
  key: string;        // 也是 /gua?topic=、/go/<key>、/week-topic?topic= 的值
  path: string;       // 網址段：/<path>/
  label: string;      // 主題名（給標題與分享）
  eyebrow: string;    // 眉題前綴
  kicker: string;     // 三種狀況卡的小標
  ctaTitle: string;
  ctaLead: string;
  shareTitle: string;
  descTail: string;   // meta description 收尾
  emptyH1: string;    // 還沒有當期內容時的標題
  emptyLede: string;
}

const EMPTY_LEDE = '老師這週的卦還沒出。想現在就知道自己的，往下點一下，起卦以你點下去的那一刻為準。';

export const WEEK_TOPICS: Record<string, WeekTopic> = {
  love: {
    key: 'love', path: 'love-week', label: '愛情', eyebrow: '這週的卦', kicker: '你現在的狀況',
    ctaTitle: '抽這週屬於你的一卦',
    ctaLead: '同一件事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的愛情卦',
    descTail: '風易揚老師的解卦，每週更新；點一下就能抽這週屬於你的一卦，不用登入。',
    emptyH1: '這週的愛情卦，還在路上', emptyLede: EMPTY_LEDE,
  },
  wealth: {
    key: 'wealth', path: 'wealth-week', label: '財運', eyebrow: '這週的卦', kicker: '你現在的狀況',
    ctaTitle: '抽這週你的財運一卦',
    ctaLead: '同樣是錢的事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的財運卦',
    descTail: '風易揚老師的解卦，每週更新；點一下就能抽這週你的財運一卦，不用登入。',
    emptyH1: '這週的財運卦，還在路上', emptyLede: EMPTY_LEDE,
  },
  fortune: {
    key: 'fortune', path: 'fortune-week', label: '運勢', eyebrow: '這週的卦', kicker: '這週先顧哪一頭',
    ctaTitle: '抽這週你自己的一卦',
    ctaLead: '整體運勢人人一樣，你的那一卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的運勢卦',
    descTail: '風易揚老師的解卦，每週更新；點一下就能抽這週你自己的一卦，不用登入。',
    emptyH1: '這週的運勢卦，還在路上', emptyLede: EMPTY_LEDE,
  },
};

export interface WeekData {
  week: string; range: string; range_long: string; status: string;
  hex: { char: string; name: string; sub: string };
  h1: string; lede: string; line: string; tags: string[];
  states: { char: string; title: string; line: string }[];
  quote: string;
  prev?: { week: string; label: string } | null;
}

const API = 'https://api.winds.tw';

// 即時讀當期（或指定篇）。讀不到（還沒發、worker 掛了）回 null，頁面走空狀態但抽一卦的鈕照常。
export async function fetchWeek(topicKey: string, id?: string): Promise<{ data: WeekData | null; isCurrent: boolean }> {
  try {
    const url = `${API}/week-topic?topic=${encodeURIComponent(topicKey)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const j = await r.json() as { ok: boolean; item: any; prev: any; latest_id: number | null };
    if (!j.ok || !j.item) return { data: null, isCurrent: !id };
    const it = j.item;
    return {
      data: { week: String(it.id), range: it.range, range_long: it.range_long, status: it.status, hex: it.hex, h1: it.h1, lede: it.lede, line: it.line, tags: it.tags || [], states: it.states || [], quote: it.quote, prev: j.prev || null },
      isCurrent: !id || Number(id) === Number(j.latest_id),
    };
  } catch {
    return { data: null, isCurrent: !id };
  }
}
