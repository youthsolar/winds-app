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
  apply(resolve());

  window.ZFTheme = {
    get: resolve,
    isDark: function () { return resolve() === "dark"; },
    set: function (mode) {
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      apply(mode);
      window.dispatchEvent(new CustomEvent("zf-theme-change", { detail: { mode: mode } }));
    },
    toggle: function () { this.set(resolve() === "dark" ? "light" : "dark"); },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} apply(resolve()); }
  };
})();
