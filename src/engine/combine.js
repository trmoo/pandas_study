// © 2026 티쳐무 · 모든 권리 보유
// 표 합치기·재구성 — pd.merge · pd.concat · pivot_table · pd.crosstab · pd.to_datetime · pd.to_numeric
// 결과의 줄 차례·열 차례·dtype 을 pandas 2.2 와 같게 맞췄다(test/golden.json 으로 대조).
import { Num, Tuple, Dict, PyError, NotSupported, parseArgs, REQUIRED, toNumber, str as pyStr, typeName, strRepr, pyInt } from './pyvalues.js';
import { DataFrame, Series, Index, MultiIndex, isMissing, valueKey, isIntD, boxLabel } from './pandas.js';
import { DT, Timestamp, parseDate, parseWithFormat, NaT, needsDateutil } from './datetime.js';
import { NDArray } from './ndarray.js';

const lab = (v) => (v instanceof Num ? v.v : v instanceof Timestamp ? v.ms : v);
const listOf = (v) => (v == null ? null : Array.isArray(v) ? v.map(lab) : v instanceof Tuple ? v.items.map(lab) : [lab(v)]);
function checkCols(d, cols, side = '') {
  for (const c of cols) if (!(c in d.data)) throw new PyError('KeyError', typeof c === 'string' ? strRepr(c) : String(c), `${side}표에 '${c}' 열이 없습니다. 있는 열: ${d.columns.map((x) => `'${x}'`).join(', ')}`);
}
function cmp(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const x = String(a), y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}
// 정수 열에 빈칸이 생기면 실수 열이 된다
function settle(values, dtype) {
  if ((isIntD(dtype) || dtype === 'bool') && values.some((x) => typeof x === 'number' && Number.isNaN(x))) return 'float64';
  return dtype;
}

// ── pd.merge ─────────────────────────────────────────────────
export function mergeFrames(args, kw) {
  const o = parseArgs('merge', args, kw, [['left', REQUIRED], ['right', REQUIRED], ['how', 'inner'], ['on', null], ['left_on', null], ['right_on', null],
    ['left_index', false], ['right_index', false], ['sort', false], ['suffixes', new Tuple(['_x', '_y'])], ['copy', null], ['indicator', false], ['validate', null]]);
  const L = o.left, R = o.right;
  if (!(L instanceof DataFrame) || !(R instanceof DataFrame)) throw new PyError('TypeError', `Can only merge Series or DataFrame objects, a ${typeName(R instanceof DataFrame ? L : R)} was passed`, '합칠 두 표(DataFrame)를 넣으세요.');
  if (o.left_index === true || o.right_index === true) throw new NotSupported("merge(left_index=True) — 이름표를 reset_index( ) 로 열로 꺼낸 뒤 on='열' 로 합치세요");
  if (o.indicator !== false) throw new NotSupported('merge(indicator=True)');
  const how = pyStr(o.how);
  if (!['inner', 'left', 'right', 'outer'].includes(how)) {
    throw new PyError('ValueError', `do not recognize join method ${how}`, "how 에는 'inner'·'left'·'right'·'outer' 가운데 하나를 씁니다.");
  }
  let lk, rk;
  if (o.on != null) { lk = rk = listOf(o.on); }
  else if (o.left_on != null || o.right_on != null) {
    if (o.left_on == null || o.right_on == null) throw new PyError('MergeError', 'Must pass "right_on" OR "right_index".', 'left_on 과 right_on 을 함께 적어야 합니다.');
    lk = listOf(o.left_on); rk = listOf(o.right_on);
  } else {
    lk = rk = L.columns.filter((c) => R.columns.includes(c));
    if (!lk.length) throw new PyError('MergeError', `No common columns to perform merge on. Merge options: left_on=None, right_on=None, left_index=False, right_index=False`, "두 표에 이름이 같은 열이 없습니다. on='열' 이나 left_on·right_on 으로 짝지을 열을 알려 주세요.");
  }
  checkCols(L, lk, '왼쪽 '); checkCols(R, rk, '오른쪽 ');
  const same = lk.map((c, i) => c === rk[i]);
  const keyOf = (d, cols, i) => JSON.stringify(cols.map((c) => valueKey(d.dtypes[c] === DT ? new Timestamp(d.data[c][i]) : d.data[c][i])));
  const rIndex = new Map();
  for (let j = 0; j < R.nrows; j++) { const key = keyOf(R, rk, j); if (!rIndex.has(key)) rIndex.set(key, []); rIndex.get(key).push(j); }
  const lIndex = new Map();
  for (let i = 0; i < L.nrows; i++) { const key = keyOf(L, lk, i); if (!lIndex.has(key)) lIndex.set(key, []); lIndex.get(key).push(i); }
  const pairs = []; // [왼쪽 줄 또는 -1, 오른쪽 줄 또는 -1]
  if (how === 'inner' || how === 'left') {
    for (let i = 0; i < L.nrows; i++) {
      const m = rIndex.get(keyOf(L, lk, i));
      if (m) m.forEach((j) => pairs.push([i, j])); else if (how === 'left') pairs.push([i, -1]);
    }
  } else if (how === 'right') {
    for (let j = 0; j < R.nrows; j++) {
      const m = lIndex.get(keyOf(R, rk, j));
      if (m) m.forEach((i) => pairs.push([i, j])); else pairs.push([-1, j]);
    }
  } else {
    // outer — 열쇠 값으로 정렬한다
    const keys = new Map();
    for (let i = 0; i < L.nrows; i++) { const k = keyOf(L, lk, i); if (!keys.has(k)) keys.set(k, lk.map((c) => L.data[c][i])); }
    for (let j = 0; j < R.nrows; j++) { const k = keyOf(R, rk, j); if (!keys.has(k)) keys.set(k, rk.map((c) => R.data[c][j])); }
    const sorted = [...keys.entries()].sort((p, q) => { for (let t = 0; t < p[1].length; t++) { const c = cmp(p[1][t], q[1][t]); if (c) return c; } return 0; });
    for (const [k] of sorted) {
      const li = lIndex.get(k) ?? [-1], rj = rIndex.get(k) ?? [-1];
      for (const i of li) for (const j of rj) pairs.push([i, j]);
    }
  }
  // 열 이름 — 겹치는 열(열쇠 제외)에는 꼬리표(_x, _y)
  const suf = o.suffixes instanceof Tuple ? o.suffixes.items.map(pyStr) : Array.isArray(o.suffixes) ? o.suffixes.map(pyStr) : ['_x', '_y'];
  const rKeysSame = new Set(rk.filter((c, t) => same[t]));
  const rCols = R.columns.filter((c) => !rKeysSame.has(c));
  const lKeySame = new Set(lk.filter((c, t) => same[t]));
  const overlap = new Set(L.columns.filter((c) => rCols.includes(c) && !lKeySame.has(c)));
  const cols = [], data = {}, dtypes = {};
  for (const c of L.columns) {
    const name = overlap.has(c) ? c + suf[0] : c;
    const t = lk.indexOf(c);
    const fromRight = t >= 0 && same[t] ? rk[t] : null;
    const vals = pairs.map(([i, j]) => (i >= 0 ? L.data[c][i] : fromRight != null && j >= 0 ? R.data[fromRight][j] : NaN));
    cols.push(name); data[name] = vals; dtypes[name] = settle(vals, L.dtypes[c]);
  }
  for (const c of rCols) {
    const name = overlap.has(c) ? c + suf[1] : c;
    if (name in data) throw new NotSupported(`merge 결과에 같은 이름의 열이 둘 생김(${name}) — suffixes 를 다르게 주세요`);
    const vals = pairs.map(([, j]) => (j >= 0 ? R.data[c][j] : NaN));
    cols.push(name); data[name] = vals; dtypes[name] = settle(vals, R.dtypes[c]);
  }
  return new DataFrame(cols, data, Index.range(pairs.length), dtypes);
}

// ── pd.concat ────────────────────────────────────────────────
export function concatFrames(args, kw) {
  const o = parseArgs('concat', args, kw, [['objs', REQUIRED], ['axis', pyInt(0)], ['join', 'outer'], ['ignore_index', false], ['keys', null], ['levels', null], ['names', null], ['verify_integrity', false], ['sort', false], ['copy', null]]);
  const objs = Array.isArray(o.objs) ? o.objs : o.objs instanceof Tuple ? o.objs.items : null;
  if (!objs) throw new PyError('TypeError', `first argument must be an iterable of pandas objects, you passed an object of type "${typeName(o.objs)}"`, '합칠 표들을 대괄호로 묶어 넣습니다. 예) pd.concat([표1, 표2])');
  if (!objs.length) throw new PyError('ValueError', 'No objects to concatenate');
  if (o.keys != null) throw new NotSupported('concat(keys=…)');
  const axis = o.axis instanceof Num ? o.axis.v : o.axis === 'columns' ? 1 : o.axis === 'index' ? 0 : o.axis;
  const join = pyStr(o.join);
  if (objs.every((x) => x instanceof Series) && axis === 0) {
    const dtypes = [...new Set(objs.map((x) => x.dtype))];
    const dtype = dtypes.length === 1 ? dtypes[0] : dtypes.every((d) => d === 'float64' || isIntD(d)) ? 'float64' : 'object';
    const vals = objs.flatMap((x) => (dtype === 'object' && x.dtype !== 'object' ? x.values.map((v) => boxLabel(v, x.dtype)) : x.values));
    const idx = o.ignore_index === true ? Index.range(vals.length) : new Index(objs.flatMap((x) => x.index.labels));
    const names = [...new Set(objs.map((x) => x.name))];
    return new Series(vals, idx, { name: names.length === 1 ? names[0] : null, dtype });
  }
  const frames = objs.map((x) => {
    if (x instanceof DataFrame) return x;
    if (x instanceof Series) { const nm = x.name ?? 0; return new DataFrame([nm], { [nm]: x.values }, x.index, { [nm]: x.dtype }); }
    throw new PyError('TypeError', `cannot concatenate object of type '${typeName(x)}'; only Series and DataFrame objs are valid`);
  });
  if (axis === 1) {
    const names = frames.flatMap((f) => f.columns);
    if (new Set(names).size !== names.length) throw new NotSupported('concat(axis=1) 으로 이름이 같은 열을 나란히 붙이기 — 한쪽 열 이름을 rename( ) 으로 바꾼 뒤 붙이세요');
    let labels = [];
    const seen = new Set();
    const allSame = frames.every((f) => f.index.equals(frames[0].index));
    if (allSame) labels = frames[0].index.labels;
    else if (join === 'inner') labels = frames[0].index.labels.filter((l) => frames.every((f) => f.index.has(l)));
    else frames.forEach((f) => f.index.labels.forEach((l) => { if (!seen.has(l)) { seen.add(l); labels.push(l); } }));
    const data = {}, dtypes = {};
    for (const f of frames) for (const c of f.columns) {
      const vals = labels.map((l) => { const p = f.index.pos(l); return p === undefined ? NaN : f.data[c][p]; });
      data[c] = vals; dtypes[c] = settle(vals, f.dtypes[c]);
    }
    const idx = allSame ? frames[0].index : new Index(labels, { name: frames[0].index.name });
    return new DataFrame(names, data, o.ignore_index === true ? Index.range(labels.length) : idx, dtypes);
  }
  let cols;
  if (join === 'inner') cols = frames[0].columns.filter((c) => frames.every((f) => f.columns.includes(c)));
  else { cols = []; for (const f of frames) for (const c of f.columns) if (!cols.includes(c)) cols.push(c); }
  const data = {}, dtypes = {};
  for (const c of cols) {
    const parts = frames.map((f) => (c in f.data ? { vals: f.data[c], dtype: f.dtypes[c] } : { vals: Array(f.nrows).fill(NaN), dtype: null }));
    const kinds = [...new Set(parts.filter((p) => p.dtype).map((p) => p.dtype))];
    const missing = parts.some((p) => !p.dtype);
    let dtype = kinds.length === 1 ? kinds[0] : kinds.every((d) => d === 'float64' || isIntD(d)) ? 'float64' : 'object';
    if (missing && (isIntD(dtype) || dtype === 'bool')) dtype = 'float64';
    data[c] = parts.flatMap((p) => (dtype === 'object' && p.dtype && p.dtype !== 'object' ? p.vals.map((v) => boxLabel(v, p.dtype)) : p.vals));
    dtypes[c] = dtype;
  }
  const n = frames.reduce((s, f) => s + f.nrows, 0);
  const idx = o.ignore_index === true ? Index.range(n) : new Index(frames.flatMap((f) => f.index.labels), { name: frames.every((f) => f.index.name === frames[0].index.name) ? frames[0].index.name : null });
  return new DataFrame(cols, data, idx, dtypes);
}

// ── pivot_table · crosstab ───────────────────────────────────
const PIVOT_AGG = ['mean', 'sum', 'count', 'min', 'max', 'median', 'std', 'var', 'size', 'nunique', 'first', 'last'];
export function pivotTable(args, kw) {
  const o = parseArgs('pivot_table', args, kw, [['data', REQUIRED], ['values', null], ['index', null], ['columns', null], ['aggfunc', 'mean'],
    ['fill_value', null], ['margins', false], ['dropna', true], ['margins_name', 'All'], ['observed', null], ['sort', true]]);
  const d = o.data;
  if (!(d instanceof DataFrame)) throw new PyError('TypeError', 'pivot_table 의 첫 값은 표(DataFrame)여야 합니다');
  if (o.margins === true) throw new NotSupported('pivot_table(margins=True)');
  let aggfunc = typeof o.aggfunc === 'string' ? o.aggfunc : o.aggfunc?.name === 'len' ? 'count' : o.aggfunc?.name;
  let perCol = null;
  if (Array.isArray(o.aggfunc)) throw new NotSupported("pivot_table(aggfunc=[…]) — 계산을 여러 개 쓰면 머리글이 두 줄인 표가 됩니다. 이 실습실에서는 aggfunc 에 'sum' 처럼 하나만 쓰세요");
  if (o.aggfunc instanceof Dict) {
    perCol = new Map([...o.aggfunc.map].map(([c, f]) => {
      if (typeof f !== 'string') throw new NotSupported("pivot_table(aggfunc={'열': [여러 계산]}) — 머리글이 두 줄인 표가 됩니다. 열마다 계산 하나씩만 쓰세요");
      return [lab(c), f];
    }));
    aggfunc = 'mean';
  }
  for (const f of perCol ? [...perCol.values()] : [aggfunc]) {
    if (!PIVOT_AGG.includes(f)) throw new PyError('AttributeError', `'SeriesGroupBy' object has no attribute '${f}'`, `aggfunc 에 쓸 수 있는 것: ${PIVOT_AGG.join(', ')}`);
  }
  const idxCols = listOf(o.index) ?? [];
  const colCols = listOf(o.columns) ?? [];
  if (!idxCols.length && !colCols.length) throw new PyError('ValueError', 'No group keys passed!', "index='열' 로 줄 기준을 알려 주세요.");
  if (colCols.length > 1) throw new NotSupported('pivot_table(columns=[여러 열])');
  checkCols(d, [...idxCols, ...colCols]);
  let vals = listOf(o.values);
  if (perCol && !vals) vals = [...perCol.keys()];
  if (perCol) vals = vals.filter((c) => perCol.has(c));
  if (vals) checkCols(d, vals);
  else vals = d.columns.filter((c) => !idxCols.includes(c) && !colCols.includes(c) && (aggfunc === 'count' || aggfunc === 'size' || d.dtypes[c] !== 'object'));
  if (colCols.length && vals.length > 1) throw new NotSupported('pivot_table(values=[여러 열], columns=…) — values 에는 열 하나만 쓰세요');
  const gb = d.getattr('groupby').fn([[...idxCols, ...colCols]], new Map());
  const g = gb.derive(vals, false);
  let red;
  if (perCol) {
    red = { data: {}, dtypes: {} };
    for (const c of vals) { const r = g.reduceColumn(c, perCol.get(c)); red.data[c] = r.values; red.dtypes[c] = r.dtype; }
  } else red = aggfunc === 'size' ? null : g.reduce(aggfunc === 'count' ? 'count' : aggfunc);
  const nk = idxCols.length;
  // 줄 이름표
  const rowMap = new Map();
  gb.tuples.forEach((t) => { const k = JSON.stringify(t.slice(0, nk)); if (!rowMap.has(k)) rowMap.set(k, t.slice(0, nk)); });
  const rows = [...rowMap.values()];
  const rowPos = new Map(rows.map((r, i) => [JSON.stringify(r), i]));
  const index = nk === 1 ? new Index(rows.map((r) => r[0]), { name: idxCols[0], dtype: d.dtypes[idxCols[0]] === 'object' ? null : d.dtypes[idxCols[0]] })
    : new MultiIndex(idxCols.map((c, j) => rows.map((r) => r[j])), { names: idxCols, dtypes: idxCols.map((c) => d.dtypes[c]) });
  const fill = o.fill_value == null ? null : toNumber(o.fill_value);
  if (!colCols.length) {
    const data = {}, dtypes = {};
    for (const c of vals) {
      data[c] = red.data[c]; dtypes[c] = red.dtypes[c];
    }
    // pivot_table 은 열 이름을 가나다순으로 늘어놓는다
    const sortedCols = [...vals].sort(cmp);
    return new DataFrame(sortedCols, data, index, dtypes);
  }
  const c0 = colCols[0];
  const colLabels = [...new Set(gb.tuples.map((t) => t[nk]))].sort(cmp);
  const v = vals[0];
  const data = {}, dtypes = {};
  for (const cl of colLabels) data[cl] = Array(rows.length).fill(NaN);
  gb.tuples.forEach((t, i) => { data[t[nk]][rowPos.get(JSON.stringify(t.slice(0, nk)))] = red.data[v][i]; });
  const anyNa = colLabels.some((cl) => data[cl].some((x) => Number.isNaN(x)));
  const base = red.dtypes[v];
  for (const cl of colLabels) {
    if (fill != null) data[cl] = data[cl].map((x) => (Number.isNaN(x) ? fill : x));
    dtypes[cl] = fill != null ? (isIntD(base) || base === 'bool' ? 'int64' : base === 'float64' && Number.isInteger(fill) && aggfunc !== 'mean' && data[cl].every(Number.isInteger) ? base : base) : anyNa && isIntD(base) ? 'float64' : base;
  }
  const out = new DataFrame(colLabels, data, index, dtypes);
  out.columnsName = c0;
  out.columnsDtype = d.dtypes[c0];
  return out;
}

export function crosstab(args, kw) {
  const o = parseArgs('crosstab', args, kw, [['index', REQUIRED], ['columns', REQUIRED], ['values', null], ['rownames', null], ['colnames', null], ['aggfunc', null], ['margins', false], ['normalize', false]]);
  if (!(o.index instanceof Series) || !(o.columns instanceof Series)) throw new NotSupported('crosstab(시리즈가 아닌 값)');
  if (o.values != null || o.margins !== false || o.normalize !== false) throw new NotSupported('crosstab(values·margins·normalize)');
  const a = o.index, b = o.columns;
  const rows = [...new Set(a.values.filter((x) => !isMissing(x)))].sort(cmp);
  const cols = [...new Set(b.values.filter((x) => !isMissing(x)))].sort(cmp);
  const rp = new Map(rows.map((r, i) => [r, i]));
  const data = {}, dtypes = {};
  for (const c of cols) { data[c] = Array(rows.length).fill(0); dtypes[c] = 'int64'; }
  a.values.forEach((x, i) => { const y = b.values[i]; if (isMissing(x) || isMissing(y)) return; data[y][rp.get(x)]++; });
  const out = new DataFrame(cols, data, new Index(rows, { name: a.name ?? 'row_0', dtype: a.dtype === 'object' ? null : a.dtype }), dtypes);
  out.columnsName = b.name ?? 'col_0';
  return out;
}

// ── pd.to_datetime · pd.to_numeric ───────────────────────────
// 서식 없이 읽은 첫 값의 모양 — 판다스는 첫 값으로 서식을 짐작해 나머지에 똑같이 쓴다
function guessFormat(s) {
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return '%Y-%m-%d';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t)) return '%Y-%m-%d %H:%M:%S';
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t)) return '%Y-%m-%d %H:%M';
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(t)) return '%Y/%m/%d';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return '%m/%d/%Y';
  return null;
}
export function toDatetime(args, kw, ctx) {
  const o = parseArgs('to_datetime', args, kw, [['arg', REQUIRED], ['errors', 'raise'], ['dayfirst', false], ['yearfirst', false], ['utc', false], ['format', null]]);
  const fmt = o.format == null ? null : pyStr(o.format);
  const coerce = pyStr(o.errors) === 'coerce';
  let inferred = null, warned = false;
  const helpTxt = (s) => `'${s}' 는 날짜로 읽을 수 없습니다. 모양이 낯선 날짜는 format='%Y년%m월%d일' 처럼 서식을 알려 주고, 날짜가 아닌 값이 섞였다면 errors='coerce' 로 그 칸을 NaT(빈 날짜)로 만드세요.`;
  const one = (x, pos, many) => {
    if (isMissing(x)) return NaN;
    if (x instanceof Timestamp) return x.ms;
    const s = x instanceof Num ? String(x.v) : typeof x === 'number' ? String(x) : String(x);
    if (!fmt && many && pos === 0) inferred = guessFormat(s);
    if (!fmt && many && !warned && needsDateutil(s)) { warned = true; ctx?.warn('UserWarning: Could not infer format, so each element will be parsed individually, falling back to `dateutil`. To ensure parsing is consistent and as-expected, please specify a format.'); }
    const ms = fmt ? parseWithFormat(s, fmt) : parseDate(s);
    if (ms === null) {
      if (coerce) return NaN;
      if (fmt || (many && inferred)) throw new PyError('ValueError', `time data "${s}" doesn't match format "${fmt ?? inferred}", at position ${pos}. You might want to try:`, helpTxt(s));
      if (/^\d{1,4}:\d{1,2}:\d{1,2}$/.test(s)) throw new PyError('DateParseError', `hour must be in 0..23: ${s}, at position ${pos}`, `「${s}」 처럼 쌍점(:)으로 이은 날짜는 시각으로 읽혀 버립니다. format='%Y:%m:%d' 처럼 서식을 알려 주세요.`);
      throw new PyError('DateParseError', `Unknown datetime string format, unable to parse: ${s}, at position ${pos}`, helpTxt(s));
    }
    return ms;
  };
  const a = o.arg;
  if (a instanceof Series) {
    if (a.dtype === DT) return new Series([...a.values], a.index, { name: a.name, dtype: DT });
    return new Series(a.values.map((x, i) => one(a.dtype === 'float64' || isIntD(a.dtype) ? (Number.isNaN(x) ? NaN : pyInt(x)) : x, i, true)), a.index, { name: a.name, dtype: DT });
  }
  if (typeof a === 'string' || a instanceof Num) { const ms = one(a, 0, false); return Number.isNaN(ms) ? NaT : new Timestamp(ms); }
  if (Array.isArray(a)) return new Index(a.map((x, i) => one(x, i, true)), { dtype: DT });
  throw new NotSupported(`pd.to_datetime(${typeName(a)})`);
}

export function toNumeric(args, kw) {
  const o = parseArgs('to_numeric', args, kw, [['arg', REQUIRED], ['errors', 'raise'], ['downcast', null]]);
  const coerce = pyStr(o.errors) === 'coerce';
  const a = o.arg;
  const one = (x, pos) => {
    if (isMissing(x)) return NaN;
    if (x instanceof Num) return x.v;
    if (typeof x === 'number') return x;
    if (typeof x === 'boolean') return x ? 1 : 0;
    const t = String(x).trim();
    const v = t === '' ? NaN : Number(t);
    if (Number.isNaN(v)) {
      if (coerce) return NaN;
      throw new PyError('ValueError', `Unable to parse string "${x}" at position ${pos}`, `'${x}' 는 수로 바꿀 수 없습니다. 수가 아닌 값을 빈칸(NaN)으로 만들려면 errors='coerce' 를 붙이세요.`);
    }
    return v;
  };
  if (a instanceof Series) {
    if (a.dtype !== 'object') return new Series([...a.values], a.index, { name: a.name, dtype: a.dtype });
    const vals = a.values.map((x, i) => one(x, i));
    const allInt = vals.every((x) => Number.isInteger(x));
    return new Series(vals, a.index, { name: a.name, dtype: allInt ? 'int64' : 'float64' });
  }
  if (typeof a === 'string') { const v = one(a, 0); return Number.isInteger(v) ? pyInt(v) : new Num(v, 'float'); }
  if (a instanceof Num) return a;
  throw new NotSupported(`pd.to_numeric(${typeName(a)})`);
}

export { NDArray };
