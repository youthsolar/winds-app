/* 共用 Nav 帳號區 — 逐值對齊 DS 權威元件 components/account-nav/AccountNav.jsx
 * （DesignSync get_file，2026-06-20）。僅注入 markup + 串 localStorage/JWT 邏輯；
 *  設計值全部來自 DS：頭像 ring 2/3 rose-200、首字 size×0.44、caret ph-bold ink-500、
 *  下拉 min-width 200 / padding 8 / header mb 6、下拉項目無 icon。
 *  注入點：#auth-button（桌機）、#auth-button-m（手機抽屜）。
 */
(function () {
  var LOGOUT_URL = '/';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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
    try { sessionStorage.removeItem('winds_pending_log_id'); } catch (er) {}
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
            '<div class="nav-acct-menu" hidden style="position:absolute;top:calc(100% + 10px);right:0;z-index:41;min-width:200px;background:var(--surface-card);border:1px solid var(--border-soft);border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:8px">' +
              '<div style="padding:8px 12px 10px;border-bottom:1px solid var(--border-soft);margin-bottom:6px">' +
                '<div style="font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--ink-900)">' + esc(p.name || '') + '</div>' +
                '<div style="font-family:var(--font-sans);font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.email || '') + '</div>' +
              '</div>' +
              '<a href="/account" style="display:flex;align-items:center;gap:8px;padding:9px 12px;font-family:var(--font-serif);font-size:14.5px;color:var(--ink-700);border-radius:var(--radius-sm);text-decoration:none">會員中心</a>' +
              '<button type="button" class="nav-logout" style="all:unset;cursor:pointer;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:9px 12px;font-family:var(--font-serif);font-size:14.5px;color:var(--text-muted);border-radius:var(--radius-sm)">登出</button>' +
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
          '<div style="display:flex;align-items:center;gap:10px;padding:8px 4px">' + avatarHTML(p, 36) +
            '<div style="min-width:0">' +
              '<div style="font-family:var(--font-serif);font-size:16px;font-weight:500;color:var(--ink-900)">' + esc(p.name || '') + '</div>' +
              '<div style="font-family:var(--font-sans);font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(p.email || '') + '</div>' +
            '</div>' +
          '</div>' +
          '<a href="/account" style="display:block;font-family:var(--font-serif);font-size:16px;color:var(--ink-700);padding:10px 4px;text-decoration:none">會員中心</a>' +
          '<button type="button" class="nav-logout" style="all:unset;cursor:pointer;display:block;font-family:var(--font-serif);font-size:16px;color:var(--text-muted);padding:10px 4px">登出</button>';
      } else {
        m.innerHTML = '<a href="/login" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:44px;padding:0 22px;box-sizing:border-box;white-space:nowrap;font-family:var(--font-serif);font-size:16px;font-weight:500;color:var(--ink-900);background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-pill);text-decoration:none"><i class="ph-thin ph-user-circle" style="font-size:20px"></i>登入</a>';   // 10/17：登入頁有 LINE 和 Google 兩種，這裡不寫 Google
      }
      wireLogout(m);
    }
  }

  window.__refreshNavAuth = render;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
