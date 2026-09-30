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
  var HEAD = /[不沒還也都就才再又很在把被讓給跟和與對向從最更太只往為]$/;
  var OPEN = /[「『【（《〈(\[]$/;
  /* 2026-10-01（廣告前全站掃描）：半形逗號／句點與空白都算小句結尾，「NT$ 3,040」被切成「3,｜040」、「4.8」切成「4.｜8」，
     小句之間插 <wbr> → iPhone 上訂金顯示「NT$ 3,⏎040」；不斷行空白（wrapText 把「120 分鐘」的空白換成的）也被當結尾，
     「120 ⏎分鐘」照樣能斷。現在：數字＋逗號／句點＋數字、不斷行空白都不算小句結尾。 */
  var CLAUSE = /(?:\d[,.](?=\d)|\u00a0|[^，。、；：？！…」』）》〉,.;:?!\s])+[，。、；：？！…」』）》〉,.;:?!\s]*|[，。、；：？！…」』）》〉,.;:?!\s]+/g;
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
    j = j.replace(/\u2060\u0001|\u0001\u2060/g, '\u2060');   /* Word Joiner 兩側不插斷點 */
    j = j.replace(/(\d)\u0001(?=[\d天年月日次個張分秒週周歲%％期號元])/g, '$1');   /* 數字不拆、數字＋單位不拆（「4／9天」） */
    j = j.replace(/(\d)\u0001?([,.])\u0001?(?=\d)/g, '$1$2').replace(/\u00a0\u0001|\u0001\u00a0/g, '\u00a0');   /* 2026-10-01（廣告前全站掃描）：長句改照詞拆時「3,040」也不拆、不斷行空白兩側不插斷點 */
    j = j.replace(/[「『【（《〈][^」』】）》〉]{0,12}[」』】）》〉]/g, function (m) { return m.replace(/\u0001/g, ''); });   /* 短括號詞裡面不斷 */
    var parts = j.split('\u0001'), out = [];
    /* 9/29 第三版黏合（截圖抓到「還沒／看見」「往／前走」「一句「／愛不愛」」）：
       ① 開頭括號、HEAD 字（不沒還往為…）結尾的段 → 一律黏到下一段（不受長度上限）
       ② TAIL 字（的了嗎…）開頭的段 → 一律黏到上一段
       ③ 落單的單字、疊字 → 黏上一段，但合起來不超過 6 字 */
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i]; if (!w) continue;
      var last = out.length ? out[out.length - 1] : '';
      var aNotA = out.length && /^[沒不]/.test(w) && w.charAt(1) === last.slice(-1);   /* 有沒有、是不是 */
      var vNotC = out.length && /^[不沒][下起到了完動開住得見出來去掉懂透清]/.test(w) && CJK.test(last.slice(-1));   /* 放不下、看不到、說不出 */
      var closeLead = out.length && /^[，。、；：？！…」』】）》〉,.;:?!)]/.test(w);   /* 收尾標點開頭的段黏回上一段 */
      if (out.length && (HEAD.test(last) || OPEN.test(last) || TAIL.test(w) || aNotA || vNotC || closeLead)) out[out.length - 1] += w;
      else if (out.length && !HEAD.test(w) && (last + w).length <= 7 && ((w.replace(/[，。、；：？！…」』】）》〉,.;:?!)]/g, '').length === 1 && CJK.test(w)) || last.slice(-1) === w.charAt(0))) out[out.length - 1] += w;   /* 單字（可帶標點，如「辦？」）黏上一段 */
      else out.push(w);
    }
    return out;
  }

  function width(s) { s = s.replace(/\u2060/g, ''); var wide = (s.match(WIDE) || []).length; return wide + (s.length - wide) * 0.55; }

  /* 回傳片段；片段之間允許換行 */
  /* joinPrev／joinNext：這段文字前／後緊貼著連結、粗體等行內元素，同一小句被拆在不同節點，
     只看自己的長度會以為放得下 → 相接那一小句改照詞組拆，接起來才有合法斷點 */
  function plan(text, cpl, joinPrev, joinNext) {
    var clauses = text.match(CLAUSE) || [text], segs = [];
    for (var i = 0; i < clauses.length; i++) {
      var c = clauses[i];
      var edge = (i === 0 && joinPrev) || (i === clauses.length - 1 && joinNext && !/[，。、；：？！…」』）》〉,.;:?!\s]$/.test(c));
      if (!edge && width(c) <= cpl && !/[「『【（《〈]/.test(c)) { var ws = words(c); segs.push({ t: c, w: ws.length > 1 ? ws : null }); }   /* 含括號的小句直接照詞切（括號詞本身不換行），才能補行 */
      else words(c).forEach(function (x) { segs.push({ t: x, w: null }); });
    }
    return segs;
  }

  /* 2026-09-29 第三版：「小句不拆」會把整句推到下一行、上一行右邊空一大塊（/love「七天以後，」後空 15 字）。
     排好之後實際量：某一行右邊空 ≥ 3 個字、而下一行開頭那一小句還能照詞拆 → 只拆那一句，讓前面的詞補上來。
     拆的時候虛字黏合規則照舊，所以不會回到「卻不／知道」。只處理靠左對齊的段落。 */
  var SPLIT = new WeakMap(), touched = new Set();
  function prevCharRect(node, block) {
    var w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), n, prev = null;
    while ((n = w.nextNode()) && n !== node) if (n.nodeValue.trim()) prev = n;
    if (!prev) return null;
    var r = document.createRange(), v = prev.nodeValue, i = v.length;
    while (i > 0 && /\s/.test(v[i - 1])) i--;
    if (!i) return null;
    r.setStart(prev, i - 1); r.setEnd(prev, i);
    var rs = r.getClientRects(); return rs.length ? rs[rs.length - 1] : null;
  }
  function splitNode(node) {
    var ws = SPLIT.get(node); if (!ws) return;
    SPLIT.delete(node);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < ws.length; i++) {
      if (i) { var b = document.createElement('wbr'); b.setAttribute('data-cjk', ''); frag.appendChild(b); }
      appendSeg(frag, ws[i]);
    }
    node.parentNode.replaceChild(frag, node);
  }
  function refine() {
    var blocks = new Set();
    touched.forEach(function (n) { if (n.isConnected && n.parentElement) blocks.add(blockOf(n.parentElement)); });
    touched.clear();
    blocks.forEach(function (block) {
      var bcs = getComputedStyle(block);
      if (!/^(start|left|justify)$/.test(bcs.textAlign)) return;
      var right = block.getBoundingClientRect().right - (parseFloat(bcs.paddingRight) || 0) - (parseFloat(bcs.borderRightWidth) || 0);
      for (var pass = 0; pass < 6; pass++) {
        var changed = false, w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), n, cands = [];
        while ((n = w.nextNode())) if (SPLIT.has(n)) cands.push(n);
        for (var i = 0; i < cands.length; i++) {
          var node = cands[i], r = document.createRange(); r.selectNodeContents(node);
          var first = r.getClientRects()[0]; if (!first) continue;
          var pr = prevCharRect(node, block); if (!pr) continue;
          var fs = parseFloat(getComputedStyle(node.parentElement).fontSize) || 16;
          if (first.top > pr.top + pr.height / 2 && right - pr.right >= fs * 3) { splitNode(node); changed = true; break; }
        }
        if (!changed) break;
      }
      /* 孤字：最後一行只剩 ≤3 個字（不算標點）→ 把它前面那個斷點拿掉，跟前一個詞一起下去（最多兩次）。
         9/29 實測：補行之後出現「往前走的／可能。」「浮／上來。」「下／一步。」這種尾巴。 */
      for (var k = 0; k < 2; k++) {
        var tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), t, lastTop = -1, tops = [];
        while ((t = tw.nextNode())) {
          if (!t.nodeValue.trim()) continue;
          var rr = document.createRange(); rr.selectNodeContents(t);
          var rs = rr.getClientRects(); if (!rs.length) continue;
          tops.push({ n: t, top: rs[0].top, lastTop: rs[rs.length - 1].top, h: rs[0].height });
          lastTop = Math.max(lastTop, rs[rs.length - 1].top);
        }
        if (tops.length < 2) break;
        var onLast = tops.filter(function (x) { return x.top >= lastTop - x.h / 2; });
        var firstLine = tops[0].top;
        if (!onLast.length || onLast[0].top <= firstLine + onLast[0].h / 2) break;   /* 只有一行 */
        var lastText = onLast.map(function (x) { return x.n.nodeValue; }).join('').replace(/[，。、；：？！）」』》〉…,.;:?!()（「『《\s⁠]/g, '');   /* Word Joiner 不算字 */
        if (lastText.length > 3) break;
        var head = onLast[0].n, before = head.previousSibling;
        if (!(before && before.nodeName === 'WBR' && before.hasAttribute('data-cjk'))) break;
        /* 黏之前量：前一段＋這一段合起來超過一行寬就不黏——否則會變成一整塊比一行長、被硬切（9/29「怎麼／辦？」） */
        var prevT = before.previousSibling;
        if (!prevT || prevT.nodeType !== 3) break;
        var wOf = function (n) { var r = document.createRange(); r.selectNodeContents(n); var t = 0, rs = r.getClientRects(); for (var z = 0; z < rs.length; z++) t += rs[z].width; return t; };
        var bl = block.getBoundingClientRect().left + (parseFloat(bcs.paddingLeft) || 0);
        if (wOf(prevT) + wOf(head) > (right - bl) * 0.98) break;
        var par = before.parentNode; par.replaceChild(document.createTextNode(WJ), before); par.normalize();   /* 接縫補 WJ，正常換行模式下才不會在這裡斷 */
      }
    });
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
      if (SKIP[n.nodeName.toUpperCase()] || n.isContentEditable || (n.hasAttribute && n.hasAttribute('data-nocjk')) || (n.classList && n.classList.contains('cjk-nb'))) return true;
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
    if (v.indexOf('\u2060') >= 0) { v = v.replace(/\u2060/g, ''); node.nodeValue = v; }
    parent.classList.add('cjk');
    /* 數字＋中文單位（30 分鐘、7 天）黏住：空白換成不斷行空白 */
    if (/\d\s+[\u3400-\u9fff]/.test(v)) { v = v.replace(/(\d)\s+(?=[\u3400-\u9fff])/g, '$1\u00a0'); node.nodeValue = v; }
    var joinPrev = inlineSib(node, -1) && !/^[，。、；：？！…」』）》〉,.;:?!\s]/.test(v);
    var joinNext = inlineSib(node, 1);
    if (!joinPrev && !joinNext && parent !== blockOf(parent)) { joinPrev = inlineSib(parent, -1); joinNext = inlineSib(parent, 1); }
    var segs = plan(v, cplOf(parent), joinPrev, joinNext);
    if (segs.length < 2) { node.nodeValue = glue(v); if (segs[0] && segs[0].w) { SPLIT.set(node, segs[0].w); touched.add(node); } return; }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < segs.length; i++) {
      if (i) { var w = document.createElement('wbr'); w.setAttribute('data-cjk', ''); frag.appendChild(w); }
      var tn = appendSeg(frag, segs[i].t);
      if (segs[i].w) { SPLIT.set(tn, segs[i].w); touched.add(tn); }
    }
    parent.replaceChild(frag, node);
  }

  /* WebKit（iPhone）即使 keep-all 也會在開頭括號後面換行（「一句「／愛不愛」」），Chrome 不會。
     短引號詞（≤8 字）整組包不換行；長的至少讓開頭括號跟第一個字綁住。用 span 不插隱形字，textContent 不變。 */
  /* 9/29 第四版：WebKit（iPhone）在 word-break:keep-all 下不照標點規則換行（開括號後、句號前照斷；實測 46 處），
     Word Joiner、nowrap span 都擋不乾淨（span 邊界反而變斷點）。改成：不用 keep-all，改 word-break:normal＋line-break:strict，
     詞裡面每兩個字之間插 Word Joiner（U+2060，Unicode 規定前後不可斷）→ 詞不會被切；詞與詞之間 <wbr>；
     標點前後能不能斷交回瀏覽器的標準規則。實測三種做法標點錯位 46／0／0。 */
  var WJ = '\u2060';
  function glue(t) {
    var a = Array.from(t), o = '';
    for (var i = 0; i < a.length; i++) {
      var c = a[i], p = i ? a[i - 1] : '';
      if (i && !/\s/.test(p) && !/\s/.test(c) && !/[\u200D\uFE0E\uFE0F\u20E3\u2060]/.test(c) && p !== '\u200D' && p !== WJ) o += WJ;
      o += c;
    }
    return o;
  }
  function appendSeg(frag, text) { var tn = document.createTextNode(glue(text)); frag.appendChild(tn); return tn; }

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
    refine();
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
    var nb = document.querySelectorAll('span.cjk-nb');
    for (var q = 0; q < nb.length; q++) { var pp = nb[q].parentNode; if (parents.indexOf(pp) < 0) parents.push(pp); pp.replaceChild(document.createTextNode(nb[q].textContent), nb[q]); }
    for (var k = 0; k < parents.length; k++) parents[k].normalize();
    process(document.body);
    refine();
    observe();
  }

  function injectCss() {
    if (document.getElementById('cjk-wrap-css')) return;
    var st = document.createElement('style'); st.id = 'cjk-wrap-css';
    st.textContent = '.cjk{word-break:normal!important;line-break:strict!important;overflow-wrap:anywhere!important}';
    (document.head || document.documentElement).appendChild(st);
  }

  var started = false;
  function start() {
    if (started) { redo(); return; }
    started = true;
    process(document.body);
    refine();
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
