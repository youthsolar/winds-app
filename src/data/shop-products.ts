/* 法器選物 sample data（佔位）— 真實商品/分類/glyph/款式由 EasyStore 同步帶入。
 * 🔭 待 Code：商品名稱/價格/代表字 glyph/分類/options/meta/forWho/howto 由 ES metafield 同步，
 *    glyph 由 AI 三層 fallback 選字（規則見 handoff CLAUDE.md）。 */

export type Choice = { name: string; price?: number };
export type Product = {
  id: string; cat: string; glyph: string; tone: 'rose' | 'clay' | 'sage'; price: number;
  name: string; material: string; blurb: string; detail: string;
  options?: { label: string; choices: Choice[] }[];
  meta?: { k: string; v: string }[];
  forWho?: string[]; howto?: string[]; notes?: string;
};

export const CATS = [
  { key: 'all', name: '全部' },
  { key: 'peace', name: '平安', tone: 'sage' },
  { key: 'fate', name: '緣分', tone: 'rose' },
  { key: 'cleanse', name: '淨化', tone: 'clay' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'anshen', cat: 'peace', glyph: '安', tone: 'sage', price: 480,
    name: '安神隨身符', material: '和紙 · 棉袋',
    blurb: '睡不好、心緒亂的夜裡，放在枕邊陪你。',
    detail: '以和紙手寫安神字樣，縫進柔軟的棉袋裡。放在枕邊、包包或床頭。給睡前轉念很多、一直靜不下來的時候用。每一只都會先靜置淨化後再寄出。',
    options: [{ label: '款式', choices: [{ name: '素色棉袋' }, { name: '刺繡棉袋', price: 60 }] }],
    meta: [{ k: '五行', v: '水' }, { k: '尺寸', v: '約 6 × 8 cm' }],
    forWho: ['睡前轉念很多、一直靜不下來', '換環境認床、容易淺眠', '想給自己一點安定感'],
    howto: ['放在枕邊、包包或床頭', '每隔一段時間可拿到窗邊透透氣', '受潮請自然風乾'],
    notes: '手寫手作，每只字跡與紋理略有不同，是正常的。',
  },
  {
    id: 'pingan', cat: 'peace', glyph: '平', tone: 'sage', price: 520,
    name: '平安御守袋', material: '棉麻 · 刺繡',
    blurb: '出門帶著，像有人替你看著路。',
    detail: '棉麻刺繡的小御守，繫在包上或鑰匙圈。出門在外，帶著就多一點安心。顏色為乾燥玫瑰與米白。',
    options: [{ label: '顏色', choices: [{ name: '乾燥玫瑰' }, { name: '米白' }, { name: '鼠尾草綠' }] }],
    meta: [{ k: '五行', v: '木' }, { k: '尺寸', v: '約 5 × 7 cm' }],
    forWho: ['經常出門、通勤通車', '想給家人或朋友一份小小的祈願'],
    howto: ['繫在包、鑰匙圈或車上', '避免長時間潮濕'],
    notes: '刺繡為手工，針路細節各有不同。',
  },
  {
    id: 'yuanxian', cat: 'fate', glyph: '緣', tone: 'rose', price: 680,
    name: '結緣紅線手環', material: '蠟線 · 黃銅',
    blurb: '為一段你還在意的關係，繫上一點溫柔的祝福。',
    detail: '手工編織的紅蠟線，搭一顆細緻的黃銅墜。不是替什麼強求，是為心裡那個人，繫一條細線在那裡。可調整鬆緊。',
    options: [{ label: '尺寸', choices: [{ name: '可調式' }, { name: 'S · 16 cm' }, { name: 'M · 18 cm' }] }],
    meta: [{ k: '五行', v: '火' }, { k: '材質', v: '蠟線 · 黃銅' }],
    forWho: ['心裡有個還在意的人', '想為一段關係留點溫柔'],
    howto: ['繫於手腕，打結時默默許下心裡的話', '沐浴或運動時可取下'],
    notes: '黃銅遇氣氛或水氣可能自然氧化，不影響使用。',
  },
  {
    id: 'yuelao', cat: 'fate', glyph: '月', tone: 'rose', price: 560,
    name: '月老祈緣香牌', material: '天然香木',
    blurb: '想被好好喜歡的時候，帶著它。',
    detail: '天然香木雕的小香牌，帶淡淡木質香。隨身或放在枕邊，給正在等待、或正在靠近一段關係的你。',
    options: [{ label: '香氛', choices: [{ name: '檀香' }, { name: '沉香', price: 80 }] }],
    meta: [{ k: '五行', v: '火' }, { k: '材質', v: '天然香木' }],
    forWho: ['正在等待或靠近一段感情', '想讓自己狀態柔軟一點'],
    howto: ['隨身攜帶或放在枕邊', '避光、避潮保存香氣更久'],
    notes: '天然香木紋理各異，香氣會隨時間轉淡。',
  },
  {
    id: 'aicao', cat: 'cleanse', glyph: '淨', tone: 'clay', price: 560,
    name: '淨化香氛．艾草', material: '艾草 · 精油',
    blurb: '回到家，先讓空間靜下來。',
    detail: '艾草與溫潤精油調合的室內香氛。進門點上，像替整個空間深呼吸一次。適合搬新家、換季、或想重新開始的時候。',
    options: [{ label: '容量', choices: [{ name: '30 ml' }, { name: '50 ml', price: 120 }] }],
    meta: [{ k: '五行', v: '木' }, { k: '容量', v: '30 / 50 ml' }],
    forWho: ['搬新家、換季、想重新開始', '一進門想讓空間安靜下來'],
    howto: ['進門或睡前滴於香氛機或棉片', '避免直接接觸肌膚'],
    notes: '天然精油，孕婦與寵物家庭請先詢問專業意見。',
  },
  {
    id: 'shuwei', cat: 'cleanse', glyph: '煙', tone: 'clay', price: 420,
    name: '鼠尾草淨化棒', material: '白鼠尾草',
    blurb: '想把舊的、悶的，輕輕送走。',
    detail: '天然白鼠尾草綁束。點燃後讓煙繞過空間與自己，是許多人安頓心緒的小儀式。附耐熱承盤建議另購。',
    options: [{ label: '規格', choices: [{ name: '單支' }, { name: '三支組', price: 200 }] }],
    meta: [{ k: '五行', v: '金' }, { k: '長度', v: '約 10 cm' }],
    forWho: ['想為空間或自己做一次清理', '喜歡以儀式安頓心緒'],
    howto: ['點燃後輕搧熄火苗，讓煙繞過空間', '搭耐熱承盤使用，保持通風', '結束後確實熄滅'],
    notes: '請全程有人看顧，遠離可燃物。',
  },
  {
    id: 'fenjing', cat: 'peace', glyph: '晶', tone: 'sage', price: 880,
    name: '安定粉晶原礦', material: '天然粉晶',
    blurb: '放在桌上，提醒自己對自己好一點。',
    detail: '天然粉晶，每塊紋理都不一樣。放在書桌、床頭或窗邊，放著就好，不用想它做什麼。附素麻收納袋。',
    options: [{ label: '大小', choices: [{ name: '掌心小礦' }, { name: '中礦', price: 300 }] }],
    meta: [{ k: '五行', v: '土' }, { k: '材質', v: '天然粉晶' }],
    forWho: ['想在桌上放一個溫柔的提醒', '希望對自己多一點寬容'],
    howto: ['放在書桌、床頭或窗邊', '定期以清水或月光淨化'],
    notes: '天然原礦含棉絮與冰裂，是天然特徵。',
  },
  {
    id: 'hongxian', cat: 'fate', glyph: '結', tone: 'rose', price: 380,
    name: '同心結香囊', material: '綢緞 · 乾燥花',
    blurb: '把想說的話，收進一個小小的結裡。',
    detail: '綢緞縫製的小香囊，內含乾燥玫瑰花瓣。裡面可以放一張手寫的小紙條，或者什麼都不放，就繫著。',
    options: [{ label: '顏色', choices: [{ name: '緋紅' }, { name: '黛綠' }, { name: '鵝黃' }] }],
    meta: [{ k: '五行', v: '火' }, { k: '尺寸', v: '約 5 cm' }],
    forWho: ['想為一個人收起一句話', '喜歡隨身帶點溫柔的人'],
    howto: ['可放入手寫小紙條後繫起', '避免水洗，保持乾燥'],
    notes: '乾燥花瓣香氣會隨時間轉淡，屬正常。',
  },
];

// 占卜結果推薦（佔位）。🔭 reason 由 LLM 依占卜結果生成；未問過則空白。
export const RECOMMENDED_PRODUCT = {
  id: 'anshen',
  reason: '你抽到的牌提醒你「先把自己穩住」——這只安神符，留給睡不好的那些夜裡。',
};
