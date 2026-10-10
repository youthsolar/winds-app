/* 找風問幸福 — 信箱驗證碼視窗（2026-10-09 Jeffery 拍板：6 位數驗證碼，不用信件連結）
 * 用在：占卜（填的信箱已有帳號、付款前）、網站預約付款前。後端見 cloudflare-worker/src/email-verify.ts。
 * 為什麼是碼：客人多在 Threads／IG／LINE 內建瀏覽器，點信裡的連結會開在別的分頁、原本那頁的卦和時段還可能被清掉；
 * 碼是回原頁輸入，頁面不離開。
 *
 * ZFEmailVerify.token(email)          這個瀏覽器存的驗證憑證（30 天），沒有回 ""
 * ZFEmailVerify.clear(email)          後端說憑證不算數時清掉
 * ZFEmailVerify.ensure(opts)          開視窗、自動寄碼、驗過回 Promise<憑證>，按取消回 Promise<null>
 *     opts = { email } 或 { logId, k, masked }（只知道是哪一卦、不知道完整信箱時，後端寄到那一卦的信箱）
 * ZFEmailVerify.fromGoogle(idToken)   Google 已確認過信箱：換一張憑證存起來，不用收碼
 */
(function () {
  var API = 'https://api.winds.tw';
  var KEY = 'winds_ev';   // winds_ 開頭：登出時跟其他個資一起清（nav-auth.js）

  function norm(e) { return String(e || '').trim().toLowerCase(); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function store(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }
  var mem = {};   // localStorage 寫不進去（無痕、部分內建瀏覽器）時，這一頁還是記得

  function token(email) {
    var e = norm(email); if (!e) return '';
    // 這一頁記的優先（Astra V110 #1）：localStorage 寫不進去時，裡面那張舊憑證會蓋掉剛驗好的；清掉過的也記在這裡，不再讀回舊的
    var r = Object.prototype.hasOwnProperty.call(mem, e) ? mem[e] : load()[e];
    if (r && r.t && (!r.x || Date.parse(r.x) > Date.now())) return r.t;
    return '';
  }
  function save(email, t, x) {
    var e = norm(email); if (!e || !t) return;
    mem[e] = { t: t, x: x || '' };
    var m = load(); m[e] = mem[e]; store(m);
  }
  function clear(email) {
    var e = norm(email); mem[e] = { t: '' };
    var m = load(); if (m[e]) { delete m[e]; store(m); }
  }

  function post(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d = d || {}; d._status = r.status; return d; }); });
  }

  function fromGoogle(idToken) {
    try {
      var p = JSON.parse(atob(String(idToken).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!p.email || token(p.email)) return;
    } catch (e) { return; }
    fetch(API + '/email-verify/google', { method: 'POST', headers: { 'X-Google-Id-Token': idToken } })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok && d.token && d.email) save(d.email, d.token, d.expires_at); })
      .catch(function () {});
  }

  /* 樣式逐值對齊 DS（2026-10-09）：版面＝預約精靈彈窗（DS ui_kits/booking lp-wizard，booking.astro .bw-*）：遮罩 --scrim＋模糊 3px、
     面板 --surface-page／--radius-2xl／--shadow-xl、寬 min(520px, 100vw−32px)、標題區 22/24/16＋細線、標題 serif 22／500、副標 sans 13 muted、
     內容 20/24、底列 16/24＋細線、兩顆鈕各佔一半。輸入框＝DS Field、按鈕＝DS Button md（primary／secondary）、重寄＝DS TextLink */
  var CSS = '' +
    '.zfev-ov{position:fixed;left:0;right:0;top:0;height:100%;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;}' +
    '.zfev-scrim{position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}' +
    '.zfev-panel{position:relative;width:min(520px,calc(100vw - 32px));max-height:min(88vh,100%);display:flex;flex-direction:column;background:var(--surface-page);border-radius:var(--radius-2xl);box-shadow:var(--shadow-xl);overflow:hidden;}' +
    '.zfev-head{padding:22px 24px 16px;border-bottom:1px solid var(--border-soft);}' +
    '.zfev-title{font-family:var(--font-serif);font-size:22px;font-weight:500;color:var(--ink-900);margin:0;}' +
    '.zfev-sub{font-family:var(--font-sans);font-size:13px;color:var(--text-muted);margin-top:3px;}' +
    '.zfev-body{padding:20px 24px;overflow:auto;}' +
    '.zfev-msg{font-family:var(--font-serif);font-size:var(--t-body);line-height:var(--lh-body);letter-spacing:var(--ls-body);color:var(--ink-700);margin:0 0 16px;}' +
    '.zfev-mail{white-space:nowrap;color:var(--ink-900);}' +
    '.zfev-in{display:block;width:100%;padding:12px 16px;font-family:var(--font-serif);font-size:var(--t-body);color:var(--ink-900);background:var(--surface-card);border:1px solid var(--border-strong);border-radius:var(--radius-md);box-shadow:var(--shadow-xs);outline:none;transition:border-color var(--dur-fast) var(--ease-soft),box-shadow var(--dur-fast) var(--ease-soft);line-height:1.4;box-sizing:border-box;}' +
    '.zfev-in:focus{border-color:var(--rose-300);box-shadow:0 0 0 4px var(--focus-ring);}' +
    '.zfev-in[aria-invalid="true"]{border-color:var(--critical);}' +
    '.zfev-err{display:block;margin-top:7px;min-height:1.5em;font-family:var(--font-sans);font-size:var(--t-caption);line-height:var(--lh-ui);color:var(--critical);}' +
    '.zfev-re{display:inline-flex;align-items:center;gap:5px;margin-top:14px;font-family:var(--font-sans);font-size:14px;color:var(--rose-600);background:transparent;border:none;padding:0;cursor:pointer;border-bottom:1px solid var(--rose-200);line-height:1.5;transition:color var(--dur-fast) var(--ease-soft);}' +
    '.zfev-re[disabled]{color:var(--text-muted);border-bottom-color:var(--border-strong);cursor:default;}' +
    '.zfev-hint{display:block;margin-top:14px;font-family:var(--font-sans);font-size:var(--t-caption);line-height:var(--lh-ui);color:var(--text-muted);}' +
    '.zfev-foot{display:flex;gap:12px;padding:16px 24px;border-top:1px solid var(--border-soft);}' +
    '.zfev-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;min-height:44px;font-family:var(--font-serif);font-size:var(--t-body);font-weight:var(--w-medium);letter-spacing:0.04em;line-height:1;border-radius:var(--radius-pill);border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:background var(--dur-fast) var(--ease-soft),transform var(--dur-fast) var(--ease-soft),box-shadow var(--dur-fast) var(--ease-soft);}' +
    '.zfev-btn:active:not([disabled]){transform:translateY(1px) scale(0.99);}' +
    '.zfev-btn[disabled]{opacity:.45;cursor:not-allowed;}' +
    '.zfev-pri{background:var(--accent);color:var(--text-on-accent);box-shadow:var(--shadow-sm);}' +
    '.zfev-pri:hover:not([disabled]){background:var(--accent-hover);}' +
    '.zfev-sec{background:var(--surface-card);color:var(--ink-900);border-color:var(--border-strong);box-shadow:var(--shadow-xs);}' +
    '.zfev-sec:hover:not([disabled]){background:var(--rice-100);}' +
    /* 可見高度太矮（手機橫拿＋鍵盤）：整個面板一起捲，標頭與底部按鈕不被裁掉（Astra V114） */
    '.zfev-tight{overflow-y:auto;-webkit-overflow-scrolling:touch;}' +
    '.zfev-tight .zfev-head,.zfev-tight .zfev-body,.zfev-tight .zfev-foot{flex-shrink:0;}' +
    '.zfev-tight .zfev-body{overflow:visible;}';

  var open = null;   // 同時只開一個視窗

  function ensure(opts) {
    opts = opts || {};
    if (open) return open;
    var target = opts.email ? { email: norm(opts.email) } : { log_id: Number(opts.logId) || 0, k: opts.k || '' };
    var masked = opts.masked || '';
    if (!document.getElementById('zfev-css')) {
      var st = document.createElement('style'); st.id = 'zfev-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    open = new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'zfev-ov';
      ov.innerHTML =
        '<div class="zfev-scrim"></div>' +
        '<div class="zfev-panel" role="dialog" aria-modal="true" aria-labelledby="zfev-t">' +
          '<div class="zfev-head"><h2 class="zfev-title" id="zfev-t">確認一下信箱</h2><div class="zfev-sub">確認這個信箱是你本人的、收得到信</div></div>' +
          '<div class="zfev-body">' +
            '<p class="zfev-msg">正在寄驗證碼…</p>' +
            '<input class="zfev-in" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" enterkeyhint="done" placeholder="6 位數字" aria-label="驗證碼">' +
            '<span class="zfev-err" aria-live="polite"></span>' +
            '<button class="zfev-re" type="button" disabled>重寄</button>' +
            '<span class="zfev-hint">收不到的話，看一下 Gmail 的「促銷內容」或「垃圾郵件」。</span>' +
          '</div>' +
          '<div class="zfev-foot"><button class="zfev-btn zfev-sec zfev-x" type="button">取消</button><button class="zfev-btn zfev-pri zfev-go" type="button" disabled>確認</button></div>' +
        '</div>';
      document.body.appendChild(ov);
      var msg = ov.querySelector('.zfev-msg'), inp = ov.querySelector('.zfev-in'), err = ov.querySelector('.zfev-err'),
          go = ov.querySelector('.zfev-go'), re = ov.querySelector('.zfev-re'), x = ov.querySelector('.zfev-x');
      function bad(on) { inp.setAttribute('aria-invalid', on ? 'true' : 'false'); }
      var timer = null, busy = false, done = false;

      function setMsg(m) {
        msg.innerHTML = '';
        msg.appendChild(document.createTextNode('驗證碼已經寄到 '));
        var b = document.createElement('span'); b.className = 'zfev-mail'; b.setAttribute('data-nocjk', ''); b.textContent = m || '你的信箱';
        msg.appendChild(b);
        msg.appendChild(document.createTextNode('，10 分鐘內有效。打開信，把 6 位數字填在下面。'));
      }
      function countdown(sec) {
        clearInterval(timer);
        var left = Math.max(1, Number(sec) || 60);
        re.disabled = true; re.textContent = '重寄（' + left + ' 秒）';
        timer = setInterval(function () {
          left--;
          if (left <= 0) { clearInterval(timer); re.disabled = false; re.textContent = '重寄'; }
          else re.textContent = '重寄（' + left + ' 秒）';
        }, 1000);
      }
      function finish(v) {
        if (done) return; done = true;
        clearInterval(timer);
        document.removeEventListener('keydown', onKey);
        if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); } else window.removeEventListener('resize', fit);
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        open = null;
        resolve(v);
      }
      function send() {
        err.textContent = '';
        re.disabled = true;
        post('/email-code/send', target).then(function (d) {
          if (d.ok) { masked = d.email_masked || masked; setMsg(masked); countdown(d.resend_after || 60); go.disabled = false; inp.focus(); return; }
          // 剛寄過：前一組碼還能用，照樣讓他輸入
          if (d.error === 'too_soon') { setMsg(masked); countdown(d.retry_after || 60); go.disabled = false; err.textContent = d.message || ''; inp.focus(); return; }
          msg.textContent = '驗證碼沒寄出去。';
          err.textContent = d.message || '暫時寄不出去，請稍後再按「重寄」。';
          re.disabled = false; re.textContent = '重寄';
          // 寄太多次只是不能再寄，手上最新那組碼還能輸入（Astra V110 #9）；只有猜錯太多次才停用確認
          if (d.error === 'too_many') { re.disabled = true; go.disabled = false; setMsg(masked); err.textContent = d.message || ''; inp.focus(); }
          if (d.error === 'locked') { re.disabled = true; go.disabled = true; }
        }).catch(function () {
          msg.textContent = '驗證碼沒寄出去。';
          err.textContent = '網路不太穩，請再按一次「重寄」。';
          re.disabled = false; re.textContent = '重寄';
        });
      }
      function verify() {
        if (busy) return;
        var code = String(inp.value || '').replace(/\D/g, '').slice(0, 6);
        if (code.length !== 6) { bad(true); err.textContent = '請輸入信裡的 6 位數字。'; inp.focus(); return; }
        busy = true; go.disabled = true; go.textContent = '確認中…'; err.textContent = '';
        var body = { code: code };
        for (var key in target) body[key] = target[key];
        post('/email-code/verify', body).then(function (d) {
          busy = false; go.textContent = '確認';
          if (d.ok && d.token) {
            var em = target.email || d.email || '';
            if (em) save(em, d.token, d.expires_at);
            // 從那一卦驗的：後端回這一卦的本人 k（Astra 最終驗收 #1），留給頁面換掉手上的一般 k
            if (target.log_id && d.k) window.ZFEmailVerify.lastLogK = { logId: String(target.log_id), k: d.k };
            finish(d.token);
            return;
          }
          go.disabled = d.error === 'locked';
          bad(true); err.textContent = d.message || '沒有驗證成功，再試一次。';
          if (d.error !== 'locked') { inp.select(); inp.focus(); }
          try { err.scrollIntoView({ block: 'nearest' }); } catch (e) {}   // 小螢幕叫出鍵盤時錯誤提示會落在底部按鈕後面
        }).catch(function () {
          busy = false; go.disabled = false; go.textContent = '確認';
          err.textContent = '網路不太穩，再按一次「確認」。';
        });
      }
      function onKey(e) { if (e.key === 'Escape') finish(null); }
      /* 叫出鍵盤時跟著「看得到的那一塊」走（2026-10-09 內建瀏覽器實測）：iPhone 的 WKWebView（IG／Threads／FB／LINE 內建瀏覽器都是它）
         鍵盤打開時版面高度不變，固定位置的視窗會置中到鍵盤後面；小螢幕上輸入框還會被擠到底部按鈕後面。
         改成視窗的位置與高度照 visualViewport 設，內容區再把輸入框捲進來 */
      var vv = window.visualViewport;
      function fit() {
        var h = vv ? vv.height : window.innerHeight;
        if (vv) ov.style.top = vv.offsetTop + 'px';
        ov.style.height = h + 'px';
        var panel = ov.querySelector('.zfev-panel');
        if (panel) panel.classList.toggle('zfev-tight', h < 280);   // 標頭＋輸入框＋底部按鈕約 260px，塞不下才整個一起捲
        if (document.activeElement === inp) setTimeout(function () { try { inp.scrollIntoView({ block: 'nearest' }); } catch (e) {} }, 0);
      }
      if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } else window.addEventListener('resize', fit);
      inp.addEventListener('focus', function () { setTimeout(fit, 300); });
      fit();

      inp.addEventListener('input', function () {
        bad(false);
        // 2026-10-10 Jeffery 在 IG 內建瀏覽器實測：Gmail 自動填寫會塞兩次（090109090109），只留前 6 碼
        var d = String(inp.value || '').replace(/\D/g, '').slice(0, 6);
        if (inp.value !== d) inp.value = d;
        if (d.length === 6 && !go.disabled) verify();   // 貼上整串或填滿 6 碼就直接送
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') verify(); });
      go.addEventListener('click', verify);
      re.addEventListener('click', function () { if (!re.disabled) send(); });
      x.addEventListener('click', function () { finish(null); });
      document.addEventListener('keydown', onKey);
      send();
    });
    return open;
  }

  window.ZFEmailVerify = { token: token, clear: clear, ensure: ensure, fromGoogle: fromGoogle };
})();
