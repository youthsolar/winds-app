/* 預約老師 sample data（佔位）— 老師資料/引言/評價/檔期/價格由 SimplyBook 同步帶入。
 * 🔭 待 Code：teacher 名單、quote（介紹文）、rating/reviews、price、檔期 60 天皆由 SB provider 同步。 */

export type Teacher = {
  id: string; name: string; tone: 'rose' | 'clay' | 'sage'; years: number; persona: string;
  skills: string[]; skillMain: string; blurb: string; style: string;
  rating: number; reviews: number; price: number; quote: string;
};

export const TEACHERS: Teacher[] = [
  { id: 'lin', name: '林秋語', tone: 'rose', years: 12, persona: 'gentle', skills: ['感情', '身心'], skillMain: '感情與關係', blurb: '說話慢、不催你。最擅長陪你把「他到底在想什麼」這種卡很久的心事，一層一層拆開。', style: '塔羅 · 牌卡對談', rating: 4.9, reviews: 386, price: 1600, quote: '我幫不了你決定，但可以陪你把那些繞來繞去的，理一理。' },
  { id: 'chen', name: '陳之嶼', tone: 'clay', years: 9, persona: 'rational', skills: ['事業', '感情'], skillMain: '事業與選擇', blurb: '理性溫和，給的是脈絡不是斷語。換工作、創業、卡在選擇題時，他很會幫你看清各條路的代價。', style: '紫微 · 易經', rating: 4.8, reviews: 254, price: 1800, quote: '把選項攤開，你會發現自己其實已經有偏好了。' },
  { id: 'wang', name: '王明萱', tone: 'sage', years: 15, persona: 'energy', skills: ['身心', '事業'], skillMain: '身心與安定', blurb: '像個沉穩的長輩。睡不好、提不起勁、莫名焦慮的時候，她會先讓你穩下來，再慢慢看。', style: '八字 · 五行調理', rating: 5.0, reviews: 421, price: 2000, quote: '先照顧好自己，答案才聽得進去。' },
  { id: 'lee', name: '李依庭', tone: 'rose', years: 7, persona: 'gentle', skills: ['身心', '感情'], skillMain: '靈性與身心', blurb: '通靈師。說話輕，但說的都很準。最常幫人釐清那種「明明沒什麼大事、卻一直不對勁」的感覺。', style: '通靈 · 靈訊傳遞', rating: 4.9, reviews: 193, price: 1800, quote: '有時候你需要的不是答案，是讓那件事被說出來一次。' },
  { id: 'chang', name: '張玄璋', tone: 'clay', years: 18, persona: 'energy', skills: ['身心', '事業'], skillMain: '調煞與改運', blurb: '法師背景，處理的多是「一直卡、一直不順」的問題。邏輯清楚，不會讓你越聽越怕。', style: '法術 · 五術調理', rating: 4.8, reviews: 178, price: 2200, quote: '把問題說清楚，我們來看是什麼在卡。' },
  { id: 'su', name: '蘇映心', tone: 'sage', years: 5, persona: 'gentle', skills: ['感情', '身心'], skillMain: '感情與自我', blurb: '年輕，但很細膩。牌讀得慢、解得深，適合想好好坐下來、一張牌說很久的那種人。', style: '塔羅 · 奧秘塔羅', rating: 4.7, reviews: 112, price: 1400, quote: '你對自己的事，比你以為的更清楚。' },
  { id: 'huang', name: '黃柏翰', tone: 'clay', years: 11, persona: 'rational', skills: ['事業', '感情'], skillMain: '命盤與大運', blurb: '把命盤當地圖用，不只解今年，會告訴你接下來幾年的走勢在哪。適合想看長線的人。', style: '紫微斗數 · 大限流年', rating: 4.8, reviews: 306, price: 1900, quote: '命盤是地圖，走哪條路還是你決定。' },
  { id: 'hsieh', name: '謝靜雲', tone: 'sage', years: 13, persona: 'direct', skills: ['身心', '事業'], skillMain: '易經與人生節奏', blurb: '易經老師，說話像在聊天。最常幫人找回「現在這件事，我應該動還是等」的那個感覺。', style: '易經 · 六爻卜卦', rating: 4.9, reviews: 267, price: 1700, quote: '易經不是叫你算命，是幫你感覺到自己現在在哪。' },
];

export const PERSONAS = [
  { key: 'gentle', name: '溫柔傾聽', desc: '擅長傾聽、同理，陪你把情緒慢慢說開。' },
  { key: 'rational', name: '理性決策', desc: '擅長理清脈絡，幫你看清每個選擇的代價。' },
  { key: 'energy', name: '能量調理', desc: '擅長調整氣場、體質與空間的能量。' },
  { key: 'direct', name: '直白判斷', desc: '不繞圈、一針見血，直接給你明確方向。' },
];

// 占卜結果推薦（佔位）。🔭 reason 由 LLM 依占卜結果生成。
export const RECOMMENDED = {
  id: 'lin',
  reason: '你這題的牌陣一直在說「等待」——林老師很適合陪你把這種懸著的感覺好好說出來。',
};
