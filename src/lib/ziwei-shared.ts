// 紫微斗數：正式紫微頁（/ziwei）與老師排盤工具（/teacher-ziwei）共用的型別、常數與畫命盤／走勢／四化的函式。
// 2026-11-05 從兩頁各一份抽出來（原本逐字相同）；兩頁不同的部分（登入、解讀呼叫、showResult）仍留在各自頁面。
// 縮排刻意保留兩格（原樣搬自頁面 <script>）：函式裡的 HTML 樣板字串含縮排，改縮排會改到輸出的 HTML。

  export const FOCUS_PALACES = ['summary', '命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'];
  export const PALACE_LABEL: Record<string, string> = {
    summary: '整體格局',
    '命宮': '命宮（自我）',
    '兄弟': '兄弟宮（手足平輩）',
    '夫妻': '夫妻宮（伴侶）',
    '子女': '子女宮（子女晚輩）',
    '財帛': '財帛宮（金錢）',
    '疾厄': '疾厄宮（健康身體）',
    '遷移': '遷移宮（外出機遇）',
    '僕役': '僕役宮（朋友人脈）',
    '官祿': '官祿宮（事業）',
    '田宅': '田宅宮（家庭財庫）',
    '福德': '福德宮（精神）',
    '父母': '父母宮（原生家庭）',
  };

  export type Star = { name: string; type?: string; brightness: string; mutagen: string };
  export type AdjStar = { name: string };
  export type Palace = {
    index: number; name: string;
    heavenlyStem: string; earthlyBranch: string;
    isBodyPalace: boolean; isOriginalPalace?: boolean;
    majorStars: Star[]; minorStars: Star[]; adjectiveStars: AdjStar[];
    decadal: { range: [number, number]; heavenlyStem: string; earthlyBranch: string };
    changsheng12?: string;
  };
  export type Chart = { meta: any; palaces: Palace[] };
  export type HoroscopeItem = {
    index: number; name: string;
    heavenlyStem: string; earthlyBranch: string;
    palaceNames: string[]; mutagen: string[];
  };
  export type TrendDecadal = { index: number; ageStart: number; ageEnd: number; stem: string; branch: string; palaceName: string; mutagen: string[]; score: number; isCurrent: boolean };
  export type TrendYearly = { year: number; age: number; mutagen: string[]; score: number; isCurrent: boolean };
  export type ZiweiTrend = { decadal: TrendDecadal[]; yearly: { ageStart: number; ageEnd: number; years: TrendYearly[] }; currentAge: number; currentYear: number; currentDecadalIndex: number };
  export type SihuaTransform = { type: string; star: string; toIndex: number; toPalace: string; isSelf: boolean };
  export type SihuaPalaceFly = { fromIndex: number; fromPalace: string; stem: string; transforms: SihuaTransform[] };
  export type ZiweiSihua = { flies: SihuaPalaceFly[]; selfTransforms: { palaceIndex: number; palace: string; type: string; star: string }[] };
  export type Horoscope = {
    date: string; lunarDate: string;
    decadal: HoroscopeItem;
    age: HoroscopeItem & { nominalAge: number };
    yearly: HoroscopeItem & { yearlyDecStar?: any };
    monthly: HoroscopeItem;
    daily: HoroscopeItem;
    trend?: ZiweiTrend | null;
    sihua?: ZiweiSihua | null;
  };

  // 化星顏色（繁中 key 對齊 worker setLanguage('zh-TW') 輸出）
  export const MUTAGEN_COLOR: Record<string, string> = {
    '祿': 'mutagen-lu', '權': 'mutagen-quan', '科': 'mutagen-ke', '忌': 'mutagen-ji',
  };
  // 化星 bg/fg（對齊 DS ziwei-page.jsx MUT_COLOR；四化飛星 chip + 自化角標共用）
  export const MUT_VAL: Record<string, { bg: string; fg: string }> = {
    '祿': { bg: 'var(--sage-200)', fg: 'var(--sage-500)' }, '權': { bg: 'var(--gold-300)', fg: 'var(--gold-500)' },
    '科': { bg: 'var(--rose-100)', fg: 'var(--rose-600)' }, '忌': { bg: 'var(--tint-rose-soft)', fg: 'var(--critical)' },
  };
  // Design 定稿 MUT_COLOR（四化飛星區塊用；對齊 LIFF 雙生 + sihua-design.jsx）
  export const MUT_COLOR: Record<string, { bg: string; fg: string }> = {
    '祿': { bg: 'var(--sage-200)', fg: 'var(--sage-500)' }, '權': { bg: 'var(--gold-300)', fg: 'var(--gold-500)' },
    '科': { bg: 'var(--rose-100)', fg: 'var(--rose-600)' }, '忌': { bg: 'var(--tint-rose-soft)', fg: 'var(--critical)' },
  };
  export const MUT_ORDER = ['祿', '權', '科', '忌'];
  // 內聯 SVG 圖示（currentColor 驅動，對齊 LIFF 雙生頁，不依賴 Phosphor）
  export const ICON_ARROW_RIGHT = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M3 8h8.5M8.5 4l3.5 4-3.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  export const ICON_SELF_LOOP = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M13 12V9a4 4 0 0 0-4-4H3.5M6 2 2.5 5 6 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  export const ICON_SELF_LOOP_SM = '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M13 12V9a4 4 0 0 0-4-4H3.5M6 2 2.5 5 6 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  export const ICON_INFO = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" style="flex:none"><circle cx="8" cy="8" r="6.4" stroke="currentColor" stroke-width="1.3"/><path d="M8 7.3v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5.2" r="0.9" fill="currentColor"/></svg>';
  export const ICON_LOCK_OPEN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><rect x="3" y="7.3" width="10" height="6.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7.3V5a2.5 2.5 0 0 1 4.9-.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  // 副星依類型上色（對齊 share.ts / ziwei-page.jsx：六煞紅、桃花玫瑰、其餘鼠尾草綠）
  export const TOUGH = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);
  export const FLOWER = new Set(['紅鸞', '天喜', '天姚', '咸池', '大耗']);
  export const starColor = (name: string, kind: 'major' | 'minor') => kind === 'major' ? 'var(--ink-900)' : TOUGH.has(name) ? 'var(--critical)' : FLOWER.has(name) ? 'var(--rose-500)' : 'var(--sage-500)';

  // 12 地支 → 4×4 grid
  export const BRANCH_POS: Record<string, [number, number]> = {
    '巳': [0, 0], '午': [0, 1], '未': [0, 2], '申': [0, 3],
    '辰': [1, 0],                              '酉': [1, 3],
    '卯': [2, 0],                              '戌': [2, 3],
    '寅': [3, 0], '丑': [3, 1], '子': [3, 2], '亥': [3, 3],
  };

  // 計算當事人虛歲（中州派紫微大限以虛歲計算）
  // 虛歲 = 西元當前年 - 西元出生年 + 1
  export function calcVirtualAge(birthSolarDate: string): number {
    const [by] = birthSolarDate.split('-').map(Number);
    return new Date().getFullYear() - by + 1;
  }

  export function renderChart(chart: Chart, mount: HTMLElement, horoscope?: Horoscope | null, mode: 'natal' | 'yearly' = 'natal') {
    const grid: Array<Palace | null> = Array(16).fill(null);
    for (const p of chart.palaces) {
      const pos = BRANCH_POS[p.earthlyBranch];
      if (pos) grid[pos[0] * 4 + pos[1]] = p;
    }

    // 2026-09-28（Codex 體檢）：用西元年相減，農曆年前出生的人會差一歲、標錯大限 → 有後端算的虛歲就用它
    const currentAge = horoscope?.age?.nominalAge ?? calcVirtualAge(chart.meta.solarDate);
    // 找當前大限所在的 palace index
    let currentDecadalIndex = -1;
    for (const p of chart.palaces) {
      if (p.decadal && currentAge >= p.decadal.range[0] && currentAge <= p.decadal.range[1]) {
        currentDecadalIndex = p.index;
        break;
      }
    }

    // 流年模式準備：palaceNames[index] = 該本命 index 在流年的宮名
    // 流年化星 mutagen[0,1,2,3] 對應 [祿, 權, 科, 忌]
    const yearly = mode === 'yearly' && horoscope ? horoscope.yearly : null;
    const yearlyMutagenMap: Record<string, string> = {};
    if (yearly) {
      const labels = ['祿', '權', '科', '忌'];
      yearly.mutagen.forEach((star, i) => { if (star) yearlyMutagenMap[star] = labels[i]; });
    }
    // 自化標記（本命固定，僅本命盤顯示）
    const selfMark: Record<number, string[]> = {};
    if (mode === 'natal' && horoscope?.sihua?.selfTransforms) {
      for (const s of horoscope.sihua.selfTransforms) (selfMark[s.palaceIndex] = selfMark[s.palaceIndex] || []).push(s.type);
    }

    // 2026-09-28（Codex 體檢）：姓名是客人輸入、API 原樣回傳，直接進 innerHTML＝XSS
    const zwEsc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
    const cells = grid.map((cell, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;

      // 中宮 2x2 — DS ZiweiChart 中宮（inline styles，免 Astro scoped 注入問題）
      if (row === 1 && col === 1) {
        const m = chart.meta;
        const mobile = window.matchMedia('(max-width:760px)').matches;
        const yearStr = horoscope ? horoscope.date.split('-')[0] : String(new Date().getFullYear());
        const emphB = `font-family:var(--font-serif);font-weight:500;color:var(--ink-900)`;
        const nameLine = m.name
          ? `<div style="font-family:var(--font-serif);font-size:${mobile ? 15 : 21}px;font-weight:600;color:var(--ink-900);text-align:center">${zwEsc(m.name)}</div>`
          : '';
        return `<div style="grid-row: 2 / 4; grid-column: 2 / 4;background:linear-gradient(155deg, var(--rose-50), var(--paper));border:1px solid var(--rose-100);border-radius:${mobile ? 10 : 14}px;padding:${mobile ? '10px 9px' : '16px 18px'};display:flex;flex-direction:column;justify-content:center">
          ${nameLine}
          <div style="font-family:var(--font-sans);font-size:${mobile ? 8.5 : 10}px;letter-spacing:0.02em;color:var(--accent-press);text-align:center;margin:${mobile ? '2px 0 8px' : '3px 0 12px'}">${m.gender} · ${mode === 'yearly' ? yearStr + ' 流年盤' : '本命盤'}</div>
          <div style="display:flex;flex-direction:column;gap:${mobile ? 3 : 5}px;font-family:var(--font-sans);font-size:${mobile ? 9.5 : 12}px;color:var(--ink-700)">
            <div><span style="color:var(--text-muted);margin-right:${mobile ? 4 : 6}px">國曆</span>${m.solarDate} ${m.time}</div>
            <div><span style="color:var(--text-muted);margin-right:${mobile ? 4 : 6}px">農曆</span>${m.lunarGZ || m.lunarDate}</div>
            <div><span style="color:var(--text-muted);margin-right:${mobile ? 4 : 6}px">八字</span><span style="font-family:var(--font-serif);letter-spacing:0.08em;color:var(--ink-900)">${m.chineseDate}</span></div>
          </div>
          <div style="height:1px;background:var(--rose-100);margin:${mobile ? '8px 0' : '12px 0'}"></div>
          <div style="font-family:var(--font-serif);font-size:${mobile ? 11 : 14}px;font-weight:500;color:var(--rose-600);text-align:center;margin-bottom:${mobile ? 6 : 10}px">${m.sign} · 屬${m.zodiac} · ${m.fiveElementsClass}</div>
          <div style="display:flex;flex-direction:column;gap:${mobile ? 3 : 5}px;font-family:var(--font-sans);font-size:${mobile ? 9.5 : 12}px;color:var(--ink-700);text-align:center">
            <div><span style="color:var(--text-muted);margin-right:4px">命主</span><b style="${emphB}">${m.soul}</b>　<span style="color:var(--text-muted);margin-right:4px">身主</span><b style="${emphB}">${m.body}</b></div>
            <div><span style="color:var(--text-muted);margin-right:4px">命宮</span><b style="${emphB}">${m.earthlyBranchOfSoulPalace}宮</b>　<span style="color:var(--text-muted);margin-right:4px">身宮</span><b style="${emphB}">${m.earthlyBranchOfBodyPalace}宮</b></div>
          </div>
        </div>`;
      }
      if ((row === 1 && col === 2) || (row === 2 && col === 1) || (row === 2 && col === 2)) return '';
      if (!cell) return '<div class="palace-cell empty"></div>';

      const renderStar = (s: Star, kind: 'major' | 'minor') => {
        const yearlyTag = yearlyMutagenMap[s.name];
        return `<div class="star ${kind}">
          <span class="star-name" style="color:${starColor(s.name, kind)}">${s.name}</span>
          ${s.brightness ? `<span class="star-brightness">${s.brightness}</span>` : ''}
          ${s.mutagen ? `<span class="star-mutagen ${MUTAGEN_COLOR[s.mutagen] || ''}">化${s.mutagen}</span>` : ''}
          ${yearlyTag ? `<span class="star-mutagen yearly-mutagen ${MUTAGEN_COLOR[yearlyTag] || ''}">流${yearlyTag}</span>` : ''}
        </div>`;
      };
      const majors = cell.majorStars.map((s) => renderStar(s, 'major')).join('');
      const minors = cell.minorStars.map((s) => renderStar(s, 'minor')).join('');
      // 雜星收摺：cell 內顯示「+N」徽章，click 展開 popover 浮在 cell 上方
      const adjList = cell.adjectiveStars;
      const adjRow = adjList.length ? `<div class="adj-row">${adjList.map(s => `<span class="adj" style="color:${FLOWER.has(s.name) ? 'var(--rose-500)' : 'var(--text-muted)'}">${s.name}</span>`).join('')}</div>` : '';
      const flowers = adjList.filter(s => FLOWER.has(s.name));
      const others = adjList.filter(s => !FLOWER.has(s.name));
      const adjMobile = adjList.length ? `<div class="adj-mobile">${flowers.map(s => `<span class="adj-fl">${s.name}</span>`).join('')}${others.length ? `<span class="adj-more">+${others.length}雜</span>` : ''}</div>` : '';
      const adj = adjRow + adjMobile;
      const empty = cell.majorStars.length === 0 && cell.minorStars.length === 0 ? '<span class="empty-palace">空宮</span>' : '';

      const isCurrentDecadal = cell.index === currentDecadalIndex;
      const yearlyName = yearly ? yearly.palaceNames[cell.index] : null;
      const isYearlySoul = yearly ? cell.index === yearly.index : false;

      // 自化角落徽記（critical 圓底 + ↺ self-loop；本命固定，僅本命盤一格一枚）
      const hasSelf = (selfMark[cell.index] || []).length > 0;
      const selfBadge = hasSelf
        ? `<span class="cell-self-badge" title="自化（化星落回本宮）" style="position:absolute;right:-4px;bottom:-4px;width:17px;height:17px;border-radius:999px;background:var(--critical);color:var(--text-on-accent);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-xs);z-index:3">${ICON_SELF_LOOP_SM}</span>`
        : '';

      return `<div class="palace-cell ${cell.isBodyPalace ? 'is-body' : ''} ${cell.isOriginalPalace ? 'is-origin' : ''} ${isCurrentDecadal ? 'is-current-decadal' : ''} ${isYearlySoul ? 'is-yearly-soul' : ''}" data-palace-index="${cell.index}">
        ${isCurrentDecadal && mode === 'natal' ? '<div class="current-decadal-badge">目前大限</div>' : ''}
        ${isYearlySoul && mode === 'yearly' ? '<div class="yearly-soul-badge">流年命宮</div>' : ''}
        <div class="cell-header">
          <span class="palace-name">${cell.name}${cell.isBodyPalace ? '<em class="body-tag">身</em>' : ''}</span>
          <span class="cell-stem-branch">${cell.heavenlyStem}${cell.earthlyBranch}</span>
        </div>
        <div class="cell-stars">
          ${empty}${majors}${minors}${adj}
        </div>
        <div class="cell-footer">
          <span>${yearlyName
            ? `<span class="yearly-footer">流年・${yearlyName}</span>`
            : (cell.decadal ? `<span class="decadal">大限 ${cell.decadal.range[0]}-${cell.decadal.range[1]}</span>` : '')}</span>
          ${cell.changsheng12 ? `<span class="cs">${cell.changsheng12}</span>` : ''}
        </div>
        ${selfBadge}
      </div>`;
    }).join('');

    mount.innerHTML = `<div class="ziwei-chart"><div class="ziwei-grid">${cells}</div></div>`;

    // 三方四正 hover
    const cellsEl = mount.querySelectorAll<HTMLElement>('.palace-cell[data-palace-index]');
    cellsEl.forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const idx = Number(cell.dataset.palaceIndex);
        const trines = new Set([idx, (idx + 6) % 12, (idx + 4) % 12, (idx + 8) % 12]);
        cellsEl.forEach(c => {
          const i = Number(c.dataset.palaceIndex);
          c.classList.toggle('trine-highlight', trines.has(i) && i !== idx);
          c.classList.toggle('trine-focus', i === idx);
        });
      });
      cell.addEventListener('mouseleave', () => {
        cellsEl.forEach(c => c.classList.remove('trine-highlight', 'trine-focus'));
      });
    });

    // 手機點宮位 → 底部詳情卡（對齊 DS ziwei-page.jsx ZiweiSheet）
    mount.addEventListener('click', (ev) => {
      if (!window.matchMedia('(max-width:760px)').matches) return;   // 2026-09-28（Codex 體檢）：與 CSS 收合雜曜的 760px 同一個斷點
      const cellEl = (ev.target as HTMLElement).closest<HTMLElement>('.palace-cell');
      if (!cellEl || cellEl.classList.contains('empty')) return;
      const idx = Number(cellEl.dataset.palaceIndex);
      const p = chart.palaces.find(x => x.index === idx);
      if (p) openZiweiSheet(p, mode, yearly);
    });
  }

  export function openZiweiSheet(p: Palace, mode: 'natal' | 'yearly', yearly: (HoroscopeItem & { nominalAge?: number }) | null) {
    const ymap: Record<string, string> = {};
    if (yearly && yearly.mutagen) yearly.mutagen.forEach((n, i) => { if (n) ymap[n] = ['祿', '權', '科', '忌'][i]; });
    const bigStar = (s: Star, kind: 'major' | 'minor') => {
      const mc = MUT_VAL[s.mutagen], yt = ymap[s.name], yc = MUT_VAL[yt];
      return `<span class="zs-star ${kind}"><span class="zs-name" style="color:${starColor(s.name, kind)}">${s.name}</span>${s.brightness ? `<span class="zs-br">${s.brightness}</span>` : ''}${s.mutagen && mc ? `<span class="zs-mut" style="background:${mc.bg};color:${mc.fg}">化${s.mutagen}</span>` : ''}${yt && yc ? `<span class="zs-mut" style="border:1px solid ${yc.fg};color:${yc.fg};background:transparent">流${yt}</span>` : ''}</span>`;
    };
    const yName = yearly ? yearly.palaceNames[p.index] : null;
    const title = (mode === 'yearly' && yName) ? yName : p.name;
    const sub = (mode === 'yearly' ? `本${p.name} · ` : '') + p.heavenlyStem + p.earthlyBranch;
    const nMajor = p.majorStars.length;
    const main = [...p.majorStars, ...p.minorStars];
    const mainHtml = main.length ? main.map((s, i) => bigStar(s, i < nMajor ? 'major' : 'minor')).join('') : '<span class="zs-empty">（無主星，借對宮）</span>';
    const adjHtml = p.adjectiveStars.map(a => `<span class="zs-adj" style="color:${FLOWER.has(a.name) ? 'var(--rose-500)' : 'var(--text-muted)'}">${a.name}</span>`).join('');
    const foot = `大限 ${p.decadal ? p.decadal.range[0] + '–' + p.decadal.range[1] : '—'} 歲　·　長生十二神「${p.changsheng12 || '—'}」`;
    let host = document.getElementById('zw-sheet-host');
    if (!host) { host = document.createElement('div'); host.id = 'zw-sheet-host'; document.body.appendChild(host); }
    host.innerHTML = `<div class="zw-scrim" data-close></div><div class="zw-sheet"><div class="zw-handle"></div><div class="zw-title">${title}<span class="zw-sub">${sub}</span></div><div class="zw-stars">${mainHtml}</div>${adjHtml ? `<div class="zw-adjs">${adjHtml}</div>` : ''}<div class="zw-foot">${foot}</div></div>`;
    host.querySelector('[data-close]')!.addEventListener('click', () => { host!.innerHTML = ''; });
  }

  export function renderInterpretationSkeleton(mount: HTMLElement, mode: 'natal' | 'yearly', year?: number) {
    const title = mode === 'yearly' ? `${year} 年流年深度解讀` : '命盤深度解讀';
    const blocks = FOCUS_PALACES.map(p => `
      <article class="interp-block" data-palace="${p}" data-mode="${mode}">
        <h3>${PALACE_LABEL[p]}</h3>
        <div class="interp-text loading">解讀生成中…</div>
      </article>`).join('');
    mount.innerHTML = `<section class="interpretation-section">
      <h2>${title}</h2>
      ${blocks}
    </section>`;
  }

  // YearlyContext for backend
  export function buildYearlyContextForApi(horoscope: Horoscope) {
    return {
      year: parseInt(horoscope.date.split('-')[0]),
      yearlyHeavenlyStem: horoscope.yearly.heavenlyStem,
      yearlyEarthlyBranch: horoscope.yearly.earthlyBranch,
      yearlyPalaceNames: horoscope.yearly.palaceNames,
      yearlyMutagen: horoscope.yearly.mutagen,
      decadalHeavenlyStem: horoscope.decadal.heavenlyStem,
      decadalEarthlyBranch: horoscope.decadal.earthlyBranch,
      decadalPalaceNames: horoscope.decadal.palaceNames,
      nominalAge: horoscope.age.nominalAge,
    };
  }

  export function renderPalaceText(palace: string, text: string | null, mount: HTMLElement) {
    // trend/sihua 區塊 data-palace 與 .interp-text 在同一元素；12 宮則為父子關係 — 兩者都要命中
    const block = mount.querySelector(`[data-palace="${palace}"].interp-text`)
      || mount.querySelector(`[data-palace="${palace}"] .interp-text`);
    if (!block) return;
    block.classList.remove('loading');
    if (text) {
      block.textContent = text;
    } else {
      block.classList.add('error');
      const failed = '此段生成失敗，';
      block.innerHTML = `${failed}<button class="retry-palace" data-palace="${palace}">重試</button>`;
    }
  }

  // 主入口：根據 chartData 渲染結果區（共用 newly-created / already-existing 路徑）
  // === Design TrendChart（trArea/trHalo 漸層 + 順逆標 + 區域柔光 + 0 基準 + 目前點光暈/引線/氣泡）===
  export function trendSvg(pts: { label: string; sub: string; score: number; cur: boolean }[], _which: string): string {
    const mobile = window.matchMedia('(max-width:760px)').matches;
    const W = 680, H = mobile ? 210 : 240, padL = 30, padR = 30, padT = 30, padB = 48;
    const n = pts.length; if (!n) return '';
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const X = (i: number) => padL + (n === 1 ? innerW / 2 : innerW * i / (n - 1));
    const Y = (s: number) => padT + innerH * (1 - (s + 100) / 200);
    const zeroY = Y(0), botY = padT + innerH;
    const co = pts.map((p, i) => ({ x: X(i), y: Y(p.score), label: p.label, sub: p.sub, score: p.score, cur: p.cur }));
    // 柔曲線（Catmull-Rom → 三次貝茲，合品牌調性）
    let line = co.length ? `M${co[0].x.toFixed(1)},${co[0].y.toFixed(1)}` : '';
    for (let i = 0; i < co.length - 1; i++) {
      const p0 = co[i - 1] || co[i], p1 = co[i], p2 = co[i + 1], p3 = co[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      line += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    const area = line ? `${line} L${co[n - 1].x.toFixed(1)},${botY.toFixed(1)} L${co[0].x.toFixed(1)},${botY.toFixed(1)} Z` : '';
    const cur = co.find((c) => c.cur);
    const curBlock = cur ? `<g>`
      + `<line x1="${cur.x.toFixed(1)}" y1="${cur.y.toFixed(1)}" x2="${cur.x.toFixed(1)}" y2="${botY.toFixed(1)}" stroke="var(--rose-300)" stroke-width="1" stroke-dasharray="2 3"/>`
      + `<circle cx="${cur.x.toFixed(1)}" cy="${cur.y.toFixed(1)}" r="18" fill="url(#trHalo)"/>`
      + `<g transform="translate(${cur.x.toFixed(1)}, ${(cur.y - 24).toFixed(1)})"><rect x="-19" y="-15" width="38" height="20" rx="10" fill="var(--accent)"/><text x="0" y="-1" text-anchor="middle" style="font-family:var(--font-sans);font-size:11px;font-weight:700;fill:var(--text-on-accent)">${cur.score > 0 ? '+' + cur.score : cur.score}</text></g>`
      + `</g>` : '';
    const points = co.map((c) => {
      const r = c.cur ? 5 : 3;
      const dot = `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${c.cur ? 'var(--accent)' : 'var(--paper)'}" stroke="var(--accent)" stroke-width="${c.cur ? 2.2 : 1.8}"/>`;
      const lab = `<text x="${c.x.toFixed(1)}" y="${H - 26}" text-anchor="middle" style="font-family:var(--font-sans);font-size:${mobile ? 9 : 10.5}px;fill:${c.cur ? 'var(--rose-600)' : 'var(--text-muted)'};font-weight:${c.cur ? 700 : 400}">${c.label}</text>`;
      const sub = c.sub ? `<text x="${c.x.toFixed(1)}" y="${H - 12}" text-anchor="middle" style="font-family:var(--font-sans);font-size:${mobile ? 8 : 9.5}px;fill:var(--text-muted)">${c.sub}</text>` : '';
      return dot + lab + sub;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="trend-svg" role="img" aria-label="運勢走勢線">`
      + `<defs>`
      + `<linearGradient id="trArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--rose-400)" stop-opacity="0.22"/><stop offset="100%" stop-color="var(--rose-400)" stop-opacity="0"/></linearGradient>`
      + `<radialGradient id="trHalo" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="var(--rose-400)" stop-opacity="0.30"/><stop offset="100%" stop-color="var(--rose-400)" stop-opacity="0"/></radialGradient>`
      + `</defs>`
      + `<text x="${padL}" y="${padT - 12}" style="font-family:var(--font-sans);font-size:10px;fill:var(--sage-400)">順</text>`
      + `<text x="${padL}" y="${botY + 14}" style="font-family:var(--font-sans);font-size:10px;fill:var(--text-muted)">逆</text>`
      + (area ? `<path d="${area}" fill="url(#trArea)"/>` : '')
      + `<line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" stroke="var(--rose-200)" stroke-width="1" stroke-dasharray="3 4"/>`
      + `<text x="${W - padR}" y="${(zeroY - 5).toFixed(1)}" text-anchor="end" style="font-family:var(--font-sans);font-size:9.5px;fill:var(--text-muted)">0</text>`
      + `<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
      + curBlock
      + points
      + `</svg>`;
  }

  // 一顆四化星：MutChip + 星名 + 飛向（自化以記號標示）
  export function sihuaFlyStar(t?: { ty: string; star: string; to: string; self: boolean }): string {
    if (!t) return '';
    const c = MUT_COLOR[t.ty] || { bg: 'var(--ink-500)', fg: 'var(--text-on-accent)' };
    const chip = `<span style="font-family:var(--font-sans);font-size:9.5px;font-weight:700;padding:1px 4px;border-radius:4px;line-height:1.4;background:${c.bg};color:${c.fg}">${t.ty}</span>`;
    const star = `<span style="font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--ink-900)">${t.star}</span>`;
    const tail = t.self
      ? `<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-sans);font-size:12px;font-weight:600;color:var(--critical)"><span style="display:inline-flex;color:var(--critical)">${ICON_SELF_LOOP}</span>自化</span>`
      : `<span style="display:inline-flex;align-items:center;gap:2px;font-family:var(--font-sans);font-size:12.5px;color:var(--accent-press)"><span style="display:inline-flex;color:var(--accent-press)">${ICON_ARROW_RIGHT}</span>${t.to}</span>`;
    return `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:var(--radius-sm);white-space:nowrap;background:${t.self ? 'var(--tint-rose-soft)' : 'var(--surface-sunken)'};border:1px solid ${t.self ? 'var(--rose-200)' : 'transparent'}">${chip}${star}${tail}</span>`;
  }
  // 一宮的飛星：宮名 + 天干圓盤 + 四顆化星（命宮列最突出）
  export function sihuaPalaceFlight(f: { from: string; stem: string; ming: boolean; t: { ty: string; star: string; to: string; self: boolean }[] }): string {
    const hasSelf = f.t.some((t) => t.self);
    // GlyphDisc 內聯（flex none, radius-md, font-serif 置中）
    const disc = `<span style="flex:none;width:34px;height:34px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:16px;line-height:1;color:${f.ming ? 'var(--rose-600)' : 'var(--accent-press)'};background:${f.ming ? 'var(--rose-50)' : 'var(--paper)'};border:1px solid ${f.ming ? 'var(--rose-200)' : 'var(--rose-100)'}">${f.stem}</span>`;
    const head = `<div class="ds-flight-head" style="flex:none;display:flex;align-items:center;gap:10px">${disc}<div><div class="ds-flight-from" style="font-family:var(--font-serif);font-size:16px;font-weight:600;color:${f.ming ? 'var(--rose-600)' : 'var(--ink-900)'}">${f.from}</div><div style="font-family:var(--font-sans);font-size:10.5px;color:var(--text-muted);margin-top:1px">${f.stem}干引動${hasSelf ? ' · 含自化' : ''}</div></div></div>`;
    const grid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex:1">${MUT_ORDER.map((ty) => sihuaFlyStar(f.t.find((x) => x.ty === ty))).join('')}</div>`;
    return `<div class="ds-flight${f.ming ? ' is-ming' : ''}" style="display:flex;flex-direction:column;gap:10px;padding:14px 14px;border-radius:var(--radius-md);background:${f.ming ? 'linear-gradient(120deg,var(--rose-50),var(--paper))' : 'var(--surface-card)'};border:1px solid ${f.ming ? 'var(--rose-300)' : 'var(--border-soft)'};box-shadow:${f.ming ? 'var(--shadow-sm)' : 'none'}">${head}${grid}</div>`;
  }
  // 圖例 + 自化角落徽記示範
  export function sihuaLegend(): string {
    const meaning: Record<string, string> = { '祿': '順與得', '權': '力與成', '科': '名與貴', '忌': '執與守' };
    const items = MUT_ORDER.map((ty) => {
      const c = MUT_COLOR[ty];
      return `<span style="display:inline-flex;align-items:center;gap:5px"><span style="font-family:var(--font-sans);font-size:9.5px;font-weight:700;padding:1px 4px;border-radius:4px;background:${c.bg};color:${c.fg}">${ty}</span><span style="font-family:var(--font-sans);font-size:12px;color:var(--text-secondary)">${meaning[ty]}</span></span>`;
    }).join('');
    return `<div style="background:var(--surface-tint);border:1px solid var(--rose-100);border-radius:var(--radius-lg);padding:16px 16px;display:flex;flex-wrap:wrap;gap:14px 18px;align-items:center;margin-top:4px"><div style="display:flex;gap:12px;flex-wrap:wrap">${items}</div>`
      + `<div style="display:flex;align-items:center;gap:10px"><div style="position:relative;width:40px;height:40px;border-radius:8px;background:var(--surface-card);border:1px solid var(--border-soft);flex:none"><span style="position:absolute;top:4px;left:5px;font-family:var(--font-serif);font-size:12px;color:var(--ink-700)">天同</span><span style="position:absolute;right:-5px;bottom:-5px;width:17px;height:17px;border-radius:999px;background:var(--critical);color:var(--text-on-accent);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-xs)">${ICON_SELF_LOOP_SM}</span></div><span style="font-family:var(--font-sans);font-size:12px;line-height:1.6;color:var(--text-secondary)">自化＝化星落回本宮<br>命盤格以角落小徽記標示</span></div></div>`;
  }
