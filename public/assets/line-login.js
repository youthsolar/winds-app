/* 網站 LINE 登入（2026-10-16，計劃 ~/.claude/plans/line-login-add-friend-2026-10-15.md）
 * 跟 LINE 占卜（LIFF）同一組 LINE Login 設定，拿到的 id_token 後端現成就認得。
 *   WindsLine.start('/history')  → 產生 state／nonce／PKCE，存 localStorage，跳 LINE 授權（同意畫面一起問加好友）
 *   WindsLine.session()          → { token, p } 或 null（過期會順手清掉）
 *   WindsLine.friend()           → true／false／null（null＝查不到，不能當成「不是好友」）
 *   WindsLine.recheckFriend(cb)  → 客人按完加好友回來重查一次
 * 交易存 localStorage 不存 sessionStorage：LINE 自動登入有時回到新分頁，sessionStorage 會跟著不見。
 * 一次只留一筆交易、10 分鐘過期、用過即刪。
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
      set(TXN, JSON.stringify({ state: state, nonce: nonce, verifier: verifier, ret: safeReturn(ret), t: Date.now() }));
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

  /* 給 /auth/line-callback 用：比對 state、換憑證、存起來，回傳要跳去的頁。
     失敗時 reject 一個字串：'cancel'（客人在 LINE 按取消）／'state'（對不上或過期）／'exchange'（換不到） */
  function finish(params) {
    var raw = get(TXN); del(TXN);
    var txn = null; try { txn = JSON.parse(raw || 'null'); } catch (e) {}
    var ret = txn ? txn.ret : '/account';
    if (params.get('error')) return Promise.reject({ kind: params.get('error') === 'access_denied' ? 'cancel' : 'exchange', ret: ret });
    if (!txn || !params.get('code') || params.get('state') !== txn.state || Date.now() - txn.t > 10 * 60 * 1000) return Promise.reject({ kind: 'state', ret: ret });
    return fetch(API + '/auth/line/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: params.get('code'), code_verifier: txn.verifier, nonce: txn.nonce, redirect_uri: REDIRECT_URI })
    }).then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) {
        if (!d || !d.success || !d.id_token) throw { kind: 'exchange', ret: ret };
        set(TOKEN, d.id_token);
        if (d.access_token) set(AT, d.access_token);
        saveFriend(typeof d.friend === 'boolean' ? d.friend : null);
        return ret;
      }, function () { throw { kind: 'exchange', ret: ret }; });
  }

  window.WindsLine = { start: start, session: session, friend: friend, recheckFriend: recheckFriend, finish: finish, safeReturn: safeReturn };
})();
