/* 找風問幸福 — 主題初始化（暖墨夜色切換）
 * 放在每頁 <head> 樣式表之前同步載入，避免明→暗閃爍。
 * 規則（2026-07-09 Jeffery 拍板，取代 DS 原稿的「跟系統」）：
 *   使用者選過 → localStorage("zf_theme")；沒選過 → 依客端時間 19:00–07:00 暗。
 * API 形狀同 DS theme-init.js（ZFTheme / zf-theme-change），日後元件無痛接。
 */
(function () {
  var KEY = "zf_theme";
  function byTime() {
    var h = new Date().getHours();
    return (h >= 19 || h < 7) ? "dark" : "light";
  }
  function resolve() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    return byTime();
  }
  function apply(mode) {
    if (mode === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }
  /* 2026-09-28（gpt-6-astra 體檢）：get／isDark／toggle 原本每次重算 resolve()，跟畫面上實際套用的不一定一樣——
     沒選過主題、頁面開著跨過 07:00／19:00 時第一次點沒反應；localStorage 寫不進去時切一次就切不回來。
     改成記住「目前套用的」，三者都看它；localStorage 只負責存起來給下次開頁用。 */
  var current = resolve();
  apply(current);

  window.ZFTheme = {
    get: function () { return current; },
    isDark: function () { return current === "dark"; },
    set: function (mode) {
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      current = mode;
      apply(mode);
      window.dispatchEvent(new CustomEvent("zf-theme-change", { detail: { mode: mode } }));
    },
    toggle: function () { this.set(current === "dark" ? "light" : "dark"); },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} current = resolve(); apply(current); }
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
