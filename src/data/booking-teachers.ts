/* 預約老師頁的依想問的事分兩類（2026-10-16 文案檢驗：原四種風格兩類沒有老師）；老師 persona 可寫多類用逗號分開（風易揚＝life,love）。
 * 老師名單／介紹／檔期／價格一律由 SimplyBook 即時帶入（/sb-providers），這裡不放老師資料。 */

export const PERSONAS = [
  { key: 'love', name: '感情與關係', desc: '從感情反覆到相處不安，找老師一起釐清。' },
  { key: 'life', name: '生活與運勢', desc: '想問工作財運或家中狀況，從在意的事談起。' },
];
