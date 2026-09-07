/* 預約老師頁的「你想要什麼樣的人陪你」四種 persona。
 * 老師名單／介紹／檔期／價格一律由 SimplyBook 即時帶入（/sb-providers），這裡不放老師資料。 */

export const PERSONAS = [
  { key: 'gentle', name: '溫柔傾聽', desc: '擅長傾聽、同理，陪你把情緒慢慢說開。' },
  { key: 'rational', name: '理性決策', desc: '擅長理清脈絡，幫你看清每個選擇的代價。' },
  { key: 'energy', name: '能量調理', desc: '擅長調整氣場、體質與空間的能量。' },
  { key: 'direct', name: '直白判斷', desc: '不繞圈、一針見血，直接給你明確方向。' },
];
