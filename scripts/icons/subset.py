#!/usr/bin/env python3
# 把 Phosphor 圖示字型縮到「全站用得到的圖示」：讀 scripts/icons/full/ 的完整版，
# 產出 src/styles/phosphor-*.css 與 src/assets/phosphor/*.woff2。
# 加了新圖示、建置被 check.mjs 擋下來時跑：
#   pip install fonttools brotli && python3 scripts/icons/subset.py
import json, os, re, subprocess, sys
from fontTools import subset

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FULL = os.path.join(ROOT, 'scripts', 'icons', 'full')
WEIGHTS = {  # css 檔: (class 前綴, 字型檔)
    'phosphor-regular.css': ('.ph', 'Phosphor.woff2'),
    'phosphor-thin.css': ('.ph-thin', 'Phosphor-Thin.woff2'),
    'phosphor-bold.css': ('.ph-bold', 'Phosphor-Bold.woff2'),
    'phosphor-fill.css': ('.ph-fill', 'Phosphor-Fill.woff2'),
}

used = set(subprocess.check_output(['node', os.path.join(ROOT, 'scripts', 'icons', 'used.mjs')], text=True).split())
rule = re.compile(r'(\.ph(?:-[a-z]+)?)\.ph-([a-z0-9-]+):before \{\s*content: "\\([0-9a-f]+)";\s*\}\n?')
os.makedirs(os.path.join(ROOT, 'src', 'assets', 'phosphor'), exist_ok=True)
missing_all = None

for css_name, (prefix, font) in WEIGHTS.items():
    src = open(os.path.join(FULL, css_name), encoding='utf8').read()
    head = src[:rule.search(src).start()]
    keep, codes, known = [], [], set()
    for m in rule.finditer(src):
        known.add(m.group(2))
        if m.group(2) in used:
            keep.append(m.group(0) if m.group(0).endswith('\n') else m.group(0) + '\n')
            codes.append(int(m.group(3), 16))
    missing = used - known
    missing_all = missing if missing_all is None else missing_all & missing
    note = f'/* 自動產生：scripts/icons/subset.py（只留全站用到的 {len(keep)} 個圖示；完整版在 scripts/icons/full/）。別手改。 */\n'
    open(os.path.join(ROOT, 'src', 'styles', css_name), 'w', encoding='utf8').write(note + head + ''.join(keep))
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = []; opts.name_IDs = ['*']; opts.notdef_outline = True
    f = subset.load_font(os.path.join(FULL, font), opts)
    s = subset.Subsetter(opts); s.populate(unicodes=codes); s.subset(f)
    subset.save_font(f, os.path.join(ROOT, 'src', 'assets', 'phosphor', font), opts)
    print(css_name, len(keep), 'icons')

# 名稱長得像圖示、但 Phosphor 沒有的（多半是一般字，例如 ph-xxx 的樣式 class），列出來看一下就好
if missing_all: print('不是 Phosphor 圖示（略過）:', ' '.join(sorted(missing_all)))
open(os.path.join(ROOT, 'scripts', 'icons', 'kept.json'), 'w').write(json.dumps(sorted(used - (missing_all or set())), indent=0) + '\n')
