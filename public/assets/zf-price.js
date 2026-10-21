/* 靈符解方價格（2026-10-21 Jeffery 拍板試營運價；Astra 試營運價第 1 輪：不能用客人手機時間決定價格）
 * 價格一律以後端 api.winds.tw/config 為準（talisman_price／talisman_list_price）；拿到之前先用預設（試營運價），拿到後換掉。
 * 寫死在頁面上的價格包成 <span data-zf-price="…">，這支會依現在的價格改字：
 *   data-zf-price="num"   → NT$199（到期後 NT$360）
 *   data-zf-price="label" → 試營運價 NT$199（到期後 NT$360）
 *   data-zf-price="faq"   → 目前是試營運價 NT$199（原價 NT$360，到 1 月 31 日）（到期後 是 NT$360）
 * 價格變了會發 zf-price 事件（占卜頁的付款卡跟著重畫）。網站與 LINE（liff/assets/zf-price.js）同一份。 */
(function () {
  var st = { price: Date.now() < Date.UTC(2027, 0, 31, 16) ? 199 : 360, list: 360, server: false };   /* 伺服器回來之前的暫定值 */
  function txt(m) {
    var t = st.price < st.list;
    if (m === 'num') return 'NT$' + st.price;
    if (m === 'faq') return t ? '目前是試營運價 NT$' + st.price + '（原價 NT$' + st.list + '，到 1 月 31 日）' : '是 NT$' + st.price;
    return t ? '試營運價 NT$' + st.price : 'NT$' + st.price;
  }
  function apply(root) {
    var els = (root || document).querySelectorAll ? (root || document).querySelectorAll('[data-zf-price]') : [];
    for (var i = 0; i < els.length; i++) { var v = txt(els[i].getAttribute('data-zf-price')); if (els[i].textContent !== v) els[i].textContent = v; }
  }
  var busy = false;
  function load() {
    if (busy) return; busy = true;
    fetch('https://api.winds.tw/config', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      busy = false;
      var p = Number(d && d.talisman_price), l = Number(d && d.talisman_list_price) || 360;
      if (!(p > 0)) return;
      var ch = p !== st.price || l !== st.list;
      st.price = p; st.list = l; st.server = true;
      apply();
      if (ch) { try { window.dispatchEvent(new Event('zf-price')); } catch (e) {} }
    }).catch(function () { busy = false; });
  }
  window.ZFPrice = { get: function () { return st; }, refresh: load, apply: apply };
  function boot() {
    apply();
    try { new MutationObserver(function () { apply(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  load();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  setInterval(function () { if (!document.hidden) load(); }, 10 * 60 * 1000);   /* 頁面一直開著也會跟上（例如跨過截止時間；Astra 第 2 輪） */
})();
