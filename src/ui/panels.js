// © 2026 티쳐무 · 모든 권리 보유
// 👀 눈으로 보기 — 코드가 표의 어느 칸을 고르고, 어떻게 묶고, 어떻게 짝짓는지 그림으로 보여 준다.
// 계산은 모두 실습실 엔진으로 진짜로 해서 보여 준다(그림과 코드 결과가 어긋나지 않게).
import { h, svg, fill } from '../lib/ui.js';
import { Kernel } from '../engine/interp.js';
import { DataFrame, Series, frameTable, renderSeries } from '../engine/pandas.js';
import { highlight, renderResult } from './output.js';

export function buildPanel(name, files) {
  const make = { locs: locPanel, groupby: groupbyPanel, merge: mergePanel }[name];
  if (!make) return h('div', {});
  return h('section', { class: 'panel' }, h('div', { class: 'panel-head' }, '👀 눈으로 보기'), make(files));
}

// ── loc · iloc 실험실 ────────────────────────────────────────
// 칸마다 「줄번호|열이름」 이 적힌 표에 같은 코드를 돌려, 결과에 남은 칸을 칠한다.
function locPanel(files) {
  const k = new Kernel({ files });
  k.run("import pandas as pd\ndf = pd.read_csv('menu.csv')\ndf2 = df.drop(0)");
  const df = k.env.get('df');
  // 칸마다 「이름표|열이름」 이 적힌 같은 모양의 표
  const tagOf = (d) => {
    const data = {}, dtypes = {};
    for (const c of d.columns) { data[c] = d.index.labels.map((l) => `${l}|${c}`); dtypes[c] = 'object'; }
    return new DataFrame([...d.columns], data, d.index, dtypes);
  };
  k.env.set('_tag', tagOf(df));
  k.env.set('_tag2', tagOf(k.env.get('df2')));
  const PRESETS = [
    ['df.loc[3]', '이름표 3 줄 전체'], ["df.loc[3, '가격']", '칸 하나'], ["df.loc[1:3, '메뉴':'가격']", 'loc 범위 — 끝 포함'],
    ['df.iloc[1:3, 0:2]', 'iloc 범위 — 끝 미포함'], ["df.loc[:, '칼로리']", '열 하나 전체'], ['df.iloc[:, 2]', '같은 열을 위치로'],
    ["df.loc[[0, 4, 8], ['메뉴', '칼로리']]", '띄엄띄엄'], ['df.iloc[-1]', '맨 끝 줄'], ['df[2:5]', '대괄호 범위 = 줄 위치'],
    ["df[['메뉴', '판매량']]", '열 이름 리스트'], ["df2.loc[1:3, '메뉴']", '0번 지운 df2 — loc'], ['df2.iloc[1:3, 0]', '0번 지운 df2 — iloc'],
  ];
  const input = h('input', { class: 'panel-input', type: 'text', spellcheck: 'false', value: PRESETS[2][0], 'aria-label': '고르기 코드' });
  const grid = h('div', { class: 'loc-grid' });
  const info = h('div', { class: 'panel-info' });
  const out = h('div', { class: 'panel-out' });
  const draw = () => {
    const code = input.value.trim();
    const useDf2 = /\bdf2\b/.test(code);
    const base = useDf2 ? k.env.get('df2') : df;
    const tagCode = code.replace(/\bdf2\b/g, '_tag2').replace(/\bdf\b/g, '_tag');
    const real = k.run(code);
    const tagged = k.run(tagCode);
    const picked = new Set();
    const v = tagged.error ? null : tagged.items.find((it) => it.kind === 'display')?.value;
    const collect = (x) => { if (typeof x === 'string' && x.includes('|')) picked.add(x); };
    if (v instanceof DataFrame) for (const c of v.columns) v.data[c].forEach(collect);
    else if (v instanceof Series) v.values.forEach(collect);
    else collect(v);
    // 표 그리기 — 고른 칸은 노랗게, 그 줄·열 머리는 진하게
    const rowsPicked = new Set([...picked].map((t) => t.split('|')[0]));
    const colsPicked = new Set([...picked].map((t) => t.split('|')[1]));
    const head = h('tr', {}, h('th', { class: 'pos' }, '위치'), h('th', {}, '이름표'), ...base.columns.map((c, j) => h('th', { class: colsPicked.has(c) ? 'on' : '' }, h('span', { class: 'colpos' }, j), String(c))));
    const body = base.index.labels.map((lab, i) => h('tr', {},
      h('td', { class: 'pos' }, i), h('th', { class: rowsPicked.has(String(lab)) ? 'on' : '' }, String(lab)),
      ...base.columns.map((c) => h('td', { class: picked.has(`${lab}|${c}`) ? 'pick' : '' }, String(base.data[c][i])))));
    fill(grid, h('table', { class: 'loc-table' }, h('thead', {}, head), h('tbody', {}, body)));
    fill(info, real.error ? '' : h('span', {}, `고른 칸 ${picked.size}개 · 줄 ${rowsPicked.size}개 × 열 ${colsPicked.size}개`,
      useDf2 ? h('span', { class: 'sub' }, ' — df2 는 0번 줄(떡볶이)을 지운 표라서 이름표와 위치가 한 칸씩 어긋납니다') : ''));
    fill(out, renderResult(real));
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') draw(); });
  const presets = h('div', { class: 'presets' }, PRESETS.map(([c, label]) => h('button', { class: 'btn small', onClick: () => { input.value = c; draw(); }, title: label }, h('code', {}, c))));
  queueMicrotask(draw);
  return h('div', { class: 'panel-body' },
    h('p', {}, '코드를 고르거나 직접 고쳐 Enter 를 누르면, 표에서 고른 칸이 노랗게 칠해집니다. 왼쪽 「위치」는 iloc 이 세는 번호, 「이름표」는 loc 이 쓰는 이름입니다.'),
    presets, h('div', { class: 'panel-row' }, input, h('button', { class: 'btn run', onClick: draw }, '▶ 칠하기')), info, grid,
    h('details', { class: 'panel-result' }, h('summary', {}, '실행 결과 보기'), out));
}

// ── groupby — 쪼개고 · 계산하고 · 합치기 ──────────────────────
const PALETTE = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa'];
function groupbyPanel(files) {
  const k = new Kernel({ files });
  k.run("import pandas as pd\ndf = pd.read_csv('menu.csv')");
  const df = k.env.get('df');
  const sel = (opts, val) => h('select', { class: 'panel-select' }, opts.map((o) => h('option', { value: o, selected: o === val }, o)));
  const byS = sel(['분류', '매운맛'], '분류');
  const colS = sel(['가격', '칼로리', '판매량'], '가격');
  const fnS = sel(['mean', 'sum', 'max', 'min', 'count'], 'mean');
  const codeBox = h('pre', { class: 'code small' });
  const stage = h('div', { class: 'gb-stage' });
  const draw = () => {
    const by = byS.value, col = colS.value, fn = fnS.value;
    const code = `df.groupby('${by}')['${col}'].${fn}()`;
    fill(codeBox, highlight(code));
    const r = k.run(code);
    const res = r.items.find((it) => it.kind === 'display')?.value;
    const keys = [...new Set(df.data[by])].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const color = (key) => PALETTE[keys.indexOf(key) % PALETTE.length];
    const orig = h('table', { class: 'gb-table' }, h('thead', {}, h('tr', {}, h('th', {}, '메뉴'), h('th', {}, by), h('th', {}, col))),
      h('tbody', {}, df.index.labels.map((_, i) => h('tr', { style: { background: color(df.data[by][i]) } }, h('td', {}, df.data['메뉴'][i]), h('td', {}, String(df.data[by][i])), h('td', { class: 'num' }, String(df.data[col][i]))))));
    const groups = h('div', { class: 'gb-groups' }, keys.map((key) => {
      const rows = df.index.labels.map((_, i) => i).filter((i) => df.data[by][i] === key);
      return h('div', { class: 'gb-group', style: { background: color(key) } }, h('div', { class: 'gb-key' }, `${by} = ${key}`),
        h('div', { class: 'gb-vals' }, rows.map((i) => String(df.data[col][i])).join(', ')),
        h('div', { class: 'gb-fn' }, `→ ${fn}( ) = `, h('strong', {}, res instanceof Series ? renderValue(res, keys.indexOf(key)) : '')));
    }));
    const result = h('div', { class: 'gb-result' }, res ? h('pre', { class: 'out result' }, renderSeries(res)) : renderResult(r));
    fill(stage,
      h('div', { class: 'gb-step' }, h('div', { class: 'gb-title' }, '① 원래 표 — 무리마다 색칠'), orig),
      h('div', { class: 'gb-arrow' }, '➜'),
      h('div', { class: 'gb-step' }, h('div', { class: 'gb-title' }, '② 쪼개서 무리마다 계산'), groups),
      h('div', { class: 'gb-arrow' }, '➜'),
      h('div', { class: 'gb-step' }, h('div', { class: 'gb-title' }, '③ 합친 결과 (시리즈)'), result));
  };
  [byS, colS, fnS].forEach((s) => s.addEventListener('change', draw));
  queueMicrotask(draw);
  return h('div', { class: 'panel-body' },
    h('p', {}, '묶을 열 · 계산할 열 · 계산을 바꿔 보세요. groupby 는 표를 무리로 쪼개고(split), 무리마다 계산하고(apply), 결과를 하나로 합칩니다(combine).'),
    h('div', { class: 'panel-row' }, h('label', {}, '묶을 열 ', byS), h('label', {}, '계산할 열 ', colS), h('label', {}, '계산 ', fnS)),
    codeBox, stage);
}
function renderValue(s, i) {
  const x = s.values[i];
  if (typeof x !== 'number') return String(x);
  return Number.isInteger(x) ? String(x) : x.toFixed(2);
}

// ── merge — how 네 가지 ─────────────────────────────────────
function mergePanel(files) {
  const k = new Kernel({ files });
  k.run("import pandas as pd\norder = pd.DataFrame({'메뉴': ['김밥', '라면', '순대', '떡볶이'], '수량': [3, 2, 1, 4]})\nprice = pd.DataFrame({'메뉴': ['김밥', '라면', '떡볶이', '식혜'], '가격': [3500, 4000, 4500, 2000]})");
  const L = k.env.get('order'), R = k.env.get('price');
  const lkeys = new Set(L.data['메뉴']), rkeys = new Set(R.data['메뉴']);
  const kind = (m) => (lkeys.has(m) && rkeys.has(m) ? 'both' : lkeys.has(m) ? 'left' : 'right');
  const hows = ['inner', 'left', 'right', 'outer'];
  let how = 'inner';
  const btns = h('div', { class: 'presets' });
  const stage = h('div', { class: 'mg-stage' });
  const small = (d, title) => h('div', { class: 'mg-side' }, h('div', { class: 'gb-title' }, title),
    h('table', { class: 'gb-table' }, h('thead', {}, h('tr', {}, d.columns.map((c) => h('th', {}, c)))),
      h('tbody', {}, d.index.labels.map((_, i) => h('tr', { class: `mg-${kind(d.data['메뉴'][i])}` }, d.columns.map((c) => h('td', {}, String(d.data[c][i]))))))));
  const venn = (sel) => {
    const on = (part) => ({ inner: ['both'], left: ['left', 'both'], right: ['right', 'both'], outer: ['left', 'both', 'right'] }[sel].includes(part));
    return svg('svg', { viewBox: '0 0 240 130', class: 'venn', role: 'img', 'aria-label': `how=${sel} 그림` },
      svg('defs', {}, svg('clipPath', { id: 'clipL' }, svg('circle', { cx: 90, cy: 62, r: 52 }))),
      svg('circle', { cx: 90, cy: 62, r: 52, class: on('left') ? 'v-on' : 'v-off' }),
      svg('circle', { cx: 150, cy: 62, r: 52, class: on('right') ? 'v-on' : 'v-off' }),
      svg('circle', { cx: 150, cy: 62, r: 52, 'clip-path': 'url(#clipL)', class: on('both') ? 'v-on2' : 'v-off2' }),
      svg('circle', { cx: 90, cy: 62, r: 52, class: 'v-line' }), svg('circle', { cx: 150, cy: 62, r: 52, class: 'v-line' }),
      svg('text', { x: 66, y: 66, class: 'v-txt', 'text-anchor': 'middle' }, '순대'),
      svg('text', { x: 120, y: 50, class: 'v-txt', 'text-anchor': 'middle' }, '김밥'),
      svg('text', { x: 120, y: 65, class: 'v-txt', 'text-anchor': 'middle' }, '라면'),
      svg('text', { x: 120, y: 80, class: 'v-txt', 'text-anchor': 'middle' }, '떡볶이'),
      svg('text', { x: 174, y: 66, class: 'v-txt', 'text-anchor': 'middle' }, '식혜'),
      svg('text', { x: 70, y: 126, class: 'v-lab' }, 'order'), svg('text', { x: 140, y: 126, class: 'v-lab' }, 'price'));
  };
  const draw = () => {
    fill(btns, hows.map((x) => h('button', { class: `btn small ${x === how ? 'primary' : ''}`, onClick: () => { how = x; draw(); } }, `how='${x}'`)));
    const code = `pd.merge(order, price, on='메뉴', how='${how}')`;
    const r = k.run(code);
    const res = r.items.find((it) => it.kind === 'display')?.value;
    const resTable = res instanceof DataFrame ? h('table', { class: 'gb-table' }, h('thead', {}, h('tr', {}, res.columns.map((c) => h('th', {}, c)))),
      h('tbody', {}, res.index.labels.map((_, i) => h('tr', { class: `mg-${kind(res.data['메뉴'][i])}` }, res.columns.map((c) => h('td', {}, Number.isNaN(res.data[c][i]) ? 'NaN' : String(res.data[c][i]))))))) : renderResult(r);
    fill(stage, small(L, '왼쪽 order'), small(R, '오른쪽 price'),
      h('div', { class: 'mg-side' }, h('div', { class: 'gb-title' }, '어떤 열쇠가 남나'), venn(how)),
      h('div', { class: 'mg-side' }, h('div', { class: 'gb-title' }, h('code', {}, code)), resTable));
  };
  queueMicrotask(draw);
  return h('div', { class: 'panel-body' },
    h('p', {}, 'how 단추를 눌러 보세요. 초록은 양쪽에 다 있는 메뉴, 파랑은 왼쪽에만(순대), 분홍은 오른쪽에만(식혜) 있는 메뉴입니다.'),
    btns, stage);
}
