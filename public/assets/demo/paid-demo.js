/* 付費版範例頁（/demo/gua、/demo/tarot，2026-10-23 DS ui_kits/free-flow/paid-demo.jsx 定稿）
 * 掛在 FunnelDocument（demo）主腳本之後：主腳本不跑 boot（不打後端、不量測、不登入），這支用固定的範例資料畫一份「付費後結果頁」。
 * 版面沿用付費頁同一套函式與樣式（block／paywall(true)／tianPair／tarotBlockFull／tframe／fulu／mdFull；塔羅抽牌區用 tarot-funnel.js 的 TarotDemo）。
 * 資料＝範例帳號 2026-10-23 的真實快照（易經 林予晴、塔羅 陳以安，名字為化名），只留畫面要用的欄位、不含任何憑證；解讀全文逐字照範例內容檔。
 * 圖：卦符卡、第一張靈符存成 /assets/demo/ 靜態圖（網址不帶任何憑證）。
 * 不放（DS 第 8 點）：分享、會員中心、存這張卦符、回來拿靈符提醒、推薦預約、購買時間、重新起卦。
 * 注意：行內註解一律用 /* *\/，不要在一行中間放 //。
 */
(function () {
  'use strict';
  var KIND = document.body.getAttribute('data-demo');
  if (KIND !== 'gua' && KIND !== 'tarot') return;
  var TAROT = KIND === 'tarot';
  var GO_URL = TAROT ? '/love-tarot/' : '/love-gua/';   /* 〔拿到靈符解方〕連回對應活動頁 */
  var D = {"gua":{"text":"**先說結論**\n\n命卦（小過）與運卦（比）放在一起看：運卦說眼前氣順、他靠得近；命卦說這件事的本命是「小過」，近可以，急不行。這是命差運好的組合，眼前會順，但別押太大，別把一時的順當成結果。\n\n摘要說「親近不是錯覺」，這點保留，但要修正：他的心離你很近，近在日常、近在小事，離「說定」還差一段時間。\n\n**命卦（小過）怎麼說**\n\n過山雷鳴，雷在山上，聲大力小。四陰壓兩陽，小事能過，大事不能硬過。爻辭寫獨木橋：心裡惶恐，爽利就過得去，慢吞吞反而不安。感情爻只有一句：要較長時間彼此瞭解，不可倉促。\n\n你的八字辛金坐亥水，心思細，感受多。時支巳與日支亥相沖，所以你內在常拉扯，一邊期待、一邊猜。今年丙午，丙火與你的日干辛相合，感情確實被牽動。你無犯太歲，這是緣分被推到眼前，但要靠時間驗證。箕水豹加白羊，直覺快、性子急，正好撞上小過的「不可過火」。\n\n**塔羅在說什麼**\n\n- 過去聖杯騎士逆位：忽冷忽熱、情緒起伏的舊模式，來自他，也來自你。\n- 現在錢幣五：你感到匱乏、怕被冷落。這份缺，多半是你心裡的空，不全是他不在。\n- 未來隱士逆位：風險在這裡。一猜不準，你就縮回殼裡、假裝不在意。\n- 建議戰車：有決心、肯前進很好，但小過要你收韁繩。前進是穩穩的小步，不是衝線。\n- 結果聖杯六逆位：別拿過去的甜或舊傷當尺去量他。\n\n**觀音靈籤第45籤**\n\n「溫柔自古勝剛強」，講的正是這段感情的用法。別逼問、別試探，用溫柔而穩的態度，他才會靠近。戰車的力氣用在守住自己的節奏，不要用在他身上。\n\n**這組符為什麼配給你**\n\n命卦是雷（木）壓著山（土），木剋土，兩股力量互相拉扯，就像你心裡的期待與猜疑。五張符水、火、金、木、土俱全，是依這點配的：不偏幫哪一邊，讓木與土之間有火能轉、有水能潤、有金能收，拉扯有地方緩下來。這是給你一個穩住心的依靠。\n\n**行動方案**\n\n- 近期（立冬前後兩週）：不問「你到底怎麼想」，改約一件具體的小事，坦率表達一次善意。每天只記他做了什麼，不記你猜了什麼。\n- 中期（一到三個月）：看他是否主動、是否說到做到。三件小事兌現了，再談關係定位。\n- 長期：讓自己的價值不靠他的回應來定義。若半年後仍停在曖昧，就用一次清楚、溫柔的對話收尾。\n\n**風險與時機**\n\n立冬前後氣轉，情緒容易起伏。深夜別傳長訊息，也別因旁人一句話就改變判斷。時機在「慢」，不在「快」。\n\n**孔明大易神數 · 難以脫逃的人心**\n\n第201籤，本卦比、變六四，變卦萃。這是你天性會走向的方向：從兩人相依，走到人事聚集，也就是有旁人進場。籤詩說「無端風雨催春去，知君心事亂如麻」，這是中下籤、平破之局。\n\n風雨將會來，而且不是憑空而來。身邊有一個來自北方、姓氏帶金或刀、占有慾強、架子很大的人，正在中間攪動，讓你的心亂成一團。你越亂，越容易錯看他的心。\n\n這局屬破厄之局，需順應霜降到立冬的節氣，每七到十四天用金、水、木、火、土五種五炁屬性的法器一起補一次，五炁俱足，才能順氣破厄。你正在走向的結局是：心若穩，桃花落了仍能再開；心若亂，風雨就會替你決定。\n\n**能量指引語**\n\n心穩了，近的人自然會走近。\n\n找風問幸福 祝福你","tarot":[{"card_name":"聖杯騎士","is_reversed":true,"image_url":"https://cdn.winds.tw/tarot/minor_arcana_cups_knight_reversed.png"},{"card_name":"錢幣五","is_reversed":false,"image_url":"https://cdn.winds.tw/tarot/minor_arcana_pentacles_5.png"},{"card_name":"隱士","is_reversed":true,"image_url":"https://cdn.winds.tw/tarot/major_arcana_hermit_reversed.png"},{"card_name":"戰車","is_reversed":false,"image_url":"https://cdn.winds.tw/tarot/major_arcana_chariot.png"},{"card_name":"聖杯六","is_reversed":true,"image_url":"https://cdn.winds.tw/tarot/minor_arcana_cups_6_reversed.png"}],"benMing":[{"label":"本世功課","card_name":"星星","image_url":"https://cdn.winds.tw/tarot/major_arcana_star.png"},{"label":"天賦資源","card_name":"皇帝","image_url":"https://cdn.winds.tw/tarot/major_arcana_emperor.png"},{"label":"業力因果","card_name":"星星","image_url":"https://cdn.winds.tw/tarot/major_arcana_star.png"},{"label":"天緣","card_name":"戀人","image_url":"https://cdn.winds.tw/tarot/major_arcana_lovers.png"}],"ziwei":["命宮坐戌，紫微天相同宮，紫微得化科，帶有貴氣與名聲上的加持。此局性格偏重原則與體面，做事講究分寸，容易被視為可靠、能擔責任的人；天相的特質讓你善於協調與輔佐，但也容易在人情與規則之間顧慮過多。命主祿存加土五局，底子穩健、重實際，晚成而耐久，傾向步步為營地累積，而非一次賭上全部。身主天機，思慮敏捷，凡事習慣先想過一輪，優點是反應快、能謀劃，代價是容易心思過重。","盤中最顯著的是財帛宮武曲天府同宮，屬財庫穩固的組合，對金錢有紀律感，適合穩健經營、長期累積，只是地空同度，意味理財上宜守不宜冒進，避免過度理想化的投資。官祿廉貞坐廟，事業上有企圖心與專業魅力，但火星、陀羅同度，節奏容易急躁或反覆，需要耐心打磨。遷移宮破軍旺而見擎羊、地劫，外在環境變動較多，也代表你適合在變局中開創，而非守成不動。福德宮七殺旺，內心有一股不服輸的驅動力，與命宮的穩重形成張力。","整體而言，這是一張外柔內剛、需要在安定與突破之間找平衡的盤。關鍵課題在於：學會把天機的謀略落實為行動，在保有紫府式穩健底盤的同時，敢於在變動中選一個方向深耕，而不是讓思慮耗掉機會。"],"chat":[[true,"最近一直在想他到底在不在乎我，我是不是想太多？"],[false,"我們先停一下。\n一直反覆想「他到底在不在乎」，其實不是想太多，是我們心裡有一塊地方沒被安放好，所以才一直繞回來看。那種懸著、想確認又怕確認的感覺，我們都知道，很累。\n不過我想問自己一句：讓我們這樣反覆猜的，是他做了什麼、沒做什麼？還是我們在等一句話，一個確定的回應？\n你願意的話，跟我說說最近發生了什麼。我在。"],[true,"那我該主動找他，還是等他？"],[false,"我們先別急著選「找」或「等」，因為這兩個選項背後，其實是同一個問題：我們想用什麼姿態去確認他在不在乎。\n如果是「等」，我們多半是怕主動了顯得太在意、被看輕，結果把自己耗在原地，越等越酸。如果是「找」，是因為我們真的想靠近他、想說說話，那就沒什麼好彆扭的，找就是了。但如果找他是為了「測試」他會不會回應、回得夠不夠快，那很容易讓我們更焦慮，因為不管他回什麼，我們都會再拿去反覆咀嚼。\n所以我會先問自己：此刻想找他，是想「跟他說話」，還是想「得到一個答案」？\n如果是前者，就用輕鬆、不帶壓力的方式找他，聊點日常就好，不用交代我們的心情。如果是後者，那也許我們該直接一點，找個舒服的時機，把「我最近有點在意我們之間的狀態」好好說出口，比悶著猜安心得多。\n你覺得，我們比較偏向哪一種？"],[true,"謝謝你，我會試著先穩住自己。"],[false,"嗯，先穩住自己，這個決定很好。\n穩下來之後，不管最後是找他還是等他，我們都是從踏實的地方出發，而不是從慌張裡出發，那就已經贏了一半。\n這幾天如果又開始繞圈，就回來跟我說說話。我一直都在。"]]},"tarot":{"text":"【結果傾向】\n你們目前比較像停在「等待與調整」的階段，還沒走到可以明確定義的位置。未來位的倒吊人是暫停、換個角度看事情。結果位的節制逆位，則提醒關係容易在忽冷忽熱、衝動或失衡之間擺盪。所以六個月後，可能還是沒有一個乾脆的名分答案。但這不代表沒有路。如果你不急著逼出答案，改用穩定的節奏互動，先把自己的滿足感顧好，結果有機會往平穩的方向走。反過來，如果雙方都用衝動或極端的方式確認彼此，就傾向更混亂。\n\n【你的核心課題】\n這題的核心是倒吊人加聖杯九：在不確定裡學會等待，同時守住自己的滿足感。心裡有特定的人，又很想知道「我們算什麼」，這種等待特別磨人。\n\n你的八字日柱是戊寅，戊土是代表「你自己」的那個字，像大地與山，傾向穩重，事情習慣放在心裡慢慢消化。八字裡申金與壬水很多，白話說就是想法、感受與變動的力量偏多。你可能容易想很多，感受一多就容易淹沒自己，這正好呼應聖杯九的水過多。處女座與生肖猴也有細膩、反應快的傾向，容易在細節裡反覆推敲訊號。時柱只輕輕補充，不下斷定。\n\n本命塔羅的戀人，是本世功課也是業力因果，代表感情裡「選擇與忠於自己價值」的課題一再出現。這次倒吊人的換視角、節制的找平衡，都是同一課題的延伸。惡魔是你的天賦資源，代表你對感情有很強的吸引力與投入，用得好是動力，用過頭就容易執著。女皇則提醒你有滋養與被滋養的能力。\n\n【五張牌與你】\n過去的寶劍十逆位，像背上插滿寶劍、天邊卻透出黎明微光，這個階段已經過去、已沒有力量，不必再拿它當現在的判斷依據。\n\n現在的錢幣三逆位，指向合作與默契不足、品質不穩，也許是你們在相處方式、彼此期待上還沒磨合。這份力量已經交給下一件事，轉成下一步的基礎：先把互動的方式整理清楚。\n\n未來的倒吊人，是倒掛卻平靜、頭上有光環的畫面。它邀請你換個角度看這段關係，不急著推進，也不急著下結論。\n\n建議的聖杯九雖然是滿足與願望成真的牌，但現在被牽制而削弱，所以你還在辛苦防守。要做好長期抗戰的準備，滿足感要一點一點養，不會一下子到位。\n\n結果的節制逆位，提醒失衡與衝動是要留意的地方。畫面裡一腳踏水、一腳踏地，正是要在感受與現實之間找回平衡。\n\n【支持與牽制】\n錢幣三支持倒吊人，也支持聖杯九。把互動方式與期待整理好，會讓你的等待更有依據，也讓滿足感比較有地基。節制支持錢幣三，所以當你能穩住自己的節奏，合作與默契也會跟著變好，這是可以借力的地方。\n\n要調整期待的是節制牽制聖杯九，也牽制倒吊人。失衡的情緒會削弱你的滿足感，也可能讓原本該平靜的等待變成焦慮。倒吊人是大牌，這裡只講影響，不改變其他牌的狀態。寶劍十已經過去，它曾經讓你對「平衡」特別敏感，但現在已沒有力量，不能拿來借力，也不必再被它牽著走。\n\n【人際】\n這次沒有出現宮廷牌，所以這題主要靠你自己的部分：你怎麼表達、怎麼定節奏、怎麼守住界線。牌面沒有給出對方的想法，也不能替他下判斷。你能掌握的是自己的說法是否清楚、自己的付出是否過量，以及自己是否在等待中失去重心。\n\n【六個月的觀察節點】\n第一，霜降前後運勢小吉，適合平靜地把自己的感受與期待說清楚一次。如果對方有回應、互動變穩，就可以繼續維持。\n\n第二，立冬到小雪都偏平，適合觀察。看互動是不是比較一致，而不是時熱時冷。如果仍然忽冷忽熱，就調低期待，把重心放回自己。\n\n第三，大雪與冬至偏小慎，情緒容易起伏。若出現想逼問、想一次攤牌的衝動，先放慢。到小寒再回頭重新評估。你沒有犯太歲，但不代表外在完全沒有壓力，工作與生活的壓力也可能影響感情節奏，留意即可。\n\n【選項與代價】\n一、先穩定互動、暫不定義關係。代價是要忍受一段模糊期，但最符合倒吊人與錢幣三的方向。這是第一步。\n\n二、在平靜的時候，直接談彼此的期待。代價是可能聽到不想聽的答案，或對方也還沒有答案。避免在情緒高點談，否則容易落入節制逆位的衝動。\n\n三、暫時拉開距離，把重心放回自己的生活。代價是互動可能變少、關係可能更淡，但能保護你的滿足感。若長期是你單方面投入、對方沒有回應，就改走這個選項。\n\n【給你的建議】\n你最在意的是「我們算什麼」，但目前牌面顯示，這個答案可能一時不會有。還要考慮到的是，你很容易因為想太多、感受太滿而失衡，這會讓等待變得更辛苦。所以目前建議你先穩住自己的節奏，把互動整理得清楚、平穩，再在適合的時機表達期待。如果互動愈來愈穩，就可以往下走。如果仍然反覆、你持續耗損，就重新評估，把重心放回自己。\n\n【靈符解方】\n風易揚老師給你的土符，平衡的是聖杯九那份「水過多」：感受、期待與想像太滿、容易淹沒你的狀態。土像堤岸，對應節制裡「一腳踏地」的現實感，也補你八字裡水偏多、土需要撐住的地方。用法是存成手機桌布，常常看見它，提醒自己回到當下、穩住步調。目前只有這一張，已經在你手上。它是幫你練習穩定的提醒。"}};

  /* 好愛「心裡有一個特定的人」：易經問「他的心，離我有多近」、塔羅問「我們現在算什麼」 */
  STATE.data.loveWho = 'someone';
  STATE.data.loveAngle = TAROT ? 'where' : 'heart';
  STATE.step = 'demo';   /* 不是 result：價格更新時主腳本不會重畫整頁（範例頁自己換頁尾） */

  /* 完整解讀：易經粗體小標、塔羅【】小標都用付費頁同一個玫瑰色小標（.fi-h2），其餘照付費頁 mdFull */
  function fullText(t) {
    return String(t).split('\n').map(function (l) {
      var s = l.trim(), m = s.match(/^\*\*(.+)\*\*$/);
      if (m) return '### ' + m[1];
      if (/^【.+】$/.test(s)) return '### ' + s;
      return l;
    }).join('\n');
  }

  function banner(name) {
    return '<div class="season-tip dm-banner">' + ic('eye', 'thin') + '<span class="t">範例客人：' + name + '（名字為化名）</span></div>';
  }
  function summary(q, hero) {
    return '<div class="summary"><span class="eyebrow"><span class="dot"></span>已拿到靈符解方</span>' +
      '<h1 class="q">你的完整感情解讀</h1>' +
      '<p class="sum-ask" style="margin:24px 0 10px">你這次問的是：「' + esc(q) + '」。</p>' +
      '<div style="margin-top:22px">' + hero + '</div></div>';
  }
  /* 卦符卡／靈符卡（同 hexCardHero／fuHero 的放法；拿掉「存這張卦符」與節氣提醒） */
  function heroCard(img, alt, until, right) {
    return '<div class="zf-card sunken tal-hero-card"><div class="tal-hero">' +
      '<div class="tal-wrap"><div style="position:relative">' + tframe('<img src="' + img + '" alt="' + alt + '" decoding="async" style="width:100%;height:100%;object-fit:cover">', true) + '</div>' +
      '<div class="tal-caption">' + ic('device-mobile') + '<span style="text-align:center">法效期間 · ' + until + ' 止</span></div></div>' +
      '<div class="hexcol">' + right + '</div></div></div>';
  }

  /* ── 易經：五張靈符（第一張已開，其餘照節氣鎖著；日期寫死，不隨今天變） ── */
  var FU = [['霜降', '水', ''], ['立冬', '火', '11 月 7 日'], ['小雪', '金', '11 月 22 日'], ['大雪', '木', '12 月 7 日'], ['冬至', '土', '12 月 22 日']];
  function guaTalismans() {
    var h = '<div class="tal5-sec"><div style="display:flex;align-items:center;gap:10px;margin:0 0 6px;flex-wrap:wrap"><span class="tal5-t">依你命卦搭配的 5 張量能靈符</span><span class="zf-tag rose outline" style="font-size:12px;letter-spacing:0;white-space:nowrap">隨命卦「雷山小過」而對應</span></div>' +
      '<p class="tal5-p">前面的卦象回應這次感情問題，以下五張靈符則由風易揚老師親手畫，依你的命卦搭配。</p></div>';
    h += '<div class="tal5-grid">' + FU.map(function (f, i) {
      var open = i === 0;
      var inner = open
        ? '<img src="/assets/demo/gua-fu-1.jpg" alt="' + f[1] + '符" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover">'
        : '<div class="blurred" style="width:100%;height:100%">' + fulu(f[1], f[1]) + '</div>';
      var fog = open ? '' : '<div class="fog"><span class="lk">' + ic('lock-simple', 'thin') + '</span><span class="fu-wait">' + f[0] + '開</span></div>';
      return '<div class="tal5"><div style="position:relative">' + tframe(inner, false, EL_GLOW[f[1]]) + fog + '</div>' +
        '<div class="nm">' + f[0] + ' · ' + f[1] + '</div>' +
        '<div class="nm" style="margin-top:2px;color:var(--text-muted)">' + (open ? '已開' : f[0] + '（' + f[2] + '）開') + '</div></div>';
    }).join('') + '</div>';
    return h;
  }
  /* #ziwei：紫微完整解讀節錄（樣式＝紫微頁宮位解讀） */
  function ziweiBlockDemo() {
    return '<div id="ziwei" class="dm-anchor">' + block('紫微完整解讀', '',
      '<div class="zf-card dm-zw"><h4 class="dm-zw-h">命宮（自我）</h4>' + D.gua.ziwei.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<p class="dm-foot">完整解讀共 12 宮，另含運勢走勢與四化飛星。</p>') + '</div>';
  }
  /* #spirit：分靈體小卡（照分靈體頁頂部卡）＋三問三答 */
  function spiritBlockDemo() {
    var card = '<div class="dm-sp-prof"><div class="dm-sp-row"><span class="dm-sp-pav">星</span><div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="dm-sp-name">星湖</span><span class="dm-sp-tag">你的分靈體</span></div>' +
      '<div class="dm-sp-sub">沉靜・通透・念舊</div></div></div></div>';
    var chat = '<div class="dm-chat">' + D.gua.chat.map(function (m) {
      return m[0]
        ? '<div class="dm-bub user"><div class="dm-bub-in"><p class="dm-bub-txt">' + esc(m[1]) + '</p></div><span style="width:32px;flex:none"></span></div>'
        : '<div class="dm-bub"><span class="dm-av">星</span><div class="dm-bub-in"><p class="dm-bub-txt">' + esc(m[1]) + '</p></div></div>';
    }).join('') + '</div>';
    return '<div id="spirit" class="dm-anchor">' + block('你的分靈體', '', card + chat + '<p class="dm-foot">付費後 7 天可以跟自己的分靈體聊，每天 30 句。</p>') + '</div>';
  }

  /* 頁尾：試營運價＋〔拿到靈符解方〕＋〔回到我的解讀〕 */
  function endHtml() {
    return '<div class="res-end" id="demoEnd" style="display:flex;flex-direction:column;align-items:center;gap:14px">' +
      '<div style="width:100%;display:flex;flex-direction:column;align-items:center">' + trialPriceHtml(true) +
      '<a class="zf-btn primary lg" href="' + GO_URL + '">' + ic('sparkle') + '拿到靈符解方 · NT$ ' + TALISMAN_PRICE + '</a></div>' +
      '<div id="demoBackWrap"><button class="zf-btn secondary md" onclick="demoBack()">回到我的解讀</button></div></div>';
  }
  /* 範例頁是新分頁開的：先試著關掉這個分頁；關不掉、有上一頁就上一頁；都不行不跳活動頁（會丟掉客人的解讀），改成一行說明（Astra #9） */
  window.demoBack = function () {
    try { window.close(); } catch (e) {}
    setTimeout(function () {
      if (history.length > 1) { history.back(); return; }
      var w = document.getElementById('demoBackWrap');
      if (w) w.innerHTML = '<p class="dm-foot" style="margin:0;text-align:center">關掉這個分頁，就會回到你的解讀。</p>';
    }, 250);
  };

  function viewGua() {
    var R = { hexName: '水地比', upperGua: '水', lowerGua: '地', tarot: D.gua.tarot,
      tian: { name: '雷山小過', upper_gua: '雷', lower_gua: '山', same: false, birth_label: '' } };   /* 命卦說明拿掉生辰日期 */
    STATE.result = R;
    STATE.full = { hexagram_content: fullText(D.gua.text), ben_ming_tarots: D.gua.benMing };
    var right = '<span class="hex-name">此刻的運卦是<span style="white-space:nowrap">「水地比」</span></span>' +
      '<p class="hex-read" style="font-size:24px;letter-spacing:6px;color:var(--accent-press);margin:10px 0 0">' + GUA_UNI['水'] + GUA_UNI['地'] + '</p>';
    var h = banner('林予晴') + summary('這段感情・他的心，離我有多近', heroCard('/assets/demo/gua-hexcard.jpg', '水地比 卦符', '12/22', right));
    h += block('你的命卦與運卦', '', tianPair(R));
    h += block('完整解讀', '', paywall(true));
    h += ziweiBlockDemo();
    h += spiritBlockDemo();
    h += tarotBlockFull(R);
    h += block('風易揚老師的靈符解方', '風易揚老師親手畫的靈符會按下方日期開放，開放後可點開儲存大圖，設成手機桌布，陪你改善炁場。', guaTalismans(), true);
    return h;
  }
  function viewTarot() {
    STATE.result = {};
    STATE.full = { hexagram_content: fullText(D.tarot.text) };
    var T = window.TarotDemo;
    if (T) T.restore({ cast_at: '2026-10-22T18:58:00.609Z', needs_teacher: false, focus_ids: ['major-12', 'cups-9'], talismans: [{ n: 1, element: '土' }],
      cards: [{ id: 'swords-10', orientation: 'reversed', name: '寶劍十' }, { id: 'pentacles-3', orientation: 'reversed', name: '錢幣三' }, { id: 'major-12', orientation: 'upright', name: '倒吊人' }, { id: 'cups-9', orientation: 'upright', name: '聖杯九' }, { id: 'major-14', orientation: 'reversed', name: '節制' }] });
    var h = banner('陳以安') + summary('這段感情・我們現在算什麼', heroCard('/assets/demo/tarot-fu-1.jpg', '土符', '10/23', T ? T.box() : ''));
    h += block('完整解讀', '', paywall(true));
    return h;
  }

  function paint() {
    var root = document.getElementById('root');
    root.innerHTML = siteHeader() + '<main class="shell" style="max-width:820px">' + (TAROT ? viewTarot() : viewGua()) + endHtml() + '</main>' + siteFooter();
    /* 會員中心入口（導覽列登入／帳號、頁尾「會員中心」）只在範例頁拿掉 */
    Array.prototype.forEach.call(root.querySelectorAll('#auth-button,#auth-button-m,.zf-footer a[href="/account"]'), function (el) { el.parentNode.removeChild(el); });
    wireSiteChrome();
    if (TAROT && window.TarotDemo) TarotDemo.mount();
    /* 網址帶 #ziwei／#spirit：捲到那一格（圖片陸續撐開時再對準，同結果頁 renderScroll） */
    var a = (location.hash || '').slice(1);
    if (a === 'ziwei' || a === 'spirit') { RENDER_KEEP = { anchor: a }; renderScroll(); }
  }
  /* 價格以後端為準：換了就只重畫頁尾 */
  window.addEventListener('zf-price', function () { var e = document.getElementById('demoEnd'); if (e) e.outerHTML = endHtml(); });
  window.addEventListener('hashchange', function () { var a = (location.hash || '').slice(1); if (a === 'ziwei' || a === 'spirit') { RENDER_KEEP = { anchor: a }; renderScroll(); } });
  paint();
})();
