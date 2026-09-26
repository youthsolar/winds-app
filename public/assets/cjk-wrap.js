/* 全站中文斷行（2026-09-26 第二版，Jeffery：「卻不／知道」「還沒／看見」在詞中間被切，要全部都檢查）
 *
 * 第一版（9/25）只用 BudouX：它切的是「詞」（卻｜不｜知道），不是語意片段，所以照樣會斷在「卻不／知道」。
 * 第二版規則：
 *   1. 先照標點切成「小句」（卻不知道你們會走到哪裡？）。
 *   2. 小句一行放得下（字數 ≤ 這個元素一行能放的字數）→ 整句不拆，只在標點後換行。
 *   3. 放不下的長句才往下拆：用 BudouX 的詞組邊界，但「的了著過嗎呢吧啊」黏前面、
 *      「不沒還也都就才再又很在把被讓給跟和與對向從」黏後面，單字不落單，保護詞（風易揚老師…）不拆。
 *   4. 在允許的斷點插 <wbr data-cjk>（不是 ​：textContent 不會多出隱形字），
 *      父元素加 .cjk（word-break:keep-all）→ 只准在 <wbr>／標點／空白換行。
 *   5. JS 後來才畫的內容用 MutationObserver 補；視窗寬度改變就依新寬度重算。
 * 需要先載 /assets/budoux-zh-hant.min.js（沒有也能跑：長句退回逐字斷）。 */
(function () {
  var KEEP = ['風易揚老師','風易揚','找風問幸福','找風問好愛','通靈水鏡法','元辰宮代觀','元辰宮','分靈體','完整解讀','7 天'];
  var TAIL = /^[的了著過嗎呢吧啊呀喔哦嘛囉們得地]/;
  var HEAD = /[不沒還也都就才再又很在把被讓給跟和與對向從最更太只]$/;
  var CLAUSE = /[^，。、；：？！…」』）》〉,.;:?!\s]+[，。、；：？！…」』）》〉,.;:?!\s]*|[，。、；：？！…」』）》〉,.;:?!\s]+/g;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1, SVG: 1, TEMPLATE: 1, IFRAME: 1 };
  var CJK = /[㐀-鿿]/;
  var WIDE = /[㐀-鿿＀-￯　-〿]/g;
  var parser = null, observer = null, pending = [], scheduled = false, lastW = window.innerWidth;

  function getParser() {
    if (parser) return parser;
    if (!window.customElements || !customElements.get('budoux-zh-hant')) return null;
    try { parser = document.createElement('budoux-zh-hant').parser; } catch (e) { return null; }
    return parser && typeof parser.parse === 'function' ? parser : (parser = null);
  }

  function esc(c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function words(s) {
    var p = getParser();
    var j = (p ? p.parse(s) : s.split('')).join('\u0001');
    KEEP.forEach(function (w) { j = j.replace(new RegExp(w.split('').map(esc).join('\u0001?'), 'g'), w); });
    j = j.replace(/([\uD800-\uDBFF‍])\u0001|\u0001(?=[\uDC00-\uDFFF‍︎️⃣])/g, '$1');
    var parts = j.split('\u0001'), out = [];
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i];
      var last = out.length ? out[out.length - 1] : '';
      if (out.length && (last + w).length <= 6 && (TAIL.test(w) || HEAD.test(last) || (w.length === 1 && CJK.test(w)) || last.slice(-1) === w.charAt(0))) out[out.length - 1] += w; /* 黏合上限 6 字：黏太長會比一行還寬、被迫硬切 */ /* 最後一條：疊字（看看、慢慢）不拆 */
      else out.push(w);
    }
    return out;
  }

  function width(s) { var wide = (s.match(WIDE) || []).length; return wide + (s.length - wide) * 0.55; }

  /* 回傳片段；片段之間允許換行 */
  /* joinPrev／joinNext：這段文字前／後緊貼著連結、粗體等行內元素，同一小句被拆在不同節點，
     只看自己的長度會以為放得下 → 相接那一小句改照詞組拆，接起來才有合法斷點 */
  function plan(text, cpl, joinPrev, joinNext) {
    var clauses = text.match(CLAUSE) || [text], segs = [];
    for (var i = 0; i < clauses.length; i++) {
      var c = clauses[i];
      var edge = (i === 0 && joinPrev) || (i === clauses.length - 1 && joinNext && !/[，。、；：？！…」』）》〉,.;:?!\s]$/.test(c));
      if (!edge && width(c) <= cpl) segs.push(c); else segs = segs.concat(words(c));
    }
    return segs;
  }

  function inlineSib(n, dir) {
    var x = dir < 0 ? n.previousSibling : n.nextSibling;
    while (x && (x.nodeName === 'WBR' || (x.nodeType === 3 && !x.nodeValue.trim()))) x = dir < 0 ? x.previousSibling : x.nextSibling;
    if (!x) return false;
    if (x.nodeType === 3) return true;
    if (x.nodeType !== 1 || x.nodeName === 'BR') return false;
    return getComputedStyle(x).display.indexOf('inline') === 0 && /[\u3400-\u9fff]/.test(x.textContent);
  }

  function blockOf(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var d = getComputedStyle(n).display;
      if (d.indexOf('inline') !== 0 && d !== 'contents') return n;
    }
    return document.body;
  }

  function skipped(el) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (SKIP[n.nodeName.toUpperCase()] || n.isContentEditable || (n.hasAttribute && n.hasAttribute('data-nocjk'))) return true;
    }
    return false;
  }

  function cplOf(parent) {
    var b = blockOf(parent), cs = getComputedStyle(b), pcs = getComputedStyle(parent);
    var fs = parseFloat(pcs.fontSize) || 16, ls = parseFloat(pcs.letterSpacing) || 0;
    var w = b.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (!(w > 0)) w = window.innerWidth - 32;
    return Math.max(4, Math.floor(w / (fs + ls)) - 1);
  }

  function wrapText(node) {
    var v = node.nodeValue;
    if (!v || !CJK.test(v)) return;
    var parent = node.parentElement;
    if (!parent || skipped(parent)) return;
    if (v.indexOf('​') >= 0) { v = v.replace(/​/g, ''); node.nodeValue = v; } /* 舊版插的零寬空白 */
    parent.classList.add('cjk');
    var joinPrev = inlineSib(node, -1) && !/^[，。、；：？！…」』）》〉,.;:?!\s]/.test(v);
    var joinNext = inlineSib(node, 1);
    if (!joinPrev && !joinNext && parent !== blockOf(parent)) { joinPrev = inlineSib(parent, -1); joinNext = inlineSib(parent, 1); }
    var segs = plan(v, cplOf(parent), joinPrev, joinNext);
    if (segs.length < 2) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < segs.length; i++) {
      if (i) { var w = document.createElement('wbr'); w.setAttribute('data-cjk', ''); frag.appendChild(w); }
      frag.appendChild(document.createTextNode(segs[i]));
    }
    parent.replaceChild(frag, node);
  }

  function ours(n) { return n && n.nodeName === 'WBR' && n.hasAttribute('data-cjk'); }

  function process(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!ours(root.previousSibling) && !ours(root.nextSibling)) wrapText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName.toUpperCase()]) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, nodes = [];
    while ((n = walker.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i];
      if (ours(t.previousSibling) || ours(t.nextSibling)) continue;
      wrapText(t);
    }
  }

  function observe() { if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true }); }

  function flush() {
    scheduled = false;
    var list = pending; pending = [];
    if (observer) observer.disconnect();
    for (var i = 0; i < list.length; i++) if (list[i].isConnected) process(list[i]);
    observe();
  }

  function queue(n) {
    pending.push(n);
    if (!scheduled) { scheduled = true; if (window.requestAnimationFrame) requestAnimationFrame(flush); else setTimeout(flush, 16); }
  }

  function redo() {
    if (observer) observer.disconnect();
    var ws = document.querySelectorAll('wbr[data-cjk]'), parents = [];
    for (var i = 0; i < ws.length; i++) { var p = ws[i].parentNode; if (parents.indexOf(p) < 0) parents.push(p); p.removeChild(ws[i]); }
    for (var k = 0; k < parents.length; k++) parents[k].normalize();
    process(document.body);
    observe();
  }

  function injectCss() {
    if (document.getElementById('cjk-wrap-css')) return;
    var st = document.createElement('style'); st.id = 'cjk-wrap-css';
    st.textContent = '.cjk{word-break:keep-all!important;overflow-wrap:anywhere!important}';
    (document.head || document.documentElement).appendChild(st);
  }

  var started = false;
  function start() {
    if (started) { redo(); return; }
    started = true;
    process(document.body);
    observer = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') { queue(m.target); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) queue(m.addedNodes[j]);
      }
    });
    observe();
    var rt = null;
    window.addEventListener('resize', function () {
      if (Math.abs(window.innerWidth - lastW) < 8) return;
      lastW = window.innerWidth; clearTimeout(rt); rt = setTimeout(redo, 150);
    });
    /* 不在 fonts.ready 重算：一行字數只看區塊寬度與字級，字型晚到不改變這兩個值（Codex 複審：省掉載入時第二次全頁重算） */
  }

  function boot() {
    injectCss();
    if (getParser()) { start(); return; }
    if (window.customElements && customElements.whenDefined) customElements.whenDefined('budoux-zh-hant').then(start);
    setTimeout(function () { if (!started) start(); }, 1500);
  }
  window.CJKWrap = { redo: redo, plan: plan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
