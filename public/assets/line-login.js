/* 網站 LINE 登入（2026-10-16，計劃 ~/.claude/plans/line-login-add-friend-2026-10-15.md）
 * 跟 LINE 占卜（LIFF）同一組 LINE Login 設定，拿到的 id_token 後端現成就認得。
 *   WindsLine.start('/history')  → 產生 state／nonce／PKCE，存 localStorage，跳 LINE 授權（同意畫面一起問加好友）
 *   WindsLine.session()          → { token, p } 或 null（過期會順手清掉）
 *   WindsLine.friend()           → true／false／null（null＝查不到，不能當成「不是好友」）
 *   WindsLine.recheckFriend(cb)  → 客人按完加好友回來重查一次
 * 交易存 localStorage 不存 sessionStorage：LINE 自動登入有時回到新分頁，sessionStorage 會跟著不見。
 * 每筆交易用 state 當鍵分開存（兩個分頁同時登入不會互蓋）、10 分鐘過期、對上了才刪。
 * 2026-10-16 Astra 審查後改：①原本單一鍵、回來先刪再比對 → 雙分頁兩邊都失敗，別人塞 ?error= 也能清掉交易
 *   ②存不進去原本照樣跳 LINE／照樣說登入成功 → 改成存不進就停 ③LINE 登入成功時清掉前一位的 Google 登入與本機痕跡，
 *   不然導覽列與紀錄頁還是前一個人。
 */
(function () {
  var CHANNEL_ID = '2009168674';
  var REDIRECT_URI = 'https://winds.tw/auth/line-callback';
  var API = 'https://api.winds.tw';
  var TXN = 'winds_line_txn', TOKEN = 'winds_line_token', AT = 'winds_line_at', FRIEND = 'winds_line_friend';
  var RETURNS = ['/history', '/bookings', '/account'];

  function rand(n) {
    var a = new Uint8Array(n); crypto.getRandomValues(a);
    return b64url(a);
  }
  function b64url(bytes) {
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  /* 交易與登入憑證一定要存得進去；存不進就丟錯，讓頁面顯示失敗，不要假裝成功 */
  function setRequired(k, v) {
    localStorage.setItem(k, v);
    if (localStorage.getItem(k) !== v) throw new Error('storage_unavailable');
  }
  /* 清掉過期交易，最多留最近 3 筆 */
  function pruneTxns() {
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(TXN + ':') === 0) keys.push(k); }
      if (localStorage.getItem(TXN) !== null) localStorage.removeItem(TXN);   // 舊版單一鍵
      var live = [];
      keys.forEach(function (k) {
        var t = null; try { t = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
        if (!t || !(Date.now() - t.t <= 10 * 60 * 1000)) localStorage.removeItem(k); else live.push({ k: k, t: t.t });
      });
      live.sort(function (a, b) { return b.t - a.t; }).slice(2).forEach(function (x) { localStorage.removeItem(x.k); });
    } catch (e) {}
  }

  function safeReturn(r) {
    var path = String(r || '').split('?')[0].replace(/\/+$/, '');
    return RETURNS.indexOf(path) >= 0 ? path : '/account';
  }

  function decode(token) {
    try {
      var p = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))));
      if (!p.sub || !p.exp || p.exp * 1000 <= Date.now()) return null;
      return p;
    } catch (e) { return null; }
  }

  function start(ret) {
    var state = rand(24), nonce = rand(24), verifier = rand(48);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function (h) {
      pruneTxns();
      setRequired(TXN + ':' + state, JSON.stringify({ state: state, nonce: nonce, verifier: verifier, ret: safeReturn(ret), t: Date.now() }));
      var q = new URLSearchParams({
        response_type: 'code', client_id: CHANNEL_ID, redirect_uri: REDIRECT_URI,
        state: state, nonce: nonce, scope: 'openid profile', bot_prompt: 'normal',
        code_challenge: b64url(new Uint8Array(h)), code_challenge_method: 'S256'
      });
      location.href = 'https://access.line.me/oauth2/v2.1/authorize?' + q.toString();
    });
  }

  function session() {
    var t = get(TOKEN); if (!t) return null;
    var p = decode(t);
    if (!p) { del(TOKEN); return null; }
    return { token: t, p: p };
  }

  function friend() {
    var f = get(FRIEND);
    return f === '1' ? true : f === '0' ? false : null;
  }

  function saveFriend(v) { if (v === true) set(FRIEND, '1'); else if (v === false) set(FRIEND, '0'); else del(FRIEND); }

  function recheckFriend(cb) {
    var at = get(AT);
    if (!at) { saveFriend(null); if (cb) cb(null); return; }
    fetch(API + '/auth/line/friendship', { method: 'POST', headers: { Authorization: 'Bearer ' + at } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { var v = d && typeof d.friend === 'boolean' ? d.friend : null; saveFriend(v); if (cb) cb(v); })
      .catch(function () { saveFriend(null); if (cb) cb(null); });
  }

  /* LINE 登入成功、換到別人時：清掉前一位的 Google 登入與本機痕跡（同登出的清法），再存新的 */
  function switchIdentity() {
    try {
      if (!localStorage.getItem('winds_google_token')) return;
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('winds_') === 0 && k !== 'winds_teacher_provider' && k.indexOf(TXN) !== 0) kill.push(k); }
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  /* 給 /auth/line-callback 用：比對 state、換憑證、存起來，回傳要跳去的頁。
     失敗時 reject { kind, ret }：kind＝'cancel'（客人在 LINE 按取消）／'state'（對不上或過期）／'exchange'（換不到）／'storage'（存不進去）
     只有對得上的交易才刪；網址上的 state 對不到任何交易就什麼都不動（別人塞 ?error= 清不掉正在進行的登入） */
  function finish(params) {
    var state = params.get('state') || '';
    if (!/^[A-Za-z0-9_-]{32}$/.test(state)) return Promise.reject({ kind: 'state', ret: '/account' });
    var key = TXN + ':' + state;
    var txn = null; try { txn = JSON.parse(get(key) || 'null'); } catch (e) {}
    var age = txn ? Date.now() - txn.t : NaN;
    if (!txn || txn.state !== state || !(age >= 0 && age <= 10 * 60 * 1000)) return Promise.reject({ kind: 'state', ret: '/account' });
    var ret = safeReturn(txn.ret);
    del(key);
    if (params.get('error')) return Promise.reject({ kind: params.get('error') === 'access_denied' ? 'cancel' : 'exchange', ret: ret });
    if (!params.get('code')) return Promise.reject({ kind: 'state', ret: ret });
    return fetch(API + '/auth/line/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: params.get('code'), code_verifier: txn.verifier, nonce: txn.nonce, redirect_uri: REDIRECT_URI })
    }).then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) {
        if (!d || !d.success || !d.id_token) throw { kind: 'exchange', ret: ret };
        switchIdentity();
        try {
          setRequired(TOKEN, d.id_token);
          if (d.access_token) setRequired(AT, d.access_token); else del(AT);
        } catch (e) { del(TOKEN); del(AT); throw { kind: 'storage', ret: ret }; }
        saveFriend(typeof d.friend === 'boolean' ? d.friend : null);
        return ret;
      }, function () { throw { kind: 'exchange', ret: ret }; });
  }

  window.WindsLine = { start: start, session: session, friend: friend, recheckFriend: recheckFriend, finish: finish, safeReturn: safeReturn };
})();
