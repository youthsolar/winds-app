/* 網站 LINE 登入（2026-10-16，計劃 ~/.claude/plans/line-login-add-friend-2026-10-15.md）
 * 跟 LINE 占卜（LIFF）同一組 LINE Login 設定，拿到的 id_token 後端現成就認得。
 *   WindsLine.start('/history')  → 產生 state／nonce／PKCE，存 localStorage，跳 LINE 授權（同意畫面一起問加好友）
 *   WindsLine.session()          → { token, p } 或 null（過期會順手清掉）
 *   WindsLine.friend()           → true／false／null（null＝查不到，不能當成「不是好友」）
 *   WindsLine.mountFriend(el)    → 不是好友時在 el 放「加入官方 LINE」提示
 * 2026-10-16（Jeffery 選項卡）：LINE 的 30 天 access token 不存瀏覽器（只拿來重查好友，風險不值得）；
 *   好友狀態只在登入那一下由後端查好帶回來，客人按了加好友就先把提示收起來、下次登入再查。
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
  var RETURNS = ['/history', '/bookings', '/account', '/account/link', '/partner', '/sso/wp'];   // 2026-10-23 合作分潤頁；2026-10-29 SSO：商城／預約／課程登入回 /sso/wp 續接（規格 §3.2）
  var WP_SSO = 'winds_wp_sso', SSO_TXN = 'winds_sso_s';   // SSO：這台瀏覽器有登入過 WP 的旗標／進行中的 SSO 交易（/sso/wp 管）
  var WP_LOGOUT = 'https://wp.winds.tw/winds-sso/logout';
  var BIND = 'winds_bind';   // 2026-10-17 帳號合併：綁定交易（account-link.js 管），LINE 綁定模式回來把憑證放這裡

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

  /* 2026-10-18（Astra 導流收單驗收 #3）：起卦頁（結果頁讀不到要登入時）也要回得去，只帶回 log_id、k 兩個參數，格式不對就丟掉 */
  var FUNNELS = ['', '/divination', '/home-gua', '/home-tarot', '/love-gua', '/love-tarot', '/ziwei'];
  function safeReturn(r) {
    var raw = String(r || ''), i = raw.indexOf('?');
    if (raw.charAt(0) !== '/') return '/account';
    var path = (i < 0 ? raw : raw.slice(0, i)).replace(/\/+$/, '');
    if (RETURNS.indexOf(path) >= 0) return path;
    if (FUNNELS.indexOf(path) >= 0) {
      var q = new URLSearchParams(i < 0 ? '' : raw.slice(i + 1)), o = new URLSearchParams();
      if (/^[0-9]{1,12}$/.test(q.get('log_id') || '')) o.set('log_id', q.get('log_id'));
      if (/^[a-f0-9]{24}$/.test(q.get('k') || '')) o.set('k', q.get('k'));
      if (/^[a-f0-9]{32}$/.test(q.get('draft') || '')) o.set('draft', q.get('draft'));   /* 2026-10-21 信箱題跳 LINE 登入：回來接回進度（只帶編號，讀取秘密留在原瀏覽器） */
      var qs = o.toString();
      return path + '/' + (qs ? '?' + qs : '');
    }
    return '/account';
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
      /* 2026-10-18（Astra 導流收單驗收 #2）：LINE 有時回到新分頁，這個分頁的「這次從哪來」會不見——跟交易一起存，回來時補回去（原時間不變） */
      var src = null; try { src = JSON.parse(sessionStorage.getItem('winds_this_touch') || 'null'); } catch (e) {}
      setRequired(TXN + ':' + state, JSON.stringify({ state: state, nonce: nonce, verifier: verifier, ret: safeReturn(ret), src: src && typeof src === 'object' ? src : null, t: Date.now() }));
      var q = new URLSearchParams({
        response_type: 'code', client_id: CHANNEL_ID, redirect_uri: REDIRECT_URI,
        state: state, nonce: nonce, scope: 'openid profile', bot_prompt: 'normal',
        code_challenge: b64url(new Uint8Array(h)), code_challenge_method: 'S256'
      });
      location.href = 'https://access.line.me/oauth2/v2.1/authorize?' + q.toString();
    });
  }

  /* 2026-10-17 帳號合併（規格 §5b）：綁定模式。nonce 用後端綁定交易給的（不是自己產生的），回來不換掉目前登入，
     LINE 憑證只存進綁定交易，回 /account/link 繼續 */
  function startBind(nonce, intentId) {
    var state = rand(24), verifier = rand(48);
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function (h) {
      pruneTxns();
      setRequired(TXN + ':' + state, JSON.stringify({ state: state, nonce: nonce, verifier: verifier, ret: '/account/link', bind: intentId, t: Date.now() }));
      var q = new URLSearchParams({
        response_type: 'code', client_id: CHANNEL_ID, redirect_uri: REDIRECT_URI,
        state: state, nonce: nonce, scope: 'openid profile',
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

  del(AT);   // 10/16 以前存過的 30 天 access token 一律清掉

  function friend() {
    var f = get(FRIEND);
    return f === '1' ? true : f === '0' ? false : null;
  }

  function saveFriend(v) { if (v === true) set(FRIEND, '1'); else if (v === false) set(FRIEND, '0'); else del(FRIEND); }

  /* 登入成功後共用收尾（LINE：finish；Google：/login onCredential）。回傳要去的頁（ret 或 WP_LOGOUT）；憑證存不進去就丟 Error('storage_unavailable')。
     2026-10-29 SSO（規格 §11、§17.65／72）＋審查必改 A：
       ・第一行先讀 winds_wp_sso（下面的清除會把它清掉）
       ・網站換人（清前一位 winds_ 鍵）＝另一種登入的憑證還在，或同一種憑證的 sub 不同；LINE 與 Google 對稱（LINE 登入清 Google、Google 登入清 LINE）
         保留清單照舊：winds_teacher_provider、winds_first_touch、交易前綴、winds_sso_s（進行中的 SSO 交易要撐過換人，回 /sso/wp 續接）
       ・要不要繞 WP 登出頁只看旗標：/sso/wp 領碼成功時寫進「這次登進 WP 的身分」line:<sub>／google:<sub>。
         原本比對舊憑證的 sub，可是 session() 跟別頁會把過期憑證刪掉（憑證約 1 小時就過期），常常比不到 → 換人沒繞、WP 停在前一位最長 14 天。
         旗標空＝不繞；'1'（舊格式）或≠新身分＝換人要繞；＝新身分＝不繞。
         已接受的代價：已合併帳號的同一人換用另一種登入，會多繞一次 WP 登出。
       ・新憑證存好之後才繞；進行中 SSO 交易（回 /sso/wp）不繞，WP finish 自己會換人；旗標留著（WP 還是前一位，領碼成功才改寫）
       ・旗標一律原樣放回（網站換人的清除會清到它）：決定繞時也不刪——10/29 第三批（Opus 第 8 輪建議）改成回到 /?signed_out=1
         （WP 登出 POST 成功才會 303 到這裡）才由首頁清；WP 只出按鈕、客人沒按就離開，下次登入或點 WP 連結會再比、再繞
       ・第 4 個參數 mode：true＝SSO 交易中；'stay'＝呼叫的頁登入完要接著做事（領取禮物、起卦／看報告），離頁會打斷 → 不繞、旗標原樣留，
         WP 等下一次從 /login、LINE 登入或 WP 自己 finish 時再換人；網站換人也只清前一位的另一種憑證，不全清 winds_（10/29 gift／FunnelDocument 用） */
  var GTOKEN = 'winds_google_token';
  function claims(t) {
    try { return JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; }
  }
  function aliasOf(kind, token) { var p = token ? claims(token) : null; return p && p.sub ? kind + ':' + p.sub : null; }
  function isSsoReturn(ret) {
    try { var u = new URL(String(ret || ''), location.origin); return u.pathname.replace(/\/+$/, '') === '/sso/wp' || u.searchParams.get('sso') === '1'; } catch (e) { return false; }
  }
  function afterLogin(kind, idToken, ret, mode) {
    var hadWp = get(WP_SSO);
    var alias = aliasOf(kind, idToken);
    var mine = kind === 'line' ? TOKEN : GTOKEN, other = kind === 'line' ? GTOKEN : TOKEN;
    var switched = false;
    try {
      var old = localStorage.getItem(mine), op = old ? claims(old) : null, np = claims(idToken);
      switched = !!localStorage.getItem(other) || !!(old && (!op || !np || op.sub !== np.sub));
      if (switched && mode === 'stay') {
        /* 'stay'：頁面流程進行中，本機還有這次的卦／分潤來源／信件憑證（winds_ff_*、winds_partner_pk、winds_edm_token…），全清會打斷 →
           只拿掉前一位的另一種登入憑證（Q2：不然 WP〔用 LINE 登入〕會拿前一位的 LINE 憑證）；同種憑證下面直接蓋掉 */
        localStorage.removeItem(other);
        if (other === TOKEN) localStorage.removeItem(FRIEND);
      } else if (switched) {
        var kill = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('winds_') === 0 && k !== 'winds_teacher_provider' && k !== 'winds_first_touch' && k !== SSO_TXN && k.indexOf(TXN) !== 0) kill.push(k);   /* 第一次從哪來是這台瀏覽器的，不是前一位的（Astra 導流收單驗收 #2） */ }
        kill.forEach(function (k) { localStorage.removeItem(k); });
      }
    } catch (e) {}
    try { setRequired(mine, idToken); } catch (e) { if (hadWp) set(WP_SSO, hadWp); throw e; }
    var noBounce = mode === true || mode === 'stay' || isSsoReturn(ret);
    var wpOther = !!hadWp && hadWp !== alias;
    if (hadWp) set(WP_SSO, hadWp);
    return wpOther && !noBounce ? WP_LOGOUT : ret;
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
    try { if (txn.src && !sessionStorage.getItem('winds_this_touch')) sessionStorage.setItem('winds_this_touch', JSON.stringify(txn.src)); } catch (e) {}
    if (params.get('error')) return Promise.reject({ kind: params.get('error') === 'access_denied' ? 'cancel' : 'exchange', ret: ret });
    if (!params.get('code')) return Promise.reject({ kind: 'state', ret: ret });
    return fetch(API + '/auth/line/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: params.get('code'), code_verifier: txn.verifier, nonce: txn.nonce, redirect_uri: REDIRECT_URI })
    }).then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (d) {
        if (!d || !d.success || !d.id_token) throw { kind: 'exchange', ret: ret };
        if (txn.bind) {
          var b = null; try { b = JSON.parse(get(BIND) || 'null'); } catch (e) {}
          if (!b || b.intent_id !== txn.bind) throw { kind: 'state', ret: '/account' };
          b.line_token = d.id_token;
          try { setRequired(BIND, JSON.stringify(b)); } catch (e) { throw { kind: 'storage', ret: '/account' }; }
          return '/account/link';
        }
        /* 2026-10-29 SSO（規格 §11）：WP 還是別人 → 新憑證存好之後（LINE code 已用掉，不能先離頁）先繞 WP 登出頁，
           繞完落首頁是拍板代價（WP 登出頁不收 ret）。正在進行 SSO 交易（回 /sso/wp）不繞：WP 那邊 finish 自己會換人。 */
        var dest;
        try { dest = afterLogin('line', d.id_token, ret); } catch (e) { del(TOKEN); throw { kind: 'storage', ret: ret }; }
        saveFriend(typeof d.friend === 'boolean' ? d.friend : null);
        return dest;
      }, function () { throw { kind: 'exchange', ret: ret }; });
  }

  /* 「加入官方 LINE」提示（DS line-login v1 ④，2026-10-16）。只給「確定不是好友」的 LINE 登入者看。
     關掉後 30 天不出現；30 天後還不是好友再出現一次；第二次關掉就不再出現（依帳號分開記）。
     按下去開官方帳號，提示就先收起來（好友狀態改成「查不到」），下次登入再由後端查。 */
  var OA_URL = 'https://lin.ee/tQHsgWB', DISMISS = 'winds_line_friend_x', DAY = 86400000;
  function dismissed(sub) {
    var d = null; try { d = JSON.parse(get(DISMISS) || 'null'); } catch (e) {}
    if (!d || d.sub !== sub) return false;
    return d.n >= 2 || (d.n === 1 && Date.now() - d.t < 30 * DAY);
  }
  function mountFriend(el) {
    var s = session();
    if (!el || !s || friend() !== false || dismissed(s.p.sub)) return;
    el.innerHTML =
      '<div class="zf-friend" role="region" aria-label="加入官方 LINE">' +
        '<button type="button" class="zf-friend-x" aria-label="關閉"><i class="ph ph-x"></i></button>' +
        '<div class="zf-friend-main"><span class="zf-icon-disc"><i class="ph-thin ph-bell-simple"></i></span>' +
          '<div><div class="zf-friend-t">在 LINE 收到老師的提醒</div>' +
          '<div class="zf-friend-d">卦符快到期、節氣換符的時候，風易揚老師會在 LINE 跟你說一聲。</div></div></div>' +
        '<div class="zf-friend-cta"><a class="zf-line-btn sm inline" href="' + OA_URL + '" target="_blank" rel="noopener">' +
          '<span class="ic"><img src="/assets/line-btn-base.png" alt="" width="26" height="26"></span><span class="tx">開啟官方 LINE</span></a></div>' +
      '</div>';
    el.hidden = false;
    el.querySelector('.zf-friend-x').addEventListener('click', function () {
      var d = null; try { d = JSON.parse(get(DISMISS) || 'null'); } catch (e) {}
      set(DISMISS, JSON.stringify({ sub: s.p.sub, n: (d && d.sub === s.p.sub ? d.n : 0) + 1, t: Date.now() }));
      el.innerHTML = ''; el.hidden = true;
    });
    el.querySelector('.zf-line-btn').addEventListener('click', function () {
      saveFriend(null);
      setTimeout(function () { el.innerHTML = ''; el.hidden = true; }, 300);
    });
  }

  /* 前往 WP 登出頁（規格 §11）：WP 只在「同站且 Referer 是 winds.tw」時自動送出。noTracking 頁（no-referrer）用 location 跳會沒有 Referer、
     WP 只好出按鈕 → 一律用帶 referrerpolicy 的連結點過去 */
  function goWpLogout() {
    var a = document.createElement('a');
    a.href = WP_LOGOUT; a.referrerPolicy = 'strict-origin-when-cross-origin'; a.style.display = 'none';
    (document.body || document.documentElement).appendChild(a); a.click();
  }

  window.WindsLine = { start: start, startBind: startBind, session: session, friend: friend, finish: finish, safeReturn: safeReturn, mountFriend: mountFriend, afterLogin: afterLogin, aliasOf: aliasOf, goWpLogout: goWpLogout, WP_LOGOUT: WP_LOGOUT };
})();
