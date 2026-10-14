/* 五行通靈塔羅試做頁（/love-tarot、/home-tarot，2026-10-12）
 * 掛在 FunnelDocument（mode=love／home ＋ tarot）的主腳本之後：同一個落地頁、同一套問題與「認識你」逐題問，
 * 只把水鏡起卦換成 DS TarotShuffle 抽五張牌。2026-10-12 接後端：牌由 api.winds.tw/tarot-draw 抽（重點牌、配符一起算好、抽牌簽名），
 * 送出走 /liff-submit（divination_method＝五行塔羅）、結果走 /liff-status 的 tarot 區塊，符卡由後端出圖（/t/w/ 閘道），付款沿用 createOrder。
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
  var BOOK_URL = '/booking';   /* 「預約老師」連結帶 data-wc-open 開風小編（2026-10-13 掛回）；JS 沒跑起來時退回預約頁 */
  /* DS TarotShuffle SKIN：好愛＝「愛」、家裡的符＝「宅」 */
  var SKIN = HOME
    ? { bg: 'var(--accent-press)', bg2: 'var(--accent)', line: 'var(--text-on-accent)', ink: 'var(--text-on-accent)', glyph: '宅', glow: 'var(--accent)' }
    : { bg: 'var(--accent)', bg2: 'var(--accent-hover)', line: 'var(--text-on-accent)', ink: 'var(--text-on-accent)', glyph: '愛', glow: 'var(--rose-300)' };

  /* ── 靜態表 ──
     節氣交節時刻（UTC 毫秒；台北時間＝+8）：lunar-typescript（同 cloudflare-worker）2026-10-12 產出，2026/09/23 秋分～2031/01/20 大寒（2026-10-12 補到 2030 年底）；超出範圍見 jieqiAt。
     （生肖、星座改由後端照客人生日算，畫在後端出圖的靈符卡上） */
  var TS_JQ = [["秋分",1790121913908],["寒露",1791440957494],["霜降",1792748277351],["立冬",1794045124503],["小雪",1795332201289],["大雪",1796611951899],["冬至",1797886213691],["小寒",1799158197825],["大寒",1800430190111],["立春",1801705578497],["雨水",1802986408770],["驚蟄",1804275572936],["春分",1805574282330],["清明",1806884250678],["穀雨",1808205458455],["立夏",1809537911740],["小滿",1810880294465],["芒種",1812230747924],["夏至",1813587049514],["小暑",1814945823035],["大暑",1816304679335],["立秋",1817659606111],["處暑",1819008858779],["白露",1820348907599],["秋分",1821679302626],["寒露",1822997825698],["霜降",1824305572463],["立冬",1825601914943],["小雪",1826889373731],["大雪",1828168661098],["冬至",1829443330091],["小寒",1830714878704],["大寒",1831987316722],["立春",1833262273216],["雨水",1834543562250],["驚蟄",1835832286966],["春分",1837131429774],["清明",1838440985596],["穀雨",1839762570846],["立夏",1841094731570],["小滿",1842437389090],["芒種",1843787759967],["夏至",1845144119767],["小暑",1846503018045],["大暑",1847861638867],["立秋",1849216870573],["處暑",1850565656144],["白露",1851906129907],["秋分",1853235920378],["寒露",1854554910942],["霜降",1855862003979],["立冬",1857158835800],["小雪",1858445663507],["大雪",1859725480665],["冬至",1860999580551],["小寒",1862271715243],["大寒",1863543653217],["立春",1864819246929],["雨水",1866100075666],["驚蟄",1867389457221],["春分",1868688118766],["清明",1869998303852],["穀雨",1871319342158],["立夏",1872652065859],["小滿",1873994152095],["芒種",1875344998118],["夏至",1876700897258],["小暑",1878060143428],["大暑",1879418525416],["立秋",1880773904476],["處暑",1882122696728],["白露",1883463114336],["秋分",1884793111295],["寒露",1886111887993],["霜降",1887419288053],["立冬",1888715805976],["小雪",1890002963667],["大雪",1891282428328],["冬至",1892556847803],["小寒",1893828634400],["大寒",1895100864074],["立春",1896376107694],["雨水",1897657197256],["驚蟄",1898946198313],["春分",1900245126840],["清明",1901554860530],["穀雨",1902876216333],["立夏",1904208378012],["小滿",1905550866162],["芒種",1906901070041],["夏至",1908257478317],["小暑",1909616129011],["大暑",1910975093358],["立秋",1912330039781],["處暑",1913679384224],["白露",1915019570416],["秋分",1916350014532],["寒露",1917668716703],["霜降",1918976434652],["立冬",1920272924316],["小雪",1921560276046],["大雪",1922839657273],["冬至",1924114177368],["小寒",1925385788735],["大寒",1926658078059]];
  /* 節氣底圖池大小：同 hex-card.ts FRAME_POOL_V5 */
  var FRAME_POOL_V5 = { '立春': { male: 12, female: 12 }, '雨水': { male: 9, female: 11 }, '驚蟄': { male: 10, female: 11 }, '春分': { male: 12, female: 12 }, '清明': { male: 12, female: 12 }, '穀雨': { male: 12, female: 12 }, '立夏': { male: 12, female: 12 }, '小滿': { male: 11, female: 11 }, '芒種': { male: 12, female: 9 }, '夏至': { male: 12, female: 12 }, '小暑': { male: 12, female: 12 }, '大暑': { male: 11, female: 12 }, '立秋': { male: 11, female: 12 }, '處暑': { male: 11, female: 12 }, '白露': { male: 12, female: 11 }, '秋分': { male: 11, female: 12 }, '寒露': { male: 12, female: 12 }, '霜降': { male: 12, female: 12 }, '立冬': { male: 12, female: 12 }, '小雪': { male: 12, female: 12 }, '大雪': { male: 12, female: 12 }, '冬至': { male: 12, female: 12 }, '小寒': { male: 12, female: 12 }, '大寒': { male: 12, female: 12 } };
  var CDN = 'https://cdn.winds.tw/';
  var FU_EL = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };

  /* ── 牌資料 ── */
  var CARDS = null, BY_ID = Object.create(null);
  var cardsReady = fetch('/assets/tarot/cards-data.json').then(function (r) { return r.json(); }).then(function (list) {
    CARDS = list;
    list.forEach(function (c) { BY_ID[c.id] = c; });
    if (TS.mount && TS.mount.kind === 'land') renderFoot();
  });
  function nameOf(id) { return BY_ID[id] ? BY_ID[id].name : ''; }

  var TS = { state: null, timers: [], mount: null, adv: null };
  function later(fn, ms) { TS.timers.push(setTimeout(fn, reduced ? 0 : ms)); }
  function clearTimers() { TS.timers.forEach(clearTimeout); TS.timers = []; if (TS.adv) { clearTimeout(TS.adv); TS.adv = null; } }
  function resetDraw() { clearTimers(); TS.state = null; }

  /* 牌由後端抽（同一套規則當場算好重點牌與配符，回抽牌簽名，送出時帶回驗證） */
  function fetchDraw() {
    /* 12 秒拿不到就放棄（走洗牌失敗那條：清掉這一局、請他再按一次；Astra front-r1 #3） */
    var ctl = window.AbortController ? new AbortController() : null, to = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    return fetch(WORKER_API + '/tarot-draw', ctl ? { method: 'POST', signal: ctl.signal } : { method: 'POST' }).then(function (r) { return r.json(); }).then(function (d) {
      if (to) clearTimeout(to);
      if (!d || !d.success || !d.cards || d.cards.length !== 5 || !d.draw_token) throw new Error('draw');
      return d;
    }, function (e) { if (to) clearTimeout(to); throw e; });
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
    if (s && s.draw) s.draw.forEach(function (c, i) {
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
          '<a class="zf-btn primary md" href="' + BOOK_URL + '" data-wc-open>預約老師</a>';
        d.append(restartLink()); f.append(d);
      } else f.append(restartLink());
    }
  }
  function startShuffle() {
    if (!CARDS || !ready() || (TS.state && TS.state.st !== 'idle')) return;
    clearTimers();
    var s = TS.state = { label: askLabel(), question: askText(), at: Date.now(), draw: null, open: [false, false, false, false, false], st: 'shuffle', dealt: 0 };
    var t0 = Date.now();
    /* 洗牌動畫照跑，同時跟後端拿牌；牌回來且洗滿 2.1 秒才發牌 */
    fetchDraw().then(function (d) {
      if (TS.state !== s) return;
      s.draw = d.cards; s.srv = d; s.token = d.draw_token; s.at = Date.parse(d.draw_at) || s.at;
      later(function () { if (TS.state === s) deal(s); }, Math.max(0, 2100 - (Date.now() - t0)));
    }).catch(function () {
      if (TS.state !== s) return;
      resetDraw(); renderStage(); showFfErr('洗牌沒有成功，請再按一次。');
    });
    renderStage();
  }
  function deal(s) {
    if (reduced) { s.st = 'flip'; s.dealt = 5; renderStage(); return; }
    s.st = 'deal'; renderStage();
    for (var i = 0; i < 5; i++) (function (i) { later(function () { if (TS.state === s) { s.dealt = i + 1; moveSlots(); } }, 160 + i * 140); })(i);
    later(function () { if (TS.state === s) { s.st = 'flip'; renderStage(); } }, 160 + 4 * 140 + 460);
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
    /* 重點牌與配符用後端抽牌時算好的（前後端同一份規則，單一真相在後端） */
    var s = TS.state, d = s.srv || {};
    s.sel = { focus_ids: d.focus_ids || [] };
    s.tal = (!d.needs_teacher && d.talismans && d.talismans.length) ? d.talismans : null;
    s.ok = !!s.tal;
  }
  /* 結果頁（剛送出、付款回來、重新整理）：用 /liff-status 回的 tarot 區塊把這一局還原，抽牌區照翻完狀態畫 */
  function restoreFromServer(T) {
    /* 牌名先用後端給的（牌庫 cards-data.json 可能比結果晚到；Astra front-r1 #5） */
    T.cards.forEach(function (c) { if (!BY_ID[c.id] && c.name) BY_ID[c.id] = { id: c.id, name: c.name }; });
    TS.state = { label: askLabel(), question: '', at: Date.parse(T.cast_at) || Date.now(), draw: T.cards.map(function (c) { return { id: c.id, orientation: c.orientation }; }),
      open: [true, true, true, true, true], st: 'done', dealt: 5, sel: { focus_ids: T.focus_ids || [] }, tal: T.needs_teacher ? null : T.talismans, ok: !T.needs_teacher, srv: T };
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
  function frameUrl(jq, gender, seed) {
    var pool = FRAME_POOL_V5[jq]; if (!pool) return '';
    var list = [];
    (gender ? [gender] : ['male', 'female']).forEach(function (g) { for (var i = 1; i <= pool[g]; i++) list.push(g + '/' + i); });
    return CDN + 'brand/frames/v5/' + encodeURIComponent(jq) + '/' + list[seed % list.length] + '.jpg';
  }
  function mk(tag, cls, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); return e; }
  /* 清楚的符卡由後端出圖（/t/w/ 閘道，同卦符卡版型）；清楚符令不再放公開檔。這裡只組「還沒開」那張的遮罩卡 */
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
    var s = TS.state;
    var jq = jieqiAt(s.at), seed = hashStr(s.draw.map(function (c) { return c.id; }).join('|'));
    return (s.tal || []).map(function (t, i) { return { el: t.element, frame: frameUrl(jq, null, seed + i), t: t }; });
  }
  function mountFu() {
    var s = TS.state; if (!s || !s.tal) return;
    var parts = fuParts();
    var b = document.querySelector('#tsFu2 .tframe'); if (b && parts[1] && !parts[1].t.url) b.append(fuBlurCard(parts[1].el, parts[1].frame));
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
  /* 送出：沿用網站的 submitFree（信箱驗證碼、手機必填、改生日確認、錯誤處理全部照舊），只把「卦」換成這一局的抽牌簽名 */
  var _submitFree = window.submitFree;
  window.submitFree = function () {
    var s = TS.state;
    if (!s || !s.ok || !s.token) { go('landing'); return; }
    STATE.cast = { code: 'tarot', castAt: new Date(s.at).toISOString() };   /* 只是讓網站那支的「先起卦」檢查放行；真正送出的是 tarot_draw */
    window.ffPayloadHook = function (p) { p.divination_method = '五行塔羅'; p.tarot_draw = s.token; delete p.cast_code; delete p.cast_at; };
    _submitFree();
  };
  /* 抽太久（簽名過期）後端回 recast，網站那支會去「起卦」那一步 → 塔羅頁改回落地頁重新洗牌 */
  window.viewCast = function () { resetDraw(); setTimeout(function () { go('landing'); }, 0); return ''; };
  /* 等解讀那一頁的第一句（原「老師正在看你的卦」） */
  if (window.READING_LINES) READING_LINES[0] = '老師正在看你的牌……';
  /* 送給老師的問題字串：好愛原本是「起一卦」 */
  if (LOVE) STATE.text = '我想為現在這段感情抽一組牌，先看看我們目前的狀況。';

  /* 結果資料：多帶後端回的 tarot 區塊，並把這一局還原到抽牌區 */
  var _buildResult = window.buildResult;
  window.buildResult = function (d) { var R = _buildResult(d); R.tarotSrv = d.tarot || null; if (d.tarot) restoreFromServer(d.tarot); return R; };

  /* ── 覆寫：結果頁（結構同 viewResult／viewReportPaid；卦符卡換成後端出圖的靈符卡） ── */
  function tarotPaywall(T) {
    var two = T.talismans.length > 1, first, f1 = T.talismans[0];
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
      (f1.expired
        ? '<button class="zf-btn primary lg" onclick="askAnother()">' + ic('arrow-counter-clockwise') + '這組牌已過期，重新抽一次牌</button><p class="veil-alt">靈符七天內有效，過了老師要依新的牌重新配符。</p>'
        : '<button class="zf-btn primary lg" id="unlockBtn" onclick="createOrder()">' + ic('sparkle') + '拿到靈符解方 · NT$ ' + TALISMAN_PRICE + '</button>' +
          '<p class="veil-alt">這張靈符 ' + esc(f1.valid_until_label) + ' 前有效，過了要重新抽牌。</p>') +
      '<p class="veil-alt">想直接找老師談這件事？<a href="' + BOOK_URL + '" data-wc-open>預約老師</a></p></div></div>';
  }
  /* 第一張靈符（後端出圖，同卦符卡 hexCardHero 的放法）＋右邊五張牌與下一個節氣 */
  function fuHero(T, paid) {
    /* 下一個節氣：用後端照「現在」算的（兩週後回來看也對；Astra front-r1 #4），沒有才用抽牌那天推 */
    var s = TS.state, f1 = T.talismans[0], J = (STATE.result || {}).jieqi, nx = J && J.next ? null : jieqiNext(s.at);
    var inner = f1.url ? '<img src="' + esc(f1.url) + '" alt="' + esc(f1.element) + '符" decoding="async" onerror="this.onerror=null;this.style.visibility=\'hidden\'" style="width:100%;height:100%;object-fit:cover;-webkit-touch-callout:default">' : '';
    var cap = f1.expired ? '這組牌已過期，重新抽一次牌'
      : paid ? '法效期間 · ' + esc(f1.valid_until_label) + ' 止<br>長按存成手機桌布'
      : '<span style="white-space:nowrap">讓這張靈符陪你改善炁場，</span><span style="white-space:nowrap">手機桌布放滿七天</span><br><span style="white-space:nowrap">' + esc(f1.valid_until_label) + ' 前有效 · </span><span style="white-space:nowrap">長按存成手機桌布</span>';
    return '<div class="zf-card sunken tal-hero-card"><div class="tal-hero">' +
      '<div class="tal-wrap" id="tsFu1"><div style="position:relative">' + tframe(inner, true) + '</div>' +
      '<div class="tal-caption">' + ic('device-mobile') + '<span style="text-align:center">' + cap + '</span></div>' +
      ((f1.url && !f1.expired) ? '<div style="text-align:center;margin-top:10px"><a class="zf-btn secondary sm" href="' + esc(f1.url) + '" target="_blank" rel="noopener">' + ic('download-simple') + '存這張靈符</a></div>' : '') + '</div>' +
      '<div class="hexcol">' + tsBox('tsRes') +
      (J && J.next ? '<div class="season-tip">' + ic('leaf', 'thin') + '<span class="t">下一個節氣是 <b>' + esc(J.next) + '</b>（' + esc(J.next_date) + '）。' + PH_SOLAR.line + '</span></div>'
        : nx ? '<div class="season-tip">' + ic('leaf', 'thin') + '<span class="t">下一個節氣是 <b>' + nx[0] + '</b>（' + (tp(nx[1]).getUTCMonth() + 1) + ' 月 ' + tp(nx[1]).getUTCDate() + ' 日）。' + PH_SOLAR.line + '</span></div>' : '') +
      '</div></div></div>';
  }
  /* 第二張靈符：還沒開＝遮罩卡＋鎖（付款後寫「N 天後自動開」，同網站 daysUntilUnlock）；開了＝後端出圖 */
  function fuSecond(T, paid) {
    var f2 = T.talismans[1]; if (!f2) return '';
    if (f2.url) return '<div class="tal5-grid"><div class="tal5"><div style="position:relative">' + tframe('<img src="' + esc(f2.url) + '" alt="' + esc(f2.element) + '符" decoding="async" style="width:100%;height:100%;object-fit:cover;-webkit-touch-callout:default">', false, EL_GLOW[f2.element]) + '</div>' +
      '<div class="nm">' + esc(f2.element) + '符</div><div class="ln">法效期間 · ' + esc(f2.valid_until_label) + ' 止</div></div></div>';
    /* 還鎖著就至少寫 1 天；真正開不開由後端決定（Astra front-r1 #6）。2026-10-14：用後端回的伺服器時間算，不靠客人手機時鐘（舊後端沒回就退回手機時間） */
    var wait = paid && f2.opens_at ? Math.max(1, Math.ceil((Date.parse(f2.opens_at) - (Date.parse(T.server_now) || Date.now())) / 864e5)) : 0;
    return '<div class="tal5-grid"><div class="tal5" id="tsFu2"><div style="position:relative">' + tframe('', false, EL_GLOW[f2.element]) +
      '<div class="fog"><span class="lk">' + ic('lock-simple', 'thin') + '</span>' + (paid ? '<span class="fu-wait">' + wait + ' 天後自動開</span>' : '') + '</div></div>' +
      '<div class="nm">' + esc(f2.element) + '符</div><div class="ln">' + (paid ? esc(f2.opens_label || '') + ' 自動開' : '付 NT$360 後，第 14 天解開') + '</div></div></div>';
  }
  function resEnd() {
    return '<div class="res-end" style="display:flex;flex-direction:column;align-items:center;gap:22px">' +
      '<a class="zf-btn primary md" href="' + BOOK_URL + '" data-wc-open>' + ic('calendar-heart', 'thin') + '預約老師</a>' +
      '<button onclick="askAnother()" style="all:unset;cursor:pointer;font-family:var(--font-serif);font-size:15.5px;color:var(--rose-600);border-bottom:1px solid var(--rose-200);padding-bottom:3px">換一件事重新問</button></div>';
  }
  window.viewResult = function () {
    var R = STATE.result || {}, T = R.tarotSrv, s = TS.state;
    if (!T || !s || !T.talismans || !T.talismans.length) { setTimeout(function () { go('landing'); }, 0); return ''; }
    var paid = STATE.paid || R.purchased, q = askLabel(), h;
    if (paid) {
      /* 付費後：同 viewReportPaid（靈符卡在最上面，完整解讀用網站同一張付費卡） */
      h = '<div class="summary"><span class="eyebrow"><span class="dot"></span>已拿到靈符解方</span><h1 class="q">你的完整命理報告</h1>' +
        '<p class="sum-ask" style="margin:24px 0 10px">你問的是「' + esc(q) + '」</p>' +
        '<div style="margin-top:22px">' + fuHero(T, true) + '</div></div>';
      h += block('完整解讀', '', paywall(true));
      h += block('你的命理檔案', '', profileCard(true));
      if (!(R.profile && R.profile.trim())) h += block('你的分靈體', '', spiritCard(true));
      if (T.talismans[1]) h += block('第二張靈符', '付款後第 14 天自動開，開了一樣存成手機桌布。', fuSecond(T, true), true);
      h += resEnd();
      return '<main class="shell" style="max-width:820px">' + h + '</main>';
    }
    h = '<div class="summary"><span class="eyebrow"><span class="dot"></span>為你讀好了</span><h1 class="ff-main">' +
      (LOVE ? (lvSingle() ? '這組牌，看見的是你現在的桃花狀態' : '這組牌，看見的是你們現在的關係') : '這組牌，看見的是你家現在的狀態') + '</h1>';
    if (HOME) h += '<p class="lede" style="margin:10px 0 4px">家不是單純的「住得好」或「住不好」。<br>有時候是格局與方位，悄悄影響每天的心情。<br>有時候是剛搬進去，人和房子還在磨合。<br>還在挑房子的話，也先看看你和它合不合。<br>先看看，你的家現在正在什麼位置。</p>';
    if (LOVE) h += (lvSingle()
      ? '<p class="lede" style="margin:10px 0 4px">桃花不是單純的「有人追」或「沒人追」。<br>有時候機會已經出現，只是你沒有注意。<br>有時候身邊明明有人，卻始終遇不到真正適合自己的關係。<br>也有些時候，是上一段感情留下的東西，還沒有真正離開。<br>先看看，你現在的感情正在什麼位置。</p>'
      : '<p class="lede" style="margin:10px 0 4px">有些人明明彼此在意，卻一直停在原地。<br>有些人越靠越近，其中一個卻突然退開。<br>也有些感情真正卡住的，從來不是「愛不愛」，而是兩個人已經站在不同的位置。<br>先別急著問結果。<br>先看看，你們現在怎麼了。</p>');
    h += '<p class="sum-ask" style="margin:24px 0 10px">你問的是「' + esc(q) + '」</p>';
    h += '<div style="margin-top:22px">' + fuHero(T, false) + '</div>';
    if (R.summary) h += '<div class="sum-body">' + md(R.summary) + '</div>';
    h += '</div>';
    h += '<div class="banner"><div class="bimg" style="background-image:url(/assets/flow-banner-top.jpg),linear-gradient(135deg,var(--rose-100),var(--clay-200))"></div><div class="cap"><span>慢慢看，不用急。</span></div></div>';
    h += block('完整解讀與你的靈符', (LOVE ? (lvSingle() ? '看懂你現在的桃花，也看看現在還能為自己做些什麼。' : '看懂這段感情，也看看現在還能為自己做些什麼。') : '看了這組牌的簡答，也看看接下來能為自己做些什麼。'),
      fuSecond(T, false) + '<div style="margin-top:' + (T.talismans[1] ? 20 : 0) + 'px">' + tarotPaywall(T) + '</div>', true);
    h += blogSection();
    h += socialCta();
    h += resEnd();
    return '<main class="shell" style="max-width:820px">' + h + '</main>';
  };
  var _askAnother = window.askAnother;
  window.askAnother = function () { resetDraw(); _askAnother(); if (LOVE) STATE.text = '我想為現在這段感情抽一組牌，先看看我們目前的狀況。'; };

  /* 剛送出等解讀逾時：這一局已經建好了（有 log_id 與 k）→ 留在同一局給「再讀一次」，不要退回「你的牌」讓他重送（Astra front-r1 #1） */
  var _pollGiveUp = window.pollGiveUp;
  window.pollGiveUp = function (msg) { if (STATE.reportLogId && STATE.k) STATE.reportMode = true; _pollGiveUp(msg); };

  /* render() 之後掛抽牌區與靈符卡 */
  var _render = window.render;
  window.render = function () { _render(); afterRender(); };
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (TS.mount && !(TS.state && (TS.state.st === 'shuffle' || TS.state.st === 'deal'))) renderStage(); fitFu(); }, 150); });

  /* 開機（同網站 boot 的報告分支）：付款回跳、重新整理帶 ?log_id=&k= 或「開了付款頁」留下的那一局 → 讀結果；其餘從落地頁開始。
     回訪預填（提醒信 ?ret=）這版先不接 */
  (function tarotBoot() {
    /* 量測：ViewContent＝進到塔羅漏斗（2026-10-13 恢復量測；名稱分開，好跟水鏡版 love／home-gua 比） */
    try { var cn = HOME ? 'home-tarot' : 'love-tarot'; if (window.fbq) fbq('track', 'ViewContent', { content_name: cn }); if (window.gtag) gtag('event', 'view_item', { item_name: cn }); } catch (e) {}
    var p = new URLSearchParams(location.search), rid = p.get('log_id') || '';
    var kk = p.get('k') || (location.hash.match(/[#&]k=([a-f0-9]{24})/) || [])[1] || '', pending = '', pendingPath = '';
    try { pending = sessionStorage.getItem('winds_pending_log_id') || ''; pendingPath = sessionStorage.getItem('winds_pending_path') || ''; sessionStorage.removeItem('winds_pending_log_id'); sessionStorage.removeItem('winds_pending_path'); } catch (e) {}
    if (pending && pendingPath && pendingPath !== location.pathname) pending = '';
    var id = rid || pending;
    if (id) {
      STATE.k = kk || recallK(id) || '';
      /* 網址帶的是一般 k（付款回跳），這台裝置另存了收碼換到的本人 k → 帳號資料被遮時換那把（同網站 boot；Astra front-r1 #2） */
      if (kk) { var _sk = recallK(id); if (_sk && _sk !== kk) STATE.kAlt = _sk; }
      if (!STATE.k) { try { if (localStorage.getItem('winds_ff_log') === String(id)) STATE.k = localStorage.getItem('winds_ff_k') || ''; } catch (e) {} }
      if (STATE.k) { STATE.reportMode = true; STATE.step = 'interpreting'; render(); pollStatus(id); return; }
    }
    render();
  })();
  cardsReady.catch(function () { showFfErr('牌載入失敗，請重新整理。'); });
})();
