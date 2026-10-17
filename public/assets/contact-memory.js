/* 找風問幸福 — 全站表單自動帶入（2026-10-18 Jeffery 拍板：占卜填過的帶進預約，全站同樣處理）
 * 在任何一張表單填過姓名、手機、Gmail、生日時辰，其他表單自動帶入；只補空著的格子，客人隨時可以改。
 * 兩個來源，每一項（姓名／手機／Gmail／生日時辰）各自帶「最近一次填的」那份：
 *   ① 這支手機記的（localStorage winds_contact；winds_ 開頭＝登出時 nav-auth.js 跟其他個資一起清）
 *   ② 登入的帳號（後端 /my-contact，只回自己的資料，每一項附真正的填寫時間）
 * 姓名、生日時辰都是「整組」：不會把兩個人的姓和名、或兩次的年月日拼在一起。
 *
 * ZFContact.save(o)       送出時記下來。o 可帶 last／first（分開兩格）或 name（只有一格全名）、phone、email、
 *                         birth（YYYY-MM-DD）＋shi（0–11 時辰序；-1＝客人選了「不確定」）
 * ZFContact.get(cb, done) 先回手機記的；登入帳號的那份到了，若有更新的再回一次（cb 可能被叫兩次）；done＝兩份都比完
 * ZFContact.autofill(g)   一般表單用：g = { name: {last, first} 或 {full}, phone, email, birth: {y, m, d, h} }（都是欄位元素）
 *                         客人動過的那一組就不再帶；還是自動帶的值（客人沒改）才會被更新的資料換掉
 * ZFContact.forget()      清掉這支手機記的，這一頁也不再從帳號帶入（客人按「不是你？清除」）
 * ZFContact.notice(onClear, inline)   「不是你？清除」那一列的元素（DS 10/18 v1）；inline＝占卜頁的一行小字版
 * ZFContact.cleared(inline)           清除後的狀態字（role=status）
 *
 * autofill(g, { notice: 元素, noticeClass, noticeGap, noticeSpan })：有帶入時，把「已帶入上次填的資料・不是你？清除」放在該元素正上方；
 * 按清除＝清掉手機記的、清空自動帶的格子（客人自己打的不動）、這一頁不再帶，那一列換成「已清空…」，客人一開始打字就收起。
 */
(function () {
  var API = 'https://api.winds.tw';
  var KEY = 'winds_contact';
  var suppressed = false;   // 這一頁按過「不是你？清除」：不再帶入（包括登入帳號那份）
  var mem = null;   // 只在 localStorage 寫不進去（無痕、部分內建瀏覽器）時用，這一頁還記得；寫得進去就每次重讀，別的分頁改過也讀得到

  function phone(v) { var x = String(v || '').replace(/[\s-]/g, '').replace(/^\+886/, '0'); return /^09\d{8}$/.test(x) ? x : ''; }
  function gmail(v) { var x = String(v || '').trim().toLowerCase(); return /^[a-z0-9._%+-]+@gmail\.com$/.test(x) ? x : ''; }
  function birth(v) { var x = String(v || '').trim(); return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : ''; }
  function shiOf(hhmm) { var h = parseInt(String(hhmm || '').split(':')[0], 10); return isNaN(h) ? -1 : Math.floor(((h + 1) % 24) / 2); }
  function str(v) { return v === undefined || v === null ? '' : String(v); }

  var GROUPS = { name_t: ['last', 'first', 'name'], phone_t: ['phone'], email_t: ['email'], birth_t: ['birth', 'shi'] };
  function local() {
    var v = null;
    try { v = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { v = null; }
    if (!mem) return v;
    if (!v) return mem;
    // 寫入失敗留在這一頁的那份，跟讀得到的那份（可能是別的分頁存的）每一組比時間，取新的
    var r = {};
    for (var t in GROUPS) { var src = (mem[t] || 0) >= (v[t] || 0) ? mem : v; if (src[t]) { r[t] = src[t]; GROUPS[t].forEach(function (k) { r[k] = src[k]; }); } }
    return r;
  }

  function save(o) {
    o = o || {};
    var c = {}, cur = local() || {}, now = Date.now();
    for (var k in cur) c[k] = cur[k];
    var last = str(o.last).trim(), first = str(o.first).trim(), name = str(o.name).trim();
    if (last && first) { c.last = last; c.first = first; c.name = last + first; c.name_t = now; }
    else if (name) {
      // 只有一格全名（商城）：跟記的姓＋名一樣就保留分開的；不一樣就不留分開的（不猜哪個字是姓）
      if (str(c.last) + str(c.first) !== name) { c.last = ''; c.first = ''; }
      c.name = name; c.name_t = now;
    }
    if (phone(o.phone)) { c.phone = phone(o.phone); c.phone_t = now; }
    if (gmail(o.email)) { c.email = gmail(o.email); c.email_t = now; }
    if (birth(o.birth)) { c.birth = birth(o.birth); c.shi = typeof o.shi === 'number' && o.shi >= -1 && o.shi <= 11 ? o.shi : -1; c.birth_t = now; }
    try { localStorage.setItem(KEY, JSON.stringify(c)); mem = null; } catch (e) { mem = c; }
  }

  function forget() {
    mem = null; suppressed = true;
    // winds_ff_log／winds_ff_k＝這支手機上次起卦那一卦（占卜頁「回訪一行」靠它）；不是本人就一起清，免得開占卜頁又出現上一位（Astra v2 #2）
    try { localStorage.removeItem(KEY); localStorage.removeItem('winds_ff_log'); localStorage.removeItem('winds_ff_k'); } catch (e) {}
  }

  // ── 「不是你？清除」（DS 表單自動帶入 v1：sunken 淺底一列、TextLink 底線字；占卜頁是無底色的一行小字）──
  var CSS = '.zf-af{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-radius:var(--radius-md);background:var(--surface-sunken);font-family:var(--font-sans);font-size:13px;line-height:1.5;color:var(--text-secondary)}' +
    '.zf-af-l{display:inline-flex;align-items:center;gap:8px;min-width:0}.zf-af-l i{font-size:16px;flex:none}.zf-af-l i.ok{color:var(--accent-press)}' +
    '.zf-af-r{display:inline-flex;align-items:center;gap:6px;flex:none;white-space:nowrap}' +
    '.zf-af-link{all:unset;cursor:pointer;font-family:var(--font-sans);font-size:13px;font-weight:500;color:var(--accent-press);border-bottom:1px solid var(--rose-200);padding-bottom:1px;line-height:1.4;white-space:nowrap}' +
    '.zf-af-link:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}' +
    '.zf-af-inline{display:flex;align-items:center;gap:6px;padding:0 4px;font-family:var(--font-sans);font-size:13px;color:var(--text-muted)}';
  function css() {
    if (document.getElementById('zf-af-css')) return;
    var st = document.createElement('style'); st.id = 'zf-af-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
  }
  function notice(onClear, inline) {
    css();
    var el = document.createElement('div');
    if (inline) { el.className = 'zf-af-inline'; el.innerHTML = '不是你？<button type="button" class="zf-af-link">清除</button>'; }
    else { el.className = 'zf-af'; el.innerHTML = '<span class="zf-af-l"><i class="ph-thin ph-clock-counter-clockwise" aria-hidden="true"></i>已帶入上次填的資料</span><span class="zf-af-r">不是你？<button type="button" class="zf-af-link">清除</button></span>'; }
    el.querySelector('button').addEventListener('click', function () { onClear(); });
    return el;
  }
  function cleared(inline) {
    css();
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    if (inline) { el.className = 'zf-af-inline'; el.textContent = '已清空，請重新告訴老師你的資料。'; }
    else { el.className = 'zf-af'; el.innerHTML = '<span class="zf-af-l"><i class="ph-thin ph-check-circle ok" aria-hidden="true"></i>已清空，請填寫你自己的資料。</span>'; }
    return el;
  }

  function authHeaders() {
    try {
      var g = localStorage.getItem('winds_google_token') || '';
      var p = g ? JSON.parse(atob(g.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
      if (p && p.exp * 1000 > Date.now()) return { 'X-Google-Id-Token': g };
    } catch (e) {}
    // 網站 LINE 登入（line-login.js 存的；不是每頁都載 line-login.js，所以直接讀，規則同它：要有 sub、沒過期）
    try {
      var t = localStorage.getItem('winds_line_token') || '';
      var q = t ? JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
      if (q && q.sub && q.exp * 1000 > Date.now()) return { 'X-Line-Id-Token': t };
    } catch (e) {}
    return null;
  }

  function fromAccount(d) {
    var dob = str(d.date_of_birth).split(' '), t = function (x) { return Date.parse(x || '') || 0; };
    return { last: str(d.last_name), first: str(d.first_name), name: str(d.full_name), name_t: t(d.name_at),
      phone: phone(d.phone), phone_t: t(d.phone_at), email: gmail(d.email), email_t: t(d.email_at),
      birth: birth(dob[0]), shi: dob[1] ? shiOf(dob[1]) : -1, birth_t: t(d.birth_at) };
  }

  // 每一組各取時間比較新、而且有值的那一份
  function merge(a, b) {
    var r = {};
    function pick(has, t) { if (!a || !has(a)) return b; if (!b || !has(b)) return a; return (b[t] || 0) > (a[t] || 0) ? b : a; }
    var n = pick(function (x) { return !!(x.name || x.last); }, 'name_t'); if (n) { r.last = str(n.last); r.first = str(n.first); r.name = str(n.name) || r.last + r.first; }
    var p = pick(function (x) { return !!x.phone; }, 'phone_t'); if (p) r.phone = p.phone;
    var e = pick(function (x) { return !!x.email; }, 'email_t'); if (e) r.email = e.email;
    var bb = pick(function (x) { return !!x.birth; }, 'birth_t'); if (bb) { r.birth = bb.birth; r.shi = typeof bb.shi === 'number' ? bb.shi : -1; }
    return r;
  }
  function same(x, y) { return JSON.stringify(x) === JSON.stringify(y); }

  // done（選填）：兩份都比完了才叫（沒登入就馬上叫；帳號那份回來、失敗或 4 秒沒回都算完）。占卜頁回訪一行要等它，才知道信箱有沒有比較新的
  function get(cb, done) {
    var fin = false, end = function () { if (!fin) { fin = true; if (done) done(); } };
    if (suppressed) return end();
    var l = local(), first = l ? merge(l, null) : null;
    if (first) cb(first);
    var h = authHeaders();
    if (!h) return end();
    setTimeout(end, 4000);
    fetch(API + '/my-contact', { headers: h, cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.found || suppressed) return;
      var m = merge(local(), fromAccount(d));
      if (!first || !same(first, m)) cb(m);
    }).catch(function () {}).then(end);
  }

  // ── 一般表單：整組帶、客人動過的那組不再帶 ──
  function autofill(g, opts) {
    g = g || {}; opts = opts || {};
    var groups = [], box = null;
    // 放進不同版面：opts.noticeClass（例如格線表單要跨兩欄的 wide）、opts.noticeGap（一般流排要的下距，px）
    function deco(el) { if (opts.noticeClass) el.className += ' ' + opts.noticeClass; if (opts.noticeGap) el.style.marginBottom = opts.noticeGap + 'px'; if (opts.noticeSpan) el.style.gridColumn = '1 / -1'; return el; }
    function grp(key, els, setter) {
      els = els.filter(Boolean);
      if (!els.length) return;
      var G = { key: key, els: els, touched: false, set: setter };
      els.forEach(function (el) {
        // 客人動過這一格：整組不再帶，這一格也不再算「自動帶的」（清除時不會清掉客人自己打的，就算打的字跟帶入的一樣；Astra v2 #5）
        var mark = function (ev) { if (ev.isTrusted) { G.touched = true; el.removeAttribute('data-zf-auto'); } };
        el.addEventListener('input', mark); el.addEventListener('change', mark);
      });
      groups.push(G);
    }
    // 格子空著（下拉選單＝還停在第一個選項）、或還是上次自動帶的值，而且客人沒動過，才算可以帶
    function free(G) {
      if (G.touched) return false;
      return G.els.every(function (el) {
        var empty = el.tagName === 'SELECT' ? (el.options.length && el.value === el.options[0].value) : !el.value;
        return empty || el.value === el.getAttribute('data-zf-auto');
      });
    }
    function put(el, v) { el.value = v; el.setAttribute('data-zf-auto', el.value); }
    if (g.name && g.name.full) grp('name', [g.name.full], function (c) { var v = c.name || (c.last && c.first ? c.last + c.first : ''); if (!v) return false; put(g.name.full, v); });
    else if (g.name) grp('name', [g.name.last, g.name.first], function (c) { if (!c.last || !c.first) return false; put(g.name.last, c.last); put(g.name.first, c.first); });
    if (g.phone) grp('phone', [g.phone], function (c) { if (!c.phone) return false; put(g.phone, c.phone); });
    if (g.email) grp('email', [g.email], function (c) { if (!c.email) return false; put(g.email, c.email); });
    if (g.birth) grp('birth', [g.birth.y, g.birth.m, g.birth.d, g.birth.h], function (c) {
      var b = str(c.birth).split('-'); if (b.length !== 3) return false;
      put(g.birth.y, String(+b[0])); put(g.birth.m, String(+b[1]));
      if (window.zfFixDays) window.zfFixDays();   // 先依年月重排「日」的選項（BaseLayout），不然 31 日可能選不到
      put(g.birth.d, String(+b[2]));
      // 時辰下拉：第一個選項是「不確定」，後面依子丑寅…排；記的是「不確定」(-1) 就選回第一個
      var h = g.birth.h; if (h) { var o = h.options[c.shi >= 0 ? c.shi + 1 : 0]; if (o) put(h, o.value); }
    });
    function clearAll() {
      forget();
      groups.forEach(function (G) {
        G.els.forEach(function (el) {
          var a = el.getAttribute('data-zf-auto');
          if (a !== null && el.value === a) el.value = el.tagName === 'SELECT' && el.options.length ? el.options[0].value : '';
          el.removeAttribute('data-zf-auto');
        });
        G.touched = true;
      });
      if (window.zfFixDays) window.zfFixDays();
      var done = deco(cleared(false));
      if (box && box.parentNode) box.parentNode.replaceChild(done, box);
      box = done;
      // 客人開始填，就收起「已清空」
      var off = function (ev) { if (!ev.isTrusted) return; if (box && box.parentNode) box.parentNode.removeChild(box); box = null; groups.forEach(function (G) { G.els.forEach(function (el) { el.removeEventListener('input', off); el.removeEventListener('change', off); }); }); };
      groups.forEach(function (G) { G.els.forEach(function (el) { el.addEventListener('input', off); el.addEventListener('change', off); }); });
    }
    get(function (c) {
      var any = false;
      groups.forEach(function (G) { if (free(G) && G.set(c) !== false) any = true; });
      if (any && opts.notice && !box && opts.notice.parentNode) { box = deco(notice(clearAll, false)); opts.notice.parentNode.insertBefore(box, opts.notice); }
    });
  }

  window.ZFContact = { save: save, get: get, autofill: autofill, forget: forget, notice: notice, cleared: cleared, css: css };
})();
