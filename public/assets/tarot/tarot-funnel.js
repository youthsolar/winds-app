/* 五行通靈塔羅試做頁（/love-tarot、/home-tarot，2026-10-12）
 * 掛在 FunnelDocument（mode=love／home ＋ tarot）的主腳本之後：同一個落地頁、同一套問題與「認識你」逐題問，
 * 只把水鏡起卦換成 DS TarotShuffle 抽五張牌，結果頁改成前端自己算（不打後端、不建訂單、不存資料）。
 * 做法：覆寫主腳本裡的幾個全域函式（viewLanding／viewHex／submitFree／viewResult…），其餘原樣沿用。
 * 抽牌元件＝claude-artifacts/tarot-trial/template.html（DS 第二～四輪）逐段搬；靈符桌布卡＝hex-card.ts cardHtml 逐值。
 * ⚠️ 行內註解一律用 /* *\/，不要在一行中間放 //（10/12 試用頁被吃掉半行兩次）。
 */
(function () {
  'use strict';
  if (document.body.getAttribute('data-tarot') !== '1' || !window.TarotEngine) return;
  var E = window.TarotEngine;
  var POS = E.TIME_POSITIONS;
  var RATIO = 551 / 320;
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PERIOD = '未來六個月';   /* 10/11 Jeffery：觀察期限一律六個月，不給選單 */
  var BOOK_URL = '/booking';   /* 塔羅試做頁不掛風小編（客服），所有「預約老師」都直接連網站預約頁 */
  /* DS TarotShuffle SKIN：好愛＝「愛」、家裡的符＝「宅」 */
  var SKIN = HOME
    ? { bg: 'var(--accent-press)', bg2: 'var(--accent)', line: 'var(--text-on-accent)', ink: 'var(--text-on-accent)', glyph: '宅', glow: 'var(--accent)' }
    : { bg: 'var(--accent)', bg2: 'var(--accent-hover)', line: 'var(--text-on-accent)', ink: 'var(--text-on-accent)', glyph: '愛', glow: 'var(--rose-300)' };

  /* ── 靜態表 ──
     節氣交節時刻（UTC 毫秒；台北時間＝+8）：lunar-typescript（同 cloudflare-worker）2026-10-12 產出，2026/09/23 秋分～2031/01/20 大寒（2026-10-12 補到 2030 年底）；超出範圍見 jieqiAt。
     生肖：農曆正月初一換（同 lunarCalc getYearShengXiao）；星座：國曆分界（同 solar.getXingZuo，白羊寫牡羊）。 */
  var TS_JQ = [["秋分",1790121913908],["寒露",1791440957494],["霜降",1792748277351],["立冬",1794045124503],["小雪",1795332201289],["大雪",1796611951899],["冬至",1797886213691],["小寒",1799158197825],["大寒",1800430190111],["立春",1801705578497],["雨水",1802986408770],["驚蟄",1804275572936],["春分",1805574282330],["清明",1806884250678],["穀雨",1808205458455],["立夏",1809537911740],["小滿",1810880294465],["芒種",1812230747924],["夏至",1813587049514],["小暑",1814945823035],["大暑",1816304679335],["立秋",1817659606111],["處暑",1819008858779],["白露",1820348907599],["秋分",1821679302626],["寒露",1822997825698],["霜降",1824305572463],["立冬",1825601914943],["小雪",1826889373731],["大雪",1828168661098],["冬至",1829443330091],["小寒",1830714878704],["大寒",1831987316722],["立春",1833262273216],["雨水",1834543562250],["驚蟄",1835832286966],["春分",1837131429774],["清明",1838440985596],["穀雨",1839762570846],["立夏",1841094731570],["小滿",1842437389090],["芒種",1843787759967],["夏至",1845144119767],["小暑",1846503018045],["大暑",1847861638867],["立秋",1849216870573],["處暑",1850565656144],["白露",1851906129907],["秋分",1853235920378],["寒露",1854554910942],["霜降",1855862003979],["立冬",1857158835800],["小雪",1858445663507],["大雪",1859725480665],["冬至",1860999580551],["小寒",1862271715243],["大寒",1863543653217],["立春",1864819246929],["雨水",1866100075666],["驚蟄",1867389457221],["春分",1868688118766],["清明",1869998303852],["穀雨",1871319342158],["立夏",1872652065859],["小滿",1873994152095],["芒種",1875344998118],["夏至",1876700897258],["小暑",1878060143428],["大暑",1879418525416],["立秋",1880773904476],["處暑",1882122696728],["白露",1883463114336],["秋分",1884793111295],["寒露",1886111887993],["霜降",1887419288053],["立冬",1888715805976],["小雪",1890002963667],["大雪",1891282428328],["冬至",1892556847803],["小寒",1893828634400],["大寒",1895100864074],["立春",1896376107694],["雨水",1897657197256],["驚蟄",1898946198313],["春分",1900245126840],["清明",1901554860530],["穀雨",1902876216333],["立夏",1904208378012],["小滿",1905550866162],["芒種",1906901070041],["夏至",1908257478317],["小暑",1909616129011],["大暑",1910975093358],["立秋",1912330039781],["處暑",1913679384224],["白露",1915019570416],["秋分",1916350014532],["寒露",1917668716703],["霜降",1918976434652],["立冬",1920272924316],["小雪",1921560276046],["大雪",1922839657273],["冬至",1924114177368],["小寒",1925385788735],["大寒",1926658078059]];
  var TS_SX = [[1930,130,"馬"],[1931,217,"羊"],[1932,206,"猴"],[1933,126,"雞"],[1934,214,"狗"],[1935,204,"豬"],[1936,124,"鼠"],[1937,211,"牛"],[1938,131,"虎"],[1939,219,"兔"],[1940,208,"龍"],[1941,127,"蛇"],[1942,215,"馬"],[1943,205,"羊"],[1944,125,"猴"],[1945,213,"雞"],[1946,202,"狗"],[1947,122,"豬"],[1948,210,"鼠"],[1949,129,"牛"],[1950,217,"虎"],[1951,206,"兔"],[1952,127,"龍"],[1953,214,"蛇"],[1954,203,"馬"],[1955,124,"羊"],[1956,212,"猴"],[1957,131,"雞"],[1958,218,"狗"],[1959,208,"豬"],[1960,128,"鼠"],[1961,215,"牛"],[1962,205,"虎"],[1963,125,"兔"],[1964,213,"龍"],[1965,202,"蛇"],[1966,121,"馬"],[1967,209,"羊"],[1968,130,"猴"],[1969,217,"雞"],[1970,206,"狗"],[1971,127,"豬"],[1972,215,"鼠"],[1973,203,"牛"],[1974,123,"虎"],[1975,211,"兔"],[1976,131,"龍"],[1977,218,"蛇"],[1978,207,"馬"],[1979,128,"羊"],[1980,216,"猴"],[1981,205,"雞"],[1982,125,"狗"],[1983,213,"豬"],[1984,202,"鼠"],[1985,220,"牛"],[1986,209,"虎"],[1987,129,"兔"],[1988,217,"龍"],[1989,206,"蛇"],[1990,127,"馬"],[1991,215,"羊"],[1992,204,"猴"],[1993,123,"雞"],[1994,210,"狗"],[1995,131,"豬"],[1996,219,"鼠"],[1997,207,"牛"],[1998,128,"虎"],[1999,216,"兔"],[2000,205,"龍"],[2001,124,"蛇"],[2002,212,"馬"],[2003,201,"羊"],[2004,122,"猴"],[2005,209,"雞"],[2006,129,"狗"],[2007,218,"豬"],[2008,207,"鼠"],[2009,126,"牛"],[2010,214,"虎"],[2011,203,"兔"],[2012,123,"龍"],[2013,210,"蛇"],[2014,131,"馬"],[2015,219,"羊"],[2016,208,"猴"],[2017,128,"雞"],[2018,216,"狗"],[2019,205,"豬"],[2020,125,"鼠"],[2021,212,"牛"],[2022,201,"虎"],[2023,122,"兔"],[2024,210,"龍"],[2025,129,"蛇"],[2026,217,"馬"],[2027,206,"羊"],[2028,126,"猴"],[2029,213,"雞"],[2030,203,"狗"],[2031,123,"豬"]];
  var TS_XZ = [[101,"摩羯座"],[120,"水瓶座"],[219,"雙魚座"],[321,"牡羊座"],[420,"金牛座"],[521,"雙子座"],[622,"巨蟹座"],[723,"獅子座"],[823,"處女座"],[923,"天秤座"],[1024,"天蠍座"],[1123,"射手座"],[1222,"摩羯座"]];
  /* 節氣底圖池大小：同 hex-card.ts FRAME_POOL_V5 */
  var FRAME_POOL_V5 = { '立春': { male: 12, female: 12 }, '雨水': { male: 9, female: 11 }, '驚蟄': { male: 10, female: 11 }, '春分': { male: 12, female: 12 }, '清明': { male: 12, female: 12 }, '穀雨': { male: 12, female: 12 }, '立夏': { male: 12, female: 12 }, '小滿': { male: 11, female: 11 }, '芒種': { male: 12, female: 9 }, '夏至': { male: 12, female: 12 }, '小暑': { male: 12, female: 12 }, '大暑': { male: 11, female: 12 }, '立秋': { male: 11, female: 12 }, '處暑': { male: 11, female: 12 }, '白露': { male: 12, female: 11 }, '秋分': { male: 11, female: 12 }, '寒露': { male: 12, female: 12 }, '霜降': { male: 12, female: 12 }, '立冬': { male: 12, female: 12 }, '小雪': { male: 12, female: 12 }, '大雪': { male: 12, female: 12 }, '冬至': { male: 12, female: 12 }, '小寒': { male: 12, female: 12 }, '大寒': { male: 12, female: 12 } };
  var CDN = 'https://cdn.winds.tw/';
  var FU_EL = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
  var FU_LINE = { '金': '讓長得太滿的木收一收', '木': '把壓得太實的土鬆開', '水': '讓過旺的火靜下來', '火': '把太硬的金化開', '土': '替漫過頭的水築一道堤' };
  var FU_DAYS = 7;

  /* ── 牌資料 ── */
  var CARDS = null, BY_ID = Object.create(null), ELEMENTS = Object.create(null);
  var cardsReady = fetch('/assets/tarot/cards-data.json').then(function (r) { return r.json(); }).then(function (list) {
    CARDS = list;
    list.forEach(function (c) { BY_ID[c.id] = c; ELEMENTS[c.id] = { upright: c.e[0], reversed: c.e[1] }; });
    if (TS.mount && TS.mount.kind === 'land') renderFoot();
  });
  function nameOf(id) { return BY_ID[id] ? BY_ID[id].name : ''; }

  var TS = { state: null, timers: [], mount: null, who: null, adv: null };
  function later(fn, ms) { TS.timers.push(setTimeout(fn, reduced ? 0 : ms)); }
  function clearTimers() { TS.timers.forEach(clearTimeout); TS.timers = []; if (TS.adv) { clearTimeout(TS.adv); TS.adv = null; } }
  function resetDraw() { clearTimers(); TS.state = null; TS.who = null; }

  function randInt(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function drawFive() {
    var pool = CARDS.map(function (c) { return c.id; }), out = [];
    for (var i = 0; i < 5; i++) out.push({ id: pool.splice(randInt(pool.length), 1)[0], orientation: randInt(2) ? 'reversed' : 'upright' });
    return out;
  }
  function ready() { return HOME ? !!STATE.data.home : lvReady(); }
  /* 這次問的那一句（同 viewResult 的「你問的是」） */
  function askLabel() {
    if (HOME) { var hs = homeSitu(STATE.data.home); return '家裡的符' + (hs ? '・' + hs.l : ''); }
    var la = loveAngle(STATE.data.loveWho, STATE.data.loveAngle); return (lvSingle() ? '我的桃花' : '這段感情') + (la ? '・' + la.l : '');
  }
  /* 送給規則程式的問題字串（同 submitFree 組法） */
  function askText() {
    if (HOME) { var hs = homeSitu(STATE.data.home); return STATE.text + (hs ? '　家的情形：' + hs.l + '。' : ''); }
    var la = loveAngle(STATE.data.loveWho, STATE.data.loveAngle);
    return STATE.text + '　感情狀況：' + (lvSingle() ? '目前沒有特定對象，想看自己的桃花' : '心裡有一個特定的人') + '。最想先知道：' + (la ? la.l : '') + '。';
  }

  /* ── 抽牌元件（DS TarotShuffle） ── */
  function tsBox(id) {
    return '<div class="ts" id="' + id + '"><div class="ts-sum" hidden><span class="ts-q"></span><span class="ts-p">觀察六個月</span></div>' +
      '<div class="ts-stage" aria-live="polite"></div><div class="ts-foot"></div></div>';
  }
  function geom() {
    var root = TS.mount && TS.mount.root, avail = (root && root.clientWidth) || 340;
    var width = Math.max(260, Math.min(avail, avail >= 400 ? 376 : 310));
    var gap = width < 360 ? 6 : 10;
    var w = Math.floor((width - gap * 4) / 5), h = Math.round(w * RATIO);
    return { width: width, gap: gap, w: w, h: h, stageH: h + 6 + 10 + 8 + 74, deckX: (width - w) / 2 };
  }
  function stageHeight(g) {
    var s = TS.state, st = s ? s.st : 'idle';
    if (st === 'idle' || st === 'shuffle') return g.h + 12;
    if (st === 'done' && !s.ok) return g.h + 60;   /* 需要老師判讀：沒有上浮與「重點牌」那一行 */
    return g.stageH;
  }
  function backEl(w) {
    var k = SKIN, h = Math.round(w * RATIO), r = Math.max(4, Math.round(w * 0.08));
    var d = document.createElement('div'); d.className = 'tback';
    d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.borderRadius = r + 'px'; d.style.background = 'linear-gradient(160deg, ' + k.bg2 + ' 0%, ' + k.bg + ' 62%)';
    var i1 = Math.max(3, w * 0.06), i2 = Math.max(6, w * 0.12), dots = '';
    for (var i = 0; i < 12; i++) { var a = (i * 30 - 90) * Math.PI / 180; dots += '<circle cx="' + (50 + 38 * Math.cos(a)) + '" cy="' + (50 + 38 * Math.sin(a)) + '" r="' + (i % 3 ? 1.4 : 2.4) + '" fill="' + k.ink + '" opacity="' + (i % 3 ? .5 : .85) + '"/>'; }
    d.innerHTML = '<span class="b1" style="inset:' + i1 + 'px;border-radius:' + (r * .6) + 'px;border-width:1px;border-color:' + k.line + ';opacity:.9"></span>' +
      '<span class="b2" style="inset:' + i2 + 'px;border-radius:' + (r * .4) + 'px;border-width:.5px;border-color:' + k.line + ';opacity:.5"></span>' +
      [[0, 0], [1, 0], [0, 1], [1, 1]].map(function (p) { return '<span class="dm" style="background:' + k.line + ';' + (p[0] ? 'right' : 'left') + ':' + (w * .12 - 3) + 'px;' + (p[1] ? 'bottom' : 'top') + ':' + (w * .12 - 3) + 'px"></span>'; }).join('') +
      '<svg viewBox="0 0 100 100" style="width:' + (w * .8) + 'px;height:' + (w * .8) + 'px" aria-hidden="true">' + dots + '</svg>' +
      '<span class="gl" style="width:' + Math.round(w * .42) + 'px;height:' + Math.round(w * .42) + 'px;border-color:' + k.line + ';color:' + k.ink + ';font-size:' + Math.round(w * .22) + 'px">' + k.glyph + '</span>';
    return d;
  }
  function addName(lab, c, w) {
    var nm = document.createElement('span'); nm.className = 'nm'; nm.style.fontSize = (w < 64 ? 11.5 : 13) + 'px'; nm.textContent = nameOf(c.id); lab.append(nm);
    if (c.orientation === 'reversed') lab.insertAdjacentHTML('beforeend', '<span class="rv">逆位</span>');
  }
  function isFocus(i) { var s = TS.state; return !!(s && s.st === 'done' && s.ok && s.sel.focus_ids.indexOf(s.draw[i].id) >= 0); }
  function renderStage() {
    var m = TS.mount; if (!m) return;
    var g = geom(), stage = m.stage, s = TS.state, st = s ? s.st : 'idle';
    m.root.style.setProperty('--tsw', g.width + 'px');
    stage.style.height = stageHeight(g) + 'px';
    stage.replaceChildren();
    var sum = m.root.querySelector('.ts-sum');
    sum.hidden = !s || m.kind === 'result'; if (s) sum.querySelector('.ts-q').textContent = '「' + s.label + '」';
    var dealt = s ? s.dealt : 0;
    if (st === 'idle' || st === 'shuffle' || (st === 'deal' && dealt < 5)) {
      var n = st === 'shuffle' ? 10 : 6 - (st === 'deal' ? dealt : 0);
      for (var j = 0; j < n; j++) {
        var p = document.createElement('div'); p.className = 'ts-pile';
        var x0 = g.deckX + (j - n / 2) * .6;
        p.style.cssText = 'left:0;top:' + (6 - Math.min(j, 5) * 1.2) + 'px;z-index:' + j + ';--x0:' + x0 + 'px;--rf:' + Math.round(g.w * .62) + 'px;transform:translate(' + x0 + 'px,0)';
        if (st === 'shuffle' && !reduced) p.style.animation = 'tsRiffle' + (j % 2 ? 'R' : 'L') + ' 700ms ' + ((j >> 1) * 40) + 'ms var(--ease-soft) 3';
        p.append(backEl(g.w)); stage.append(p);
      }
    }
    if (s) s.draw.forEach(function (c, i) {
      var placed = i < dealt, open = s.open[i], key = isFocus(i);
      var slot = document.createElement('div'); slot.className = 'ts-slot';
      var x = placed ? i * (g.w + g.gap) : g.deckX, y = placed ? (key ? -10 : 6) : 6;
      slot.style.cssText = 'width:' + g.w + 'px;transform:translate(' + x + 'px,' + y + 'px);opacity:' + (placed ? 1 : 0) + ';z-index:' + (20 + i);
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ts-card' + (open ? ' open' : '');
      var r = Math.max(4, Math.round(g.w * .08));
      btn.style.cssText = 'width:' + g.w + 'px;height:' + g.h + 'px;border-radius:' + r + 'px;box-shadow:' + (key ? '0 0 0 2px ' + SKIN.glow + ', 0 10px 26px var(--photo-scrim)' : 'none');
      btn.disabled = st !== 'flip' || open || !m.live;
      btn.setAttribute('aria-label', POS[i] + (open ? '：' + nameOf(c.id) + (c.orientation === 'reversed' ? '（逆位）' : '') : '，點牌翻開'));
      var inner = document.createElement('div'); inner.className = 'ts-inner';
      var back = document.createElement('div'); back.className = 'ts-side back'; back.append(backEl(g.w));
      var face = document.createElement('div'); face.className = 'ts-side face';
      face.innerHTML = '<div class="face-img' + (c.orientation === 'reversed' ? ' rev' : '') + '" style="border-radius:' + r + 'px"><img src="/assets/tarot/cards/' + c.id + '.jpg" alt="" decoding="async"></div>';
      face.querySelector('img').alt = nameOf(c.id);
      inner.append(back, face); btn.append(inner);
      btn.addEventListener('click', function () { flip(i, btn, slot); });
      var lab = document.createElement('div'); lab.className = 'ts-labels';
      lab.style.marginTop = (8 + (key ? 10 : 0)) + 'px'; lab.style.opacity = placed ? 1 : 0;
      lab.innerHTML = '<span class="pos">' + POS[i] + '</span>';
      if (open) addName(lab, c, g.w);
      if (key) lab.insertAdjacentHTML('beforeend', '<span class="key">重點牌</span>');
      slot.append(btn, lab); stage.append(slot);
    });
    renderFoot();
  }
  function restartLink() {
    var a = document.createElement('button'); a.type = 'button'; a.className = 'ts-link'; a.textContent = '換一件事重新問';
    a.addEventListener('click', function () { askAnother(); }); return a;
  }
  function renderFoot() {
    var m = TS.mount; if (!m) return;
    var f = m.foot, s = TS.state, st = s ? s.st : 'idle'; f.replaceChildren();
    f.hidden = m.kind === 'result'; if (f.hidden) return;   /* 結果頁：頁尾已有「換一件事重新問」，這裡不放 */
    if (st === 'idle') {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'zf-btn primary md'; b.textContent = '洗牌';
      b.disabled = !ready() || !CARDS; b.addEventListener('click', startShuffle); f.append(b);
    } else if (st === 'shuffle' || st === 'deal') {
      f.innerHTML = '<span class="st">' + (st === 'shuffle' ? '洗牌中…' : '發牌中…') + '</span>';
    } else if (st === 'flip') {
      f.innerHTML = '<span class="st" style="color:var(--text-secondary)">點牌翻開（' + s.open.filter(Boolean).length + '／5）</span>';
    } else if (st === 'done') {
      if (!s.ok) {
        var d = document.createElement('div'); d.className = 'ts-teacher';
        d.innerHTML = '<span class="t1">這組牌需要老師進一步判讀</span><span class="t2">五張牌的組合比較特別，交給老師當面看，會說得比較完整。</span>' +
          '<a class="zf-btn primary md" href="' + BOOK_URL + '">預約老師</a>';
        d.append(restartLink()); f.append(d);
      } else f.append(restartLink());
    }
  }
  function startShuffle() {
    if (!CARDS || !ready() || (TS.state && TS.state.st !== 'idle')) return;
    clearTimers();
    TS.state = { label: askLabel(), question: askText(), at: Date.now(), draw: drawFive(), open: [false, false, false, false, false], st: 'shuffle', dealt: 0 };
    if (reduced) { TS.state.st = 'flip'; TS.state.dealt = 5; renderStage(); return; }
    renderStage();
    later(function () {
      TS.state.st = 'deal'; renderStage();
      for (var i = 0; i < 5; i++) (function (i) { later(function () { TS.state.dealt = i + 1; moveSlots(); }, 160 + i * 140); })(i);
      later(function () { TS.state.st = 'flip'; renderStage(); }, 160 + 4 * 140 + 460);
    }, 2100);
  }
  /* 發牌時只移動，不整塊重畫（才看得到落位動畫） */
  function moveSlots() {
    var m = TS.mount; if (!m) return;
    var g = geom(), slots = m.stage.querySelectorAll('.ts-slot'), piles = m.stage.querySelectorAll('.ts-pile');
    Array.prototype.forEach.call(slots, function (s, i) { if (i < TS.state.dealt) { s.style.transform = 'translate(' + (i * (g.w + g.gap)) + 'px,6px)'; s.style.opacity = 1; s.querySelector('.ts-labels').style.opacity = 1; } });
    var keep = 6 - TS.state.dealt; Array.prototype.forEach.call(piles, function (p, j) { p.hidden = j >= keep; });
  }
  function flip(i, btn, slot) {
    var s = TS.state; if (!s || s.st !== 'flip' || s.open[i]) return;
    s.open[i] = true; btn.classList.add('open'); btn.disabled = true;
    var c = s.draw[i];
    btn.setAttribute('aria-label', POS[i] + '：' + nameOf(c.id) + (c.orientation === 'reversed' ? '（逆位）' : ''));
    addName(slot.querySelector('.ts-labels'), c, geom().w);
    renderFoot();
    if (s.open.every(Boolean)) later(function () { analyze(); s.st = 'done'; markDone(); }, 700);
  }
  /* 翻完：在原元素上浮起重點牌（不重畫，才看得到上浮與光暈的過場） */
  function markDone() {
    var m = TS.mount, s = TS.state, g = geom();
    m.stage.style.height = stageHeight(g) + 'px';
    Array.prototype.forEach.call(m.stage.querySelectorAll('.ts-slot'), function (el, i) {
      if (!isFocus(i)) return;
      el.style.transform = 'translate(' + (i * (g.w + g.gap)) + 'px,-10px)';
      el.querySelector('.ts-card').style.boxShadow = '0 0 0 2px ' + SKIN.glow + ', 0 10px 26px var(--photo-scrim)';
      var lab = el.querySelector('.ts-labels'); lab.style.marginTop = '18px';
      lab.insertAdjacentHTML('beforeend', '<span class="key">重點牌</span>');
    });
    renderFoot();
    /* 有符：同水鏡起好卦 1.7 秒後接到下一步；需要老師判讀就停在這裡 */
    if (s.ok) TS.adv = setTimeout(function () { TS.adv = null; if (STATE.step === 'landing' && TS.state === s) go('hex'); }, reduced ? 600 : 1700);
  }
  /* 規則：重點牌（取牌規則）→ 五行生剋 → 配符；取不出重點牌或配不出符＝交給老師 */
  function analyze() {
    var s = TS.state;
    s.sel = E.pickFocus({ question: s.question, timeframe: PERIOD, deck: 'RWS', cards: s.draw });
    s.wx = (s.sel.status === 'ok' && s.sel.focus_ids.length) ? E.analyzeWuxing(s.draw, s.sel.focus_ids, ELEMENTS) : null;
    var t = s.wx ? E.talismansFor(s.wx) : null;
    s.tal = (t && t.status === 'ok' && t.talismans && t.talismans.length) ? t.talismans : null;
    s.ok = !!s.tal;
  }

  /* ── 掛載：每次 render() 之後把抽牌區畫進對應的容器 ── */
  function mountStage(id, kind) {
    var root = document.getElementById(id); if (!root) { TS.mount = null; return; }
    TS.mount = { root: root, stage: root.querySelector('.ts-stage'), foot: root.querySelector('.ts-foot'), kind: kind, live: kind === 'land' };
    renderStage();
  }
  function afterRender() {
    if (STATE.step === 'landing') {
      /* 回到落地頁（上一步、換一件事）：已經抽完有符的那一局作廢，重新洗牌（同水鏡回到落地頁要重新起卦） */
      if (TS.state && TS.state.st === 'done' && TS.state.ok) resetDraw();
      mountStage('tsLand', 'land');
    } else if (STATE.step === 'hex') mountStage('tsHex', 'hex');
    else if (STATE.step === 'result') { mountStage('tsRes', 'result'); mountFu(); }
    else TS.mount = null;
  }

  /* ── 靈符桌布卡（hex-card.ts cardHtml 逐值；試用頁 fuCard／fuBlurCard） ── */
  function hashStr(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function tp(ms) { return new Date(ms + 8 * 3600e3); }   /* 台北日期用 getUTC* 讀 */
  function ymd(ms, full) { var t = tp(ms), m = t.getUTCMonth() + 1, d = t.getUTCDate(); return full ? t.getUTCFullYear() + '/' + pad2(m) + '/' + pad2(d) : m + '/' + d; }
  /* 超出表的範圍（2026/09/23 秋分之前、2031/01/20 大寒之後）：不默默回錯的節氣——用最接近的那一個，並在 console 警告要補表 */
  function jieqiAt(ms) {
    var first = TS_JQ[0], last = TS_JQ[TS_JQ.length - 1];
    if (ms < first[1] || ms >= last[1]) { console.warn('[tarot] 節氣表只到 ' + ymd(last[1], true) + '（從 ' + ymd(first[1], true) + ' 起），這個時間超出範圍，暫用最接近的節氣；請補 TS_JQ'); return ms < first[1] ? first[0] : last[0]; }
    var cur = first[0]; for (var i = 0; i < TS_JQ.length; i++) if (TS_JQ[i][1] <= ms) cur = TS_JQ[i][0]; return cur;
  }
  /* 下一個節氣：表外一律回 null（結果頁就不顯示「下一個節氣」那句，不猜） */
  function jieqiNext(ms) { if (ms < TS_JQ[0][1]) return null; for (var i = 0; i < TS_JQ.length; i++) if (TS_JQ[i][1] > ms) return TS_JQ[i]; return null; }
  function shengxiaoOf(y, md) { var row = null, prev = null; TS_SX.forEach(function (r) { if (r[0] === y) row = r; if (r[0] === y - 1) prev = r; }); return row && md >= row[1] ? row[2] : (prev ? prev[2] : ''); }
  function xingzuoOf(md) { var z = TS_XZ[0][1]; TS_XZ.forEach(function (r) { if (md >= r[0]) z = r[1]; }); return z; }
  function frameUrl(jq, gender, seed) {
    var pool = FRAME_POOL_V5[jq]; if (!pool) return '';
    var list = [];
    (gender ? [gender] : ['male', 'female']).forEach(function (g) { for (var i = 1; i <= pool[g]; i++) list.push(g + '/' + i); });
    return CDN + 'brand/frames/v5/' + encodeURIComponent(jq) + '/' + list[seed % list.length] + '.jpg';
  }
  function mk(tag, cls, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); return e; }
  function fuCard(el, line0, frame, who, untilMs) {
    var c = mk('div', 'fc', { role: 'img', 'aria-label': el + '符桌布卡' });
    c.append(mk('img', 'frame', { src: frame, alt: '' }), mk('div', 'scrim-top'), mk('div', 'scrim-bot'));
    var tal = mk('div', 'tal'); tal.append(mk('img', 'img', { src: '/assets/tarot/fu/tal-' + FU_EL[el] + '.jpg', alt: '' }), mk('img', 'logo', { src: CDN + 'brand/logo.png', alt: '' }));
    var data = mk('div', 'data'), icons = mk('div', 'icons');
    [who.shengxiao, who.xingzuo].forEach(function (n) { if (n) icons.append(mk('img', '', { src: CDN + 'brand/icons-black/' + encodeURIComponent(n) + '.png', alt: '' })); });
    var date = mk('div', 'date'); date.textContent = '法效期間  ' + ymd(untilMs, true) + '  止'; data.append(icons, date); tal.append(data); c.append(tal);
    var top = mk('div', 'top'), tt = mk('div'), name = mk('div', 'name'), line = mk('div', 'line');
    name.textContent = el + '符';
    var l1 = mk('div'), l2 = mk('div'); l1.textContent = line0; l2.textContent = FU_LINE[el]; line.append(l1, l2); tt.append(name, line);
    top.append(tt, mk('img', 'seal-img', { src: CDN + 'brand/seal-feng.png', alt: '風' })); c.append(top);
    var bot = mk('div', 'bot'), by = mk('div', 'by'), ex = mk('div', 'exp'), tag = mk('div', 'tag');
    by.textContent = '風易揚老師親繪'; ex.textContent = '改善炁場 · ' + ymd(untilMs) + ' 前有效'; tag.textContent = '找風問幸福 winds.tw';
    bot.append(by, ex, tag); c.append(bot); return c;
  }
  /* 遮罩卡：同 hex-card.ts fuBlurCardHtml——同一張底圖、模糊符令，不放 logo／日期／名稱（鎖頭用網站 .fog，放在框外） */
  function fuBlurCard(el, frame) {
    var c = mk('div', 'fc', { role: 'img', 'aria-label': el + '符（還沒解開）' });
    var tal = mk('div', 'tal'); tal.append(mk('img', 'img', { src: '/assets/tarot/fu/tal-' + FU_EL[el] + '-blur.jpg', alt: '' }));
    c.append(mk('img', 'frame', { src: frame, alt: '' }), tal); return c;
  }
  function fitFu() {
    Array.prototype.forEach.call(document.querySelectorAll('.tframe>.fc'), function (c) { var w = c.parentNode.clientWidth; if (w) c.style.transform = 'scale(' + (w / 1080) + ')'; });
  }
  function fuParts() {
    var s = TS.state, who = TS.who || {};
    var jq = jieqiAt(s.at), seed = hashStr(s.draw.map(function (c) { return c.id; }).join('|')), until = s.at + FU_DAYS * 864e5;
    return s.tal.map(function (t, i) {
      var w = (s.wx.cards.filter(function (c) { return c.id === t.card; })[0]) || {};
      return { el: t.element, frame: frameUrl(jq, who.gender, seed + i), line0: '平衡' + (w.orientation === 'reversed' ? '逆位' : '正位') + nameOf(t.card) + '的' + t.target, until: until };
    });
  }
  function mountFu() {
    var s = TS.state; if (!s || !s.tal) return;
    var parts = fuParts(), who = TS.who || {};
    var a = document.querySelector('#tsFu1 .tframe'); if (a) a.append(fuCard(parts[0].el, parts[0].line0, parts[0].frame, who, parts[0].until));
    var b = document.querySelector('#tsFu2 .tframe'); if (b && parts[1]) b.append(fuBlurCard(parts[1].el, parts[1].frame));
    fitFu();
  }

  /* ── 覆寫：落地頁（文字同 /love、/home-gua，只換掉講水鏡、卦的句子） ── */
  window.lpMirror = function () { return '<div class="lc-mirror">' + tsBox('tsLand') + '</div>'; };
  window.lpToMirror = function () { lpScrollTo(document.querySelector('.lpd #hgCast .ts')); };
  window.lvGuideHtml = function () {
    if (!STATE.data.loveWho) return '<p class="hg-guide">想著最在意的感情事，按下洗牌。</p><p class="hg-guide">抽牌後，老師依牌給你一張親手畫的靈符解方。</p>';
    if (lvSingle()) return '<p class="hg-guide">把心思放回自己。</p><p class="hg-guide">下一個是誰，先不要執著。</p><p class="hg-guide">先看看，現在的你準備好迎接一段感情了嗎？</p><p class="hg-guide">然後，按下洗牌。</p>';
    return '<p class="hg-guide">就想著他。</p><p class="hg-guide">想起最近那次對話。</p><p class="hg-guide">先看這組牌：你們現在算什麼？</p><p class="hg-guide">然後，按下洗牌。</p>';
  };
  /* 導覽列的「預約老師」原本帶 data-wc-open（開風小編）；試做頁沒有風小編，拿掉讓它直接連 /booking */
  var _siteHeader = window.siteHeader;
  window.siteHeader = function () { return _siteHeader().replace(/ data-wc-open/g, ''); };
  window.viewLoveLanding = function () {
    return siteHeader() +
      '<main class="shell narrow ff hg lpd">' +
      '<section class="lc' + (lvReady() ? ' ready' : '') + '" id="hgCast">' +
        '<div class="lc-grid"><div class="lc-qs">' +
          lpHero('找風問幸福 · 愛情', '你們，到底算什麼？', '有對象，想看清關係；沒對象，想知道桃花在哪。') +
          '<section class="lc-sec lc-sec0">' + lcStep(1, 'lcN1', '心裡，有個在意的人嗎？', '', !!STATE.data.loveWho) +
            '<div class="lc-opts" role="group" id="lvWho">' + LOVE_WHO.map(function (x) { return lcOpt(STATE.data.loveWho === x.k, "lvPickWho('" + x.k + "',this)", x.l, x.d); }).join('') + '</div></section>' +
          '<section class="lc-sec" id="lvAngleWrap"' + (STATE.data.loveWho ? '' : ' style="display:none"') + '>' + lcStep(2, 'lcN2', '哪件事，你最想問？', '', !!STATE.data.loveAngle) +
            '<div class="lc-opts lc-opts2" role="group" id="lvAngle">' + lvAngleChips() + '</div></section>' +
        '</div>' +
        '<div class="lc-side">' + lpMirror() +
          '<div class="lc-guide" id="lvGuide">' + lvGuideHtml() + '</div>' +
        '</div></div>' +
        '</section>' +
      lpFolds([
        ['最難的，是放不下', ['對話重看好多次，還是猜不透？', '有對象看關係，沒對象看桃花，先抽五張牌。']],
        ['老師如何看牌', ['洗牌抽五張，先看感情；老師依牌給符，每張都親手畫。']],
        ['這次會拿到什麼', ['先送你一張這組牌的【靈符】，存成手機桌布，七天內幫你改善炁場。', '還想往下看，我再照你的牌把解讀說完整。']]]) +
      '</main>' + siteFooter(true);
  };
  window.viewLanding = function () {
    if (LOVE) return viewLoveLanding();
    return siteHeader() +
      '<main class="shell narrow ff hg lpd">' +
      '<section class="lc' + (STATE.data.home ? ' ready' : '') + '" id="hgCast">' +
        '<div class="lc-grid"><div class="lc-qs">' +
          lpHero('找風問幸福 · 風水', '家，怎麼越住越悶？', '這個家，適合現在的你嗎？洗牌，抽五張牌。') +
          '<section class="lc-sec lc-sec0">' + lcStep(1, 'lcN1', '你家現在是哪種狀況？', '', !!STATE.data.home) +
            '<div class="lc-opts lc-opts2" role="group" id="hgChips">' + HOME_SITU.map(function (x) { return lcOpt(STATE.data.home === x.k, "hgPick('" + x.k + "',this)", x.l, ''); }).join('') + '</div></section>' +
        '</div>' +
        '<div class="lc-side">' + lpMirror() +
          '<div class="lc-guide"><p class="hg-guide">想著你的家，按下洗牌。</p><p class="hg-guide">抽牌後，老師依牌給你一張親手畫的靈符解方。</p></div>' +
        '</div></div>' +
        '</section>' +
      lpFolds([
        ['家裡哪裡卡住', ['住久了，家裡的變化會反映在人身上。', '所以我會先看牌。']],
        ['老師如何看牌', ['洗牌後抽出的五張牌，就是這個家現在給我的訊息。', '牌怎麼走，我就照著牌給符，每一張都是我親手畫的。']],
        ['這次會拿到什麼', ['先送你一張這組牌的【靈符】，存成手機桌布，七天內幫你和家裡改善炁場。', '還想往下看，我再照你的牌把解讀說完整。']]]) +
      '</main>' + siteFooter(true);
  };
  /* 選項一改：抽到一半或抽完的那一局作廢，洗牌鈕跟著亮／暗 */
  var _lcSync = window.lcSync;
  window.lcSync = function () {
    _lcSync();
    if (TS.state && TS.mount && TS.mount.kind === 'land') { resetDraw(); renderStage(); } else renderFoot();
  };

  /* ── 覆寫：「你的牌」那一步（原「你的卦」：水鏡換成五張牌，拿掉運卦模糊卦符卡；六個基本資料照舊） ── */
  STEPS[0].l = '抽牌';
  window.viewHex = function () {
    if (!TS.state || TS.state.st !== 'done' || !TS.state.ok) { setTimeout(function () { go('landing'); }, 0); return ''; }
    return '<main class="shell narrow ff"><div class="step-intro"><span class="eyebrow"><span class="dot"></span>你的牌</span></div>' +
      tsBox('tsHex') +
      '<p class="ff-p" style="margin-top:14px">牌已經抽好了。接下來，老師要合你的命盤，才能繼續往下看。</p>' +
      '<div class="six"><div class="six-claim"><span>只要 <em>6 個</em> 基本資料</span><span class="plus">＋</span><span><em>30 秒</em> 得到幸福</span></div><div class="six-fields"><span><b>01</b>姓名</span><span><b>02</b>西元生日</span><span><b>03</b>出生時間</span><span><b>04</b>性別</span><span><b>05</b>手機</span><span><b>06</b>電子郵件</span></div></div>' +
      '<button class="zf-btn primary lg" style="width:100%" onclick="go(\'ask\')">好，讓老師認識我</button></main>';
  };
  /* 逐題問照舊，只改第一題開場那句的「卦」 */
  var _viewAsk = window.viewAsk;
  window.viewAsk = function () { return _viewAsk().replace('這一卦我知道了。接下來看你的命盤，就可以給你更正確的命卦靈符。', '這組牌我知道了。接下來看你的命盤，就可以給你更正確的靈符。'); };
  /* 試做頁不打信箱檢查（MillionVerifier 會計費） */
  window.checkEmailLive = function () {};
  /* 送出：不送後端，只在這個分頁的記憶體裡用（生肖、星座、性別給靈符卡用） */
  window.submitFree = function () {
    var d = STATE.data;
    if (!TS.state || !TS.state.ok) { go('landing'); return; }
    if (!d.month || !d.day || !d.gender || !phoneE164(d.phone) || !validGmail(d.email)) { showFfErr('老師還有幾題沒問完。'); go('ask'); return; }
    var md = d.month * 100 + d.day;
    TS.who = { gender: d.gender === '男' ? 'male' : 'female', shengxiao: shengxiaoOf(d.year, md), xingzuo: xingzuoOf(md) };
    go('result');
  };

  /* ── 覆寫：結果頁（結構同 viewResult；解讀還沒接、付款不開） ── */
  function tarotPaywall() {
    var s = TS.state, two = s.tal.length > 1, first;
    if (LOVE && lvSingle()) { first = { where: '桃花時機', heart: '對象特質', stuck: '感情卡點', next: '相遇線索' }[STATE.data.loveAngle]; first = [(first || '桃花') + '的完整牌陣解讀', '從這組牌看提醒，供你參考。']; }
    else if (LOVE) first = ['這段關係的完整牌陣解讀', '關係現況、卡點與接下來的提醒'];
    else first = ['這次居家問題的完整解讀', '住得卡、剛入住、想備符或挑房的疑問'];
    var items = [first];
    if (two) items.push(['第二張靈符', '付 NT$360 後，第 14 天解開']);
    items.push(['完整節氣運勢分析', '看看接下來各節氣的運勢提醒']);
    var lead = LOVE
      ? (lvSingle()
        ? '你剛選的桃花問題，就是這份解方要接著談的重點。我會把這組牌的提醒說完整，再加上你的生辰與個性一起看，讓你帶著更完整的線索，看待接下來的感情機會。'
        : '你在意的，是這段關係接下來怎麼走。這份解方會把這組牌說完整，加上你的生辰與個性一起看。把牌面的提醒看完整，再想想自己的下一步。')
      : '挑房、入住、備符，你心裡在意的那件事，值得好好看一回。這份解方會把這組牌的提醒說完整，加上你的生辰與個性一起看，陪你整理眼前的居家疑問。';
    return '<div class="paywall"><div class="behind"><p>解鎖後，你會拿到完整解讀，還有風易揚老師親手畫的靈符。</p><div class="row"><i></i><i></i><i></i><i></i><i></i></div></div>' +
      '<div class="veil"><span class="lk">' + ic('lock-simple', 'thin') + '</span><h3>風易揚老師的靈符解方</h3>' +
      '<p>' + lead + '</p>' +
      '<div class="gets"><div class="gets-t">拿到靈符解方後，你會得到：</div>' +
      items.map(function (x) { return '<div class="get">' + ic('check', 'bold') + '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div></div>'; }).join('') + '</div>' +
      '<button class="zf-btn primary lg" disabled aria-disabled="true">' + ic('sparkle') + '拿到靈符解方 · NT$ ' + TALISMAN_PRICE + '</button>' +
      '<p class="veil-alt">塔羅版的付款還沒開放。</p>' +
      '<p class="veil-alt">想直接找老師談這件事？<a href="/booking">預約老師</a></p></div></div>';
  }
  window.viewResult = function () {
    var s = TS.state;
    if (!s || !s.ok || !TS.who) { setTimeout(function () { go('landing'); }, 0); return ''; }
    var q = askLabel(), part = fuParts()[0], nx = jieqiNext(s.at);
    var h = '<div class="summary"><span class="eyebrow"><span class="dot"></span>為你讀好了</span><h1 class="ff-main">' +
      (LOVE ? (lvSingle() ? '這組牌，看見的是你現在的桃花狀態' : '這組牌，看見的是你們現在的關係') : '這組牌，看見的是你家現在的狀態') + '</h1>';
    if (HOME) h += '<p class="lede" style="margin:10px 0 4px">家不是單純的「住得好」或「住不好」。<br>有時候是格局與方位，悄悄影響每天的心情。<br>有時候是剛搬進去，人和房子還在磨合。<br>還在挑房子的話，也先看看你和它合不合。<br>先看看，你的家現在正在什麼位置。</p>';
    if (LOVE) h += (lvSingle()
      ? '<p class="lede" style="margin:10px 0 4px">桃花不是單純的「有人追」或「沒人追」。<br>有時候機會已經出現，只是你沒有注意。<br>有時候身邊明明有人，卻始終遇不到真正適合自己的關係。<br>也有些時候，是上一段感情留下的東西，還沒有真正離開。<br>先看看，你現在的感情正在什麼位置。</p>'
      : '<p class="lede" style="margin:10px 0 4px">有些人明明彼此在意，卻一直停在原地。<br>有些人越靠越近，其中一個卻突然退開。<br>也有些感情真正卡住的，從來不是「愛不愛」，而是兩個人已經站在不同的位置。<br>先別急著問結果。<br>先看看，你們現在怎麼了。</p>');
    h += '<p class="sum-ask" style="margin:24px 0 10px">你問的是「' + esc(q) + '」</p>';
    /* 卦符卡的位置：左＝第一張靈符（清楚、七天），右＝五張牌（DS 翻完狀態）＋下一個節氣 */
    h += '<div style="margin-top:22px"><div class="zf-card sunken tal-hero-card"><div class="tal-hero">' +
      '<div class="tal-wrap" id="tsFu1"><div style="position:relative">' + tframe('', true) + '</div>' +
      '<div class="tal-caption">' + ic('device-mobile') + '<span style="text-align:center"><span style="white-space:nowrap">讓這張靈符陪你改善炁場，</span><span style="white-space:nowrap">手機桌布放滿七天</span><br><span style="white-space:nowrap">' + ymd(part.until) + ' 前有效</span></span></div></div>' +
      '<div class="hexcol">' + tsBox('tsRes') +
      (nx ? '<div class="season-tip">' + ic('leaf', 'thin') + '<span class="t">下一個節氣是 <b>' + nx[0] + '</b>（' + (tp(nx[1]).getUTCMonth() + 1) + ' 月 ' + tp(nx[1]).getUTCDate() + ' 日）。' + PH_SOLAR.line + '</span></div>' : '') +
      '</div></div></div></div>';
    h += '<div class="sum-body">這組牌的解讀即將開放。</div>';
    h += '</div>';
    h += '<div class="banner"><div class="bimg" style="background-image:url(/assets/flow-banner-top.jpg),linear-gradient(135deg,var(--rose-100),var(--clay-200))"></div><div class="cap"><span>慢慢看，不用急。</span></div></div>';
    var locked = '';
    if (s.tal[1]) {
      var el2 = s.tal[1].element;
      locked = '<div class="tal5-grid"><div class="tal5" id="tsFu2"><div style="position:relative">' + tframe('', false, EL_GLOW[el2]) +
        '<div class="fog"><span class="lk">' + ic('lock-simple', 'thin') + '</span></div></div>' +
        '<div class="nm">' + el2 + '符</div><div class="ln">付 NT$360 後，第 14 天解開</div></div></div>';
    }
    h += block('完整解讀與你的靈符', (LOVE ? (lvSingle() ? '看懂你現在的桃花，也看看現在還能為自己做些什麼。' : '看懂這段感情，也看看現在還能為自己做些什麼。') : '看了這組牌的簡答，也看看接下來能為自己做些什麼。'),
      locked + '<div style="margin-top:' + (locked ? 20 : 0) + 'px">' + tarotPaywall() + '</div>', true);
    h += blogSection();
    h += socialCta();
    h += '<div class="res-end" style="display:flex;flex-direction:column;align-items:center;gap:22px">' +
      '<a class="zf-btn primary md" href="' + BOOK_URL + '">' + ic('calendar-heart', 'thin') + '預約老師</a>' +
      '<button onclick="askAnother()" style="all:unset;cursor:pointer;font-family:var(--font-serif);font-size:15.5px;color:var(--rose-600);border-bottom:1px solid var(--rose-200);padding-bottom:3px">換一件事重新問</button></div>';
    return '<main class="shell" style="max-width:820px">' + h + '</main>';
  };
  var _askAnother = window.askAnother;
  window.askAnother = function () { resetDraw(); _askAnother(); };

  /* render() 之後掛抽牌區與靈符卡 */
  var _render = window.render;
  window.render = function () { _render(); afterRender(); };
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (TS.mount && !(TS.state && (TS.state.st === 'shuffle' || TS.state.st === 'deal'))) renderStage(); fitFu(); }, 150); });

  /* 開機：試做頁不讀網址的 log_id、不預填、不登入，直接從落地頁開始 */
  render();
  cardsReady.catch(function () { showFfErr('牌載入失敗，請重新整理。'); });
})();
