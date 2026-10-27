/* 找風問幸福 — 主題初始化（暖墨夜色切換）
 * 放在每頁 <head> 樣式表之前同步載入，避免明→暗閃爍。
 * 規則（2026-07-09 Jeffery 拍板，取代 DS 原稿的「跟系統」）：
 *   使用者選過 → localStorage("zf_theme")；沒選過 → 依客端時間 19:00–07:00 暗。
 *   2026-10-27：另存 .winds.tw cookie，三站（網站／WP／LINE）共用同一個選擇。此檔網站與 LINE 一模一樣，改一邊要複製到另一邊。
 * API 形狀同 DS theme-init.js（ZFTheme / zf-theme-change），日後元件無痛接。
 */
(function () {
  var KEY = "zf_theme";
  /* 2026-10-27 深淺色跨站記住（winds.tw ↔ wp.winds.tw ↔ liff.winds.tw）：
     localStorage 每個網址各一份，所以選擇另外存一份在 .winds.tw 共用 cookie（light／dark／auto）。
     cookie 有值＝最近一次選擇，以它為準並同步回本站 localStorage；沒有 cookie 才看 localStorage（舊客人第一次進來順手補 cookie）。
     cookie 寫不進去（瀏覽器擋、非 winds.tw 網址）就退回只用 localStorage，跟改之前一樣。 */
  var ON_WINDS = /(^|\.)winds\.tw$/.test(location.hostname);
  function readCookie() {
    try { var m = document.cookie.match(/(?:^|;\s*)zf_theme=(light|dark|auto)(?:;|$)/); return m ? m[1] : null; } catch (e) { return null; }
  }
  function writeCookie(v) {
    if (!ON_WINDS) return;
    try { document.cookie = KEY + "=" + v + "; Domain=.winds.tw; Path=/; Max-Age=31536000; SameSite=Lax; Secure"; } catch (e) {}
  }
  function readLocal() {   // 讀不到（瀏覽器擋）回 null，跟「沒選過」（auto）分開
    try { var s = localStorage.getItem(KEY); return (s === "dark" || s === "light") ? s : "auto"; } catch (e) { return null; }
  }
  function writeLocal(v) {
    try { if (v === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {}
  }
  function byTime() {
    var h = new Date().getHours();
    return (h >= 19 || h < 7) ? "dark" : "light";
  }
  function readChoice(keep) {   // keep：兩邊都讀不到時沿用的選擇（切回分頁時＝記憶體裡的，不洗回自動）
    var c = readCookie();
    if (c) { writeLocal(c); return c; }
    var l = readLocal();
    if (l === null) return keep || "auto";
    if (l !== "auto") writeCookie(l);
    return l;
  }
  function apply(mode) {
    if (mode === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }
  /* 2026-09-28（gpt-6-astra 體檢）：get／isDark／toggle 原本每次重算，跟畫面上實際套用的不一定一樣——
     沒選過主題、頁面開著跨過 07:00／19:00 時第一次點沒反應；localStorage 寫不進去時切一次就切不回來。
     改成記住「目前套用的」（current）與「客人選的是哪一段」（chosen），存檔只負責給下次開頁用。 */
  var chosen = readChoice();
  var current = chosen === "auto" ? byTime() : chosen;
  apply(current);

  window.ZFTheme = {
    get: function () { return current; },
    isDark: function () { return current === "dark"; },
    set: function (mode) {
      writeLocal(mode); writeCookie(mode);
      current = mode;
      chosen = mode;
      apply(mode);
      window.dispatchEvent(new CustomEvent("zf-theme-change", { detail: { mode: mode } }));
    },
    toggle: function () { this.set(current === "dark" ? "light" : "dark"); },
    clear: function () { writeLocal("auto"); writeCookie("auto"); chosen = "auto"; current = byTime(); apply(current); },
    /* 2026-10-27（DS 2026.10.27-4 ThemeToggle 三段，Jeffery 拍板）：客人選的是哪一段——auto／light／dark。
       選「自動」＝刪掉 localStorage 的 zf_theme（只存 light／dark，舊頁面才不會判斷錯）、cookie 記 auto，回到 19:00–07:00 深色。 */
    choice: function () { return chosen; },
    pick: function (v) {
      if (v === "auto") { this.clear(); window.dispatchEvent(new CustomEvent("zf-theme-change", { detail: { mode: current } })); }
      else this.set(v);
    }
  };

  /* 三段按鈕（.zf-tt，頁首與手機選單共用）：點擊用事件委派，動態畫出來的頁首（漏斗頁）也吃得到；
     切換後把每一組的選中狀態重畫一次。 */
  function paintTT() {
    var v = window.ZFTheme.choice();
    var bs = document.querySelectorAll(".zf-tt button[data-v]");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-checked", bs[i].getAttribute("data-v") === v ? "true" : "false");
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".zf-tt button[data-v]") : null;
    if (b) window.ZFTheme.pick(b.getAttribute("data-v"));
  });
  /* 方向鍵在三段之間移動並直接選取（radio 群組慣例，Astra 建議） */
  document.addEventListener("keydown", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".zf-tt button[data-v]") : null;
    if (!b) return;
    var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    var bs = b.parentNode.querySelectorAll("button[data-v]"), i = Array.prototype.indexOf.call(bs, b);
    var n = bs[(i + d + bs.length) % bs.length];
    n.focus(); window.ZFTheme.pick(n.getAttribute("data-v"));
  });
  window.addEventListener("zf-theme-change", paintTT);
  /* 按「上一頁」回來（瀏覽器直接拿快取畫面、不重跑這支）或切回這個分頁時，別站可能已經改過選擇、
     「自動」也可能跨過 07:00／19:00：重讀一次，選擇或實際深淺有變才重畫（Astra 10/27） */
  function sync() {
    var c = readChoice(chosen), m = c === "auto" ? byTime() : c;
    if (c === chosen && m === current) return;
    chosen = c; current = m; apply(m);
    window.dispatchEvent(new CustomEvent("zf-theme-change", { detail: { mode: m } }));
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) sync(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") sync(); });
  document.addEventListener("DOMContentLoaded", paintTT);
  window.ZFTheme.tt = function (labeled) {
    var v = window.ZFTheme.choice(), o = [["auto", "circle-half", "自動"], ["light", "sun", "淺色"], ["dark", "moon", "深色"]], h = "";
    for (var i = 0; i < o.length; i++) h += '<button type="button" role="radio" data-v="' + o[i][0] + '" aria-checked="' + (o[i][0] === v) + '" aria-label="' + o[i][2] + '" title="' + o[i][2] + '"><i class="ph ph-' + o[i][1] + '"></i>' + (labeled ? "<span>" + o[i][2] + "</span>" : "") + "</button>";
    return '<div class="zf-tt' + (labeled ? " lb" : "") + '" role="radiogroup" aria-label="深淺色">' + h + "</div>";
  };
})();

/* 2026-10-07（Jeffery 手機重開分頁整頁沒樣式）：每次部署 /_astro/*.css 檔名換新、舊檔刪除；
 * iPhone 重開分頁時用快取的舊 HTML，去抓已經不存在的舊樣式檔 → 只剩文字。
 * 這支在每頁 <head> 樣式表之前同步載入：抓到 /_astro/ 樣式檔載不到，就帶 _r 參數重抓一次最新頁面
 * （新網址＝瀏覽器與 CDN 都不會用舊快取）；網址已經帶 _r 就不再重抓，避免無限重新整理；載完把 _r 拿掉。 */
(function () {
  var fired = false;   // 好幾個樣式檔一起壞時只重抓一次
  function hasR() { return /[?&]_r=/.test(location.search); }
  window.addEventListener("error", function (e) {
    var t = e.target;
    if (fired || !t || t.tagName !== "LINK" || !/\/_astro\//.test(t.href || "") || hasR()) return;
    fired = true;
    try { var u = new URL(location.href); u.searchParams.set("_r", Date.now()); location.replace(u.toString()); } catch (_) {}
  }, true);
  window.addEventListener("load", function () {
    if (!hasR()) return;
    try { var u = new URL(location.href); u.searchParams.delete("_r"); history.replaceState(history.state, "", u.toString()); } catch (_) {}
  });
})();
