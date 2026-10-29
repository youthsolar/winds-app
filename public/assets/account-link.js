/* 帳號合併（2026-10-17，規格 ~/.claude/plans/account-merge-SPEC-final-2026-10-17.md；介面 DS account-merge v1）
 *   WindsLink.auth()           → 目前登入的憑證標頭（Google 優先，否則網站 LINE 登入）；沒登入回 null
 *   WindsLink.mountAccount()   → 會員中心「已連結的帳號」：列出、拆開、加綁、兩組提示
 *   WindsLink.runLinkPage()    → /account/link：綁定交易（重新登入目前帳號 → 登入要加的帳號 → 確認 → 合併）
 * 綁定交易存 localStorage 'winds_bind'（10 分鐘）：{ intent_id, nonce_a, nonce_b, initiator, target, line_token, google_token, t }
 */
(function () {
  var API = 'https://api.winds.tw';
  var BIND = 'winds_bind';
  var CLIENT_ID = '35219881811-2rnl87e0qmb9vsuhuqnfooo0a0af5ggd.apps.googleusercontent.com';
  var G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style="flex:none;display:block"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function jwt(t) {
    try { var p = JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); return p.exp && p.exp * 1000 > Date.now() ? p : null; } catch (e) { return null; }
  }

  function auth() {
    var g = get('winds_google_token');
    if (g && jwt(g)) return { via: 'google', headers: { 'X-Google-Id-Token': g } };
    var s = window.WindsLine && WindsLine.session();
    if (s) return { via: 'line', headers: { 'X-Line-Id-Token': s.token } };
    return null;
  }

  function api(path, body, headers) {
    var h = Object.assign({}, headers || {});
    var init = { method: body === undefined ? 'GET' : 'POST', headers: h };
    if (body !== undefined) { h['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    return fetch(API + path, init).then(function (r) { return r.json().then(function (d) { d = d || {}; d._status = r.status; return d; }, function () { return { _status: r.status }; }); });
  }

  /* ── 帳號列（DS ①）── */
  function mark(kind) {
    if (kind === 'line') return '<span class="am-mark line"><img src="/assets/line-btn-base.png" alt="" width="36" height="36"></span>';
    if (kind === 'google') return '<span class="am-mark google">' + G + '</span>';
    if (kind === 'gmail') return '<span class="zf-icon-disc am-mark"><i class="ph-thin ph-envelope-simple"></i></span>';
    return '<span class="am-mark old"><i class="ph-thin ph-clock-counter-clockwise"></i></span>';
  }
  function label(it) {
    if (it.kind === 'line') return { name: it.name || 'LINE 帳號', sub: 'LINE 帳號' };
    if (it.kind === 'google') return { name: it.name || 'Google 帳號', sub: 'Google 帳號' + (it.email_masked ? ' · ' + it.email_masked : '') };
    if (it.kind === 'gmail') return { name: it.email_masked || 'Gmail 信箱', sub: 'Gmail 信箱 · 驗證碼確認過' };
    return { name: '舊帳號', sub: '由管理員合併' };
  }
  function row(it, right) {
    var l = label(it);
    return '<div class="am-row">' + mark(it.kind) + '<div class="am-who"><div class="am-name">' + esc(l.name) + '</div><div class="am-sub">' + esc(l.sub) + '</div></div>' + (right || '') + '</div>';
  }

  function note(icon, text, actHtml) {
    var n = document.getElementById('amNote'); if (!n) return;
    document.getElementById('amNoteIcon').className = 'ph ph-' + icon;
    document.getElementById('amNoteText').textContent = text;
    document.getElementById('amNoteAct').innerHTML = actHtml || '';
    n.hidden = false;
  }

  /* ── 會員中心 ── */
  function mountAccount() {
    var a = auth(); if (!a) return;
    var q = new URLSearchParams(location.search);
    if (q.get('linked') === '1') { note('check-circle', '帳號已經合在一起了'); try { history.replaceState(null, '', location.pathname); } catch (e) {} }
    api('/link/status', undefined, a.headers).then(function (d) {
      if (!d || !d.success) return;
      render(d, a);
    });
  }

  function render(d, a) {
    var card = document.getElementById('amCard'); if (!card) return;
    var items = d.items || [];
    document.getElementById('amRows').innerHTML = items.map(function (it) {
      return row(it, it.current ? '<span class="zf-badge neutral" style="white-space:nowrap">目前登入</span>' : '<button type="button" class="am-unlink" data-id="' + esc(it.id) + '">拆開</button>');
    }).join('');
    var others = items.filter(function (it) { return !it.current; });
    document.getElementById('amSolo').hidden = others.length > 0;
    var hasLine = items.some(function (it) { return it.kind === 'line'; });
    var hasGoogle = items.some(function (it) { return it.kind === 'google'; });
    var add = document.getElementById('amAdd'); var html = '';
    /* 10/21 Jeffery：全站 Google 在上、LINE 在下 */
    if (!hasGoogle) html += '<button type="button" class="am-gbtn am-add-google">' + G + '<span>也用 Google 登入</span></button>';
    if (!hasLine) html += '<button type="button" class="zf-line-btn md am-add-line"><span class="ic"><img src="/assets/line-btn-base.png" alt="" width="24" height="24"></span><span class="tx">也用 LINE 登入</span></button>';
    add.innerHTML = html; add.hidden = !html;
    card.hidden = false;
    if (d.conflict) note('git-merge', '你的帳號連到兩組紀錄，要合成一組嗎？', '<button type="button" class="zf-btn secondary sm" id="amSelf">看看</button>');
    var self = document.getElementById('amSelf'); if (self) self.onclick = function () { location.href = '/account/link?self=1'; };
    /* 2026-10-29 SSO（規格 §3.2）：會員中心對 via=gmail 的人也放 need_link 卡。/link/status 沒有直接標 via，
       只有 Google 登入、有組、沒有衝突時才試 self-preview；回 mode self_gmail 才出卡（其他情形 worker 回 400 no_conflict、不寫入） */
    var nl = document.getElementById('amNeedLink');
    if (nl && nl.hidden && a.via === 'google' && d.group && !d.conflict) {
      mountNeedLink(document.getElementById('amNeedLinkCard'), a, function () { location.replace('/account?linked=1'); }).then(function (ok) { nl.hidden = !ok; });
    }
    var al = add.querySelector('.am-add-line'); if (al) al.onclick = function () { beginBind('line', a, al); };
    var ag = add.querySelector('.am-add-google'); if (ag) ag.onclick = function () { beginBind('google', a, ag); };
    Array.prototype.forEach.call(document.querySelectorAll('.am-unlink'), function (b) {
      b.onclick = function () { openUnlink(items.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0], a); };
    });
  }

  function beginBind(target, a, btn) {
    btn.disabled = true;
    api('/link/start', { target: target }, a.headers).then(function (d) {
      btn.disabled = false;
      if (!d || !d.success) { note('warning-circle', (d && d.message) || '現在連不上，請再試一次'); return; }
      try { localStorage.setItem(BIND, JSON.stringify({ intent_id: d.intent_id, nonce_a: d.nonce_a, nonce_b: d.nonce_b, initiator: a.via, target: target, t: Date.now() })); }
      catch (e) { note('warning-circle', '這個瀏覽器存不了登入資料，請換一般的瀏覽器（不是無痕視窗）再試一次'); return; }
      location.href = '/account/link';
    }, function () { btn.disabled = false; note('warning-circle', '現在連不上，請再試一次'); });
  }

  /* ── 拆開確認（DS ②）── */
  function openUnlink(it, a) {
    if (!it) return;
    var pairOn = !!it.pair;
    var bg = document.createElement('div'); bg.className = 'am-sheet-bg';
    bg.innerHTML = '<div class="am-sheet" role="dialog" aria-modal="true" aria-labelledby="amSheetH"><div class="am-handle"></div>' +
      '<h2 class="am-h2" id="amSheetH">拆開這個帳號？</h2><div style="margin-top:12px">' + row(it) + '</div>' +
      '<p class="am-body" style="margin-top:8px">拆開後，用它登入就看不到這裡的紀錄和預約。</p>' +
      (it.pair ? '<div class="am-check" role="checkbox" tabindex="0" aria-checked="true" id="amPair"><i class="ph-fill ph-check-square on"></i><span>同時拆開 ' + esc((it.email_masked || '這個 Gmail')) + '</span></div>' : '') +
      '<div id="amRemain"></div><p class="am-err" id="amErr" hidden></p>' +
      '<div class="am-actions"><button type="button" class="zf-btn primary lg" id="amDo">拆開</button><button type="button" class="zf-btn secondary lg" id="amCancel">取消</button></div></div>';
    document.body.appendChild(bg);
    function close() { bg.remove(); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.getElementById('amCancel').onclick = close;
    function ids() { return pairOn && it.pair ? [it.id, it.pair] : [it.id]; }
    function dry() {
      api('/link/unlink', { items: ids(), dry_run: true }, a.headers).then(function (d) {
        var box = document.getElementById('amRemain'); if (!box) return;
        var r = (d && d.remaining) || [];
        box.innerHTML = r.length ? '<div class="am-remain"><div class="am-remain-h">拆完之後，你目前的登入還會因為下面這些連著：</div>' + r.map(function (x) { return row(x); }).join('') + '</div>' : '';
      });
    }
    var pc = document.getElementById('amPair');
    if (pc) {
      var toggle = function () {
        pairOn = !pairOn;
        pc.setAttribute('aria-checked', pairOn ? 'true' : 'false');
        pc.querySelector('i').className = pairOn ? 'ph-fill ph-check-square on' : 'ph ph-square off';
        dry();
      };
      pc.onclick = toggle;
      pc.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
    }
    dry();
    document.getElementById('amDo').onclick = function () {
      var btn = this; btn.disabled = true;
      api('/link/unlink', { items: ids() }, a.headers).then(function (d) {
        if (!d || !d.success) { btn.disabled = false; var er = document.getElementById('amErr'); er.textContent = (d && d.message) || '現在連不上，請再試一次'; er.hidden = false; return; }
        close();
        note('check-circle', d.fully_unlinked ? '已拆開' : '已拆開這一項');
        api('/link/status', undefined, a.headers).then(function (s) { if (s && s.success) render(s, a); });
      }, function () { btn.disabled = false; });
    };
  }

  /* ── /account/link 綁定流程（DS ③）── */
  function loadBind() {
    var b = null; try { b = JSON.parse(get(BIND) || 'null'); } catch (e) {}
    if (!b || !b.intent_id || !(Date.now() - b.t <= 10 * 60 * 1000)) { del(BIND); return null; }
    return b;
  }
  function saveBind(b) { localStorage.setItem(BIND, JSON.stringify(b)); }

  function runLinkPage(ui) {
    var q = new URLSearchParams(location.search);
    if (q.get('self') === '1') return runSelf(ui);
    var b = loadBind();
    if (!b) { ui.show('expired'); return; }
    var lineNonce = b.initiator === 'line' ? b.nonce_a : b.nonce_b;
    var googleNonce = b.initiator === 'google' ? b.nonce_a : b.nonce_b;
    function needLine() { ui.show('relogin-line', b.initiator === 'line'); WindsLine.startBind(lineNonce, b.intent_id); }
    function needGoogle() {
      ui.show('google', b.initiator === 'google');
      ui.google(googleNonce, function (cred) {
        var p = jwt(cred);
        if (!p || p.nonce !== googleNonce) { ui.show('fail'); return; }
        b.google_token = cred; try { saveBind(b); } catch (e) { ui.show('storage'); return; }
        step();
      });
    }
    function step() {
      var haveLine = b.line_token && jwt(b.line_token), haveGoogle = b.google_token && jwt(b.google_token);
      // 發起方先重新登入，再登入要加的那一方
      if (b.initiator === 'line' && !haveLine) return needLine();
      if (b.initiator === 'google' && !haveGoogle) return needGoogle();
      if (!haveLine) return needLine();
      if (!haveGoogle) return needGoogle();
      preview();
    }
    function headers() { return { 'X-Line-Id-Token': b.line_token, 'X-Google-Id-Token': b.google_token }; }
    function preview() {
      ui.show('busy');
      api('/link/preview', { intent_id: b.intent_id }, headers()).then(function (d) {
        if (!d || !d.success) { del(BIND); ui.show(d && d._status === 410 ? 'expired' : 'fail'); return; }
        ui.confirm(d.items || [], function () { return commit(d.preview_id); }, function () { del(BIND); location.href = '/account'; });
      }, function () { ui.show('fail'); });
    }
    function commit(previewId, tries) {
      tries = tries || 0;
      return api('/link/commit', { intent_id: b.intent_id, preview_id: previewId }, headers()).then(function (d) {
        if (d && d.success) { del(BIND); location.replace('/account?linked=1'); return true; }
        if (d && d.error === 'scope_changed') { ui.changed(preview); return false; }
        del(BIND); ui.show(d && d._status === 410 ? 'expired' : 'fail'); return false;
      }, function () {
        // 斷線：不知道後端有沒有寫入 → 用同一個 preview 重送一次 commit，後端會回第一次的結果（同一筆交易冪等；Astra 完整驗收複核三）
        if (tries >= 2) { ui.changed(preview); return false; }   // 還是連不上：請他重新確認
        return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return commit(previewId, tries + 1); });
      });
    }
    step();
  }

  function runSelf(ui) {
    var a = auth(); if (!a) { location.href = '/login?return=' + encodeURIComponent('/account'); return; }
    function preview() {
      ui.show('busy');
      api('/link/self-preview', {}, a.headers).then(function (d) {
        if (!d || !d.success) { location.href = '/account'; return; }
        ui.confirm(d.items || [], function () {
          return api('/link/self-commit', { preview_id: d.preview_id }, a.headers).then(function (r) {
            if (r && r.success) { location.replace('/account?linked=1'); return true; }
            if (r && r.error === 'scope_changed') { ui.changed(preview); return false; }
            ui.show('fail'); return false;
          });
        }, function () { location.href = '/account'; });
      });
    }
    preview();
  }

  /* ── need_link 卡（DS SSO-介面字-1028 A4／A6／A7；/sso/wp 與會員中心共用）──
     Google 登入、這個 Gmail 之前只用信箱題驗過、還沒跟 Google 登入連在一起（worker basis via=gmail:）。
     /link/self-preview（mode self_gmail）列出要連在一起的登入 → 按〔加進同一個帳號〕→ /link/self-commit → done()。
     預覽或送出回 split_pending：按鈕不能按＋上方一句；wp_conflict：上方 Notice error＋〔聯絡老師〕、按鈕不能按（DS A6／A7）。 */
  var OA_URL = 'https://lin.ee/tQHsgWB';
  var MSG_SPLIT_MERGE = '上一次拆開還在等老師處理，處理完才能合併';
  var MSG_WP_CONFLICT = '這兩個登入各自已經有商城／預約的帳號，請先聯絡老師處理，再合併';
  var LMARK = '<img src="/assets/line-btn-base.png" alt="" width="20" height="20" style="flex:none;display:block;border-radius:5px">';
  function g20() { return G.replace('width="18" height="18"', 'width="20" height="20"'); }
  function linkedRows(items) {
    return '<div class="zf-sso-linked">' + items.map(function (it) {
      var ic, name, sub;
      if (it.kind === 'gmail') { ic = '<i class="ph ph-envelope-simple"></i>'; name = it.email_masked || 'Gmail 信箱'; sub = '已用信箱驗證'; }
      else if (it.kind === 'google') { ic = g20(); name = 'Google 登入'; sub = it.email_masked || ''; }
      else if (it.kind === 'line') { ic = LMARK; name = 'LINE 登入'; sub = it.name || ''; }
      else { ic = '<i class="ph ph-clock-counter-clockwise"></i>'; name = '舊帳號'; sub = '由管理員合併'; }
      return '<div class="zf-sso-lrow">' + ic + '<div><span class="zf-sso-lname">' + esc(name) + '</span>' + (sub ? '<span class="zf-sso-lsub">' + esc(sub) + '</span>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function noticeHtml(tone, text, actHtml) {
    var ic = { info: 'info', success: 'check-circle', warning: 'warning', error: 'warning-circle' }[tone];
    return '<div class="zf-notice ' + tone + '" role="' + (tone === 'error' ? 'alert' : 'status') + '"><i class="ph ph-' + ic + '"></i><div class="zf-notice-body">' + esc(text) + (actHtml ? '<div class="zf-notice-act">' + actHtml + '</div>' : '') + '</div></div>';
  }
  /* el＝卡片外框（.zf-sso-card），a＝auth()，done＝合併成功後要做的事；fail(d)＝預覽拿不到（不是 self_gmail）時 */
  function mountNeedLink(el, a, done, fail) {
    var pv = null, busy = false, state = { err: '', blocked: null };
    function paint() {
      var b = state.blocked;
      el.className = 'zf-sso-card left';
      el.innerHTML = '<h1 class="zf-sso-h1">加進同一個帳號</h1><div class="zf-sso-body">' +
        (b === 'wp_conflict' ? noticeHtml('error', MSG_WP_CONFLICT, '<a class="zf-text-link sm" href="' + OA_URL + '" target="_blank" rel="noopener">聯絡老師</a>') : '') +
        '<p class="zf-sso-line muted">這個信箱已經連結到你的帳號。按一下，就把這個 Google 登入也加進同一個帳號。</p>' +
        linkedRows((pv && pv.items) || []) +
        (state.err ? noticeHtml('error', state.err) : '') +
        (b === 'split_pending' ? '<span class="zf-sso-small">' + esc(MSG_SPLIT_MERGE) + '</span>' : '') +
        '<button type="button" class="zf-btn primary lg full" id="nlGo"' + (busy || b ? ' disabled' : '') + '>' + (busy ? '加入中…' : '加進同一個帳號') + '</button></div>';
      var go = el.querySelector('#nlGo'); if (go) go.onclick = commit;
    }
    function preview() {
      return api('/link/self-preview', {}, a.headers).then(function (d) {
        if (!d || !d.success || d.mode !== 'self_gmail') { pv = null; return false; }
        pv = d; state.blocked = d.blocked_reason || null; return true;
      }, function () { pv = null; return false; });
    }
    function commit() {
      if (busy || state.blocked) return;
      busy = true; state.err = ''; paint();
      (pv ? Promise.resolve(true) : preview()).then(function (ok) {
        if (!ok) throw 0;
        return api('/link/self-commit', { preview_id: pv.preview_id }, a.headers);
      }).then(function (r) {
        busy = false;
        if (r && r.success) { done(); return; }
        pv = null;   /* 預覽用過或過期了，下次重拿 */
        if (r && (r.error === 'split_pending' || r.error === 'wp_conflict')) state.blocked = r.error;
        else state.err = '這次沒有加進去，請再試一次。';
        paint();
      }, function () { busy = false; pv = null; state.err = '這次沒有加進去，請再試一次。'; paint(); });
    }
    return preview().then(function (ok) { if (!ok) { if (fail) fail(); return false; } paint(); return true; });
  }

  window.WindsLink = { auth: auth, api: api, mountAccount: mountAccount, runLinkPage: runLinkPage, row: row, esc: esc, G: G, CLIENT_ID: CLIENT_ID, mountNeedLink: mountNeedLink, noticeHtml: noticeHtml, OA_URL: OA_URL };
})();
