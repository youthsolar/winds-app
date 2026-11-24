/* 共用 Nav 帳號區 — 逐值對齊 DS 權威元件 components/account-nav/AccountNav.jsx
 * （DesignSync get_file，2026-06-20）。僅注入 markup + 串 localStorage/JWT 邏輯；
 *  設計值全部來自 DS：頭像 ring 2/3 rose-200、首字 size×0.44、caret ph-bold ink-500、
 *  下拉 min-width 200 / padding 8 / header mb 6、下拉項目無 icon。
 *  注入點：#auth-button（桌機）、#auth-button-m（手機抽屜）。
 */
(function () {
  var LOGOUT_URL = '/';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* 2026-11-25 Jeffery 拍板「選單重整」（樣張 claude.ai/artifact/K58jaKvs974FsUvXTHnCZs，課程站 #70 同一套）：
     名字連會員中心＋占卜紀錄／預約／課程／訂單；手機選單蓋滿畫面，外觀與登出收到最底下一列。
     圖示內嵌 SVG（Phosphor light 路徑，同樣張），不靠圖示字型。 */
  var IC = {"占卜紀錄": "M184,76H40A12,12,0,0,0,28,88V200a12,12,0,0,0,12,12H184a12,12,0,0,0,12-12V88A12,12,0,0,0,184,76Zm4,124a4,4,0,0,1-4,4H40a4,4,0,0,1-4-4V88a4,4,0,0,1,4-4H184a4,4,0,0,1,4,4ZM228,56V176a4,4,0,0,1-8,0V56a4,4,0,0,0-4-4H64a4,4,0,0,1,0-8H216A12,12,0,0,1,228,56Z", "預約": "M208,36H180V24a4,4,0,0,0-8,0V36H84V24a4,4,0,0,0-8,0V36H48A12,12,0,0,0,36,48V208a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V48A12,12,0,0,0,208,36Zm4,172a4,4,0,0,1-4,4H48a4,4,0,0,1-4-4V48a4,4,0,0,1,4-4H76V56a4,4,0,0,0,8,0V44h88V56a4,4,0,0,0,8,0V44h28a4,4,0,0,1,4,4ZM152,92a28,28,0,0,0-24,13.59A28,28,0,0,0,76,120c0,14.51,8.56,29,25.44,43.07a143.52,143.52,0,0,0,24.77,16.51,4,4,0,0,0,3.58,0,143.52,143.52,0,0,0,24.77-16.51C171.44,149,180,134.51,180,120A28,28,0,0,0,152,92Zm-24,79.47c-8.46-4.64-44-25.67-44-51.47a20,20,0,0,1,40,0,4,4,0,0,0,8,0,20,20,0,0,1,40,0C172,145.8,136.46,166.83,128,171.47Z", "課程": "M232,52H160a36,36,0,0,0-32,19.54A36,36,0,0,0,96,52H24a4,4,0,0,0-4,4V200a4,4,0,0,0,4,4H96a28,28,0,0,1,28,28,4,4,0,0,0,8,0,28,28,0,0,1,28-28h72a4,4,0,0,0,4-4V56A4,4,0,0,0,232,52ZM96,196H28V60H96a28,28,0,0,1,28,28V209.4A35.94,35.94,0,0,0,96,196Zm132,0H160a35.94,35.94,0,0,0-28,13.41V88a28,28,0,0,1,28-28h68ZM160,92h40a4,4,0,0,1,0,8H160a4,4,0,0,1,0-8Zm44,36a4,4,0,0,1-4,4H160a4,4,0,0,1,0-8h40A4,4,0,0,1,204,128Zm0,32a4,4,0,0,1-4,4H160a4,4,0,0,1,0-8h40A4,4,0,0,1,204,160Z", "訂單": "M180,104a4,4,0,0,1-4,4H80a4,4,0,0,1,0-8h96A4,4,0,0,1,180,104Zm-4,28H80a4,4,0,0,0,0,8h96a4,4,0,0,0,0-8Zm52-76V208a4,4,0,0,1-4,4,4.05,4.05,0,0,1-1.79-.42L192,196.47l-30.21,15.11a4,4,0,0,1-3.58,0L128,196.47,97.79,211.58a4,4,0,0,1-3.58,0L64,196.47,33.79,211.58A4,4,0,0,1,28,208V56A12,12,0,0,1,40,44H216A12,12,0,0,1,228,56Zm-8,0a4,4,0,0,0-4-4H40a4,4,0,0,0-4,4V201.53l26.21-13.11a4,4,0,0,1,3.58,0L96,203.53l30.21-15.11a4,4,0,0,1,3.58,0L160,203.53l30.21-15.11a4,4,0,0,1,3.58,0L220,201.53Z", "登出": "M116,216a4,4,0,0,1-4,4H48a4,4,0,0,1-4-4V40a4,4,0,0,1,4-4h64a4,4,0,0,1,0,8H52V212h60A4,4,0,0,1,116,216Zm110.83-90.83-40-40a4,4,0,0,0-5.66,5.66L214.34,124H112a4,4,0,0,0,0,8H214.34l-33.17,33.17a4,4,0,0,0,5.66,5.66l40-40A4,4,0,0,0,226.83,125.17Z", "右": "M178.83,130.83l-80,80a4,4,0,0,1-5.66-5.66L170.34,128,93.17,50.83a4,4,0,0,1,5.66-5.66l80,80A4,4,0,0,1,178.83,130.83Z"};
  function svg(k, cls) { return '<svg class="' + cls + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="' + IC[k] + '"/></svg>'; }
  var WP_DASH = 'https://wp.winds.tw/%e6%8e%a7%e5%88%b6%e5%8f%b0/';
  var ITEMS = [['占卜紀錄', '/history'], ['預約', '/bookings'], ['課程', WP_DASH], ['訂單', 'https://wp.winds.tw/my-account/orders/']];
  function injectCss() {
    if (document.getElementById('nav-auth-css')) return;
    var st = document.createElement('style'); st.id = 'nav-auth-css';
    st.textContent =
      '.na-menu a,.na-menu .nav-logout{display:flex!important;align-items:center;gap:10px;padding:9px 12px;font-family:var(--font-serif);font-size:14.5px;color:var(--ink-700);border-radius:var(--radius-sm);text-decoration:none}' +
      '.na-menu a:hover,.na-menu .nav-logout:hover{background:var(--surface-sunken);color:var(--ink-900)}' +
      '.na-menu .na-ic{width:16px;height:16px;flex:none;color:var(--text-muted)}' +
      '.na-menu .na-hd{flex-direction:column;align-items:flex-start!important;gap:0!important;padding:8px 12px 10px!important;border-bottom:1px solid var(--border-soft);border-radius:0!important;margin-bottom:6px}' +
      '.na-menu .na-hd:hover{background:transparent!important}' +
      '.na-menu .na-hd b{font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--ink-900)}' +
      '.na-menu .na-hd small{font-family:var(--font-sans);font-size:12px;color:var(--accent-press)}' +
      '.na-menu .nav-logout{color:var(--text-muted);width:100%;box-sizing:border-box;border:0;background:none;cursor:pointer;text-align:left;line-height:inherit}' +
      '#auth-button-m.zf-account-m{margin-top:14px;padding-top:0;border-top:none}' +
      '#auth-button-m .na-me{background:var(--surface-card);border:1px solid var(--border-soft);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px}' +
      '#auth-button-m .na-me a{padding:0}' +
      '#auth-button-m a.na-me-hd{display:flex;align-items:center;gap:10px;color:var(--ink-900)}' +
      '.na-me-nm{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.35}' +
      '.na-me-nm b{font-family:var(--font-serif);font-weight:500;font-size:16px;overflow-wrap:anywhere}' +
      '.na-me-nm small{font-family:var(--font-sans);font-size:12px;color:var(--accent-press)}' +
      '.na-car{width:16px;height:16px;color:var(--text-muted);flex:none}' +
      '.na-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}' +
      '#auth-button-m .na-g a{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 0;border-radius:12px;background:var(--surface-sunken);font-family:var(--font-sans);font-size:12.5px;color:var(--ink-900)}' +
      '.na-g .na-ti{width:22px;height:22px;color:var(--accent)}' +
      '.zf-drawer .na-foot{margin-top:auto;padding-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--border-soft)}' +
      '.zf-drawer .na-foot .zf-tt{margin-top:0!important;flex:0 1 auto}' +
      '.zf-drawer .na-foot .zf-tt.lb button{height:30px;padding:0 9px;font-size:12px}' +
      '.zf-drawer .na-foot .nav-logout{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);font-size:13px;color:var(--text-muted);white-space:nowrap}' +
      '.na-foot .na-ic{width:16px;height:16px}' +
      '@media (max-width:980px){' +
        '.zf-drawer:not([hidden]){height:calc(100dvh - 64px);overflow-y:auto;box-sizing:border-box}' +
        'body:has(.zf-drawer:not([hidden])){overflow:hidden}' +
        'body:has(.zf-drawer:not([hidden])) .wc-root{display:none!important}' +
      '}';
    document.head.appendChild(st);
  }

  function decode(token) {
    try {
      var p = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))));   // UTF-8：中文姓名才不會變亂碼
      if (p.exp && p.exp * 1000 <= Date.now()) return null;
      return p;
    } catch (e) { return null; }
  }

  /* MiniAvatar — DS AccountNav 內部頭像：ring 2px surface-page + 3px rose-200；
     有照用照（ring 在 img 上），無照用姓氏首字（inline-flex，size×0.44）。 */
  function avatarHTML(p, size) {
    var ring = 'box-shadow:0 0 0 2px var(--surface-page),0 0 0 3px var(--rose-200)';
    if (p.picture) {
      return '<img src="' + esc(p.picture) + '" alt="" referrerpolicy="no-referrer" style="width:' + size + 'px;height:' + size + 'px;border-radius:999px;object-fit:cover;flex:none;' + ring + '">';
    }
    var initial = (p.name || p.email || '').trim().slice(0, 1);
    return '<span style="width:' + size + 'px;height:' + size + 'px;border-radius:999px;flex:none;display:inline-flex;align-items:center;justify-content:center;background:var(--rose-100);color:var(--rose-600);font-family:var(--font-serif);font-size:' + Math.round(size * 0.44) + 'px;font-weight:500;' + ring + '">' + esc(initial) + '</span>';
  }

  /* 真正登出（2026-10-29 SSO 規格 §11）：先把 winds_wp_sso 讀進變數 → 清本機（winds_sso_s 也一起清，不保留）
     → 這台瀏覽器登入過商城／預約／課程才去 WP 登出頁（那頁送出後回 winds.tw/?signed_out=1）；沒有就回首頁。
     10/29 第三批（Opus 第 8 輪建議）：要去 WP 登出頁時 winds_wp_sso 先留著，回到 /?signed_out=1（WP 登出 POST 成功才會 303 到這裡）由首頁清；
     WP 只出按鈕、客人沒按就離開 → 旗標還在，下次登入或點 WP 連結會再比、再繞。網站本機憑證照清。
     opts.skipWp：WP 已經登出了（?signed_out=wp 的〔也登出網站〕）就不再繞。會員中心登出也呼叫這支。 */
  var WP_LOGOUT = 'https://wp.winds.tw/winds-sso/logout';
  function signOut(opts) {
    var hadWp = null;
    try { hadWp = localStorage.getItem('winds_wp_sso'); } catch (er) {}
    /* 2026-09-28（gpt-6-astra 體檢）：原本只清 Google token，同一台裝置下一個人打開占卜頁
       還會用 winds_ff_log／k 撈到前一個人的姓名、生日、信箱。跟會員中心登出同一套：清掉所有 winds_ 開頭的鍵。 */
    try {
      var kill = [];
      var goWp = !!hadWp && !(opts && opts.skipWp);
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('winds_') === 0 && k !== 'winds_teacher_provider' && !(goWp && k === 'winds_wp_sso')) kill.push(k); }   // 老師後台的篩選偏好不是個資，留著；老師密碼照清
      kill.forEach(function (k) { localStorage.removeItem(k); });
    } catch (er) {}
    try { var sk = []; for (var j = 0; j < sessionStorage.length; j++) { var s = sessionStorage.key(j); if (s && /^(shop-order-draft-|shop-order-owner-|winds-req-|winds_pending_|winds_bc_draft|winds_spirit_draft_)/.test(s)) sk.push(s); } sk.forEach(function (s) { sessionStorage.removeItem(s); }); } catch (er) {}   // 2026-11-04 雲端審查：商品頁、預約確認頁的草稿（姓名、手機、生日、門市）在這個分頁的 sessionStorage，登出也要清，不然下一位同一分頁打開會被填回
    if (hadWp && !(opts && opts.skipWp)) {
      /* WP 只在 Referer 是 winds.tw 時自動送出；noTracking 頁（no-referrer）用連結帶 referrerpolicy 過去 */
      var a = document.createElement('a'); a.href = WP_LOGOUT; a.referrerPolicy = 'strict-origin-when-cross-origin'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      return;
    }
    location.href = LOGOUT_URL;
  }
  window.WindsSignOut = signOut;

  function wireLogout(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.nav-logout'), function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        /* 2026-09-28（gpt-6-astra 體檢）：原本只清 Google token，同一台裝置下一個人打開占卜頁
           還會用 winds_ff_log／k 撈到前一個人的姓名、生日、信箱。跟會員中心登出同一套：清掉所有 winds_ 開頭的鍵。 */
        signOut();
      });
    });
  }

  function render() {
    injectCss();
    var token = '';
    try { token = localStorage.getItem('winds_google_token') || ''; } catch (e) {}
    var p = token ? decode(token) : null;
    /* 2026-10-16：沒有 Google 登入時看 LINE 登入（line-login.js 存的 id_token，一樣有 name／picture） */
    if (!p) { try { token = localStorage.getItem('winds_line_token') || ''; } catch (e) {} p = token ? decode(token) : null; }

    /* ---- 桌機 #auth-button ---- */
    var d = document.getElementById('auth-button');
    if (d) {
      if (p) {
        d.innerHTML =
          '<div class="nav-acct" style="position:relative">' +
            '<button type="button" class="nav-acct-toggle" style="all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px">' +
              avatarHTML(p, 34) +
              '<span style="font-family:var(--font-sans);font-size:13.5px;color:var(--ink-700)">' + esc(p.name || '') + '</span>' +
              '<i class="ph-bold ph-caret-down" style="font-size:12px;color:var(--ink-500)"></i>' +
            '</button>' +
            '<div class="nav-acct-overlay" hidden style="position:fixed;inset:0;z-index:40"></div>' +
            '<div class="nav-acct-menu na-menu" hidden style="position:absolute;top:calc(100% + 10px);right:0;z-index:41;min-width:200px;background:var(--surface-card);border:1px solid var(--border-soft);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:8px">' +
              '<a class="na-hd" href="/account"><b>' + esc(p.name || '') + '</b><small>會員中心</small></a>' +
              ITEMS.map(function (it) { return '<a href="' + it[1] + '">' + svg(it[0], 'na-ic') + it[0] + '</a>'; }).join('') +
              '<button type="button" class="nav-logout">' + svg('登出', 'na-ic') + '登出</button>' +
            '</div>' +
          '</div>';
        var wrap = d.querySelector('.nav-acct'),
            btn = d.querySelector('.nav-acct-toggle'),
            menu = d.querySelector('.nav-acct-menu'),
            ov = d.querySelector('.nav-acct-overlay');
        function setOpen(o) { if (menu) menu.hidden = !o; if (ov) ov.hidden = !o; }
        if (btn && menu) {
          btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.hidden); });
          if (ov) ov.addEventListener('click', function () { setOpen(false); });
          document.addEventListener('click', function (e) { if (wrap && !wrap.contains(e.target)) setOpen(false); });
        }
        wireLogout(d);
      } else {
        d.innerHTML = '<a href="/login" style="display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);font-size:14px;color:var(--ink-700);letter-spacing:0.03em;text-decoration:none"><i class="ph-thin ph-user-circle" style="font-size:18px"></i>登入</a>';
      }
    }

    /* ---- 手機 #auth-button-m（抽屜內，容器已有 border-top）---- */
    var m = document.getElementById('auth-button-m');
    if (m) {
      if (p) {
        m.innerHTML =
          '<div class="na-me"><a class="na-me-hd" href="/account">' + avatarHTML(p, 36) +
            '<span class="na-me-nm"><b>' + esc(p.name || '') + '</b><small>會員中心</small></span>' + svg('右', 'na-car') + '</a>' +
            '<div class="na-g">' + ITEMS.map(function (it) { return '<a href="' + it[1] + '">' + svg(it[0], 'na-ti') + '<span>' + it[0] + '</span></a>'; }).join('') + '</div>' +
          '</div>';
      } else {
        m.innerHTML = '<a href="/login" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:44px;padding:0 22px;box-sizing:border-box;white-space:nowrap;font-family:var(--font-serif);font-size:16px;font-weight:500;color:var(--ink-900);background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-pill);text-decoration:none"><i class="ph-thin ph-user-circle" style="font-size:20px"></i>登入</a>';   // 10/17：登入頁有 LINE 和 Google 兩種，這裡不寫 Google
      }
      /* 底列：外觀（縮小）＋登出（已登入才有），放在選單最底下 */
      var dr = m.closest('.zf-drawer');
      if (dr) {
        var ft = dr.querySelector('.na-foot');
        if (!ft) { ft = document.createElement('div'); ft.className = 'na-foot'; dr.appendChild(ft); }
        var tt = dr.querySelector('.zf-tt.lb'); if (tt && tt.parentNode !== ft) ft.insertBefore(tt, ft.firstChild);
        var ob = ft.querySelector('.nav-logout'); if (ob) ob.remove();
        if (p) { ob = document.createElement('button'); ob.type = 'button'; ob.className = 'nav-logout'; ob.innerHTML = svg('登出', 'na-ic') + '登出'; ft.appendChild(ob); wireLogout(ft); }
      }
      wireLogout(m);
    }
  }

  /* 進 WP 前先換人（2026-10-29 第三批，Opus 第 8 輪必改）：禮物頁、起卦頁 Google 登入不繞 WP（'stay'），WP 可能還是前一位。
     點任何指向 https://wp.winds.tw 的連結（含之後動態插入的，用 document 事件委派、capture 階段）時比：
       旗標 winds_wp_sso 有值、網站目前有登入身分（Google、LINE 各算一個，憑證要沒過期）、旗標不等於其中任何一個（舊格式 '1' 也算不同）
       → 不進 WP，改去 WP 登出頁（帶 Referer；帶 ?r=switch，繞完落 /?signed_out=switch 出換人提醒；§11 拍板代價）。網站沒登入身分（憑證過期）→ 不攔。
     /winds-sso/ 底下不攔：logout 本身就是登出頁；start 會回 /sso/wp 用網站現在的身分領碼，WP finish 自己換人。
     開新分頁：Ctrl／⌘／Shift＋點、中鍵（auxclick）一樣攔下、改在這一頁繞（不開新分頁）；
     右鍵或長按選「在新分頁開啟」攔不到點擊 → contextmenu 時把該連結的 href 換成 WP 登出頁（下一次 pointerdown／keydown 或點它時還原）。
     表單送出到 WP 也攔（submit）。 */
  function wpAliases() {
    var out = [], t, p;
    [['google', 'winds_google_token'], ['line', 'winds_line_token']].forEach(function (k) {
      t = ''; try { t = localStorage.getItem(k[1]) || ''; } catch (e) {}
      p = t ? decode(t) : null;
      if (p && p.sub) out.push(k[0] + ':' + p.sub);
    });
    return out;
  }
  /* 旗標等於網站上任何一個有效身分就放行（兩種憑證並存時，WP 用哪一種登都不算換人） */
  function wpMismatch() {
    var f = null; try { f = localStorage.getItem('winds_wp_sso'); } catch (e) {}
    if (!f) return false;
    var me = wpAliases();
    return me.length > 0 && me.indexOf(f) < 0;
  }
  /* 這個網址會不會進 WP（/winds-sso/ 底下不算） */
  function isWpUrl(href) {
    var u; try { u = new URL(String(href || ''), location.href); } catch (e) { return false; }
    return u.protocol === 'https:' && u.hostname === 'wp.winds.tw' && u.pathname.indexOf('/winds-sso/') !== 0;
  }
  function wpLink(el) {
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return null;
    return isWpUrl(a.getAttribute('data-wp-href') || a.href) ? a : null;
  }
  /* 換人繞 WP 登出（連結點擊、右鍵、表單送出、WindsWpLogout）一律帶 ?r=switch → WP 登出完 303 到 /?signed_out=switch，首頁出提醒（DS 1029 第 6 點、J35）。
     真正登出 signOut() 不走這支、維持回 /?signed_out=1 */
  var WP_SWITCH = WP_LOGOUT + '?r=switch';
  function goWpLogout() {
    var a = document.createElement('a'); a.href = WP_SWITCH; a.referrerPolicy = 'strict-origin-when-cross-origin'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
  }
  /* 共用檢查（10/29 第四批）：要用 JS 導去某個網址前呼叫 WindsWpGuard(url)，回 true＝會進 WP 而且 WP 是別人 → 改呼叫 WindsWpLogout()。
     連結點擊、表單送出已由下面的 document 監聽統一處理。 */
  function wpGuard(url) { return isWpUrl(url) && wpMismatch(); }
  window.WindsWpGuard = wpGuard;
  window.WindsWpLogout = goWpLogout;
  /* 右鍵換過 href 的連結（10/29 第四批建議）：下一次 pointerdown／keydown 一律還原（含 referrerPolicy），縮短狀態列／複製連結拿到登出頁的時間 */
  var swapped = [];
  function restore(a) {
    var orig = a.getAttribute('data-wp-href');
    if (orig == null) return;
    a.setAttribute('href', orig); a.removeAttribute('data-wp-href');
    var rp = a.getAttribute('data-wp-rp');
    if (rp) a.setAttribute('referrerpolicy', rp); else a.removeAttribute('referrerpolicy');
    a.removeAttribute('data-wp-rp');
  }
  function restoreAll() { var l = swapped; swapped = []; l.forEach(restore); }
  function onWpClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = wpLink(e.target);
    if (!a) return;
    restore(a);   /* 先前右鍵換成登出頁的：恢復原網址，再照現在的狀態判 */
    if (!wpMismatch()) return;
    e.preventDefault(); e.stopPropagation();
    goWpLogout();
  }
  function onWpMenu(e) {
    var a = wpLink(e.target);
    if (!a) return;
    restore(a);
    if (!wpMismatch()) return;
    a.setAttribute('data-wp-href', a.getAttribute('href'));
    a.setAttribute('data-wp-rp', a.getAttribute('referrerpolicy') || '');
    a.setAttribute('href', WP_SWITCH); a.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    swapped.push(a);
  }
  /* 表單送出（例：商品頁 #wooForm POST 到 wp.winds.tw/checkout/）：不經過連結點擊，另外攔 submit（capture，先於表單自己的檢查） */
  function onWpSubmit(e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var action = (e.submitter && e.submitter.getAttribute('formaction')) || f.getAttribute('action') || location.href;
    if (!wpGuard(action)) { markConnect(f, action); return; }
    e.preventDefault(); e.stopPropagation();
    goWpLogout();
  }
  /* J56（2026-10-31）：網站已登入（憑證至少還有 60 秒）又沒有換人衝突時，商品頁送到 WP 的表單多帶 winds_connect=1：
     WP 放完車、要轉回結帳頁那一下，訪客就接著走登入，客人不用再按一次〔登入〕。只有「這一次按購買」有效，不留任何 cookie。 */
  function markConnect(f, action) {
    var old = f.querySelector('input[name="winds_connect"]');
    if (old) old.remove();
    if (!isWpUrl(action)) return;
    try { if (localStorage.getItem('winds_teacher_secret') || localStorage.getItem('winds_teacher_acct')) return; } catch (e) { return; }   /* 看登出會清掉的 secret，不看永遠留著的 provider（雲端審查 10/31：不然這台之後的客人都接不上）。老師自動接上會變老師帳號、結帳被擋；訪客才買得成，維持要按登入 */
    var ok = ['winds_google_token', 'winds_line_token'].some(function (k) {
      var t = ''; try { t = localStorage.getItem(k) || ''; } catch (e) {}
      var p = t ? decode(t) : null;
      return !!(p && p.sub && p.exp && p.exp * 1000 - Date.now() > 60000);
    });
    if (!ok) return;
    var i = document.createElement('input'); i.type = 'hidden'; i.name = 'winds_connect'; i.value = '1';
    f.appendChild(i);
  }
  document.addEventListener('click', onWpClick, true);
  document.addEventListener('auxclick', onWpClick, true);
  document.addEventListener('contextmenu', onWpMenu, true);
  document.addEventListener('submit', onWpSubmit, true);
  document.addEventListener('pointerdown', restoreAll, true);
  document.addEventListener('keydown', restoreAll, true);

  window.__refreshNavAuth = render;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
