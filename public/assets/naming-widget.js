// naming-widget.js — 姓名學分析前端 widget
// 用法：在結果區放 <div id="namingSection"></div>，然後呼叫 renderNamingWidget()
// 依賴：WORKER_API 全域變數（已在 index.html / delivery.html 定義）

(function () {
  'use strict';

  // 生日 → 生肖（簡易版，用農曆年 mod 12）
  var ZODIAC_LIST = ['猴', '雞', '狗', '豬', '鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊'];
  function getZodiacFromYear(year) {
    if (!year || year < 1900) return null;
    return ZODIAC_LIST[year % 12];
  }

  // 五行 → 顏色 class
  var ELEMENT_COLORS = {
    '木': '#2d8a4e', '火': '#c44230', '土': '#8b6914',
    '金': '#b08d57', '水': '#2563eb'
  };

  // 渲染免費版
  function renderFreeVersion(data, container) {
    var fg = data.five_grid;
    var grids = [
      { label: '天格', data: fg.tian },
      { label: '人格', data: fg.ren },
      { label: '地格', data: fg.di },
      { label: '外格', data: fg.wai },
      { label: '總格', data: fg.zong }
    ];

    var html = '<div class="naming-widget">';
    html += '<div class="naming-header">📝 姓名學分析</div>';
    html += '<div class="naming-divider"></div>';

    // 字 → 筆畫 + 五行
    html += '<div class="naming-chars">';
    data.characters.forEach(function (c) {
      var color = ELEMENT_COLORS[c.five_element] || '#474747';
      var badge = c.source === 'fallback' ? ' <span class="naming-fallback">⚡推算</span>' : '';
      html += '<span class="naming-char-item">';
      html += '<span class="naming-char-big">' + c.char + '</span>';
      html += '<span class="naming-char-info">' + c.stroke + '畫 <span style="color:' + color + '">' + c.five_element + '</span>' + badge + '</span>';
      html += '</span>';
    });
    html += '</div>';

    // 五格表
    html += '<div class="naming-grid-table">';
    grids.forEach(function (g) {
      var fortune = g.data.fortune || '—';
      var isGood = fortune.indexOf('吉') >= 0;
      var cls = isGood ? 'naming-fortune-good' : 'naming-fortune-bad';
      html += '<div class="naming-grid-row">';
      html += '<span class="naming-grid-label">' + g.label + '</span>';
      html += '<span class="naming-grid-stroke">' + g.data.grid_stroke + '畫</span>';
      if (g.data.element) html += '<span class="naming-grid-element" style="color:' + (ELEMENT_COLORS[g.data.element] || '#474747') + '">' + g.data.element + '</span>';
      html += '<span class="' + cls + '">' + fortune + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // 分數
    var scoreClass = data.composite_score >= 80 ? 'naming-score-high' : (data.composite_score >= 50 ? 'naming-score-mid' : 'naming-score-low');
    html += '<div class="naming-score-wrap">';
    html += '<span class="naming-score-label">綜合分數</span>';
    html += '<span class="naming-score ' + scoreClass + '">' + data.composite_score + '</span>';
    html += '<span class="naming-score-max">/ 100</span>';
    html += '</div>';

    // 三才 key
    html += '<div class="naming-sancai-key">三才配置：' + data.san_cai_key + '</div>';

    // 付費提示（免費版）
    if (data.is_free) {
      html += '<div class="naming-paywall">';
      html += '<div class="naming-paywall-text">🔒 解鎖完整報告：三才解讀 + 靈符推薦 + 生肖命中分析</div>';
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // 渲染付費完整版（在免費版基礎上追加）
  function renderFullVersion(data, container) {
    renderFreeVersion(data, container);

    var widget = container.querySelector('.naming-widget');
    if (!widget) return;

    // 移除 paywall
    var paywall = widget.querySelector('.naming-paywall');
    if (paywall) paywall.remove();

    var extra = '';

    // 三才解讀
    if (data.san_cai) {
      var sc = data.san_cai;
      extra += '<div class="naming-sancai-detail">';
      extra += '<div class="naming-section-title">🌀 三才解讀（' + data.san_cai_key + '）</div>';
      if (sc.modern_content) extra += '<div class="naming-sancai-text">' + sc.modern_content + '</div>';
      if (sc.tags && sc.tags.length) {
        extra += '<div class="naming-tags">';
        sc.tags.forEach(function (t) { extra += '<span class="naming-tag">#' + t + '</span>'; });
        extra += '</div>';
      }
      if (sc.recommended_talisman_category) {
        extra += '<div class="naming-talisman">✨ 推薦靈符：<strong>' + sc.recommended_talisman_category + '</strong>';
        if (sc.talisman_reason) extra += ' — ' + sc.talisman_reason;
        extra += '</div>';
      }
      extra += '</div>';
    }

    // 生肖命中
    if (data.zodiac_analysis) {
      var za = data.zodiac_analysis;
      extra += '<div class="naming-zodiac">';
      extra += '<div class="naming-section-title">🐾 生肖喜忌（' + za.zodiac + '）</div>';
      extra += '<div class="naming-zodiac-hits">';
      za.hits.forEach(function (h) {
        var emoji = h.preference === 'better' ? '✅' : (h.preference === 'worse' ? '❌' : '⚪');
        var label = h.preference === 'better' ? '喜用' : (h.preference === 'worse' ? '忌用' : '中性');
        extra += '<span class="naming-zodiac-hit">' + emoji + ' ' + h.char + '（' + label + '）</span>';
      });
      extra += '</div>';
      extra += '</div>';
    }

    widget.insertAdjacentHTML('beforeend', extra);
  }

  // 主函式：呼叫 API 並渲染
  window.renderNamingWidget = function (options) {
    var container = document.getElementById(options.containerId || 'namingSection');
    if (!container) return;

    var surname = (options.surname || '').trim();
    var givenName = (options.givenName || '').trim();
    if (!surname || !givenName) return;

    var workerApi = options.workerApi || (typeof WORKER_API !== 'undefined' ? WORKER_API : 'https://api.winds.tw');
    var fullAccess = !!options.fullAccess;

    // 從出生年推生肖
    var zodiac = null;
    if (options.birthYear) {
      zodiac = getZodiacFromYear(parseInt(options.birthYear));
    }

    var body = {
      surname: surname,
      given_name: givenName,
      full_access: fullAccess
    };
    if (zodiac) body.zodiac = zodiac;

    container.innerHTML = '<div style="text-align:center;color:var(--winds-text-muted,#999);font-size:13px;padding:16px;">📝 姓名學分析中...</div>';

    fetch(workerApi + '/api/naming/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) {
          container.innerHTML = '';
          return;
        }
        if (fullAccess) {
          renderFullVersion(data, container);
        } else {
          renderFreeVersion(data, container);
        }
      })
      .catch(function () {
        container.innerHTML = '';
      });
  };
})();
