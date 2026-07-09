/* 共用 Nav 帳號區 — 逐值對齊 DS 權威元件 components/account-nav/AccountNav.jsx
 * （DesignSync get_file，2026-06-20）。僅注入 markup + 串 localStorage/JWT 邏輯；
 *  設計值全部來自 DS：頭像 ring 2/3 rose-200、首字 size×0.44、caret ph-bold ink-500、
 *  下拉 min-width 200 / padding 8 / header mb 6、下拉項目無 icon。
 *  注入點：#auth-button（桌機）、#auth-button-m（手機抽屜）。
 */
(function () {
  var LOGOUT_URL = '/';
  var GOOGLE_G =
    '<svg width="18" height="18" viewBox="0 0 48 48" style="flex:none;display:block" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    '</svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function decode(token) {
    try {
      var p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
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

  function wireLogout(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.nav-logout'), function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        try { localStorage.removeItem('winds_google_token'); } catch (er) {}
        location.href = LOGOUT_URL;
      });
    });
  }

  function render() {
    var token = '';
    try { token = localStorage.getItem('winds_google_token') || ''; } catch (e) {}
    var p = token ? decode(token) : null;

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
        m.innerHTML = '<a href="/login" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;min-height:44px;padding:0 22px;box-sizing:border-box;white-space:nowrap;font-family:var(--font-serif);font-size:16px;font-weight:500;color:var(--ink-900);background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-pill);text-decoration:none">' + GOOGLE_G + 'Google 登入</a>';
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
