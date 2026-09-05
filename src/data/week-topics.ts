// 活動頁主題家族（2026-09-06）：依發文主題分頁，同一個版型、同一種資料格式，主題只是一份設定。
// 加主題＝這裡加一筆 ＋ src/data/week/<key>/ 放週料 ＋ src/pages/<path>/ 兩支薄殼頁 ＋ worker WEEK_TOPICS 加同名。
export interface WeekTopic {
  key: string;        // 也是 /gua?topic= 與 /go/<key> 的值
  path: string;       // 網址段：/<path>/
  label: string;      // 主題名（給標題與分享）
  eyebrow: string;    // 眉題前綴
  kicker: string;     // 三種狀況卡的小標
  ctaTitle: string;
  ctaLead: string;
  shareTitle: string;
  descTail: string;   // meta description 收尾
}

export const WEEK_TOPICS: Record<string, WeekTopic> = {
  love: {
    key: 'love', path: 'love-week', label: '愛情', eyebrow: '這週的卦', kicker: '你現在的狀況',
    ctaTitle: '抽這週屬於你的一卦',
    ctaLead: '同一件事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的愛情卦',
    descTail: '風易揚老師的解卦，每週一更新；點一下就能抽這週屬於你的一卦，不用登入。',
  },
  wealth: {
    key: 'wealth', path: 'wealth-week', label: '財運', eyebrow: '這週的卦', kicker: '你現在的狀況',
    ctaTitle: '抽這週你的財運一卦',
    ctaLead: '同樣是錢的事，每個人的卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的財運卦',
    descTail: '風易揚老師的解卦，每週一更新；點一下就能抽這週你的財運一卦，不用登入。',
  },
  fortune: {
    key: 'fortune', path: 'fortune-week', label: '運勢', eyebrow: '這週的卦', kicker: '這週先顧哪一頭',
    ctaTitle: '抽這週你自己的一卦',
    ctaLead: '整體運勢人人一樣，你的那一卦不一樣。點一下就起卦，不用登入、不用填生日。',
    shareTitle: '這週的運勢卦',
    descTail: '風易揚老師的解卦，每週一更新；點一下就能抽這週你自己的一卦，不用登入。',
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

// 同一主題所有週料，新的在前。glob 路徑要寫死字面（Vite 的限制），所以三主題各一行。
const FILES: Record<string, Record<string, { default: WeekData }>> = {
  love: import.meta.glob('./week/love/*.json', { eager: true }) as Record<string, { default: WeekData }>,
  wealth: import.meta.glob('./week/wealth/*.json', { eager: true }) as Record<string, { default: WeekData }>,
  fortune: import.meta.glob('./week/fortune/*.json', { eager: true }) as Record<string, { default: WeekData }>,
};

export function weeksOf(topicKey: string): WeekData[] {
  return Object.values(FILES[topicKey] || {}).map((m) => m.default).sort((a, b) => (a.week < b.week ? 1 : -1));
}
