// © 2026 티쳐무 · 모든 권리 보유
// pandas 흉내 — Index · Series · DataFrame.
// 이 수업(데이터 수집 → 결측치 → 이상치 → 정규화)에 나오는 명령어와,
// 학생이 궁금해서 쳐 볼 만한 이웃 명령어를 중심으로 만들었다.
//
// ★ 코랩(pandas 2.2)과 같게 동작하도록 한 중요한 점 두 가지
//  1) df.열이름 · df['열이름'] 으로 꺼낸 Series 는 DataFrame 과 같은 배열을 함께 쓴다.
//     그래서 penguins.bill_length_mm.fillna(mean1, inplace=True) 가 penguins 원본을 바꾼다.
//     (pandas 3 에서는 원본이 안 바뀐다 — 그래서 FutureWarning 경고가 함께 뜬다.)
//  2) 평균·표준편차·백분위수를 numpy 와 같은 순서로 계산해 마지막 자리까지 맞춘다.
import {
  Num, f64, i64, i32, npBool, pyInt, pyFloatNum, Tuple, Dict, PyFunc, PyError, NotSupported,
  parseArgs, REQUIRED, toNumber, isNumberLike, str as pyStr, repr as pyRepr, typeName, strRepr,
} from './pyvalues.js';
import { TD, Timedelta, boxTd, formatTds, PERIODS, PERIOD_OLD } from './datetime.js';
import { DT, Timestamp, NaT, DateOnly, dateOperand, boxDate, formatDates, fmtFull, parseDate, field as dtField, DT_FIELDS, DAYS, MONTHS, strftime } from './datetime.js';
import {
  pandasFloatColumn, pandasFloatSingle, pairwiseSum, percentileSorted, center, sizeof, fixed,
} from './numfmt.js';
import { NDArray, roundHalfEven } from './ndarray.js';
import { mergeFrames, pivotTable } from './combine.js';

const NUMERIC = new Set(['float64', 'int64', 'int32', 'bool']);
// 정수 dtype — pandas 2.2 에서 날짜.dt.month 같은 것은 int32 로 나온다
export const isIntD = (d) => d === 'int64' || d === 'int32';

// ─────────────────────────────────────────────────────────────
// Index — 줄 이름표(0, 1, 2 …) 또는 열 이름표
// ─────────────────────────────────────────────────────────────
// pandas.io.formats.printing.format_object_summary (display.width 80, 100개까지)
function objectSummary(items, name, justify, width = 80) {
  const space1 = '\n' + ' '.repeat(name.length + 1), space2 = '\n' + ' '.repeat(name.length + 2);
  const n = items.length;
  if (n === 0) return '[], ';
  if (n === 1) return `[${items[0]}], `;
  if (n === 2) return `[${items[0]}, ${items[1]}], `;
  const rstripLen = (s) => s.replace(/\s+$/, '').length;
  const extend = (summary, line, value, w) => {
    if (rstripLen(line) + rstripLen(value) >= w) { summary += line.replace(/\s+$/, ''); line = space2; }
    return [summary, line + value];
  };
  let tail = items;
  if (justify && !(tail.join(', ').length < width)) { const m = Math.max(...tail.map((x) => x.length)); tail = tail.map((x) => x.padStart(m)); }
  let summary = '', line = space2;
  for (const t of tail.slice(0, -1)) [summary, line] = extend(summary, line, t + ', ', width);
  [summary, line] = extend(summary, line, tail[tail.length - 1], width - 2);
  summary += line + '],';
  summary += summary.length > width ? space1 : ' ';
  return '[' + summary.slice(space2.length);
}

export class Index {
  constructor(labels, { isRange = false, name = null, dtype = null } = {}) {
    this.labels = labels; this.isRange = isRange; this.name = name; this._dtype = dtype; this._pos = null;
  }
  get pyType() { return this.isRange ? 'RangeIndex' : this.dtype === DT ? 'DatetimeIndex' : 'Index'; }
  get length() { return this.labels.length; }
  get nlevels() { return 1; }
  static range(n, start = 0) { return new Index(Array.from({ length: n }, (_, i) => start + i), { isRange: true }); }
  get dtype() {
    if (this._dtype) return this._dtype;
    if (this.labels.length && this.labels.every((x) => typeof x === 'number')) return this.labels.every(Number.isInteger) ? 'int64' : 'float64';
    return this.labels.length ? 'object' : 'object';
  }

  pos(label) {
    if (!this._pos) { this._pos = new Map(); this.labels.forEach((l, i) => { if (!this._pos.has(l)) this._pos.set(l, i); }); }
    return this._pos.get(label);
  }
  // 같은 이름표가 여러 줄에 있을 수 있다(pd.concat 결과) — 모두의 위치
  allPos(label) { const out = []; this.labels.forEach((l, i) => { if (l === label) out.push(i); }); return out; }
  has(label) { return this.pos(label) !== undefined; }
  slice(a, b) { return new Index(this.labels.slice(a, b), { isRange: this.isRange, name: this.name, dtype: this._dtype }); }
  take(positions) { return new Index(positions.map((p) => this.labels[p]), { name: this.name, dtype: this._dtype }); }
  rename(name) { const o = new Index(this.labels, { isRange: this.isRange, name, dtype: this._dtype }); return o; }
  equals(o) { return o instanceof Index && !(o instanceof MultiIndex) && o.labels.length === this.labels.length && o.labels.every((x, i) => x === this.labels[i]); }
  // 이름표 하나 → 파이썬 값
  boxed(i) { return this.isRange ? pyInt(this.labels[i]) : boxLabel(this.labels[i], this.dtype); }
  // 화면에 찍을 이름표 글자들 (열 전체를 한 규칙으로 — 날짜는 모두 자정이면 날짜만)
  formatted() {
    const d = this.dtype;
    if (d === DT) return formatDates(this.labels);
    if (d === 'float64') return pandasFloatColumn(this.labels);
    return this.labels.map(labelStr);
  }

  repr() {
    if (this.isRange) {
      const start = this.labels.length ? this.labels[0] : 0;
      return `RangeIndex(start=${start}, stop=${start + this.labels.length}, step=1)` + (this.name != null ? '' : '');
    }
    const dtype = this.dtype;
    if (dtype === DT) {
      const items = this.formatted().map((x) => `'${x}'`);
      const tail = `dtype='datetime64[ns]'` + (this.name != null ? `, name=${strRepr(String(this.name))}` : '') + ', freq=None';
      return `DatetimeIndex(${objectSummary(items, 'DatetimeIndex', false)}${tail})`;
    }
    const items = this.labels.map((x) => (typeof x === 'string' ? strRepr(x) : dtype === 'float64' ? pyFloatRepr(x) : String(x)));
    const tail = `dtype='${dtype}'` + (this.name != null ? `, name=${typeof this.name === 'string' ? strRepr(this.name) : String(this.name)}` : '');
    // pandas 의 format_object_summary 그대로 — 80칸에서 접는다 (글자 이름표는 오른쪽 맞춤을 하지 않는다)
    return `Index(${objectSummary(items, 'Index', this.labels.some((x) => typeof x === 'string') ? false : true)}${tail})`;
  }

  getattr(name) {
    switch (name) {
      case 'name': return this.name;
      case 'names': return [this.name];
      case 'size': return pyInt(this.length);
      case 'shape': return new Tuple([pyInt(this.length)]);
      case 'dtype': return dtypeObj(this.dtype);
      case 'nlevels': return pyInt(1);
      case 'values': return new NDArray([...this.labels], [this.length], this.dtype);
      case 'tolist': case 'to_list':
        return new PyFunc(name, () => this.labels.map((x, i) => { const v = this.boxed(i); return v instanceof Num ? (v.isFloat ? pyFloatNum(v.v) : pyInt(v.v)) : v; }), { owner: 'Index', self: this });
      case 'str': return undefined;
    }
    return undefined;
  }
}

// 여러 단계 이름표 — groupby(['분류', '매운맛']) 의 결과
export class MultiIndex extends Index {
  constructor(arrays, { names = null, dtypes = null } = {}) {
    const n = arrays.length ? arrays[0].length : 0;
    super(Array.from({ length: n }, (_, i) => arrays.map((a) => a[i])));
    this.arrays = arrays;
    this.names = names ?? arrays.map(() => null);
    this.dtypes = dtypes ?? arrays.map((a) => new Index(a).dtype);
  }
  get pyType() { return 'MultiIndex'; }
  get nlevels() { return this.arrays.length; }
  get dtype() { return 'object'; }
  key(label) { return JSON.stringify(label); }
  pos(label) {
    if (!this._pos) { this._pos = new Map(); this.labels.forEach((l, i) => { const k = this.key(l); if (!this._pos.has(k)) this._pos.set(k, i); }); }
    return this._pos.get(Array.isArray(label) ? this.key(label) : label);
  }
  level(k) { return new Index(this.arrays[k], { name: this.names[k], dtype: this.dtypes[k] }); }
  slice(a, b) { return new MultiIndex(this.arrays.map((x) => x.slice(a, b)), { names: this.names, dtypes: this.dtypes }); }
  take(positions) { return new MultiIndex(this.arrays.map((x) => positions.map((p) => x[p])), { names: this.names, dtypes: this.dtypes }); }
  equals(o) { return o instanceof MultiIndex && JSON.stringify(o.arrays) === JSON.stringify(this.arrays); }
  boxed(i) { return new Tuple(this.arrays.map((a, k) => boxLabel(a[i], this.dtypes[k]))); }
  // 단계마다 글자로
  formattedLevels() { return this.arrays.map((a, k) => this.level(k).formatted()); }
  repr() {
    const items = this.labels.map((_, i) => pyRepr(this.boxed(i)));
    const pad = ' '.repeat(12);
    const nm = `names=[${this.names.map((x) => (x == null ? 'None' : strRepr(String(x)))).join(', ')}]`;
    return `MultiIndex([${items.join(',\n' + pad)}],\n           ${nm})`;
  }
  getattr(name) {
    switch (name) {
      case 'names': return this.names.map((x) => x);
      case 'nlevels': return pyInt(this.arrays.length);
      case 'name': return null;
    }
    return super.getattr(name);
  }
}

function pyFloatRepr(x) { return Number.isInteger(x) ? x.toFixed(1) : String(x); }

// 이름표(자바스크립트 수·글자) → 파이썬 값
function boxLabel(x, dtype) {
  if (dtype === DT) return boxDate(x);
  if (typeof x === 'number') return dtype === 'float64' ? f64(x) : dtype === 'int32' ? i32(x) : i64(x);
  return x;
}
export { boxLabel };

export function dtypeObj(d) {
  return { pyType: 'dtype', repr: () => (d === 'object' ? "dtype('O')" : d === DT ? "dtype('<M8[ns]')" : `dtype('${d}')`), str: () => d, equals: (o) => o.str?.() === d };
}

// 파이썬 값 → 이름표(자바스크립트 수·글자)
function toLabel(v) {
  if (v instanceof Num) return v.v;
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Timestamp) return v.ms;
  if (v instanceof Tuple) return v.items.map(toLabel);
  throw new PyError('TypeError', `이름표로 쓸 수 없는 값입니다: ${typeName(v)}`);
}
function toLabels(v) {
  if (v instanceof Index) return v.labels;
  if (v instanceof NDArray) return v.data;
  if (v instanceof Series) return v.values.map(toLabel);
  if (v instanceof NDArray) return v.data;
  if (Array.isArray(v)) return v.map(toLabel);
  if (v instanceof Tuple) return v.items.map(toLabel);
  return [toLabel(v)];
}

// 한 칸의 값이 비었나(NaN·None)
export function isMissing(x) {
  return x === null || x === undefined || x === NaT || (typeof x === 'number' && Number.isNaN(x)) || (x instanceof Num && Number.isNaN(x.v));
}

// 저장해 둔 원소 → 파이썬 값
function box(x, dtype) {
  if (dtype === 'float64') return f64(x);
  if (dtype === 'int64') return i64(x);
  if (dtype === 'int32') return i32(x);
  if (dtype === DT) return boxDate(x);
  if (dtype === TD) return boxTd(x);
  if (dtype === 'bool') return npBool(x);
  if (typeof x === 'number') return new Num(x, Number.isNaN(x) ? 'float' : 'float');
  return x;
}

// 파이썬 값 → 저장용 원소 (dtype 에 맞게)
function unbox(v, dtype) {
  if (dtype === TD) {
    if (v === null || v === NaT) return NaN;
    if (v instanceof Timedelta) return v.ms;
    return toNumber(v);
  }
  if (dtype === DT) {
    if (v === null || v === NaT) return NaN;
    if (v instanceof Timestamp) return v.ms;
    if (typeof v === 'string') { const ms = parseDate(v); return ms === null ? NaN : ms; }
    return toNumber(v);
  }
  if (dtype === 'float64' || isIntD(dtype)) {
    if (v === null) return NaN;
    return toNumber(v);
  }
  if (dtype === 'bool') return Boolean(v instanceof Num ? v.v : v);
  return v;
}

// 파이썬 리스트 같은 값들의 dtype 짐작
function inferDtype(vals) {
  if (vals.length === 0) return 'object';
  if (vals.every((v) => typeof v === 'boolean' || (v instanceof Num && v.k === 'b_'))) return 'bool';
  if (vals.every((v) => v instanceof Num && (v.k === 'int' || v.k === 'i64'))) return 'int64';
  if (vals.every((v) => v instanceof Num && v.k === 'i32')) return 'int32';
  if (vals.every((v) => v instanceof Num && (v.k === 'int' || v.k === 'i64' || v.k === 'i32'))) return 'int64';
  if (vals.every((v) => v === null || v === NaT || v instanceof Timestamp) && vals.some((v) => v instanceof Timestamp)) return DT;
  if (vals.every((v) => v === null || v === NaT || v instanceof Timedelta) && vals.some((v) => v instanceof Timedelta)) return TD;
  if (vals.every((v) => v === null || isNumberLike(v))) return 'float64';
  return 'object';
}

const bound = (self, owner, name, fn) => new PyFunc(name, fn, { owner, self });

// ─────────────────────────────────────────────────────────────
// Series — 이름표가 붙은 값 한 줄
// ─────────────────────────────────────────────────────────────
export class Series {
  constructor(values, index, { name = null, dtype = 'float64', parent = null } = {}) {
    this.values = values; this.index = index; this.name = name; this.dtype = dtype;
    this.parent = parent; // { df, column } — DataFrame 에서 꺼낸 열이면 그 출처
  }
  get pyType() { return 'Series'; }
  get length() { return this.values.length; }

  static fromPython(vals, { name = null, index = null } = {}) {
    const dtype = inferDtype(vals);
    return new Series(vals.map((v) => unbox(v, dtype)), index ?? Index.range(vals.length), { name, dtype });
  }

  equals(o) {
    return o instanceof Series && o.dtype === this.dtype && o.name === this.name && o.index.equals(this.index) &&
      o.values.length === this.values.length &&
      o.values.every((x, i) => x === this.values[i] || (isMissing(x) && isMissing(this.values[i])) ||
        (x instanceof Num && this.values[i] instanceof Num && x.v === this.values[i].v));
  }

  copyWith(values, index = this.index, dtype = this.dtype, name = this.name) {
    return new Series(values, index, { name, dtype });
  }

  take(positions, index = this.index.take(positions)) {
    return new Series(positions.map((p) => this.values[p]), index, { name: this.name, dtype: this.dtype });
  }

  nums() {
    if (this.dtype === 'object' || this.dtype === DT || this.dtype === TD || this.dtype.startsWith('period')) return null;
    if (this.dtype === 'bool') return this.values.map((x) => (x ? 1 : 0));
    return this.values;
  }

  // 숫자로만 계산할 수 있는 명령에서 글자 열을 만났을 때
  requireNumeric(what) {
    const n = this.nums();
    if (!n) {
      const first = this.values.find((x) => typeof x === 'string');
      throw new PyError('TypeError', `could not convert string to float: ${strRepr(String(first))}`,
        `'${this.name}' 열은 글자(${first} 등)가 들어 있어 계산할 수 없습니다(${what}). 숫자 열을 골라 보세요.`);
    }
    return n;
  }

  repr() { return renderSeries(this); }
  str() { return renderSeries(this); }

  getattr(name) {
    const m = SERIES_METHODS[name];
    if (m) return m(this);
    return undefined;
  }
}

// ── 통계 계산 (numpy 순서 그대로) ────────────────────────────
function nanSumMean(nums) {
  let count = 0;
  const filled = nums.map((x) => { if (Number.isNaN(x)) return 0; count++; return x; });
  const s = pairwiseSum(filled);
  return { sum: s, count, mean: count ? s / count : NaN, filled };
}
function nanVar(nums, ddof = 1) {
  const { sum, count } = nanSumMean(nums);
  if (count - ddof <= 0) return NaN;
  const avg = sum / count;
  const sqr = nums.map((x) => (Number.isNaN(x) ? 0 : (avg - x) ** 2));
  return pairwiseSum(sqr) / (count - ddof);
}
function sortedClean(nums) { return nums.filter((x) => !Number.isNaN(x)).sort((a, b) => a - b); }
function nanMedian(nums) {
  const s = sortedClean(nums);
  const n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

// Series 하나를 줄이는 계산들 (sum·mean·…) → 파이썬 값
function reduceSeries(s, how, opts = {}) {
  const dt = s.dtype;
  if (how === 'count') return i64(s.values.filter((x) => !isMissing(x)).length);
  if (dt === TD) {
    const c = s.values.filter((x) => !Number.isNaN(x));
    if (!c.length) return NaT;
    if (how === 'min' || how === 'max') return new Timedelta(c.reduce((m, x) => (how === 'min' ? Math.min(m, x) : Math.max(m, x))));
    if (how === 'sum') return new Timedelta(c.reduce((a, b) => a + b, 0));
    if (how === 'mean') return new Timedelta(Math.round(c.reduce((a, b) => a + b, 0) / c.length));
    if (how === 'median') return new Timedelta(nanMedian(c));
    throw new NotSupported(`기간 열의 ${how}( )`);
  }
  if (dt === DT) {
    const c = s.values.filter((x) => !Number.isNaN(x));
    if (how === 'min' || how === 'max') return c.length ? new Timestamp(c.reduce((m, x) => (how === 'min' ? Math.min(m, x) : Math.max(m, x)))) : NaT;
    if (how === 'mean' || how === 'median') { if (!c.length) return NaT; const v = how === 'mean' ? c.reduce((a, b) => a + b, 0) / c.length : nanMedian(c); return new Timestamp(Math.round(v)); }
    if (how === 'sum') throw new PyError('TypeError', "datetime64 type does not support sum operations", '날짜는 더할 수 없습니다. 날짜 열에서는 min()·max() 나 .dt.year 같은 것을 씁니다.');
    throw new PyError('TypeError', `datetime64 type does not support ${how} operations`, '날짜 열에는 이 계산을 할 수 없습니다.');
  }
  if (dt === 'object') {
    const vals = s.values.filter((x) => !isMissing(x));
    if (how === 'sum') return vals.map((x) => pyStr(x)).join('');
    if (how === 'min' || how === 'max') {
      if (!vals.length) return pyFloatNum(NaN);
      return vals.reduce((m, x) => ((how === 'min' ? pyStr(x) < pyStr(m) : pyStr(x) > pyStr(m)) ? x : m));
    }
    throw new PyError('TypeError', how === 'mean' ? `Could not convert string ${strRepr(vals.map((x) => pyStr(x)).join(''))} to numeric` : `could not convert string to float: ${strRepr(pyStr(vals[0]))}`,
      `'${s.name}' 열은 글자라서 ${how}( ) 계산을 할 수 없습니다.`);
  }
  const nums = s.nums();
  switch (how) {
    case 'sum': {
      const { sum } = nanSumMean(nums);
      return dt === 'float64' ? f64(sum) : i64(sum);
    }
    case 'mean': return f64(nanSumMean(nums).mean);
    case 'median': return f64(nanMedian(nums));
    case 'std': return f64(Math.sqrt(nanVar(nums, opts.ddof ?? 1)));
    case 'var': return f64(nanVar(nums, opts.ddof ?? 1));
    case 'min': case 'max': {
      const c = nums.filter((x) => !Number.isNaN(x));
      if (!c.length) return f64(NaN);
      const v = c.reduce((m, x) => (how === 'min' ? (x < m ? x : m) : (x > m ? x : m)));
      return dt === 'float64' ? f64(v) : dt === 'int64' ? i64(v) : dt === 'int32' ? i32(v) : npBool(v);
    }
    case 'any': return npBool(nums.some((x) => x && !Number.isNaN(x)));
    case 'all': return npBool(nums.every((x) => x || Number.isNaN(x)));
  }
  throw new Error(how);
}

function quantileOf(s, q) {
  const nums = s.requireNumeric('백분위수');
  return percentileSorted(sortedClean(nums), q * 100);
}

function describeSeries(s, pcts = null) {
  if (s.dtype === DT) throw new NotSupported('날짜 열의 describe() — 날짜 열은 min()·max() 로 처음과 끝을 확인하세요');
  if (s.dtype === 'object') {
    const vals = s.values.filter((x) => !isMissing(x));
    const counts = valueCounts(vals);
    const [top, freq] = counts[0] ?? [NaN, 0];
    return new Series([i64(vals.length), i64(counts.length), top, i64(freq)],
      new Index(['count', 'unique', 'top', 'freq']), { name: s.name, dtype: 'object' });
  }
  const nums = s.nums();
  const { count, mean } = nanSumMean(nums);
  const sorted = sortedClean(nums);
  const pc = pcts ?? [0.25, 0.5, 0.75];
  const out = [count, mean, Math.sqrt(nanVar(nums)), sorted[0] ?? NaN,
    ...pc.map((p) => percentileSorted(sorted, p * 100)), sorted[sorted.length - 1] ?? NaN];
  return new Series(out, new Index(['count', 'mean', 'std', 'min', ...pc.map(pctLabel), 'max']), { name: s.name, dtype: 'float64' });
}

// describe(percentiles=[…]) — pandas 처럼 0.5 를 늘 넣고 차례대로, 이름표는 「10%」·「12.5%」
function describePercentiles(v) {
  if (v == null) return null;
  const ps = toLabels(v).map(Number);
  if (ps.some((p) => !(p >= 0 && p <= 1))) throw new PyError('ValueError', 'percentiles should all be in the interval [0, 1].', 'percentiles 에는 0 과 1 사이의 수를 넣습니다. 예) [0.1, 0.9]');
  if (!ps.includes(0.5)) ps.push(0.5);
  return [...new Set(ps)].sort((a, b) => a - b);
}
function pctLabel(p) { return `${Number((p * 100).toPrecision(12))}%`; }

function valueCounts(vals) {
  const m = new Map();
  for (const v of vals) { const k = valueKey(v); if (!m.has(k)) m.set(k, [v, 0]); m.get(k)[1]++; }
  return [...m.values()].sort((a, b) => b[1] - a[1]); // 자바스크립트 정렬은 안정 정렬 — 개수가 같으면 먼저 나온 것이 앞
}

// fillna 에 넣을 값 한 칸 얻기
function fillValue(value, label) {
  if (value instanceof Series) {
    const p = value.index.pos(label);
    return p === undefined ? undefined : box(value.values[p], value.dtype);
  }
  if (value instanceof Dict) {
    for (const [k, v] of value.map) if (toLabel(k) === label) return v;
    return undefined;
  }
  return value;
}

// DataFrame 에서 꺼낸 Series 에 inplace=True 를 쓰면 코랩(pandas 2.2)은 원본을 바꾸면서 이 경고를 띄운다.
export const CHAINED_WARNING =
  'FutureWarning: A value is trying to be set on a copy of a DataFrame or Series through chained assignment using an inplace method.\n' +
  'The behavior will change in pandas 3.0. This inplace method will never work because the intermediate object on which we are setting values always behaves as a copy.\n\n' +
  "For example, when doing 'df[col].method(value, inplace=True)', try using 'df.method({col: value}, inplace=True)' or df[col] = df[col].method(value) instead, to perform the operation inplace on the original object.\n\n";

// 앞 값으로(ffill) · 뒤 값으로(bfill) 빈칸 채우기
function padValues(vals, how) {
  const out = [...vals];
  if (how === 'ffill') { let last; for (let i = 0; i < out.length; i++) { if (isMissing(out[i])) { if (last !== undefined) out[i] = last; } else last = out[i]; } }
  else { let next; for (let i = out.length - 1; i >= 0; i--) { if (isMissing(out[i])) { if (next !== undefined) out[i] = next; } else next = out[i]; } }
  return out;
}
const PAD = { ffill: 'ffill', pad: 'ffill', bfill: 'bfill', backfill: 'bfill' };
function padMethod(method) {
  const m = PAD[pyStr(method)];
  if (!m) throw new PyError('ValueError', `Invalid fill method. Expecting pad (ffill) or backfill (bfill). Got ${pyStr(method)}`, "method 에는 'ffill' 이나 'bfill' 을 씁니다.");
  return m;
}
const methodWarning = (owner) => `FutureWarning: ${owner}.fillna with 'method' is deprecated and will raise in a future version. Use obj.ffill() or obj.bfill() instead.`;

function seriesPad(s, how, inplace, ctx) {
  if (inplace === true) {
    if (s.parent) ctx.warn(CHAINED_WARNING);
    const filled = padValues(s.values, how);
    for (let i = 0; i < filled.length; i++) s.values[i] = filled[i];
    return null;
  }
  return s.copyWith(padValues(s.values, how));
}

// df['열'][조건] = 값 — 코랩(pandas 2.2)은 원본을 바꾸면서 이 두 경고를 띄운다(화면에는 경고를 보이지 않는다)
export const CHAINED_SETITEM_WARNING =
  'FutureWarning: ChainedAssignmentError: behaviour will change in pandas 3.0!\n' +
  'You are setting values through chained assignment. Currently this works in certain cases, but when using Copy-on-Write (which will become the default behaviour in pandas 3.0) this will never work to update the original DataFrame or Series, because the intermediate object on which we are setting values will behave as a copy.\n' +
  'A typical example is when you are setting values in a column of a DataFrame, like:\n\ndf["col"][row_indexer] = value\n\n' +
  'Use `df.loc[row_indexer, "col"] = values` instead, to perform the assignment in a single step and ensure this keeps updating the original `df`.\n\n' +
  'See the caveats in the documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#returning-a-view-versus-a-copy\n';
export const SETTING_COPY_WARNING =
  'SettingWithCopyWarning: \nA value is trying to be set on a copy of a slice from a DataFrame\n\n' +
  'See the caveats in the documentation: https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#returning-a-view-versus-a-copy';

function seriesFillna(s, args, kw, ctx) {
  const { value, method, inplace } = parseArgs('fillna', args, kw, [['value', null], ['method', null], ['axis', null], ['inplace', false], ['limit', null], ['downcast', null]]);
  if (value === null && method !== null) {
    const how = padMethod(method);
    if (inplace === true && s.parent) ctx.warn(CHAINED_WARNING);
    ctx.warn(methodWarning('Series'));
    const filled = padValues(s.values, how);
    if (inplace === true) { for (let i = 0; i < filled.length; i++) s.values[i] = filled[i]; return null; }
    return s.copyWith(filled);
  }
  if (value === null) {
    throw new PyError('ValueError', "Must specify a fill 'value' or 'method'.", 'fillna( ) 괄호 안에 채울 값을 넣어야 합니다.');
  }
  if (value instanceof Series && value.parent == null && s.parent == null) { /* 이름표 맞춰 채우기 */ }
  const filled = s.values.map((x, i) => {
    if (!isMissing(x)) return x;
    if (value instanceof Series) { const p = value.index.pos(s.index.labels[i]); return p === undefined ? x : value.values[p]; }
    const v = value;
    if (s.dtype === 'object') return v;
    if (!isNumberLike(v)) {
      throw new PyError('TypeError', `Invalid value '${pyStr(v)}' for dtype '${s.dtype}'`,
        '숫자 열의 빈칸은 숫자로 채워야 합니다.');
    }
    return toNumber(v);
  });
  if (inplace === true) {
    if (s.parent) ctx.warn(CHAINED_WARNING);
    for (let i = 0; i < filled.length; i++) s.values[i] = filled[i]; // 같은 배열을 바꾸므로 원본 DataFrame 도 바뀐다
    return null;
  }
  return s.copyWith(filled);
}

// ── Series 의 명령어 모음 ─────────────────────────────────────
// pandas._libs.algos.nancorr — 두 열의 값이 모두 있는 줄만, 웰퍼드 방식으로 평균·편차를 쌓는다
function welfordCorr(xs, ys) {
  let nobs = 0, ssx = 0, ssy = 0, cxy = 0, mx = 0, my = 0;
  for (let i = 0; i < xs.length; i++) {
    const vx = xs[i], vy = ys[i];
    if (!Number.isFinite(vx) || !Number.isFinite(vy)) continue;
    nobs += 1;
    const dx = vx - mx, dy = vy - my;
    mx += (1 / nobs) * dx; my += (1 / nobs) * dy;
    ssx += (vx - mx) * dx; ssy += (vy - my) * dy; cxy += (vx - mx) * dy;
  }
  if (nobs < 2) return NaN;
  const div = Math.sqrt(ssx * ssy);
  return div !== 0 ? Math.min(1, Math.max(-1, cxy / div)) : NaN;
}
function numericValues(s, who) {
  if (s.dtype === 'object') {
    const first = s.values.find((x) => typeof x === 'string');
    throw new PyError('ValueError', `could not convert string to float: ${strRepr(String(first))}`,
      `'${s.name}' 열은 글자라서 ${who} 를 계산할 수 없습니다. 숫자 열끼리 계산하세요.`);
  }
  return s.values.map(Number);
}

// ── df.plot · 시리즈.plot — 이 시험지에서는 산점도(scatter)와 원 그래프(pie)만 ──
const PLOT_KINDS_ALL = ['line', 'bar', 'barh', 'hist', 'box', 'kde', 'density', 'area', 'pie', 'scatter', 'hexbin'];
function plotAccessor(obj, isFrame) {
  const owner = isFrame ? 'DataFrame' : 'Series';
  const run = (kind, a, k, ctx) => {
    if (!PLOT_KINDS_ALL.includes(kind)) throw new PyError('ValueError', `${kind} is not a valid plot kind Valid plot kinds: ${PLOT_KINDS_ALL.join(', ')}`);
    if (isFrame && kind === 'scatter') {
      const o = { x: k.get('x') ?? a[0], y: k.get('y') ?? a[1], s: k.get('s'), title: k.get('title'), figsize: k.get('figsize'),
        xlabel: k.get('xlabel'), ylabel: k.get('ylabel'), grid: k.get('grid') };
      return ctx.plt.pandasScatter(obj, o, k, ctx);
    }
    if (!isFrame && kind === 'pie') {
      const o = { title: k.get('title'), figsize: k.get('figsize'), ylabel: k.has('ylabel') ? k.get('ylabel') : undefined, legend: k.get('legend') };
      return ctx.plt.pandasPie(obj, o, k, ctx);
    }
    throw new NotSupported(`${isFrame ? 'df' : '시리즈'}.plot(kind='${kind}') — 이 시험지에서는 산점도(scatter)와 원 그래프(pie)만 그릴 수 있습니다`);
  };
  const f = new PyFunc('plot', (a, k, ctx) => {
    let kind = k.has('kind') ? pyStr(k.get('kind')) : 'line';
    let args = a;
    if (!isFrame && a.length && typeof a[0] === 'string' && !k.has('kind')) { kind = a[0]; args = a.slice(1); }
    if (isFrame && a.length >= 3 && typeof a[2] === 'string' && !k.has('kind')) { kind = a[2]; }
    const kw = new Map(k); kw.delete('kind');
    return run(kind, args, kw, ctx);
  }, { owner, self: obj });
  f.reprText = `<pandas.plotting._core.PlotAccessor object at 0x7f3a1c2d${(Math.abs(obj.length ?? obj.nrows ?? 0) % 4096).toString(16).padStart(4, '0')}>`;
  f.classAttrs = {};
  for (const kind of PLOT_KINDS_ALL) f.classAttrs[kind] = new PyFunc(kind, (a, k, ctx) => run(kind, a, k, ctx), { owner: 'PlotAccessor', self: obj });
  return f;
}

const SERIES_METHODS = {
  plot: (s) => plotAccessor(s, false),
  corr: (s) => bound(s, 'Series', 'corr', (a, k) => {
    const o = parseArgs('corr', a, k, [['other', REQUIRED], ['method', 'pearson'], ['min_periods', null]]);
    if (!(o.other instanceof Series)) throw new PyError('TypeError', `unsupported type: ${typeName(o.other)}`, '다른 열(시리즈)을 넣습니다. 예) df[\'a\'].corr(df[\'b\'])');
    if (pyStr(o.method) !== 'pearson') throw new NotSupported(`corr(method='${pyStr(o.method)}')`);
    const xs = numericValues(s, 'corr( )'), ys0 = numericValues(o.other, 'corr( )');
    const ys = s.index.labels.map((l) => { const q = o.other.index.pos(l); return q === undefined ? NaN : ys0[q]; });
    return f64(welfordCorr(xs, ys));
  }),
  values: (s) => new NDArray([...s.values], [s.length], s.dtype),
  index: (s) => s.index,
  name: (s) => s.name,
  dtype: (s) => dtypeObj(s.dtype),
  shape: (s) => new Tuple([pyInt(s.length)]),
  size: (s) => pyInt(s.length),
  empty: (s) => s.length === 0,
  loc: (s) => new Indexer(s, 'loc'),
  iloc: (s) => new Indexer(s, 'iloc'),
  head: (s) => bound(s, 'NDFrame', 'head', (a, k) => { const { n } = parseArgs('head', a, k, [['n', pyInt(5)]]); const m = clampN(n, s.length); return new Series(s.values.slice(0, m), s.index.slice(0, m), { name: s.name, dtype: s.dtype }); }),
  tail: (s) => bound(s, 'NDFrame', 'tail', (a, k) => { const { n } = parseArgs('tail', a, k, [['n', pyInt(5)]]); const m = clampN(n, s.length); return new Series(s.values.slice(s.length - m), s.index.slice(s.length - m), { name: s.name, dtype: s.dtype }); }),
  isnull: (s) => bound(s, 'Series', 'isnull', () => s.copyWith(s.values.map(isMissing), s.index, 'bool')),
  isna: (s) => bound(s, 'Series', 'isna', () => s.copyWith(s.values.map(isMissing), s.index, 'bool')),
  notnull: (s) => bound(s, 'Series', 'notnull', () => s.copyWith(s.values.map((x) => !isMissing(x)), s.index, 'bool')),
  notna: (s) => bound(s, 'Series', 'notna', () => s.copyWith(s.values.map((x) => !isMissing(x)), s.index, 'bool')),
  sum: (s) => bound(s, 'Series', 'sum', () => reduceSeries(s, 'sum')),
  mean: (s) => bound(s, 'Series', 'mean', () => reduceSeries(s, 'mean')),
  median: (s) => bound(s, 'Series', 'median', () => reduceSeries(s, 'median')),
  min: (s) => bound(s, 'Series', 'min', () => reduceSeries(s, 'min')),
  max: (s) => bound(s, 'Series', 'max', () => reduceSeries(s, 'max')),
  std: (s) => bound(s, 'Series', 'std', (a, k) => { const { ddof } = parseArgs('std', a, k, [['ddof', pyInt(1)]]); return reduceSeries(s, 'std', { ddof: toNumber(ddof) }); }),
  var: (s) => bound(s, 'Series', 'var', (a, k) => { const { ddof } = parseArgs('var', a, k, [['ddof', pyInt(1)]]); return reduceSeries(s, 'var', { ddof: toNumber(ddof) }); }),
  count: (s) => bound(s, 'Series', 'count', () => reduceSeries(s, 'count')),
  any: (s) => bound(s, 'Series', 'any', () => reduceSeries(s, 'any')),
  all: (s) => bound(s, 'Series', 'all', () => reduceSeries(s, 'all')),
  quantile: (s) => bound(s, 'Series', 'quantile', (a, k) => {
    const { q } = parseArgs('quantile', a, k, [['q', pyFloatNum(0.5)]]);
    if (Array.isArray(q)) return new Series(q.map((x) => quantileOf(s, toNumber(x))), new Index(q.map((x) => toNumber(x))), { name: s.name, dtype: 'float64' });
    return f64(quantileOf(s, toNumber(q)));
  }),
  describe: (s) => bound(s, 'NDFrame', 'describe', (a, k) => {
    const o = parseArgs('describe', a, k, [['percentiles', null], ['include', null], ['exclude', null]]);
    return describeSeries(s, describePercentiles(o.percentiles));
  }),
  fillna: (s) => bound(s, 'Series', 'fillna', (a, k, ctx) => seriesFillna(s, a, k, ctx)),
  ffill: (s) => bound(s, 'NDFrame', 'ffill', (a, k, ctx) => { const o = parseArgs('ffill', a, k, [['axis', null], ['inplace', false], ['limit', null], ['limit_area', null], ['downcast', null]]); return seriesPad(s, 'ffill', o.inplace, ctx); }),
  bfill: (s) => bound(s, 'NDFrame', 'bfill', (a, k, ctx) => { const o = parseArgs('bfill', a, k, [['axis', null], ['inplace', false], ['limit', null], ['limit_area', null], ['downcast', null]]); return seriesPad(s, 'bfill', o.inplace, ctx); }),
  dropna: (s) => bound(s, 'Series', 'dropna', () => { const keep = s.values.map((x, i) => (isMissing(x) ? -1 : i)).filter((i) => i >= 0); return s.take(keep); }),
  copy: (s) => bound(s, 'NDFrame', 'copy', () => s.copyWith([...s.values])),
  round: (s) => bound(s, 'Series', 'round', (a, k) => {
    const { decimals } = parseArgs('round', a, k, [['decimals', pyInt(0)]]);
    s.requireNumeric('반올림');
    return s.copyWith(s.values.map((x) => roundHalfEven(x, toNumber(decimals))));
  }),
  unique: (s) => bound(s, 'Series', 'unique', () => {
    const seen = new Set(); const out = [];
    for (const x of s.values) { const key = isMissing(x) ? 'NaN' : pyStr(box(x, s.dtype)); if (!seen.has(key)) { seen.add(key); out.push(x); } }
    return new NDArray(out, [out.length], s.dtype);
  }),
  nunique: (s) => bound(s, 'Series', 'nunique', () => pyInt(new Set(s.values.filter((x) => !isMissing(x)).map((x) => pyStr(box(x, s.dtype)))).size)),
  value_counts: (s) => bound(s, 'Series', 'value_counts', (a, k) => {
    const o = parseArgs('value_counts', a, k, [['normalize', false], ['sort', true], ['ascending', false], ['bins', null], ['dropna', true]]);
    if (o.bins != null) throw new NotSupported('value_counts(bins=…)');
    const vals = o.dropna === false ? s.values : s.values.filter((x) => !isMissing(x));
    let counts = valueCounts(vals);
    if (o.sort === false) { const first = new Map(); vals.forEach((v, i) => { const key = valueKey(v); if (!first.has(key)) first.set(key, i); }); counts = [...counts].sort((p, q) => first.get(valueKey(p[0])) - first.get(valueKey(q[0]))); }
    else if (o.ascending === true) counts = [...counts].reverse().sort((p, q) => p[1] - q[1]);
    const idx = new Index(counts.map(([v]) => v), { name: s.name, dtype: s.dtype === 'object' ? null : s.dtype === 'bool' ? 'bool' : s.dtype });
    if (o.normalize === true) {
      const total = counts.reduce((acc, [, c]) => acc + c, 0);
      return new Series(counts.map(([, c]) => c / total), idx, { name: 'proportion', dtype: 'float64' });
    }
    return new Series(counts.map(([, c]) => c), idx, { name: 'count', dtype: 'int64' });
  }),
  keys: (s) => bound(s, 'Series', 'keys', () => s.index),
  sort_index: (s) => bound(s, 'Series', 'sort_index', (a, k) => {
    const { ascending } = parseArgs('sort_index', a, k, [['axis', pyInt(0)], ['level', null], ['ascending', true]]);
    return s.take(sortOrder(s.index.labels, ascending !== false));
  }),
  sort_values: (s) => bound(s, 'Series', 'sort_values', (a, k) => {
    const { ascending } = parseArgs('sort_values', a, k, [['ascending', true]]);
    const order = sortOrder(s.values, ascending !== false);
    return s.take(order);
  }),
  drop: (s) => bound(s, 'Series', 'drop', (a, k) => {
    const { labels, index } = parseArgs('drop', a, k, [['labels', null], ['index', null]]);
    const drop = toLabels(labels ?? index);
    const missing = drop.filter((l) => !s.index.has(l));
    if (missing.length) throw new PyError('KeyError', keyErrText(`${pyListOf(missing)} not found in axis`));
    const set = new Set(drop);
    return s.take(s.index.labels.map((l, i) => (set.has(l) ? -1 : i)).filter((i) => i >= 0));
  }),
  reset_index: (s) => bound(s, 'Series', 'reset_index', (a, k) => {
    const { drop, name } = parseArgs('reset_index', a, k, [['level', null], ['drop', false], ['name', null], ['inplace', false]]);
    if (drop === true) return new Series([...s.values], Index.range(s.length), { name: s.name, dtype: s.dtype });
    const front = indexAsColumns(s.index, []);
    const vn = name ?? s.name ?? 0;
    const data = {}, dtypes = {};
    for (const f of front) { data[f.name] = f.values; dtypes[f.name] = f.dtype; }
    data[vn] = [...s.values]; dtypes[vn] = s.dtype;
    return new DataFrame([...front.map((f) => f.name), vn], data, Index.range(s.length), dtypes);
  }),
  abs: (s) => bound(s, 'Series', 'abs', () => s.copyWith(s.requireNumeric('절댓값').map(Math.abs))),
  tolist: (s) => bound(s, 'Series', 'tolist', () => s.values.map((x) => pyValueOf(x, s.dtype))),
  to_list: (s) => bound(s, 'Series', 'to_list', () => s.values.map((x) => pyValueOf(x, s.dtype))),
  to_numpy: (s) => bound(s, 'Series', 'to_numpy', () => new NDArray([...s.values], [s.length], s.dtype)),
  astype: (s) => bound(s, 'Series', 'astype', (a, k) => {
    const { dtype } = parseArgs('astype', a, k, [['dtype', REQUIRED], ['copy', null], ['errors', 'raise']]);
    const d = dtype instanceof PyFunc ? dtype.name : pyStr(dtype);   // astype(int) · astype('int64')
    if ((d === 'int' || d === 'int64' || d === 'int32') && s.values.some((x) => typeof x === 'number' && !Number.isFinite(x))) {
      throw new PyError('IntCastingNaNError', 'Cannot convert non-finite values (NA or inf) to integer', '빈칸(NaN)이 남아 있으면 정수로 바꿀 수 없습니다. 결측치를 먼저 채우세요.');
    }
    if (d === 'float' || d === 'float64') {
      return s.copyWith(s.values.map((x) => {
        if (typeof x === 'number' || isMissing(x)) return isMissing(x) ? NaN : x;
        if (x instanceof Num) return x.v;
        const t = String(x).trim(), v = Number(t);
        if (t === '' || Number.isNaN(v)) throw new PyError('ValueError', `could not convert string to float: ${strRepr(String(x))}`, `'${x}' 는 수로 바꿀 수 없습니다. 먼저 replace( ) 로 바꾸거나 pd.to_numeric(…, errors='coerce') 를 쓰세요.`);
        return v;
      }), s.index, 'float64');
    }
    if (d === 'int' || d === 'int64' || d === 'int32') {
      return s.copyWith(s.values.map((x) => {
        if (typeof x === 'number') return Math.trunc(x);
        if (x instanceof Num) return Math.trunc(x.v);
        if (typeof x === 'boolean') return x ? 1 : 0;
        if (!/^\s*[-+]?\d+\s*$/.test(String(x))) throw new PyError('ValueError', `invalid literal for int() with base 10: ${strRepr(String(x))}`, `'${x}' 는 정수로 바꿀 수 없습니다. 먼저 map( )·replace( ) 로 수로 바꾸세요.`);
        return Number(String(x).trim());
      }), s.index, d === 'int32' ? 'int32' : 'int64');
    }
    if (d === 'str' || d === 'object') {
      if (s.dtype === DT) return s.copyWith(formatDates(s.values), s.index, 'object');
      return s.copyWith(s.values.map((x) => (isMissing(x) && d === 'object' ? x : pyStr(box(x, s.dtype)))), s.index, 'object');
    }
    if (d === 'bool') return s.copyWith(s.values.map((x) => Boolean(x instanceof Num ? x.v : typeof x === 'number' ? x : x)), s.index, 'bool');
    if (d === 'category') throw new NotSupported("astype('category')");
    if (d === 'datetime64[ns]' || d === 'datetime64') return s.copyWith(s.values.map((x) => (typeof x === 'string' ? (parseDate(x) ?? NaN) : NaN)), s.index, DT);
    throw new NotSupported(`astype('${d}')`);
  }),
};

// ─────────────────────────────────────────────────────────────
// 판다스 실습실에서 더한 Series 명령 — isin · between · map · apply · replace · str · dt · idxmax · nlargest …
// ─────────────────────────────────────────────────────────────
// 값 비교용 열쇠 — 수는 수끼리(1 과 1.0 은 같다), 글자는 글자끼리
export function valueKey(x) {
  if (x instanceof Num) return 'n:' + x.v;
  if (typeof x === 'number') return 'n:' + x;
  if (typeof x === 'boolean') return 'n:' + (x ? 1 : 0);
  if (x instanceof Timestamp) return 'n:' + x.ms;
  if (x === null || x === NaT) return 'na';
  return 's:' + String(x);
}
function iterValues(v, what) {
  if (Array.isArray(v)) return v;
  if (v instanceof Tuple) return v.items;
  if (v instanceof Series) return v.values.map((x) => box(x, v.dtype));
  if (v instanceof Index) return v.labels;
  if (v instanceof NDArray) return v.data;
  if (v instanceof Dict) return [...v.map.keys()];
  if (v?.pyType === 'set') return v.items;
  throw new PyError('TypeError', `only list-like objects are allowed to be passed to ${what}(), you passed a \`${typeName(v)}\``,
    `${what}( ) 괄호 안에는 리스트를 넣습니다. 예) ${what}(['음료', '디저트'])`);
}
// 파이썬 함수 부르기 (lambda · len · str …)
function callPy(fn, args, ctx) {
  if (!(fn instanceof PyFunc)) throw new PyError('TypeError', `'${typeName(fn)}' object is not callable`, '함수(예: lambda x: x * 2) 를 넣어야 합니다.');
  return fn.fn(args, new Map(), ctx);
}
// 파이썬 값 목록 → 알맞은 dtype 의 Series
export function seriesFromValues(vals, index, name) {
  const dtype = inferDtype(vals.map((v) => (typeof v === 'number' ? new Num(v, 'float') : v)));
  return new Series(vals.map((v) => (typeof v === 'number' ? v : unbox(v, dtype))), index, { name, dtype });
}

function seriesReplace(s, a, k, ctx) {
  const o = parseArgs('replace', a, k, [['to_replace', null], ['value', null], ['inplace', false], ['limit', null], ['regex', false]]);
  const pairs = [];
  if (o.to_replace instanceof Dict) for (const [x, y] of o.to_replace.map) pairs.push([x, y]);
  else if (Array.isArray(o.to_replace)) {
    if (Array.isArray(o.value)) o.to_replace.forEach((x, i) => pairs.push([x, o.value[i]]));
    else o.to_replace.forEach((x) => pairs.push([x, o.value]));
  } else pairs.push([o.to_replace, o.value]);
  const out = replaceValues(s.values, s.dtype, new Map(pairs.map(([x, y]) => [valueKey(x), y])), ctx);
  const res = out ? new Series(out.values, s.index, { name: s.name, dtype: out.dtype }) : s.copyWith([...s.values]);
  if (o.inplace === true) { s.values.splice(0, s.values.length, ...res.values); s.dtype = res.dtype; if (s.parent) s.parent.df.dtypes[s.parent.column] = res.dtype; return null; }
  return res;
}
// 한 열의 값 바꾸기 — 바뀐 것이 없으면 null
function replaceValues(values, dtype, map, ctx) {
  let changed = false;
  const vals = values.map((x) => {
    const key = valueKey(box(x, dtype));
    if (map.has(key)) { changed = true; return map.get(key); }
    return box(x, dtype);
  });
  if (!changed) return null;
  const nd = inferDtype(vals.map((v) => (isMissing(v) ? null : v)));
  // 글자 열을 바꾸어 모두 수가 되면 pandas 2.2 는 수 열로 바꾸면서 경고한다
  if (dtype === 'object' && nd !== 'object') {
    ctx?.warn("FutureWarning: Downcasting behavior in `replace` is deprecated and will be removed in a future version. To retain the old behavior, explicitly call `result.infer_objects(copy=False)`. To opt-in to the future behavior, set `pd.set_option('future.no_silent_downcasting', True)`");
  }
  const out = nd === 'object' ? 'object' : dtype === 'float64' && isIntD(nd) ? 'float64' : nd;
  return { dtype: out, values: vals.map((v) => (out === 'object' ? v : unbox(v, out))) };
}

function nTop(s, n, largest) {
  s.requireNumeric(largest ? 'nlargest' : 'nsmallest');
  const order = sortOrder(s.values, !largest);
  const keep = order.filter((i) => !isMissing(s.values[i])).slice(0, toNumber(n));
  return s.take(keep);
}

function keysDuplicated(keys, keep) {
  const seen = new Set();
  const k = keep === false ? 'none' : pyStr(keep);
  if (k === 'last') {
    const out = Array(keys.length).fill(false);
    for (let i = keys.length - 1; i >= 0; i--) { if (seen.has(keys[i])) out[i] = true; seen.add(keys[i]); }
    return out;
  }
  if (k === 'none') {
    const cnt = new Map(); keys.forEach((x) => cnt.set(x, (cnt.get(x) ?? 0) + 1));
    return keys.map((x) => cnt.get(x) > 1);
  }
  return keys.map((x) => { if (seen.has(x)) return true; seen.add(x); return false; });
}
function seriesDuplicated(s, keep) { return keysDuplicated(s.values.map((x) => valueKey(box(x, s.dtype))), keep); }

// 시리즈.str — 글자 열 다루기
class StringAccessor {
  constructor(s) { this.s = s; }
  get pyType() { return 'StringMethods'; }
  repr() { return '<pandas.core.strings.accessor.StringMethods object at 0x7f8a2b3c4d50>'; }
  // 칸마다 fn 을 적용 — 빈칸(NaN)은 그대로 둔다
  map(fn, dtype = 'object', naValue = NaN) {
    const s = this.s;
    const out = s.values.map((x) => (isMissing(x) ? naValue : fn(Array.isArray(x) ? x : String(x))));
    const hasNa = out.some((x) => typeof x === 'number' && Number.isNaN(x));
    let dt = dtype;
    if (dtype === 'bool' && hasNa) dt = 'object';
    if (dtype === 'int64' && hasNa) dt = 'float64';
    return new Series(out, s.index, { name: s.name, dtype: dt });
  }
  getitem(key) {
    if (key?.pyType === 'slice') return this.sliced(key.start, key.stop, key.step);
    const i = toNumber(key);
    return this.map((x) => { const arr = Array.isArray(x) ? x : [...x]; const j = i < 0 ? arr.length + i : i; return j >= 0 && j < arr.length ? arr[j] : NaN; }, 'object');
  }
  sliced(start, stop, step) {
    if (step != null) throw new NotSupported('str[시작:끝:간격]');
    const s = this.s;
    const out = s.values.map((x) => {
      if (isMissing(x)) return NaN;
      const arr = Array.isArray(x) ? x : [...String(x)];
      const n = arr.length;
      const norm = (v, d) => { if (v == null) return d; let t = toNumber(v); if (t < 0) t += n; return Math.min(Math.max(t, 0), n); };
      const part = arr.slice(norm(start, 0), norm(stop, n));
      return Array.isArray(x) ? part : part.join('');
    });
    return new Series(out, s.index, { name: s.name, dtype: 'object' });
  }
  getattr(name) {
    const self = this, b = (nm, fn) => new PyFunc(nm, fn, { owner: 'StringMethods', self: this });
    switch (name) {
      case 'upper': return b(name, () => self.map((x) => x.toUpperCase()));
      case 'lower': return b(name, () => self.map((x) => x.toLowerCase()));
      case 'title': return b(name, () => self.map((x) => x.toLowerCase().replace(/(^|[^A-Za-z])([a-z])/g, (m, p, c) => p + c.toUpperCase())));
      case 'strip': return b(name, (a) => self.map((x) => (a.length && a[0] != null ? trimChars(x, pyStr(a[0]), 'both') : x.trim())));
      case 'lstrip': return b(name, (a) => self.map((x) => (a.length && a[0] != null ? trimChars(x, pyStr(a[0]), 'left') : x.replace(/^\s+/, ''))));
      case 'rstrip': return b(name, (a) => self.map((x) => (a.length && a[0] != null ? trimChars(x, pyStr(a[0]), 'right') : x.replace(/\s+$/, ''))));
      case 'len': return b(name, () => self.map((x) => (Array.isArray(x) ? x.length : [...x].length), 'int64'));
      case 'contains': return b(name, (a, k) => {
        const o = parseArgs('contains', a, k, [['pat', REQUIRED], ['case', true], ['flags', pyInt(0)], ['na', null], ['regex', true]]);
        const pat = pyStr(o.pat);
        const re = o.regex !== false ? new RegExp(pat, o.case === false ? 'i' : '') : null;
        const test = (x) => (re ? re.test(x) : o.case === false ? x.toLowerCase().includes(pat.toLowerCase()) : x.includes(pat));
        if (o.na !== null) return self.map(test, 'bool', Boolean(o.na instanceof Num ? o.na.v : o.na));
        return self.map(test, 'bool');
      });
      case 'startswith': return b(name, (a, k) => { const o = parseArgs('startswith', a, k, [['pat', REQUIRED], ['na', null]]); const p = pyStr(o.pat); return o.na !== null ? self.map((x) => x.startsWith(p), 'bool', Boolean(o.na)) : self.map((x) => x.startsWith(p), 'bool'); });
      case 'endswith': return b(name, (a, k) => { const o = parseArgs('endswith', a, k, [['pat', REQUIRED], ['na', null]]); const p = pyStr(o.pat); return o.na !== null ? self.map((x) => x.endsWith(p), 'bool', Boolean(o.na)) : self.map((x) => x.endsWith(p), 'bool'); });
      case 'replace': return b(name, (a, k) => {
        const o = parseArgs('replace', a, k, [['pat', REQUIRED], ['repl', REQUIRED], ['n', pyInt(-1)], ['case', null], ['flags', pyInt(0)], ['regex', false]]);
        const pat = pyStr(o.pat), repl = pyStr(o.repl);
        if (o.regex === true) { const re = new RegExp(pat, 'g'); return self.map((x) => x.replace(re, repl.replace(/\\(\d)/g, '$$$1'))); }
        return self.map((x) => x.split(pat).join(repl));
      });
      case 'split': return b(name, (a, k) => {
        const o = parseArgs('split', a, k, [['pat', null], ['n', pyInt(-1)], ['expand', false], ['regex', null]]);
        if (o.expand === true) throw new NotSupported("str.split(…, expand=True) — str.split('-').str[0] 처럼 한 조각씩 꺼내 쓰세요");
        const sep = o.pat == null ? null : pyStr(o.pat);
        return self.map((x) => (sep == null ? x.trim().split(/\s+/) : x.split(sep)));
      });
      case 'slice': return b(name, (a, k) => { const o = parseArgs('slice', a, k, [['start', null], ['stop', null], ['step', null]]); return self.sliced(o.start, o.stop, o.step); });
      case 'get': return b(name, (a, k) => { const { i } = parseArgs('get', a, k, [['i', REQUIRED]]); return self.getitem(i); });
      case 'isdigit': case 'isnumeric': case 'isdecimal': return b(name, () => self.map((x) => /^\d+$/.test(x), 'bool'));
      case 'zfill': return b(name, (a) => { const w = toNumber(a[0]); return self.map((x) => x.padStart(w, '0')); });
      case 'count': return b(name, (a) => { const re = new RegExp(pyStr(a[0]), 'g'); return self.map((x) => (x.match(re) ?? []).length, 'int64'); });
      case 'find': return b(name, (a) => { const p = pyStr(a[0]); return self.map((x) => x.indexOf(p), 'int64'); });
      case 'cat': case 'extract': case 'extractall': case 'findall': case 'join': case 'pad': case 'center': case 'ljust': case 'rjust':
      case 'get_dummies': case 'wrap': case 'capitalize': case 'swapcase': case 'match': case 'fullmatch': case 'partition': case 'isalpha':
        throw new NotSupported(`str.${name}`);
    }
    return undefined;
  }
}
function trimChars(x, chars, side) {
  const set = new Set(chars);
  let a = 0, b = x.length;
  if (side !== 'right') while (a < b && set.has(x[a])) a++;
  if (side !== 'left') while (b > a && set.has(x[b - 1])) b--;
  return x.slice(a, b);
}

// 시리즈.dt — 날짜 열 다루기
class DateAccessor {
  constructor(s) { this.s = s; }
  get pyType() { return 'DatetimeProperties'; }
  repr() { return '<pandas.core.indexes.accessors.DatetimeProperties object at 0x7f8a2b3c5e60>'; }
  fieldSeries(name) {
    const s = this.s;
    const out = s.values.map((x) => (Number.isNaN(x) ? NaN : dtField(x, name)));
    const hasNa = out.some(Number.isNaN);
    return new Series(out, s.index, { name: s.name, dtype: hasNa ? 'float64' : 'int32' });
  }
  getattr(name) {
    const s = this.s, b = (nm, fn) => new PyFunc(nm, fn, { owner: 'DatetimeProperties', self: this });
    if (DT_FIELDS.includes(name)) return this.fieldSeries(name);
    const obj = (fn) => new Series(s.values.map((x) => (Number.isNaN(x) ? NaN : fn(x))), s.index, { name: s.name, dtype: 'object' });
    switch (name) {
      case 'day_name': return b(name, () => obj((x) => DAYS[dtField(x, 'dayofweek')]));
      case 'month_name': return b(name, () => obj((x) => MONTHS[dtField(x, 'month') - 1]));
      case 'strftime': return b(name, (a, k) => { const { date_format } = parseArgs('strftime', a, k, [['date_format', REQUIRED]]); return obj((x) => strftime(x, pyStr(date_format))); });
      case 'date': return obj((x) => new DateOnly(x - (((x % 86400000) + 86400000) % 86400000)));
      case 'to_period': return b(name, (a, k, ctx) => {
        const { freq } = parseArgs('to_period', a, k, [['freq', null]]);
        let f = pyStr(freq);
        if (PERIOD_OLD[f]) { ctx?.warn(`FutureWarning: '${f}' is deprecated and will be removed in a future version, please use '${PERIOD_OLD[f]}' instead.`); f = PERIOD_OLD[f]; }
        const p = PERIODS[f];
        if (!p) throw new NotSupported(`to_period('${f}') — 'Y'(연) · 'Q'(분기) · 'M'(월) · 'D'(일) · 'h'(시) 를 쓰세요`);
        return new Series(s.values.map((x) => (Number.isNaN(x) ? NaN : p.f(x))), s.index, { name: s.name, dtype: p.dtype });
      });
      case 'days_in_month': case 'week': case 'isocalendar': case 'normalize': case 'floor': case 'ceil': case 'round':
      case 'total_seconds': throw new PyError('AttributeError', "'DatetimeProperties' object has no attribute 'total_seconds'", "total_seconds( ) 는 기간(timedelta) 열에만 있습니다. 날짜끼리 빼서 기간을 만든 뒤 쓰세요. 예) (df['도착'] - df['주문']).dt.total_seconds()");
      case 'is_month_end': case 'is_month_start': case 'time': case 'tz_localize':
        throw new NotSupported(`dt.${name}`);
    }
    return undefined;
  }
}

// 시리즈.dt — 기간(timedelta) 열. 분·시간으로 바로 바꾸는 명령은 없어서 total_seconds( ) 로 초를 구해 나눈다.
class TimedeltaAccessor {
  constructor(s) { this.s = s; }
  get pyType() { return 'TimedeltaProperties'; }
  repr() { return '<pandas.core.indexes.accessors.TimedeltaProperties object at 0x7f8a2b3c6f70>'; }
  getattr(name) {
    const s = this.s;
    const DAYMS = 86400000;
    switch (name) {
      case 'days': {
        const v = s.values.map((x) => (Number.isNaN(x) ? NaN : Math.floor(x / DAYMS)));
        return new Series(v, s.index, { name: s.name, dtype: v.some(Number.isNaN) ? 'float64' : 'int64' });
      }
      case 'seconds': {
        const v = s.values.map((x) => (Number.isNaN(x) ? NaN : Math.floor((x - Math.floor(x / DAYMS) * DAYMS) / 1000)));
        return new Series(v, s.index, { name: s.name, dtype: v.some(Number.isNaN) ? 'float64' : 'int32' });
      }
      case 'total_seconds': return new PyFunc(name, () => new Series(s.values.map((x) => x / 1000), s.index, { name: s.name, dtype: 'float64' }), { owner: 'TimedeltaProperties', self: this });
      case 'components': case 'microseconds': case 'nanoseconds': case 'to_pytimedelta': case 'round': case 'floor': case 'ceil':
        throw new NotSupported(`dt.${name}`);
    }
    return undefined;
  }
}

Object.assign(SERIES_METHODS, {
  str: (s) => {
    if (s.dtype !== 'object') throw new PyError('AttributeError', 'Can only use .str accessor with string values!', `'${s.name}' 열은 글자 열이 아니라서 .str 을 쓸 수 없습니다. 먼저 .astype(str) 로 글자로 바꾸세요.`);
    return new StringAccessor(s);
  },
  dt: (s) => {
    if (s.dtype === TD) return new TimedeltaAccessor(s);
    if (s.dtype !== DT) throw new PyError('AttributeError', 'Can only use .dt accessor with datetimelike values', `'${s.name}' 열은 아직 날짜가 아니라 글자입니다. 먼저 pd.to_datetime(…) 으로 날짜로 바꾸세요.`);
    return new DateAccessor(s);
  },
  isin: (s) => bound(s, 'Series', 'isin', (a, k) => {
    const { values } = parseArgs('isin', a, k, [['values', REQUIRED]]);
    const keys = new Set(iterValues(values, 'isin').map(valueKey));
    return s.copyWith(s.values.map((x) => keys.has(valueKey(box(x, s.dtype)))), s.index, 'bool');
  }),
  between: (s) => bound(s, 'Series', 'between', (a, k) => {
    const o = parseArgs('between', a, k, [['left', REQUIRED], ['right', REQUIRED], ['inclusive', 'both']]);
    const inc = pyStr(o.inclusive);
    const lo = pandasBinop(inc === 'both' || inc === 'left' ? '>=' : '>', s, o.left);
    const hi = pandasBinop(inc === 'both' || inc === 'right' ? '<=' : '<', s, o.right);
    return pandasBinop('&', lo, hi);
  }),
  map: (s) => bound(s, 'Series', 'map', (a, k, ctx) => {
    const { arg } = parseArgs('map', a, k, [['arg', REQUIRED], ['na_action', null]]);
    if (arg instanceof Dict) {
      const m = new Map([...arg.map].map(([x, y]) => [valueKey(x), y]));
      const vals = s.values.map((x) => { const key = valueKey(box(x, s.dtype)); return m.has(key) ? m.get(key) : NaN; });
      return seriesFromValues(vals, s.index, s.name);
    }
    if (arg instanceof Series) {
      const vals = s.values.map((x) => { const p = arg.index.pos(toLabel(box(x, s.dtype))); return p === undefined ? NaN : box(arg.values[p], arg.dtype); });
      return seriesFromValues(vals, s.index, s.name);
    }
    return seriesFromValues(s.values.map((x) => callPy(arg, [box(x, s.dtype)], ctx)), s.index, s.name);
  }),
  apply: (s) => bound(s, 'Series', 'apply', (a, k, ctx) => {
    const { func } = parseArgs('apply', a, k, [['func', REQUIRED], ['convert_dtype', null], ['args', null], ['by_row', null]]);
    if (typeof func === 'string') return s.getattr(func)?.fn([], new Map(), ctx);
    const vals = s.values.map((x) => callPy(func, [box(x, s.dtype)], ctx));
    if (vals.some((v) => v instanceof Series)) throw new NotSupported('apply 에서 Series 를 돌려주는 함수');
    return seriesFromValues(vals, s.index, s.name);
  }),
  replace: (s) => bound(s, 'Series', 'replace', (a, k, ctx) => seriesReplace(s, a, k, ctx)),
  idxmax: (s) => bound(s, 'Series', 'idxmax', () => {
    const nums = s.requireNumeric('idxmax');
    let best = -1; nums.forEach((x, i) => { if (!Number.isNaN(x) && (best < 0 || x > nums[best])) best = i; });
    if (best < 0) throw new PyError('ValueError', 'attempt to get argmax of an empty sequence');
    return s.index.boxed(best);
  }),
  idxmin: (s) => bound(s, 'Series', 'idxmin', () => {
    const nums = s.requireNumeric('idxmin');
    let best = -1; nums.forEach((x, i) => { if (!Number.isNaN(x) && (best < 0 || x < nums[best])) best = i; });
    if (best < 0) throw new PyError('ValueError', 'attempt to get argmin of an empty sequence');
    return s.index.boxed(best);
  }),
  nlargest: (s) => bound(s, 'Series', 'nlargest', (a, k) => { const { n } = parseArgs('nlargest', a, k, [['n', pyInt(5)], ['keep', 'first']]); return nTop(s, n, true); }),
  nsmallest: (s) => bound(s, 'Series', 'nsmallest', (a, k) => { const { n } = parseArgs('nsmallest', a, k, [['n', pyInt(5)], ['keep', 'first']]); return nTop(s, n, false); }),
  mode: (s) => bound(s, 'Series', 'mode', (a, k) => {
    parseArgs('mode', a, k, [['dropna', true]]);
    const counts = valueCounts(s.values.filter((x) => !isMissing(x)));
    const top = counts.length ? counts[0][1] : 0;
    const vals = counts.filter(([, c]) => c === top).map(([v]) => v);
    const order = sortOrder(vals, true);
    return new Series(order.map((i) => vals[i]), Index.range(vals.length), { name: s.name, dtype: s.dtype });
  }),
  cumsum: (s) => bound(s, 'Series', 'cumsum', () => {
    const nums = s.requireNumeric('누적 합');
    let acc = 0;
    return s.copyWith(nums.map((x) => { if (Number.isNaN(x)) return NaN; acc += x; return acc; }), s.index, s.dtype === 'bool' ? 'int64' : s.dtype);
  }),
  duplicated: (s) => bound(s, 'Series', 'duplicated', (a, k) => { const { keep } = parseArgs('duplicated', a, k, [['keep', 'first']]); return s.copyWith(seriesDuplicated(s, keep), s.index, 'bool'); }),
  drop_duplicates: (s) => bound(s, 'Series', 'drop_duplicates', (a, k) => {
    const { keep } = parseArgs('drop_duplicates', a, k, [['keep', 'first'], ['inplace', false], ['ignore_index', false]]);
    const d = seriesDuplicated(s, keep);
    return s.take(d.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0));
  }),
  clip: (s) => bound(s, 'Series', 'clip', (a, k) => {
    const o = parseArgs('clip', a, k, [['lower', null], ['upper', null]]);
    const lo = o.lower == null ? -Infinity : toNumber(o.lower), hi = o.upper == null ? Infinity : toNumber(o.upper);
    const nums = s.requireNumeric('clip');
    const floaty = (o.lower instanceof Num && o.lower.isFloat) || (o.upper instanceof Num && o.upper.isFloat);
    return s.copyWith(nums.map((x) => (Number.isNaN(x) ? x : Math.min(Math.max(x, lo), hi))), s.index, floaty && isIntD(s.dtype) ? 'float64' : s.dtype);
  }),
  to_frame: (s) => bound(s, 'Series', 'to_frame', (a, k) => {
    const { name } = parseArgs('to_frame', a, k, [['name', null]]);
    const nm = name ?? s.name ?? 0;
    return new DataFrame([nm], { [nm]: [...s.values] }, s.index, { [nm]: s.dtype });
  }),
  unstack: (s) => bound(s, 'Series', 'unstack', (a, k) => {
    const o = parseArgs('unstack', a, k, [['level', pyInt(-1)], ['fill_value', null], ['sort', true]]);
    const lv = o.level instanceof Num ? o.level.v : typeof o.level === 'string' ? s.index.names?.indexOf(o.level) : -1;
    return unstackSeries(s, o.fill_value, lv);
  }),
  rank: () => { throw new NotSupported('rank( ) — 순위가 필요하면 sort_values( ) 로 정렬해 보세요'); },
  agg: (s) => bound(s, 'Series', 'agg', (a, k, ctx) => {
    const { func } = parseArgs('agg', a, k, [['func', REQUIRED]]);
    if (typeof func === 'string') return s.getattr(func).fn([], new Map(), ctx);
    if (Array.isArray(func)) {
      const names = func.map(pyStr);
      const vals = names.map((f) => s.getattr(f).fn([], new Map(), ctx));
      return seriesFromValues(vals, new Index(names), s.name);
    }
    throw new NotSupported('agg(이런 값)');
  }),
  item: (s) => bound(s, 'Series', 'item', () => {
    if (s.length !== 1) throw new PyError('ValueError', 'can only convert an array of size 1 to a Python scalar');
    return pyValueOf(s.values[0], s.dtype);
  }),
  diff: (s) => bound(s, 'Series', 'diff', (a, k) => {
    const { periods } = parseArgs('diff', a, k, [['periods', pyInt(1)]]);
    const p = toNumber(periods);
    if (s.dtype === DT || s.dtype === TD) return new Series(s.values.map((x, i) => (i - p < 0 || i - p >= s.length ? NaN : x - s.values[i - p])), s.index, { name: s.name, dtype: TD });
    const n = s.requireNumeric('차이');
    return new Series(n.map((x, i) => (i - p < 0 || i - p >= n.length ? NaN : x - n[i - p])), s.index, { name: s.name, dtype: 'float64' });
  }),
  shift: () => { throw new NotSupported('shift( )'); },
});

function pyValueOf(x, dtype) {
  if (dtype === 'float64') return pyFloatNum(x);
  if (isIntD(dtype)) return pyInt(x);
  if (dtype === DT) return boxDate(x);
  if (dtype === 'bool') return Boolean(x);
  return x;
}

function clampN(n, len) {
  const v = toNumber(n, 'head( )·tail( ) 괄호 안');
  return v < 0 ? Math.max(len + v, 0) : Math.min(v, len);
}

function sortOrder(values, asc) { return sortOrderMulti([values], [asc]); }
// 여러 열로 정렬 — 앞 열이 같으면 다음 열로. 안정 정렬(같은 값은 원래 차례대로)이다.
//  ⚠ 진짜 pandas 의 sort_values(열 하나)는 quicksort 라서 같은 값끼리의 차례가 컴퓨터마다 다를 수 있다(SIMD 정렬).
//    이 엔진은 늘 원래 차례를 지킨다 — 레슨에서는 같은 값이 없는 열로 정렬한다.
export function sortOrderMulti(cols, ascs, naFirst = false) {
  const idx = cols[0].map((_, i) => i);
  const key = (x) => (isMissing(x) ? null : x instanceof Num ? x.v : x instanceof Timestamp ? x.ms : x);
  return idx.sort((a, b) => {
    for (let j = 0; j < cols.length; j++) {
      const x = key(cols[j][a]), y = key(cols[j][b]);
      const asc = ascs[j];
      if (x === null && y === null) continue;
      if (x === null) return naFirst ? -1 : 1; // 빈칸은 맨 뒤(na_position='last')
      if (y === null) return naFirst ? 1 : -1;
      if (x < y) return asc ? -1 : 1;
      if (x > y) return asc ? 1 : -1;
    }
    return 0;
  });
}

// KeyError 의 글자는 파이썬 repr 모양 — 작은따옴표가 들어 있으면 큰따옴표로 감싼다
function keyErrText(msg) { return msg.includes("'") ? `"${msg}"` : `'${msg}'`; }

function pyListOf(labels) {
  return '[' + labels.map((l) => (typeof l === 'string' ? strRepr(l) : String(l))).join(', ') + ']';
}

// ─────────────────────────────────────────────────────────────
// DataFrame — 표
// ─────────────────────────────────────────────────────────────
export class DataFrame {
  constructor(columns, data, index, dtypes) {
    this.columns = columns; this.data = data; this.index = index; this.dtypes = dtypes;
    this.columnsName = null; this.columnsDtype = null; // pivot_table·unstack 결과의 열 이름표 이름
  }
  get pyType() { return 'DataFrame'; }
  keepMeta(o) { o.columnsName = this.columnsName; o.columnsDtype = this.columnsDtype; return o; }
  get nrows() { return this.index.length; }

  static fromCSV(text, { indexCol = null, parseDates = null, sep = ',', usecols = null } = {}) {
    const lines = splitCSV(text.replace(/^﻿/, ''), sep);
    const header = (lines[0] ?? []).map((h, j) => (h === '' ? `Unnamed: ${j}` : h));
    const rows = lines.slice(1);
    const data = {}, dtypes = {};
    header.forEach((h, j) => {
      const raw = rows.map((r) => r[j] ?? '');
      const numeric = raw.every((x) => x === '' || (!Number.isNaN(Number(x)) && x.trim() !== ''));
      if (numeric) {
        const hasNa = raw.some((x) => x === '');
        const allInt = raw.every((x) => x === '' || /^-?\d+$/.test(x));
        data[h] = raw.map((x) => (x === '' ? NaN : Number(x)));
        dtypes[h] = allInt && !hasNa ? 'int64' : 'float64';
      } else if (raw.every((x) => x === '' || x === 'True' || x === 'False') && raw.some((x) => x !== '') && !raw.some((x) => x === '')) {
        data[h] = raw.map((x) => x === 'True');
        dtypes[h] = 'bool';
      } else {
        data[h] = raw.map((x) => (x === '' ? NaN : x));
        dtypes[h] = 'object';
      }
    });
    let df = new DataFrame(header, data, Index.range(rows.length), dtypes);
    if (parseDates) for (const c of parseDates) { if (!(c in df.data)) throw new PyError('ValueError', `Missing column provided to 'parse_dates': '${c}'`); df.data[c] = df.data[c].map((x) => (typeof x === 'string' ? (parseDate(x) ?? NaN) : NaN)); df.dtypes[c] = DT; }
    if (usecols) df = df.selectColumns(usecols);
    if (indexCol != null) {
      const name = typeof indexCol === 'number' ? df.columns[indexCol] : indexCol;
      if (!(name in df.data)) throw new PyError('ValueError', `Index ${name} invalid`);
      const idx = new Index(df.data[name], { name: /^Unnamed: \d+$/.test(name) ? null : name, dtype: df.dtypes[name] === 'object' ? null : df.dtypes[name] });
      df = df.selectColumns(df.columns.filter((c) => c !== name));
      df.index = idx;
    }
    return df;
  }


  col(name) {
    if (!(name in this.data)) {
      throw new PyError('KeyError', strRepr(String(name)), columnHint(this, String(name)));
    }
    return new Series(this.data[name], this.index, { name, dtype: this.dtypes[name], parent: { df: this, column: name } });
  }

  // positions 에 있는 줄만 새 표로 (항상 복사본)
  takeRows(positions, index = this.index.take(positions)) {
    const data = {};
    for (const c of this.columns) data[c] = positions.map((p) => this.data[c][p]);
    return this.keepMeta(new DataFrame([...this.columns], data, index, { ...this.dtypes }));
  }
  sliceRows(a, b) {
    const data = {};
    for (const c of this.columns) data[c] = this.data[c].slice(a, b);
    return this.keepMeta(new DataFrame([...this.columns], data, this.index.slice(a, b), { ...this.dtypes }));
  }
  selectColumns(cols) {
    const missing = cols.filter((c) => !(c in this.data));
    if (missing.length) {
      throw new PyError('KeyError', `"${pyListOf(missing)} not in index"`, columnHint(this, String(missing[0])));
    }
    const data = {}, dtypes = {};
    for (const c of cols) { data[c] = [...this.data[c]]; dtypes[c] = this.dtypes[c]; }
    return this.keepMeta(new DataFrame([...cols], data, this.index, dtypes));
  }
  copy() {
    const data = {};
    for (const c of this.columns) data[c] = [...this.data[c]];
    return this.keepMeta(new DataFrame([...this.columns], data, this.index, { ...this.dtypes }));
  }
  // inplace 명령이 자기 자신을 통째로 바꿀 때
  assignFrom(o) { this.columns = o.columns; this.data = o.data; this.index = o.index; this.dtypes = o.dtypes; this.columnsName = o.columnsName; this.columnsDtype = o.columnsDtype; }

  numericColumns() { return this.columns.filter((c) => NUMERIC.has(this.dtypes[c])); }

  equals(o) {
    return o instanceof DataFrame && o.columns.join('\u0000') === this.columns.join('\u0000') && o.index.equals(this.index) &&
      this.columns.every((c) => o.dtypes[c] === this.dtypes[c] &&
        this.data[c].every((x, i) => x === o.data[c][i] || (isMissing(x) && isMissing(o.data[c][i]))));
  }

  repr() { return renderFrame(this); }
  str() { return renderFrame(this); }

  getattr(name) {
    const m = FRAME_METHODS[name];
    if (m) return m(this);
    if (name in this.data) return this.col(name);
    return undefined;
  }
}

function columnHint(df, wrong) {
  const near = nearest(wrong, df.columns);
  const list = df.columns.map((c) => `'${c}'`).join(', ');
  return (near ? `혹시 '${near}' 아닐까요? ` : '') + `이 표에 있는 열 이름: ${list}`;
}

// CSV 글자 → 줄마다 칸 목록. 큰따옴표로 감싼 칸(쉼표·줄바꿈 포함)을 읽는다.
function splitCSV(text, sep = ',') {
  const rows = [];
  let row = [], cell = '', q = false, i = 0, quoted = false;
  const t = text.replace(/\r\n?/g, '\n');
  while (i < t.length) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i += 2; continue; } q = false; i++; continue; }
      cell += c; i++; continue;
    }
    if (c === '"' && cell === '') { q = true; quoted = true; i++; continue; }
    if (c === sep) { row.push(cell); cell = ''; quoted = false; i++; continue; }
    if (c === '\n') { row.push(cell); if (row.length > 1 || row[0] !== '' || quoted) rows.push(row); row = []; cell = ''; quoted = false; i++; continue; }
    cell += c; i++;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// 비슷한 이름 찾기 (오타 도우미)
export function nearest(word, candidates, max = 3) {
  let best = null, bestD = Infinity;
  for (const c of candidates) {
    const d = editDistance(word.toLowerCase(), c.toLowerCase());
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD <= Math.max(1, Math.min(max, Math.floor(word.length / 3))) ? best : null;
}
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// 열마다 줄여서 Series 하나로 (df.mean(), df.isnull().sum() …)
function reduceFrame(df, how, { numericOnly = false, axis = 0, ddof = 1 } = {}) {
  if (axis === 1 || axis === 'columns') {
    const cols = numericOnly || how !== 'count' ? df.numericColumns() : df.columns;
    const out = [];
    for (let i = 0; i < df.nrows; i++) {
      const rowSeries = new Series(cols.map((c) => (df.dtypes[c] === 'bool' ? (df.data[c][i] ? 1 : 0) : df.data[c][i])), new Index(cols), { dtype: cols.every((c) => df.dtypes[c] === 'bool') ? 'bool' : 'float64' });
      out.push(reduceSeries(rowSeries, how, { ddof }));
    }
    const allInt = cols.every((c) => isIntD(df.dtypes[c]) || df.dtypes[c] === 'bool');
    const dtype = out.every((v) => v instanceof Num && v.k === 'b_') ? 'bool' : allInt && ['sum', 'min', 'max', 'count'].includes(how) ? 'int64' : 'float64';
    return new Series(out.map((v) => v.v), df.index, { dtype });
  }
  let cols = df.columns;
  if (numericOnly) cols = df.numericColumns();
  else if (!['count', 'min', 'max', 'sum'].includes(how)) {
    const objs = cols.filter((c) => df.dtypes[c] === 'object');
    const obj = objs[0];
    if (obj) {
      const joined = objs.map((c) => `'${df.data[c].filter((x) => !isMissing(x)).join('')}'`).join(' ');
      throw new PyError('TypeError', `Could not convert [${joined}] to numeric`,
        `'${obj}' 열이 글자라서 ${how}( ) 계산을 할 수 없습니다. 숫자 열만 계산하려면 ${how}(numeric_only=True) 처럼 쓰세요.`);
    }
  }
  const results = cols.map((c) => reduceSeries(new Series(df.data[c], df.index, { name: c, dtype: df.dtypes[c] }), how, { ddof }));
  const allF = results.every((v) => v instanceof Num && v.k === 'f64');
  const allI = results.every((v) => v instanceof Num && (v.k === 'i64' || v.k === 'i32'));
  const allB = results.every((v) => v instanceof Num && v.k === 'b_');
  const ri = new Index([...cols], { name: df.columnsName ?? null });
  if (allF) return new Series(results.map((v) => v.v), ri, { dtype: 'float64' });
  if (allI) return new Series(results.map((v) => v.v), ri, { dtype: 'int64' });
  if (allB) return new Series(results.map((v) => Boolean(v.v)), ri, { dtype: 'bool' });
  return new Series(results.map((v) => (v instanceof Num ? new Num(v.v, v.k === 'f64' ? 'float' : 'int') : v)), ri, { dtype: 'object' });
}

const DESC_NUM = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];
const DESC_ALL = ['count', 'unique', 'top', 'freq', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];
function describeFrame(df, include = null, pcts = null) {
  const pc = pcts ?? [0.25, 0.5, 0.75];
  const numRows = ['count', 'mean', 'std', 'min', ...pc.map(pctLabel), 'max'];
  const inc = include == null ? null : Array.isArray(include) ? include.map(pyStr) : [pyStr(include)];
  const isObj = (c) => df.dtypes[c] === 'object' || df.dtypes[c] === 'bool';
  if (inc && (inc.includes('all') || inc.some((x) => ['object', 'O', 'str'].includes(x)))) {
    const cols = inc.includes('all') ? [...df.columns] : df.columns.filter(isObj);
    if (!cols.length) throw new PyError('ValueError', 'No objects to concatenate');
    const hasObj = cols.some(isObj), hasNum = cols.some((c) => !isObj(c));
    const rows = hasObj && hasNum ? [...DESC_ALL.slice(0, 4), ...numRows.slice(1)] : hasObj ? DESC_ALL.slice(0, 4) : numRows;
    const data = {}, dtypes = {};
    for (const c of cols) {
      const d = describeSeries(new Series(df.data[c], df.index, { name: c, dtype: df.dtypes[c] }), pcts);
      const byName = new Map(d.index.labels.map((l, i) => [l, d.values[i]]));
      data[c] = rows.map((r) => (byName.has(r) ? byName.get(r) : NaN));
      dtypes[c] = isObj(c) ? 'object' : 'float64';
    }
    return new DataFrame(cols, data, new Index([...rows]), dtypes);
  }
  const cols = df.numericColumns().filter((c) => df.dtypes[c] !== 'bool');
  if (!cols.length) return describeFrame(df, 'object', pcts);
  const data = {}, dtypes = {};
  for (const c of cols) { data[c] = describeSeries(new Series(df.data[c], df.index, { name: c, dtype: df.dtypes[c] }), pcts).values; dtypes[c] = 'float64'; }
  return new DataFrame(cols, data, new Index(numRows), dtypes);
}

// info() — 표의 요약 설명서
function infoText(df, { verbose = true, memory = true } = {}) {
  const lines = ["<class 'pandas.core.frame.DataFrame'>"];
  const n = df.nrows;
  if (df.index.isRange) lines.push(n ? `RangeIndex: ${n} entries, ${df.index.labels[0]} to ${df.index.labels[n - 1]}` : 'RangeIndex: 0 entries');
  else if (df.index instanceof MultiIndex) lines.push(`MultiIndex: ${n} entries, ${pyRepr(df.index.boxed(0))} to ${pyRepr(df.index.boxed(n - 1))}`);
  else { const f = df.index.formatted(); lines.push(n ? `${df.index.pyType}: ${n} entries, ${f[0]} to ${f[n - 1]}` : `${df.index.pyType}: 0 entries`); }
  if (!verbose) {
    // info(verbose=False) — 열 목록 대신 한 줄
    lines.push(df.columns.length ? `Columns: ${df.columns.length} entries, ${df.columns[0]} to ${df.columns[df.columns.length - 1]}` : 'Empty DataFrame');
  } else lines.push(`Data columns (total ${df.columns.length} columns):`);
  const heads = [' # ', 'Column', 'Non-Null Count', 'Dtype'];
  const rows = df.columns.map((c, i) => [` ${i}`, c, `${df.data[c].filter((x) => !isMissing(x)).length} non-null`, df.dtypes[c]]);
  const w = heads.map((h, j) => Math.max(h.length, ...rows.map((r) => r[j].length)));
  if (verbose) {
    lines.push(heads.map((h, j) => h.padEnd(w[j])).join('  '));
    lines.push(heads.map((h, j) => '-'.repeat(h.length).padEnd(w[j])).join('  '));
    for (const r of rows) lines.push(r.map((x, j) => x.padEnd(w[j])).join('  '));
  }
  const counts = {};
  for (const c of df.columns) counts[df.dtypes[c]] = (counts[df.dtypes[c]] ?? 0) + 1;
  lines.push('dtypes: ' + Object.keys(counts).sort().map((k) => `${k}(${counts[k]})`).join(', '));
  // 메모리: 값 칸마다 8바이트(참거짓은 1바이트) + 이름표
  let bytes = 0;
  for (const c of df.columns) bytes += n * (df.dtypes[c] === 'bool' ? 1 : df.dtypes[c] === 'int32' ? 4 : 8);
  bytes += df.index.isRange ? 132 : n * 8;
  // memory_usage=False 이면 이 줄이 없고, pandas 는 끝 줄바꿈도 붙이지 않는다
  if (!memory) return lines.join('\n');
  lines.push('memory usage: ' + sizeof(bytes, df.columns.some((c) => df.dtypes[c] === 'object') || (!df.index.isRange && df.index.dtype === 'object')));
  return lines.join('\n') + '\n';
}

function framePad(df, how, inplace) {
  const out = df.copy();
  for (const c of out.columns) out.data[c] = padValues(out.data[c], how);
  if (inplace === true) { df.assignFrom(out); return null; }
  return out;
}

function frameFillna(df, args, kw, ctx) {
  const { value, method, inplace } = parseArgs('fillna', args, kw, [['value', null], ['method', null], ['axis', null], ['inplace', false], ['limit', null], ['downcast', null]]);
  if (value === null && method !== null) {
    const how = padMethod(method);
    ctx.warn(methodWarning('DataFrame'));
    return framePad(df, how, inplace);
  }
  if (value === null) throw new PyError('ValueError', "Must specify a fill 'value' or 'method'.", 'fillna( ) 괄호 안에 채울 값을 넣어야 합니다.');
  const out = df.copy();
  for (const c of out.columns) {
    const v = fillValue(value, c);
    if (v === undefined) continue;
    if (out.dtypes[c] !== 'object' && !isNumberLike(v)) {
      if (!out.data[c].some(isMissing)) continue;
      throw new PyError('TypeError', `Invalid value '${pyStr(v)}' for dtype '${out.dtypes[c]}'`, '숫자 열의 빈칸은 숫자로 채워야 합니다.');
    }
    out.data[c] = out.data[c].map((x) => (isMissing(x) ? (out.dtypes[c] === 'object' ? v : toNumber(v)) : x));
  }
  if (inplace === true) { df.assignFrom(out); return null; }
  return out;
}

function frameDrop(df, args, kw) {
  const o = parseArgs('drop', args, kw, [['labels', null], ['axis', pyInt(0)], ['index', null], ['columns', null], ['inplace', false]]);
  let rowLabels = o.index != null ? toLabels(o.index) : null;
  let colLabels = o.columns != null ? toLabels(o.columns) : null;
  if (o.labels != null) {
    const ax = o.axis instanceof Num ? o.axis.v : o.axis;
    if (ax === 1 || ax === 'columns') colLabels = toLabels(o.labels); else rowLabels = toLabels(o.labels);
  }
  if (rowLabels == null && colLabels == null) {
    throw new PyError('TypeError', "Need to specify at least one of 'labels', 'index' or 'columns'", '무엇을 지울지 index= 또는 columns= 로 알려 주세요.');
  }
  let out = df;
  if (rowLabels) {
    const missing = rowLabels.filter((l) => !df.index.has(l));
    if (missing.length) throw new PyError('KeyError', keyErrText(`${pyListOf(missing)} not found in axis`), '지우려는 줄 번호가 표에 없습니다. 이미 지웠거나 번호가 틀렸는지 확인하세요. 열을 지우려면 axis=1 을 붙이세요.');
    const set = new Set(rowLabels);
    out = df.takeRows(df.index.labels.map((l, i) => (set.has(l) ? -1 : i)).filter((i) => i >= 0));
  }
  if (colLabels) {
    const missing = colLabels.filter((c) => !(c in df.data));
    if (missing.length) throw new PyError('KeyError', keyErrText(`${pyListOf(missing)} not found in axis`), columnHint(df, String(missing[0])));
    out = out.selectColumns(out.columns.filter((c) => !colLabels.includes(c)));
  }
  if (o.inplace === true) { df.assignFrom(out === df ? df.copy() : out); return null; }
  return out === df ? df.copy() : out;
}

function frameDropna(df, args, kw) {
  const o = parseArgs('dropna', args, kw, [['axis', pyInt(0)], ['how', 'any'], ['subset', null], ['inplace', false]]);
  const cols = o.subset ? toLabels(o.subset) : df.columns;
  const keep = [];
  for (let i = 0; i < df.nrows; i++) {
    const miss = cols.map((c) => isMissing(df.data[c][i]));
    const drop = o.how === 'all' ? miss.every(Boolean) : miss.some(Boolean);
    if (!drop) keep.push(i);
  }
  const out = df.takeRows(keep);
  if (o.inplace === true) { df.assignFrom(out); return null; }
  return out;
}

// ─────────────────────────────────────────────────────────────
// groupby — 맷플롯립 1차시에서 배운 df.groupby('열').mean() 과, 원 그래프를 셀 때 쓰는 size()·count()
// 무리 이름표는 pandas 처럼 정렬하고(sort=True) 빈 이름표는 뺀다(dropna=True).
// 평균·합은 pandas 의 group_mean·group_sum 처럼 Kahan 합으로, 분산은 Welford 방식으로 셈해 끝자리까지 맞춘다.
// ─────────────────────────────────────────────────────────────
let gbAddr = 0x7f1a2c3d4e50;
const GB_NOT_HERE = new Set(['apply', 'describe', 'value_counts', 'head', 'tail', 'filter', 'plot', 'hist', 'boxplot', 'get_group',
  'groups', 'quantile', 'prod', 'cumsum', 'cumcount', 'rank', 'sem', 'idxmax', 'idxmin', 'nth', 'ohlc', 'pipe', 'rolling', 'expanding',
  'resample', 'unique', 'corr', 'cov', 'diff', 'shift', 'fillna', 'indices', 'all', 'any']);
const AGG_NAMES = ['mean', 'median', 'sum', 'min', 'max', 'std', 'var', 'count', 'size', 'nunique', 'first', 'last'];

// 이름표 정렬 — 수는 크기대로, 글자는 파이썬처럼 글자 번호 차례대로
function cmpLabel(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const x = String(a), y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

// keys: [{ name, values(자바스크립트 값 배열), dtype, isColumn }]
class GroupBy {
  constructor(df, keys, select, series, { asIndex = true, sort = true } = {}) {
    this.df = df; this.keys = keys; this.select = select; this.series = series;
    this.asIndex = asIndex; this.sort = sort;
    gbAddr += 0x3a0; this.addr = '0x' + gbAddr.toString(16);
    // 무리 나누기 — 이름표(들) → 줄 번호들. 빈 이름표가 낀 줄은 뺀다(dropna=True).
    const m = new Map();
    for (let i = 0; i < df.nrows; i++) {
      const tup = keys.map((k) => k.values[i]);
      if (tup.some((x) => isMissing(x))) continue;
      const kk = JSON.stringify(tup);
      if (!m.has(kk)) m.set(kk, { tup, rows: [] });
      m.get(kk).rows.push(i);
    }
    let entries = [...m.values()];
    if (sort) entries.sort((p, q) => { for (let j = 0; j < keys.length; j++) { const c = cmpLabel(p.tup[j], q.tup[j]); if (c) return c; } return 0; });
    this.tuples = entries.map((e) => e.tup);
    this.groups = entries.map((e) => e.rows);
  }
  get pyType() { return this.series ? 'SeriesGroupBy' : 'DataFrameGroupBy'; }
  repr() { return `<pandas.core.groupby.generic.${this.pyType} object at ${this.addr}>`; }
  str() { return this.repr(); }
  index() {
    if (this.keys.length === 1) return new Index(this.tuples.map((t) => t[0]), { name: this.keys[0].name, dtype: this.keys[0].dtype === 'object' ? null : this.keys[0].dtype });
    return new MultiIndex(this.keys.map((k, j) => this.tuples.map((t) => t[j])), { names: this.keys.map((k) => k.name), dtypes: this.keys.map((k) => k.dtype) });
  }
  keyNames() { return this.keys.filter((k) => k.isColumn).map((k) => k.name); }
  columns() { return this.select ?? this.df.columns.filter((c) => !this.keyNames().includes(c)); }

  getitem(key) {
    if (this.series) throw new NotSupported('SeriesGroupBy[…]');
    if (typeof key === 'string' || key instanceof Num) {
      const c = toLabel(key);
      if (!(c in this.df.data)) throw new PyError('KeyError', strRepr(`Column not found: ${c}`), columnHint(this.df, String(c)));
      return this.derive([c], true);
    }
    const cols = toLabels(key);
    const miss = cols.filter((c) => !(c in this.df.data));
    if (miss.length) throw new PyError('KeyError', strRepr(`Columns not found: ${miss.map((c) => strRepr(String(c))).join(', ')}`), columnHint(this.df, String(miss[0])));
    return this.derive(cols, false);
  }
  derive(select, series) {
    const g = Object.create(GroupBy.prototype);
    Object.assign(g, this, { select, series });
    gbAddr += 0x3a0; g.addr = '0x' + gbAddr.toString(16);
    return g;
  }

  getattr(name) {
    const self = this;
    const agg = (how) => bound(this, this.pyType, how, (a, k) => {
      const o = parseArgs(how, a, k, how === 'std' || how === 'var' ? [['ddof', pyInt(1)], ['numeric_only', false]] : [['numeric_only', false]]);
      return self.reduce(how, { numericOnly: o.numeric_only === true, ddof: o.ddof ? toNumber(o.ddof) : 1 });
    });
    switch (name) {
      case 'size': return bound(this, this.pyType, 'size', (a, k) => { parseArgs('size', a, k, []); return this.sizes(); });
      case 'count': return bound(this, this.pyType, 'count', (a, k) => { parseArgs('count', a, k, []); return this.reduce('count'); });
      case 'mean': case 'median': case 'sum': case 'min': case 'max': case 'std': case 'var': return agg(name);
      case 'nunique': return bound(this, this.pyType, 'nunique', () => this.reduce('nunique'));
      case 'first': case 'last': return bound(this, this.pyType, name, () => this.reduce(name));
      case 'ngroups': return pyInt(this.tuples.length);
      case 'agg': case 'aggregate': return bound(this, this.pyType, name, (a, k) => this.agg(a, k));
      case 'transform': return bound(this, this.pyType, 'transform', (a, k) => {
        const { func } = parseArgs('transform', a, k, [['func', REQUIRED]]);
        if (typeof func !== 'string') throw new NotSupported("transform(함수) — transform('mean') 처럼 이름을 글자로 쓰세요");
        return this.transform(pyStr(func));
      });
    }
    if (GB_NOT_HERE.has(name)) throw new NotSupported(`${this.pyType}.${name}`);
    if (!this.series && name in this.df.data) return this.getitem(name);
    return undefined;
  }

  // as_index=False 이면 이름표를 열로 꺼낸 표로
  finish(out) {
    if (this.asIndex) return out;
    const idx = out.index;
    const frame = out instanceof Series ? new DataFrame([out.name ?? 'size'], { [out.name ?? 'size']: out.values }, idx, { [out.name ?? 'size']: out.dtype }) : out;
    const keyCols = this.keys.map((k) => k.name);
    const data = {}, dtypes = {};
    this.keys.forEach((k, j) => { data[k.name] = this.tuples.map((t) => t[j]); dtypes[k.name] = k.dtype; });
    for (const c of frame.columns) { if (!(c in data)) { data[c] = frame.data[c]; dtypes[c] = frame.dtypes[c]; } }
    return new DataFrame([...keyCols, ...frame.columns.filter((c) => !keyCols.includes(c))], data, Index.range(this.tuples.length), dtypes);
  }

  sizes() {
    return this.finish(new Series(this.groups.map((g) => g.length), this.index(), { name: this.series ? this.select[0] : null, dtype: 'int64' }));
  }

  // 무리마다 한 열을 줄이기
  reduceColumn(c, how, ddof = 1) {
    const vals = this.df.data[c], dt = this.df.dtypes[c];
    if (how === 'count') return { dtype: 'int64', values: this.groups.map((g) => g.filter((i) => !isMissing(vals[i])).length) };
    if (how === 'nunique') return { dtype: 'int64', values: this.groups.map((g) => new Set(g.filter((i) => !isMissing(vals[i])).map((i) => valueKey(box(vals[i], dt)))).size) };
    if (how === 'first' || how === 'last') {
      return { dtype: dt, values: this.groups.map((g) => { const v = g.map((i) => vals[i]).filter((x) => !isMissing(x)); return v.length ? (how === 'first' ? v[0] : v[v.length - 1]) : NaN; }) };
    }
    if (dt === 'object') {
      if (how === 'sum') return { dtype: 'object', values: this.groups.map((g) => g.filter((i) => !isMissing(vals[i])).map((i) => pyStr(vals[i])).join('')) };
      if (how === 'min' || how === 'max') {
        return { dtype: 'object', values: this.groups.map((g) => { const v = g.map((i) => vals[i]).filter((x) => !isMissing(x)); return v.length ? v.reduce((m, x) => ((how === 'min' ? pyStr(x) < pyStr(m) : pyStr(x) > pyStr(m)) ? x : m)) : NaN; }) };
      }
      throw new PyError('TypeError', `agg function failed [how->${how},dtype->object]`,
        `'${c}' 열이 글자라서 ${how}( ) 계산을 할 수 없습니다. 숫자 열만 계산하려면 ${how}(numeric_only=True) 처럼 쓰거나, 계산할 열을 ['열이름'] 으로 고르세요.`);
    }
    if (dt === DT) {
      if (how === 'min' || how === 'max') return { dtype: DT, values: this.groups.map((g) => { const v = g.map((i) => vals[i]).filter((x) => !Number.isNaN(x)); return v.length ? (how === 'min' ? Math.min(...v) : Math.max(...v)) : NaN; }) };
      throw new NotSupported(`날짜 열의 groupby ${how}( )`);
    }
    const num = (i) => (dt === 'bool' ? (vals[i] ? 1 : 0) : vals[i]);
    const out = this.groups.map((g) => {
      const xs = g.map(num).filter((x) => !Number.isNaN(x));
      if (how === 'sum' || how === 'mean') {
        let s = 0, comp = 0;                          // Kahan 합 (pandas group_sum · group_mean)
        for (const x of xs) { const y = x - comp, t = s + y; comp = t - s - y; if (Number.isNaN(comp)) comp = 0; s = t; }
        return how === 'sum' ? s : xs.length ? s / xs.length : NaN;
      }
      if (how === 'std' || how === 'var') {
        let n = 0, mean = 0, m2 = 0;                  // Welford (pandas group_var)
        for (const x of xs) { n++; const old = mean; mean += (x - old) / n; m2 += (x - mean) * (x - old); }
        const v = n - ddof > 0 ? m2 / (n - ddof) : NaN;
        return how === 'std' ? Math.sqrt(v) : v;
      }
      if (how === 'median') return nanMedian(xs);
      if (how === 'min' || how === 'max') return xs.length ? xs.reduce((m, x) => (how === 'min' ? (x < m ? x : m) : (x > m ? x : m))) : NaN;
      throw new Error(how);
    });
    let dtype = 'float64';
    if ((how === 'sum' || how === 'min' || how === 'max') && isIntD(dt) && out.every((x) => !Number.isNaN(x))) dtype = how === 'sum' ? 'int64' : dt;
    if (how === 'sum' && dt === 'bool') dtype = 'int64';
    if ((how === 'min' || how === 'max') && dt === 'bool') dtype = 'bool';
    return { dtype, values: dtype === 'bool' ? out.map(Boolean) : out };
  }

  reduce(how, { numericOnly = false, ddof = 1 } = {}) {
    let cols = this.columns();
    if (numericOnly) cols = cols.filter((c) => NUMERIC.has(this.df.dtypes[c]));
    const parts = cols.map((c) => [c, this.reduceColumn(c, how, ddof)]);
    if (this.series) { const [c, r] = parts[0]; return this.finish(new Series(r.values, this.index(), { name: c, dtype: r.dtype })); }
    const data = {}, dtypes = {};
    for (const [c, r] of parts) { data[c] = r.values; dtypes[c] = r.dtype; }
    return this.finish(new DataFrame(cols, data, this.index(), dtypes));
  }

  // agg('sum') · agg(['mean', 'max']) · agg({'가격': 'mean'}) · agg(평균=('가격', 'mean'))
  agg(a, k) {
    const named = [...k.entries()].filter(([, v]) => v instanceof Tuple);
    if (named.length) {
      const data = {}, dtypes = {}, cols = [];
      for (const [nm, t] of named) {
        const [col, fn] = t.items.map(pyStr);
        if (!(col in this.df.data)) throw new PyError('KeyError', `"Column(s) ['${col}'] do not exist"`, columnHint(this.df, col));
        const r = this.reduceColumn(col, checkAgg(fn));
        cols.push(nm); data[nm] = r.values; dtypes[nm] = r.dtype;
      }
      return this.finish(new DataFrame(cols, data, this.index(), dtypes));
    }
    const func = a[0] ?? k.get('func');
    if (typeof func === 'string') {
      const f = checkAgg(func);
      return f === 'size' ? this.sizes() : this.reduce(f);
    }
    if (Array.isArray(func)) {
      if (!this.series) throw new NotSupported("표 전체에 agg(['…', '…']) — 열을 하나 골라 df.groupby('열')['값'].agg(['mean', 'max']) 처럼 쓰세요");
      const c = this.select[0];
      const fns = func.map((f) => checkAgg(pyStr(f)));
      const data = {}, dtypes = {};
      for (const f of fns) { const r = f === 'size' ? { dtype: 'int64', values: this.groups.map((g) => g.length) } : this.reduceColumn(c, f); data[f] = r.values; dtypes[f] = r.dtype; }
      return this.finish(new DataFrame(fns, data, this.index(), dtypes));
    }
    if (func instanceof Dict) {
      const data = {}, dtypes = {}, cols = [];
      for (const [kk, v] of func.map) {
        const col = pyStr(kk);
        if (!(col in this.df.data)) throw new PyError('KeyError', `"Column(s) ['${col}'] do not exist"`, columnHint(this.df, col));
        if (typeof v !== 'string') throw new NotSupported("agg({'열': [여러 계산]}) — 계산 이름 하나만 글자로 쓰세요");
        const r = this.reduceColumn(col, checkAgg(v));
        cols.push(col); data[col] = r.values; dtypes[col] = r.dtype;
      }
      return this.finish(new DataFrame(cols, data, this.index(), dtypes));
    }
    throw new NotSupported('agg(함수) — agg(\'mean\') 처럼 계산 이름을 글자로 쓰세요');
  }

  // 무리 계산 결과를 원래 줄마다 다시 펼치기
  transform(func) {
    const f = checkAgg(func);
    const cols = this.columns();
    const spread = (r) => { const out = Array(this.df.nrows).fill(NaN); this.groups.forEach((g, j) => g.forEach((i) => { out[i] = r.values[j]; })); return out; };
    if (this.series) {
      const c = cols[0];
      const r = f === 'size' ? { dtype: 'int64', values: this.groups.map((g) => g.length) } : this.reduceColumn(c, f);
      return new Series(spread(r), this.df.index, { name: c, dtype: r.dtype });
    }
    const data = {}, dtypes = {};
    for (const c of cols) { const r = this.reduceColumn(c, f); data[c] = spread(r); dtypes[c] = r.dtype; }
    return new DataFrame(cols, data, this.df.index, dtypes);
  }
}
function checkAgg(f) {
  if (!AGG_NAMES.includes(f)) {
    const near = nearest(f, AGG_NAMES);
    throw new PyError('AttributeError', `'SeriesGroupBy' object has no attribute '${f}'`, near ? `혹시 '${near}' 아닐까요?` : `쓸 수 있는 계산: ${AGG_NAMES.join(', ')}`);
  }
  return f;
}

function groupbyOf(d, a, k) {
  const o = parseArgs('groupby', a, k, [['by', null], ['axis', null], ['level', null], ['as_index', true], ['sort', true], ['group_keys', true], ['observed', null], ['dropna', true]]);
  if (o.by == null) throw new PyError('TypeError', "You have to supply one of 'by' and 'level'");
  if (o.dropna === false) throw new NotSupported('groupby(…, dropna=False)');
  const list = Array.isArray(o.by) ? o.by : [o.by];
  const keys = list.map((by) => {
    if (by instanceof Series) {
      // df.groupby(df['열']) — 표의 열이면 이름으로 묶은 것과 같다
      if (by.parent?.df === d && by.name in d.data) return { name: by.name, values: d.data[by.name], dtype: d.dtypes[by.name], isColumn: true };
      if (by.length !== d.nrows) throw new PyError('ValueError', `Grouper and axis must be same length`);
      const vals = by.index.equals(d.index) ? by.values : d.index.labels.map((l) => { const p = by.index.pos(l); return p === undefined ? NaN : by.values[p]; });
      return { name: by.name, values: vals, dtype: by.dtype, isColumn: false };
    }
    const name = toLabel(by);
    if (!(name in d.data)) throw new PyError('KeyError', typeof name === 'string' ? strRepr(name) : String(name), columnHint(d, String(name)));
    return { name, values: d.data[name], dtype: d.dtypes[name], isColumn: true };
  });
  return new GroupBy(d, keys, null, false, { asIndex: o.as_index !== false, sort: o.sort !== false });
}

// 여러 단계 이름표 시리즈를 표로 펼치기 — 마지막 단계가 열이 된다
function unstackSeries(s, fill, level = -1) {
  if (!(s.index instanceof MultiIndex)) throw new NotSupported('이름표가 한 단계인 시리즈의 unstack( )');
  const mi = s.index;
  const L = level < 0 ? mi.nlevels + level : level;
  if (L < 0 || L >= mi.nlevels) throw new PyError('IndexError', `Too many levels: Index has only ${mi.nlevels} levels, not ${level + 1}`);
  const keep = mi.arrays.map((_, j) => j).filter((j) => j !== L);
  const rowOf = (lab) => keep.map((j) => lab[j]);
  const rowKeys = new Map(), colKeys = new Map();
  mi.labels.forEach((lab) => {
    const r = JSON.stringify(rowOf(lab));
    if (!rowKeys.has(r)) rowKeys.set(r, rowOf(lab));
    const c = lab[L];
    if (!colKeys.has(JSON.stringify(c))) colKeys.set(JSON.stringify(c), c);
  });
  const rows = [...rowKeys.values()].sort((p, q) => { for (let j = 0; j < p.length; j++) { const c = cmpLabel(p[j], q[j]); if (c) return c; } return 0; });
  const cols = [...colKeys.values()].sort(cmpLabel);
  const rowPos = new Map(rows.map((r, i) => [JSON.stringify(r), i]));
  const hasFill = fill != null;
  const fillV = hasFill ? toNumber(fill) : NaN;
  const data = {}, dtypes = {};
  for (const c of cols) data[c] = Array(rows.length).fill(fillV);
  mi.labels.forEach((lab, i) => { data[lab[L]][rowPos.get(JSON.stringify(rowOf(lab)))] = s.values[i]; });
  const anyNa = cols.some((c) => data[c].some((x) => Number.isNaN(x)));
  for (const c of cols) dtypes[c] = s.dtype === 'object' ? 'object' : anyNa || (hasFill && fill instanceof Num && fill.isFloat) ? 'float64' : s.dtype;
  const index = keep.length === 1 ? new Index(rows.map((r) => r[0]), { name: mi.names[keep[0]], dtype: mi.dtypes[keep[0]] === 'object' ? null : mi.dtypes[keep[0]] })
    : new MultiIndex(keep.map((_, j) => rows.map((r) => r[j])), { names: keep.map((j) => mi.names[j]), dtypes: keep.map((j) => mi.dtypes[j]) });
  const out = new DataFrame(cols, data, index, dtypes);
  out.columnsName = mi.names[L];
  out.columnsDtype = mi.dtypes[L];
  return out;
}

const FRAME_METHODS = {
  groupby: (d) => bound(d, 'DataFrame', 'groupby', (a, k) => groupbyOf(d, a, k)),
  plot: (d) => plotAccessor(d, true),
  keys: (d) => bound(d, 'DataFrame', 'keys', () => new Index([...d.columns])),
  corr: (d) => bound(d, 'DataFrame', 'corr', (a, k) => {
    const o = parseArgs('corr', a, k, [['method', 'pearson'], ['min_periods', pyInt(1)], ['numeric_only', false]]);
    if (pyStr(o.method) !== 'pearson') throw new NotSupported(`corr(method='${pyStr(o.method)}')`);
    let cols = [...d.columns];
    if (o.numeric_only === true) cols = cols.filter((c) => d.dtypes[c] !== 'object');
    else {
      const bad = cols.find((c) => d.dtypes[c] === 'object');
      if (bad) numericValues(d.col(bad), 'corr( )');
    }
    const vals = Object.fromEntries(cols.map((c) => [c, d.data[c].map(Number)]));
    const data = {}, dtypes = {};
    for (const c of cols) { data[c] = cols.map((r) => welfordCorr(vals[r], vals[c])); dtypes[c] = 'float64'; }
    return new DataFrame(cols, data, new Index([...cols]), dtypes);
  }),
  shape: (d) => new Tuple([pyInt(d.nrows), pyInt(d.columns.length)]),
  columns: (d) => new Index([...d.columns]),
  index: (d) => d.index,
  size: (d) => pyInt(d.nrows * d.columns.length),
  empty: (d) => d.nrows === 0 || d.columns.length === 0,
  dtypes: (d) => new Series(d.columns.map((c) => d.dtypes[c]), new Index([...d.columns]), { dtype: 'object' }),
  values: (d) => NDArray.from2D(Array.from({ length: d.nrows }, (_, i) => d.columns.map((c) => d.data[c][i])),
    d.columns.length && d.columns.every((c) => d.dtypes[c] === 'bool') ? 'bool'
      : d.columns.every((c) => d.dtypes[c] === 'float64' || d.dtypes[c] === 'int64') ? 'float64' : 'object'),
  loc: (d) => new Indexer(d, 'loc'),
  iloc: (d) => new Indexer(d, 'iloc'),
  head: (d) => bound(d, 'NDFrame', 'head', (a, k) => { const { n } = parseArgs('head', a, k, [['n', pyInt(5)]]); return d.sliceRows(0, clampN(n, d.nrows)); }),
  tail: (d) => bound(d, 'NDFrame', 'tail', (a, k) => { const { n } = parseArgs('tail', a, k, [['n', pyInt(5)]]); const m = clampN(n, d.nrows); return d.sliceRows(d.nrows - m, d.nrows); }),
  info: (d) => bound(d, 'DataFrame', 'info', (a, k, ctx) => {
    const o = parseArgs('info', a, k, [['verbose', null], ['buf', null], ['max_cols', null], ['memory_usage', null], ['show_counts', null]]);
    if (o.buf != null) throw new NotSupported('info(buf=…)');
    if (o.max_cols != null) throw new NotSupported('info(max_cols=…)');
    if (o.show_counts === false) throw new NotSupported('info(show_counts=False)');
    if (typeof o.memory_usage === 'string') throw new NotSupported(`info(memory_usage='${o.memory_usage}')`);
    ctx.print(infoText(d, { verbose: o.verbose !== false, memory: o.memory_usage !== false }));
    return null;
  }),
  describe: (d) => bound(d, 'NDFrame', 'describe', (a, k) => {
    const o = parseArgs('describe', a, k, [['percentiles', null], ['include', null], ['exclude', null]]);
    return describeFrame(d, o.include, describePercentiles(o.percentiles));
  }),
  isnull: (d) => bound(d, 'DataFrame', 'isnull', () => mapFrame(d, isMissing, 'bool')),
  isna: (d) => bound(d, 'DataFrame', 'isna', () => mapFrame(d, isMissing, 'bool')),
  notnull: (d) => bound(d, 'DataFrame', 'notnull', () => mapFrame(d, (x) => !isMissing(x), 'bool')),
  notna: (d) => bound(d, 'DataFrame', 'notna', () => mapFrame(d, (x) => !isMissing(x), 'bool')),
  sum: (d) => reducer(d, 'sum'),
  mean: (d) => reducer(d, 'mean'),
  median: (d) => reducer(d, 'median'),
  min: (d) => reducer(d, 'min'),
  max: (d) => reducer(d, 'max'),
  std: (d) => reducer(d, 'std'),
  var: (d) => reducer(d, 'var'),
  count: (d) => reducer(d, 'count'),
  any: (d) => reducer(d, 'any'),
  all: (d) => reducer(d, 'all'),
  quantile: (d) => bound(d, 'DataFrame', 'quantile', (a, k) => {
    const { q } = parseArgs('quantile', a, k, [['q', pyFloatNum(0.5)], ['numeric_only', false]]);
    const cols = d.numericColumns();
    const qq = toNumber(q);
    return new Series(cols.map((c) => quantileOf(new Series(d.data[c], d.index, { name: c, dtype: d.dtypes[c] }), qq)), new Index(cols), { name: qq, dtype: 'float64' });
  }),
  fillna: (d) => bound(d, 'DataFrame', 'fillna', (a, k, ctx) => frameFillna(d, a, k, ctx)),
  ffill: (d) => bound(d, 'NDFrame', 'ffill', (a, k) => { const o = parseArgs('ffill', a, k, [['axis', null], ['inplace', false], ['limit', null], ['limit_area', null], ['downcast', null]]); return framePad(d, 'ffill', o.inplace); }),
  bfill: (d) => bound(d, 'NDFrame', 'bfill', (a, k) => { const o = parseArgs('bfill', a, k, [['axis', null], ['inplace', false], ['limit', null], ['limit_area', null], ['downcast', null]]); return framePad(d, 'bfill', o.inplace); }),
  dropna: (d) => bound(d, 'DataFrame', 'dropna', (a, k) => frameDropna(d, a, k)),
  drop: (d) => bound(d, 'DataFrame', 'drop', (a, k) => frameDrop(d, a, k)),
  copy: (d) => bound(d, 'NDFrame', 'copy', () => d.copy()),
  sort_values: (d) => bound(d, 'DataFrame', 'sort_values', (a, k) => {
    const { by, ascending } = parseArgs('DataFrame.sort_values', a, k, [['by', REQUIRED], ['axis', pyInt(0)], ['ascending', true]]);
    const c = pyStr(by);
    const s = d.col(c);
    return d.takeRows(sortOrder(s.values, ascending !== false));
  }),
  reset_index: (d) => bound(d, 'DataFrame', 'reset_index', (a, k) => {
    const { drop, inplace } = parseArgs('reset_index', a, k, [['drop', false], ['inplace', false]]);
    let out;
    if (drop === true) {
      out = d.copy(); out.index = Index.range(d.nrows);
    } else {
      const data = { index: [...d.index.labels], ...d.copy().data };
      out = new DataFrame(['index', ...d.columns], data, Index.range(d.nrows), { index: d.index.dtype, ...d.dtypes });
    }
    if (inplace === true) { d.assignFrom(out); return null; }
    return out;
  }),
  round: (d) => bound(d, 'DataFrame', 'round', (a, k) => {
    const { decimals } = parseArgs('round', a, k, [['decimals', pyInt(0)]]);
    const out = d.copy();
    for (const c of out.columns) if (out.dtypes[c] === 'float64') out.data[c] = out.data[c].map((x) => roundHalfEven(x, toNumber(decimals)));
    return out;
  }),
  boxplot: (d) => bound(d, 'DataFrame', 'boxplot', (a, k, ctx) => {
    const o = parseArgs('boxplot', a, k, [['column', null], ['by', null], ['ax', null], ['fontsize', null], ['rot', pyInt(0)], ['grid', true], ['figsize', null]]);
    let cols = o.column ? toLabels(o.column) : d.numericColumns().filter((c) => d.dtypes[c] !== 'bool');
    for (const c of cols) if (!(c in d.data)) d.col(c);
    const boxes = cols.map((c) => ({ label: c, values: d.data[c].map(Number).filter((x) => !Number.isNaN(x)) }));
    return ctx.plt.boxplot(boxes, { grid: o.grid !== false, figsize: o.figsize });
  }),
  nunique: (d) => bound(d, 'DataFrame', 'nunique', () => new Series(d.columns.map((c) => new Set(d.data[c].filter((x) => !isMissing(x)).map(String)).size), new Index([...d.columns]), { dtype: 'int64' })),
  to_numpy: (d) => bound(d, 'DataFrame', 'to_numpy', () => FRAME_METHODS.values(d)),
  abs: (d) => bound(d, 'DataFrame', 'abs', () => mapFrame(d, (x) => Math.abs(x), null)),
};

function reducer(d, how) {
  return bound(d, 'DataFrame', how, (a, k) => {
    const o = parseArgs(how, a, k, [['axis', pyInt(0)], ['numeric_only', false], ['ddof', pyInt(1)]]);
    const axis = o.axis instanceof Num ? o.axis.v : o.axis;
    return reduceFrame(d, how, { numericOnly: o.numeric_only === true, axis, ddof: toNumber(o.ddof) });
  });
}

function mapFrame(d, fn, dtype) {
  const data = {}, dtypes = {};
  for (const c of d.columns) {
    if (dtype === null && d.dtypes[c] === 'object') throw new PyError('TypeError', "bad operand type for abs(): 'str'");
    data[c] = d.data[c].map(fn); dtypes[c] = dtype ?? d.dtypes[c];
  }
  return new DataFrame([...d.columns], data, d.index, dtypes);
}

// ─────────────────────────────────────────────────────────────
// 판다스 실습실에서 더한 DataFrame 명령
// ─────────────────────────────────────────────────────────────
function checkCols(d, cols) {
  for (const c of cols) if (!(c in d.data)) throw new PyError('KeyError', typeof c === 'string' ? strRepr(c) : String(c), columnHint(d, String(c)));
}
function inplaceOr(d, out, inplace) {
  if (inplace === true) { d.assignFrom(out); return null; }
  return out;
}
function rowKeys(d, cols) {
  return Array.from({ length: d.nrows }, (_, i) => cols.map((c) => valueKey(box(d.data[c][i], d.dtypes[c]))).join('\u0001'));
}
// 열 값 하나를 csv 글자로
function csvCell(x, dtype, dateOnly) {
  if (isMissing(x) || (typeof x === 'number' && Number.isNaN(x))) return '';
  let t;
  if (dtype === 'float64') t = pyFloatS(x);
  else if (dtype === DT) t = dateOnly ? formatDates([x])[0] : fmtFull(x);
  else if (dtype === 'bool') t = x ? 'True' : 'False';
  else t = pyStr(x instanceof Num ? x : typeof x === 'number' ? (Number.isInteger(x) ? pyInt(x) : pyFloatNum(x)) : x);
  return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function pyFloatS(x) { return pyStr(pyFloatNum(x)); }

class AtIndexer {
  constructor(d, mode) { this.d = d; this.mode = mode; }
  get pyType() { return this.mode === 'at' ? '_AtIndexer' : '_iAtIndexer'; }
  repr() { return `<pandas.core.indexing._${this.mode === 'at' ? 'At' : 'iAt'}Indexer object>`; }
  getitem(key) {
    if (!(key instanceof Tuple) || key.items.length !== 2) throw new PyError('ValueError', 'Not enough indexers for scalar access (getting)!', `${this.mode}[줄, 열] 처럼 두 개를 함께 적습니다.`);
    return indexerGet(new Indexer(this.d, this.mode === 'at' ? 'loc' : 'iloc'), key);
  }
  setitem(key, v) {
    if (this.mode !== 'at') throw new NotSupported('.iat[ ] 로 값 바꾸기 — .loc[줄, 열] = 값 을 쓰세요');
    indexerSet(new Indexer(this.d, 'loc'), key, v);
  }
}

Object.assign(FRAME_METHODS, {
  at: (d) => new AtIndexer(d, 'at'),
  iat: (d) => new AtIndexer(d, 'iat'),
  columns: (d) => new Index([...d.columns], { name: d.columnsName ?? null, dtype: d.columnsDtype && d.columnsDtype !== 'object' ? d.columnsDtype : null }),
  values: (d) => {
    const dts = d.columns.map((c) => d.dtypes[c]);
    const uni = dts.every((x) => x === 'bool') ? 'bool' : dts.every((x) => x === 'float64' || isIntD(x)) ? (dts.every(isIntD) ? 'int64' : 'float64') : 'object';
    const rows = Array.from({ length: d.nrows }, (_, i) => d.columns.map((c) => {
      const x = d.data[c][i];
      if (uni !== 'object') return x;
      const dt = d.dtypes[c];
      return dt === 'float64' ? pyFloatNum(x) : isIntD(dt) ? pyInt(x) : dt === DT ? boxDate(x) : x;
    }));
    return NDArray.from2D(rows, uni);
  },
  T: (d) => transposeFrame(d),
  transpose: (d) => bound(d, 'DataFrame', 'transpose', () => transposeFrame(d)),
  sort_values: (d) => bound(d, 'DataFrame', 'sort_values', (a, k) => {
    const o = parseArgs('DataFrame.sort_values', a, k, [['by', REQUIRED], ['axis', pyInt(0)], ['ascending', true], ['inplace', false], ['kind', 'quicksort'], ['na_position', 'last'], ['ignore_index', false], ['key', null]]);
    const by = Array.isArray(o.by) ? o.by.map(toLabel) : [toLabel(o.by)];
    checkCols(d, by);
    const asc = Array.isArray(o.ascending) ? o.ascending.map((x) => x !== false && !(x instanceof Num && x.v === 0)) : by.map(() => o.ascending !== false);
    if (asc.length !== by.length) throw new PyError('ValueError', `Length of ascending (${asc.length}) != length of by (${by.length})`, '정렬할 열의 수와 ascending 리스트의 길이를 맞추세요.');
    const out = d.takeRows(sortOrderMulti(by.map((c) => d.data[c]), asc, pyStr(o.na_position) === 'first'));
    if (o.ignore_index === true) out.index = Index.range(out.nrows);
    return inplaceOr(d, out, o.inplace);
  }),
  sort_index: (d) => bound(d, 'DataFrame', 'sort_index', (a, k) => {
    const o = parseArgs('sort_index', a, k, [['axis', pyInt(0)], ['level', null], ['ascending', true], ['inplace', false]]);
    const ax = o.axis instanceof Num ? o.axis.v : o.axis;
    if (ax === 1 || ax === 'columns') {
      const cols = [...d.columns].sort((p, q) => cmpLabel(p, q) * (o.ascending === false ? -1 : 1));
      return inplaceOr(d, d.selectColumns(cols), o.inplace);
    }
    const lv = d.index instanceof MultiIndex ? d.index.arrays : [d.index.labels];
    return inplaceOr(d, d.takeRows(sortOrderMulti(lv, lv.map(() => o.ascending !== false))), o.inplace);
  }),
  set_index: (d) => bound(d, 'DataFrame', 'set_index', (a, k) => {
    const o = parseArgs('set_index', a, k, [['keys', REQUIRED], ['drop', true], ['append', false], ['inplace', false], ['verify_integrity', false]]);
    const keys = Array.isArray(o.keys) ? o.keys.map(toLabel) : [toLabel(o.keys)];
    checkCols(d, keys);
    const idx = keys.length === 1 ? new Index([...d.data[keys[0]]], { name: keys[0], dtype: d.dtypes[keys[0]] === 'object' ? null : d.dtypes[keys[0]] })
      : new MultiIndex(keys.map((c) => [...d.data[c]]), { names: keys, dtypes: keys.map((c) => d.dtypes[c]) });
    const out = o.drop === false ? d.copy() : d.selectColumns(d.columns.filter((c) => !keys.includes(c)));
    out.index = idx;
    return inplaceOr(d, out, o.inplace);
  }),
  reset_index: (d) => bound(d, 'DataFrame', 'reset_index', (a, k) => {
    const { drop, inplace } = parseArgs('reset_index', a, k, [['level', null], ['drop', false], ['inplace', false], ['col_level', pyInt(0)], ['col_fill', '']]);
    const out = d.copy();
    if (drop !== true) {
      const front = indexAsColumns(d.index, d.columns);
      for (const f of front) { out.data[f.name] = f.values; out.dtypes[f.name] = f.dtype; }
      out.columns = [...front.map((f) => f.name), ...d.columns];
    }
    out.index = Index.range(d.nrows);
    out.columnsName = d.columnsName;
    return inplaceOr(d, out, inplace);
  }),
  rename: (d) => bound(d, 'DataFrame', 'rename', (a, k) => {
    const o = parseArgs('rename', a, k, [['mapper', null], ['index', null], ['columns', null], ['axis', null], ['copy', null], ['inplace', false], ['level', null], ['errors', 'ignore']]);
    if (o.mapper != null && o.columns == null && o.index == null) {
      const ax = o.axis instanceof Num ? o.axis.v : o.axis;
      if (ax === 1 || ax === 'columns') o.columns = o.mapper; else o.index = o.mapper;
    }
    const mapOf = (m) => {
      if (m instanceof Dict) { const mm = new Map([...m.map].map(([x, y]) => [toLabel(x), y])); return (l) => (mm.has(l) ? toLabel(mm.get(l)) : l); }
      if (m instanceof PyFunc) return (l) => toLabel(m.fn([l], new Map()));
      throw new PyError('TypeError', "'columns' 에는 딕셔너리를 넣습니다", "예) df.rename(columns={'가격': '판매가'})");
    };
    const out = d.copy();
    if (o.columns != null) {
      const f = mapOf(o.columns);
      const cols = d.columns.map(f);
      out.columns = cols; out.data = {}; out.dtypes = {};
      d.columns.forEach((c, i) => { out.data[cols[i]] = [...d.data[c]]; out.dtypes[cols[i]] = d.dtypes[c]; });
    }
    if (o.index != null) { const f = mapOf(o.index); out.index = new Index(d.index.labels.map(f), { name: d.index.name }); }
    return inplaceOr(d, out, o.inplace);
  }),
  replace: (d) => bound(d, 'DataFrame', 'replace', (a, k, ctx) => {
    const o = parseArgs('replace', a, k, [['to_replace', null], ['value', null], ['inplace', false], ['limit', null], ['regex', false]]);
    const out = d.copy();
    const toMap = (tr, val) => {
      const pairs = [];
      if (tr instanceof Dict) for (const [x, y] of tr.map) pairs.push([x, y]);
      else if (Array.isArray(tr)) { if (Array.isArray(val)) tr.forEach((x, i) => pairs.push([x, val[i]])); else tr.forEach((x) => pairs.push([x, val])); }
      else pairs.push([tr, val]);
      return new Map(pairs.map(([x, y]) => [valueKey(x), y]));
    };
    const nested = o.to_replace instanceof Dict && [...o.to_replace.map.values()].every((v) => v instanceof Dict);
    for (const c of d.columns) {
      let m;
      if (nested) { const sub = [...o.to_replace.map].find(([x]) => toLabel(x) === c); if (!sub) continue; m = toMap(sub[1], null); }
      else m = toMap(o.to_replace, o.value);
      const r = replaceValues(d.data[c], d.dtypes[c], m, ctx);
      if (r) { out.data[c] = r.values; out.dtypes[c] = r.dtype; }
    }
    return inplaceOr(d, out, o.inplace);
  }),
  astype: (d) => bound(d, 'DataFrame', 'astype', (a, k, ctx) => {
    const { dtype } = parseArgs('astype', a, k, [['dtype', REQUIRED], ['copy', null], ['errors', 'raise']]);
    const out = d.copy();
    const conv = (c, t) => { const s = SERIES_METHODS.astype(d.col(c)).fn([t], new Map(), ctx); out.data[c] = s.values; out.dtypes[c] = s.dtype; };
    if (dtype instanceof Dict) for (const [c, t] of dtype.map) { checkCols(d, [toLabel(c)]); conv(toLabel(c), t); }
    else for (const c of d.columns) conv(c, dtype);
    return out;
  }),
  duplicated: (d) => bound(d, 'DataFrame', 'duplicated', (a, k) => {
    const o = parseArgs('duplicated', a, k, [['subset', null], ['keep', 'first']]);
    const cols = o.subset == null ? d.columns : Array.isArray(o.subset) ? o.subset.map(toLabel) : [toLabel(o.subset)];
    checkCols(d, cols);
    return new Series(keysDuplicated(rowKeys(d, cols), o.keep), d.index, { dtype: 'bool' });
  }),
  drop_duplicates: (d) => bound(d, 'DataFrame', 'drop_duplicates', (a, k) => {
    const o = parseArgs('drop_duplicates', a, k, [['subset', null], ['keep', 'first'], ['inplace', false], ['ignore_index', false]]);
    const cols = o.subset == null ? d.columns : Array.isArray(o.subset) ? o.subset.map(toLabel) : [toLabel(o.subset)];
    checkCols(d, cols);
    const dup = keysDuplicated(rowKeys(d, cols), o.keep);
    const out = d.takeRows(dup.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0));
    if (o.ignore_index === true) out.index = Index.range(out.nrows);
    return inplaceOr(d, out, o.inplace);
  }),
  nlargest: (d) => bound(d, 'DataFrame', 'nlargest', (a, k) => {
    const o = parseArgs('nlargest', a, k, [['n', REQUIRED], ['columns', REQUIRED], ['keep', 'first']]);
    const cols = Array.isArray(o.columns) ? o.columns.map(toLabel) : [toLabel(o.columns)];
    checkCols(d, cols);
    const order = sortOrderMulti(cols.map((c) => d.data[c]), cols.map(() => false)).filter((i) => !isMissing(d.data[cols[0]][i]));
    return d.takeRows(order.slice(0, toNumber(o.n)));
  }),
  nsmallest: (d) => bound(d, 'DataFrame', 'nsmallest', (a, k) => {
    const o = parseArgs('nsmallest', a, k, [['n', REQUIRED], ['columns', REQUIRED], ['keep', 'first']]);
    const cols = Array.isArray(o.columns) ? o.columns.map(toLabel) : [toLabel(o.columns)];
    checkCols(d, cols);
    const order = sortOrderMulti(cols.map((c) => d.data[c]), cols.map(() => true)).filter((i) => !isMissing(d.data[cols[0]][i]));
    return d.takeRows(order.slice(0, toNumber(o.n)));
  }),
  dropna: (d) => bound(d, 'DataFrame', 'dropna', (a, k) => {
    const o = parseArgs('dropna', a, k, [['axis', pyInt(0)], ['how', null], ['thresh', null], ['subset', null], ['inplace', false], ['ignore_index', false]]);
    const ax = o.axis instanceof Num ? o.axis.v : o.axis;
    const how = o.how == null ? 'any' : pyStr(o.how);
    const thresh = o.thresh == null ? null : toNumber(o.thresh);
    const drop = (miss) => (thresh != null ? miss.filter((m) => !m).length < thresh : how === 'all' ? miss.every(Boolean) : miss.some(Boolean));
    let out;
    if (ax === 1 || ax === 'columns') {
      out = d.selectColumns(d.columns.filter((c) => !drop(d.data[c].map(isMissing))));
    } else {
      const cols = o.subset == null ? d.columns : Array.isArray(o.subset) ? o.subset.map(toLabel) : [toLabel(o.subset)];
      checkCols(d, cols);
      const keep = [];
      for (let i = 0; i < d.nrows; i++) if (!drop(cols.map((c) => isMissing(d.data[c][i])))) keep.push(i);
      out = d.takeRows(keep);
      if (o.ignore_index === true) out.index = Index.range(out.nrows);
    }
    return inplaceOr(d, out, o.inplace);
  }),
  to_csv: (d) => bound(d, 'DataFrame', 'to_csv', (a, k, ctx) => {
    const o = parseArgs('to_csv', a, k, [['path_or_buf', null], ['sep', ','], ['na_rep', ''], ['float_format', null], ['columns', null], ['header', true], ['index', true], ['index_label', null], ['mode', 'w'], ['encoding', null]]);
    const sep = pyStr(o.sep);
    const lines = [];
    const withIndex = o.index !== false;
    const idxCols = withIndex ? indexAsColumns(d.index, []).map((f) => ({ ...f, name: f.name === 'index' && d.index.name == null && !(d.index instanceof MultiIndex) ? '' : f.name })) : [];
    if (o.header !== false) lines.push([...idxCols.map((f) => csvCell(f.name, 'object')), ...d.columns.map((c) => csvCell(String(c), 'object'))].join(sep));
    const dateOnly = Object.fromEntries(d.columns.map((c) => [c, d.dtypes[c] === DT && d.data[c].filter((x) => !Number.isNaN(x)).every((x) => formatDates([x])[0].length === 10)]));
    for (let i = 0; i < d.nrows; i++) {
      lines.push([...idxCols.map((f) => csvCell(f.values[i], f.dtype, true)), ...d.columns.map((c) => csvCell(d.data[c][i], d.dtypes[c], dateOnly[c]))].join(sep));
    }
    const text = lines.join('\n') + '\n';
    if (o.path_or_buf == null) return text;
    const path = pyStr(o.path_or_buf).replace(/\\/g, '/').replace(/^(\.\/|\/content\/)/, '');
    ctx.files[path] = text;
    return null;
  }),
  insert: (d) => bound(d, 'DataFrame', 'insert', (a, k, ctx) => {
    const o = parseArgs('insert', a, k, [['loc', REQUIRED], ['column', REQUIRED], ['value', REQUIRED], ['allow_duplicates', false]]);
    const name = toLabel(o.column);
    if (name in d.data) throw new PyError('ValueError', `cannot insert ${name}, already exists`, '이미 있는 열 이름입니다. 값을 바꾸려면 df[\'열\'] = 값 을 쓰세요.');
    setItem(d, name, o.value, ctx);
    d.columns.pop();
    d.columns.splice(toNumber(o.loc), 0, name);
    return null;
  }),
  query: () => { throw new NotSupported("query( ) — df[df['가격'] > 5000] 처럼 대괄호 조건으로 고르세요"); },
  sample: () => { throw new NotSupported('sample( ) — 무작위로 뽑는 명령이라 코랩과 결과가 달라서 이 실습실에서는 쓰지 않습니다. head( ) 로 앞부분을 보세요'); },
  apply: () => { throw new NotSupported("표 전체의 apply( ) — 열 하나를 골라 df['열'].apply(함수) 처럼 쓰세요"); },
  iterrows: () => { throw new NotSupported('iterrows( ) — 이 실습실은 for 반복문을 쓰지 않습니다'); },
  itertuples: () => { throw new NotSupported('itertuples( ) — 이 실습실은 for 반복문을 쓰지 않습니다'); },
  value_counts: () => { throw new NotSupported("표 전체의 value_counts( ) — 열 하나를 골라 df['열'].value_counts( ) 처럼 쓰세요"); },
  idxmax: () => { throw new NotSupported("표 전체의 idxmax( ) — 열 하나를 골라 df['열'].idxmax( ) 처럼 쓰세요"); },
  idxmin: () => { throw new NotSupported("표 전체의 idxmin( ) — 열 하나를 골라 df['열'].idxmin( ) 처럼 쓰세요"); },
  cumsum: () => { throw new NotSupported("표 전체의 cumsum( ) — 열 하나를 골라 df['열'].cumsum( ) 처럼 쓰세요"); },
  mode: () => { throw new NotSupported("표 전체의 mode( ) — 열 하나를 골라 df['열'].mode( ) 처럼 쓰세요"); },
  merge: (d) => bound(d, 'DataFrame', 'merge', (a, k) => mergeFrames([d, ...a], k)),
  pivot_table: (d) => bound(d, 'DataFrame', 'pivot_table', (a, k) => pivotTable([d, ...a], k)),
  isin: () => { throw new NotSupported("표 전체의 isin( ) — 열 하나를 골라 df['열'].isin([...]) 처럼 쓰세요"); },
  melt: (d) => bound(d, 'DataFrame', 'melt', (a, k) => meltFrame([d, ...a], k)),
  pivot: () => { throw new NotSupported("pivot( ) — pivot_table(index=…, columns=…, values=…, aggfunc='sum') 을 쓰세요"); },
  stack: () => { throw new NotSupported('stack( )'); },
  unstack: () => { throw new NotSupported('표의 unstack( ) — groupby 결과(시리즈)에 unstack( ) 을 쓰세요'); },
  agg: () => { throw new NotSupported("표 전체의 agg( ) — df['열'].agg(['mean', 'max']) 처럼 열 하나에 쓰세요"); },
  clip: () => { throw new NotSupported("표 전체의 clip( ) — df['열'].clip(아래, 위) 처럼 열 하나에 쓰세요"); },
});

// 넓은 표 → 긴 표. 열 이름들이 variable 열로, 값이 value 열로 들어간다.
export function meltFrame(args, kw) {
  const o = parseArgs('melt', args, kw, [['frame', REQUIRED], ['id_vars', null], ['value_vars', null], ['var_name', null], ['value_name', 'value'], ['col_level', null], ['ignore_index', true]]);
  const d = o.frame;
  const list = (v) => (v == null ? null : Array.isArray(v) ? v.map(toLabel) : [toLabel(v)]);
  const ids = list(o.id_vars) ?? [];
  checkCols(d, ids);
  const vars = list(o.value_vars) ?? d.columns.filter((c) => !ids.includes(c));
  checkCols(d, vars);
  const varName = o.var_name == null ? (d.columnsName ?? 'variable') : toLabel(o.var_name);
  const valName = toLabel(o.value_name);
  const n = d.nrows;
  const data = {}, dtypes = {};
  for (const c of ids) { data[c] = vars.flatMap(() => d.data[c]); dtypes[c] = d.dtypes[c]; }
  data[varName] = vars.flatMap((v) => Array(n).fill(v)); dtypes[varName] = 'object';
  const kinds = [...new Set(vars.map((v) => d.dtypes[v]))];
  const vd = kinds.length === 1 ? kinds[0] : kinds.every((x) => x === 'float64' || isIntD(x)) ? 'float64' : 'object';
  data[valName] = vars.flatMap((v) => (vd === 'object' && d.dtypes[v] !== 'object' ? d.data[v].map((x) => box(x, d.dtypes[v])) : d.data[v]));
  dtypes[valName] = vd;
  return new DataFrame([...ids, varName, valName], data, Index.range(n * vars.length), dtypes);
}

// 이름표를 열로 꺼내기 (reset_index · to_csv)
function indexAsColumns(index, existing) {
  if (index instanceof MultiIndex) {
    return index.arrays.map((arr, j) => ({ name: index.names[j] ?? `level_${j}`, values: [...arr], dtype: index.dtypes[j] }));
  }
  let name = index.name ?? 'index';
  if (index.name == null && existing.includes('index')) name = 'level_0';
  const dtype = index.dtype;
  return [{ name, values: [...index.labels], dtype: dtype === 'object' && index.labels.every((x) => typeof x === 'number') ? 'int64' : dtype }];
}

function transposeFrame(d) {
  const dts = [...new Set(d.columns.map((c) => d.dtypes[c]))];
  const same = dts.length === 1;
  const newCols = d.index.labels;
  const data = {}, dtypes = {};
  newCols.forEach((lab, i) => {
    data[lab] = d.columns.map((c) => {
      const x = d.data[c][i];
      if (same) return x;
      const dt = d.dtypes[c];
      return dt === 'float64' ? pyFloatNum(x) : isIntD(dt) ? pyInt(x) : dt === DT ? boxDate(x) : x;
    });
    dtypes[lab] = same ? dts[0] : 'object';
  });
  const out = new DataFrame([...newCols], data, new Index([...d.columns], { name: d.columnsName ?? null }), dtypes);
  out.columnsName = d.index.name ?? null;
  return out;
}


// ─────────────────────────────────────────────────────────────
// 대괄호 꺼내기 — df['열'], df[['열','열']], df[조건], s[조건], .loc[…], .iloc[…]
// ─────────────────────────────────────────────────────────────
export class Indexer {
  constructor(obj, mode) { this.obj = obj; this.mode = mode; }
  get pyType() { return this.mode === 'loc' ? '_LocIndexer' : '_iLocIndexer'; }
  repr() { return `<pandas.core.indexing._${this.mode === 'loc' ? 'Loc' : 'iLoc'}Indexer object>`; }
}

// 조건(참거짓 Series)으로 고를 줄 번호
function maskPositions(target, mask) {
  if (mask.dtype !== 'bool') return null;
  if (mask.index.equals(target.index)) return mask.values.map((b, i) => (b ? i : -1)).filter((i) => i >= 0);
  // 이름표가 다르면 이름표로 맞춘다
  return target.index.labels.map((l, i) => { const p = mask.index.pos(l); return p !== undefined && mask.values[p] ? i : -1; }).filter((i) => i >= 0);
}

export function getItem(obj, key, ctx = null) {
  if (obj instanceof Indexer) return indexerGet(obj, key);
  if (obj instanceof DataFrame) {
    if (typeof key === 'string') return obj.col(key);
    if ((key instanceof Num || typeof key === 'number') && obj.columns.includes(toLabel(key))) return obj.col(toLabel(key));
    if (Array.isArray(key) || key instanceof Index) return obj.selectColumns(toLabels(key).map(String));
    if (key instanceof Series && key.dtype === 'bool') {
      if (key.length !== obj.nrows) throw new PyError('ValueError', `Item wrong length ${key.length} instead of ${obj.nrows}.`);
      return obj.takeRows(maskPositions(obj, key));
    }
    if (key instanceof DataFrame) throw new NotSupported('df[조건표] (표 전체 조건)');
    if (key?.pyType === 'slice') { const [a, b] = sliceBounds(key, obj.nrows); return obj.sliceRows(a, b); }
    if (key instanceof Num || typeof key === 'number') {
      throw new PyError('KeyError', String(toLabel(key)), '표에서 줄 하나를 꺼낼 때는 df.loc[번호] 를 씁니다. df[...] 에는 열 이름을 넣습니다.');
    }
    throw new PyError('KeyError', pyRepr(key));
  }
  if (obj instanceof Series) {
    if (key instanceof Series && key.dtype === 'bool') return obj.take(maskPositions(obj, key));
    if (key?.pyType === 'slice' && (typeof key.start === 'string' || typeof key.stop === 'string')) return indexerGet(new Indexer(obj, 'loc'), key);
    if (key?.pyType === 'slice') { const [a, b] = sliceBounds(key, obj.length); return new Series(obj.values.slice(a, b), obj.index.slice(a, b), { name: obj.name, dtype: obj.dtype }); }
    // 이름표가 글자인 시리즈에 s[1] — pandas 2.2 는 위치로 꺼내 주면서 경고한다
    if (key instanceof Num && !key.isFloat && obj.index.dtype !== 'int64' && obj.index.dtype !== 'int32' && !obj.index.has(key.v)) {
      ctx?.warn('FutureWarning: Series.__getitem__ treating keys as positions is deprecated. In a future version, integer keys will always be treated as labels (consistent with DataFrame behavior). To access a value by position, use `ser.iloc[pos]`');
      return indexerGet(new Indexer(obj, 'iloc'), key);
    }
    if (Array.isArray(key) || key instanceof Index) {
      const labels = toLabels(key);
      return obj.take(labels.map((l) => { const p = obj.index.pos(l); if (p === undefined) throw new PyError('KeyError', `"${pyListOf([l])} not in index"`); return p; }));
    }
    const label = toLabel(key);
    const p = obj.index.pos(label);
    if (p === undefined) throw new PyError('KeyError', typeof label === 'string' ? strRepr(label) : String(label), '그 이름표를 가진 칸이 없습니다.');
    return box(obj.values[p], obj.dtype);
  }
  return undefined;
}

function sliceBounds(sl, n) {
  const norm = (v, def) => { if (v == null) return def; let x = toNumber(v); if (x < 0) x += n; return Math.min(Math.max(x, 0), n); };
  return [norm(sl.start, 0), norm(sl.stop, n)];
}

function rowAsSeries(df, pos) {
  const vals = df.columns.map((c) => df.data[c][pos]);
  const allFloat = df.columns.every((c) => df.dtypes[c] === 'float64');
  const allInt = df.columns.every((c) => df.dtypes[c] === 'int64');
  const name = df.index.labels[pos];
  if (allFloat || allInt) return new Series(vals, new Index([...df.columns]), { name, dtype: allFloat ? 'float64' : 'int64' });
  const pyVals = df.columns.map((c, j) => (df.dtypes[c] === 'object' ? vals[j] : df.dtypes[c] === 'bool' ? vals[j] : df.dtypes[c] === DT ? boxDate(vals[j]) : new Num(vals[j], df.dtypes[c] === 'float64' ? 'float' : 'int')));
  return new Series(pyVals, new Index([...df.columns]), { name, dtype: 'object' });
}

function indexerGet(ix, key) {
  const o = ix.obj;
  let rowKey = key, colKey = null;
  if (key instanceof Tuple) { rowKey = key.items[0]; colKey = key.items[1]; }
  const isDF = o instanceof DataFrame;
  const n = isDF ? o.nrows : o.length;

  // 줄 고르기 → 위치 목록 또는 위치 하나
  let positions = null, single = null;
  if (rowKey?.pyType === 'slice') {
    if (ix.mode === 'iloc') { const [a, b] = sliceBounds(rowKey, n); positions = Array.from({ length: b - a }, (_, i) => a + i); }
    else {
      const a = rowKey.start == null ? 0 : o.index.pos(toLabel(rowKey.start));
      const b = rowKey.stop == null ? n - 1 : o.index.pos(toLabel(rowKey.stop));
      positions = Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
    }
  } else if (rowKey instanceof Series && rowKey.dtype === 'bool') {
    positions = maskPositions(o, rowKey);
  } else if (Array.isArray(rowKey) || rowKey instanceof Index) {
    const labels = toLabels(rowKey);
    positions = labels.map((l) => {
      if (ix.mode === 'iloc') { if (l < 0 || l >= n) throw new PyError('IndexError', 'positional indexers are out-of-bounds'); return l; }
      const p = o.index.pos(l);
      if (p === undefined) throw new PyError('KeyError', `"${pyListOf([l])} not in index"`, '표에 없는 줄 번호가 섞여 있습니다.');
      return p;
    });
  } else {
    const l = toLabel(rowKey);
    if (ix.mode === 'iloc' && typeof l !== 'number') {
      throw new PyError('TypeError', 'Cannot index by location index with a non-integer key', 'iloc[ ] 에는 위치 번호(0, 1, 2 …)를 넣습니다. 이름표(글자)로 고르려면 loc[ ] 를 쓰세요.');
    }
    if (ix.mode === 'iloc') {
      const p = l < 0 ? n + l : l;
      if (p < 0 || p >= n) throw new PyError('IndexError', 'single positional indexer is out-of-bounds', `이 표는 0 부터 ${n - 1} 까지만 있습니다.`);
      single = p;
    } else {
      single = o.index.pos(l);
      if (single === undefined) {
        throw new PyError('KeyError', typeof l === 'string' ? strRepr(l) : String(l),
          '그 번호(이름표)를 가진 줄이 없습니다. 이상치를 지운 표라면 그 번호가 사라졌을 수 있어요. 위치로 고르려면 .iloc[ ] 를 쓰세요.');
      }
    }
  }

  if (!isDF) {
    if (single !== null) return box(o.values[single], o.dtype);
    return o.take(positions);
  }
  if (colKey === null) return single !== null ? rowAsSeries(o, single) : o.takeRows(positions);

  // 열까지 고른 경우
  let cols;
  if (ix.mode === 'iloc') {
    if (typeof colKey === 'string' || (Array.isArray(colKey) && colKey.some((x) => typeof x === 'string'))) {
      throw new PyError('ValueError', 'Location based indexing can only have [integer, integer slice (START point is INCLUDED, END point is EXCLUDED), listlike of integers, boolean array] types',
        'iloc[ ] 에는 열도 위치 번호로 적습니다. 열 이름을 쓰려면 loc[줄, \'열이름\'] 을 쓰세요. 예) df.loc[i, \'메뉴\']');
    }
    if (colKey?.pyType === 'slice') { const [a, b] = sliceBounds(colKey, o.columns.length); cols = o.columns.slice(a, b); }
    else if (Array.isArray(colKey)) cols = toLabels(colKey).map((j) => o.columns[j]);
    else { const j = toLabel(colKey); if (o.columns[j] === undefined) throw new PyError('IndexError', 'single positional indexer is out-of-bounds'); cols = o.columns[j]; }
  } else if (colKey?.pyType === 'slice') {
    const a = colKey.start == null ? 0 : o.columns.indexOf(pyStr(colKey.start));
    const b = colKey.stop == null ? o.columns.length - 1 : o.columns.indexOf(pyStr(colKey.stop));
    cols = o.columns.slice(a, b + 1);
  } else if (Array.isArray(colKey)) cols = toLabels(colKey).map(String);
  else cols = pyStr(colKey);

  if (typeof cols === 'string') {
    const s = o.col(cols);
    if (single !== null) return box(s.values[single], s.dtype);
    return s.take(positions);
  }
  const sub = o.selectColumns(cols);
  return single !== null ? rowAsSeries(sub, single) : sub.takeRows(positions);
}

export function setItem(obj, key, value, ctx = null) {
  if (obj instanceof DataFrame && typeof key === 'string') {
    let vals, dtype;
    if (value instanceof Series) {
      if (value.index.equals(obj.index)) vals = [...value.values];
      else vals = obj.index.labels.map((l) => { const p = value.index.pos(l); return p === undefined ? NaN : value.values[p]; });
      dtype = value.dtype;
    } else if (value instanceof NDArray && value.ndim === 1) {
      if (value.size !== obj.nrows) throw new PyError('ValueError', `Length of values (${value.size}) does not match length of index (${obj.nrows})`);
      vals = [...value.data]; dtype = value.dtype;
    } else if (Array.isArray(value)) {
      if (value.length !== obj.nrows) throw new PyError('ValueError', `Length of values (${value.length}) does not match length of index (${obj.nrows})`);
      dtype = inferDtype(value); vals = value.map((v) => unbox(v, dtype));
    } else {
      dtype = inferDtype([value]); vals = Array(obj.nrows).fill(unbox(value, dtype));
    }
    if (!(key in obj.data)) obj.columns.push(key);
    obj.data[key] = vals; obj.dtypes[key] = dtype;
    return;
  }
  // df[['열1', '열2']] = 표 — pandas 처럼 열 이름이 아니라 차례로 짝짓는다
  if (obj instanceof DataFrame && (Array.isArray(key) || key instanceof Index)) {
    const cols = toLabels(key).map(String);
    if (value instanceof DataFrame) {
      if (value.columns.length !== cols.length) throw new PyError('ValueError', 'Columns must be same length as key');
      cols.forEach((c, i) => setItem(obj, c, value.col(value.columns[i]), ctx));
    } else cols.forEach((c) => setItem(obj, c, value, ctx));
    return;
  }
  if (obj instanceof Series) {
    const positions = rowPositions(obj, key);
    writeCells(obj.values, obj.dtype, positions, value, obj.index, (dt) => {
      obj.dtype = dt;
      if (obj.parent) obj.parent.df.dtypes[obj.parent.column] = dt;
    }, ctx);
    return;
  }
  throw new NotSupported(`${typeName(obj)} 에 [ ] 로 값 넣기`);
}

// 값을 넣을 줄 번호 — 참거짓 Series(조건) · 이름표 하나 · 이름표 목록 · 모든 줄(:)
function rowPositions(target, key) {
  if (key instanceof Series && key.dtype === 'bool') return maskPositions(target, key);
  if (key?.pyType === 'slice') {
    if (key.start == null && key.stop == null && key.step == null) return target.index.labels.map((_, i) => i);
    const n = target.index.length;
    const a = key.start == null ? 0 : target.index.pos(toLabel(key.start));
    const b = key.stop == null ? n - 1 : target.index.pos(toLabel(key.stop));
    if (a === undefined || b === undefined) throw new PyError('KeyError', String(toLabel(a === undefined ? key.start : key.stop)));
    return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  }
  if (Array.isArray(key) || key instanceof Index) {
    return toLabels(key).map((l) => { const p = target.index.pos(l); if (p === undefined) throw new NotSupported('없는 이름표에 새 칸 추가'); return p; });
  }
  const p = target.index.pos(toLabel(key));
  if (p === undefined) throw new NotSupported('시리즈에 새 칸 추가');
  return [p];
}

// 한 열(배열)의 몇 칸에 값 넣기 — 값이 Series 면 이름표로 맞춘다. 정수 열에 소수가 들어오면 실수 열이 된다.
function writeCells(arr, dtype, positions, value, index, setDtype, ctx = null) {
  const pick = (p) => {
    if (value instanceof Series) { const q = value.index.pos(index.labels[p]); return q === undefined ? NaN : value.values[q]; }
    if (value instanceof NDArray) return value.data[positions.indexOf(p)];
    if (Array.isArray(value)) return unbox(value[positions.indexOf(p)], dtype === 'object' ? 'object' : 'float64');
    return value;
  };
  if ((Array.isArray(value) || value instanceof NDArray) && (Array.isArray(value) ? value.length : value.size) !== positions.length) {
    throw new PyError('ValueError', `Must have equal len keys and value when setting with an iterable`);
  }
  const vals = positions.map(pick).map((v) => (v instanceof Num ? v.v : v));
  let dt = dtype;
  if (dt !== 'object' && vals.some((v) => typeof v === 'string')) dt = 'object';
  else if (dt === 'int64' && vals.some((v) => typeof v === 'number' && !Number.isInteger(v))) dt = 'float64';
  else if (dt === 'bool' && vals.some((v) => typeof v !== 'boolean')) dt = 'float64';
  if (dt !== dtype && ctx) {
    // 코랩(pandas 2.2)은 열의 종류가 바뀔 때 경고를 띄운다(값 하나를 넣을 때만 이 모양 그대로)
    const shown = value instanceof Series || Array.isArray(value) || value instanceof NDArray ? '[…]' : pyStr(value);
    ctx.warn(`FutureWarning: Setting an item of incompatible dtype is deprecated and will raise an error in a future version of pandas. Value '${shown}' has dtype incompatible with ${dtype}, please explicitly cast to a compatible dtype first.`);
  }
  if (dtype === 'bool' && dt !== 'bool') for (let i = 0; i < arr.length; i++) if (typeof arr[i] === 'boolean') arr[i] = Number(arr[i]);
  const norm = (v) => (v === null || v === undefined ? NaN : typeof v === 'boolean' && dt !== 'bool' && dt !== 'object' ? Number(v) : v);
  positions.forEach((p, i) => { arr[p] = norm(vals[i]); });
  if (dt !== dtype) setDtype(dt);
}

// df.loc[조건, '열'] = 값 · df.loc[:, '열'] = 값 · s.loc[조건] = 값
// 표 맨 아래에 새 줄 하나 — df.loc[새이름표] = [값들] 또는 {열: 값}
function appendRow(d, lab, value) {
  let vals;
  if (Array.isArray(value) || value instanceof Tuple) {
    const arr = Array.isArray(value) ? value : value.items;
    if (arr.length !== d.columns.length) throw new PyError('ValueError', 'cannot set a row with mismatched columns', `값이 ${arr.length}개인데 열은 ${d.columns.length}개입니다. 리스트로 넣을 때는 모든 열의 값을 차례대로 적어야 합니다. (딕셔너리로 넣으면 일부 열만 적어도 됩니다)`);
    vals = new Map(d.columns.map((c, j) => [c, arr[j]]));
  } else if (value instanceof Dict) {
    vals = new Map([...value.map].map(([k, v]) => [toLabel(k), v]));
    for (const k of vals.keys()) if (!(k in d.data)) { d.columns.push(k); d.data[k] = Array(d.nrows).fill(NaN); d.dtypes[k] = 'float64'; }
  } else if (value instanceof Series) {
    vals = new Map(d.columns.map((c) => { const p = value.index.pos(c); return [c, p === undefined ? null : box(value.values[p], value.dtype)]; }));
  } else vals = new Map(d.columns.map((c) => [c, value]));
  const labels = [...d.index.labels, lab];
  const allNum = labels.every((l) => typeof l === 'number');
  d.index = new Index(labels, { name: d.index.name, dtype: allNum ? null : 'object' });
  for (const c of d.columns) {
    const v = vals.has(c) ? vals.get(c) : null;
    const dt = d.dtypes[c];
    if (isMissing(v)) {
      d.data[c].push(NaN);
      if (isIntD(dt) || dt === 'bool') d.dtypes[c] = 'float64';
      continue;
    }
    if (dt === 'object') { d.data[c].push(v instanceof Num && !v.isNumpy ? v : v); continue; }
    if (dt === DT) { d.data[c].push(unbox(v, DT)); continue; }
    if (typeof v === 'string') {
      // 수 열에 글자 — 열 전체가 object 가 된다
      d.data[c] = d.data[c].map((x) => box(x, dt));
      d.dtypes[c] = 'object'; d.data[c].push(v); continue;
    }
    const x = toNumber(v);
    if (isIntD(dt) && !Number.isInteger(x)) d.dtypes[c] = 'float64';
    if (dt === 'float64' && Number.isNaN(x)) { d.data[c].push(NaN); continue; }
    d.data[c].push(x);
  }
}
function appendRowValues(d, rows, value) {
  const lab = toLabel(rows);
  if (!d.index.has(lab)) { appendRow(d, lab, value); return; }
  const p = d.index.pos(lab);
  for (const [k, v] of value.map) { const c = toLabel(k); writeCells(d.data[c], d.dtypes[c], [p], v, d.index, (dt) => { d.dtypes[c] = dt; }, null); }
}

export function indexerSet(ix, key, value, ctx = null) {
  if (ix.mode !== 'loc') throw new NotSupported('.iloc[ ] 로 값 바꾸기');
  const obj = ix.obj;
  if (obj instanceof Series) return setItem(obj, key, value, ctx);
  if (!(obj instanceof DataFrame)) throw new NotSupported('.loc[ ] 로 값 바꾸기');
  if (!(key instanceof Tuple) || key.items.length !== 2) {
    // df.loc[이름표] = [값들] / {열: 값} — 없는 이름표면 맨 아래에 새 줄을 만든다
    const lab = key instanceof Series || key instanceof Index || Array.isArray(key) || key?.pyType === 'slice' ? null : toLabel(key);
    if (lab !== null && !obj.index.has(lab)) { appendRow(obj, lab, value); return; }
    return indexerSet(ix, new Tuple([key, { pyType: 'slice', start: null, stop: null, step: null }]), value, ctx);
  }
  const [rows, colKey] = key.items;
  let cols = typeof colKey === 'string' || typeof colKey === 'number' || colKey instanceof Num ? [toLabel(colKey)] : (Array.isArray(colKey) || colKey instanceof Index) ? toLabels(colKey) : null;
  if (colKey?.pyType === 'slice') {
    const a = colKey.start == null ? 0 : obj.columns.indexOf(toLabel(colKey.start));
    const b = colKey.stop == null ? obj.columns.length - 1 : obj.columns.indexOf(toLabel(colKey.stop));
    cols = obj.columns.slice(a, b + 1);
    if (value instanceof Dict) { appendRowValues(obj, rows, value); return; }
    if (Array.isArray(value) && cols.length === obj.columns.length && !(rows instanceof Series) && !(rows instanceof Index) && rows?.pyType !== 'slice' && !Array.isArray(rows)) {
      const lab = toLabel(rows);
      if (!obj.index.has(lab)) { appendRow(obj, lab, value); return; }
      const p = obj.index.pos(lab);
      if (value.length !== cols.length) throw new PyError('ValueError', 'Must have equal len keys and value when setting with an iterable');
      cols.forEach((c, j) => writeCells(obj.data[c], obj.dtypes[c], [p], value[j], obj.index, (dt) => { obj.dtypes[c] = dt; }, ctx));
      return;
    }
  }
  if (!cols) throw new NotSupported('.loc[…, 이런 열 고르기] 로 값 바꾸기');
  // 없는 줄 이름표 하나에 값 넣기 → 새 줄
  if (!(rows instanceof Series) && !(rows instanceof Index) && rows?.pyType !== 'slice' && !Array.isArray(rows) && !obj.index.has(toLabel(rows))) {
    appendRow(obj, toLabel(rows), new Dict(cols.map((c) => [c, value])));
    return;
  }
  const positions = rowPositions(obj, rows);
  for (const c of cols) {
    if (!(c in obj.data)) {
      if (positions.length !== obj.nrows) {
        // 일부 줄에만 새 열 — 나머지 줄은 빈칸(NaN)
        const isNum = value instanceof Num || typeof value === 'boolean';
        obj.columns.push(c); obj.data[c] = Array(obj.nrows).fill(NaN); obj.dtypes[c] = isNum ? 'float64' : 'object';
        writeCells(obj.data[c], obj.dtypes[c], positions, value, obj.index, (dt) => { obj.dtypes[c] = dt; }, null);
        continue;
      }
      setItem(obj, c, value, ctx); continue;
    }
    const v = value instanceof DataFrame ? value.col(value.columns[cols.indexOf(c)] ?? c) : value;
    writeCells(obj.data[c], obj.dtypes[c], positions, v, obj.index, (dt) => { obj.dtypes[c] = dt; }, ctx);
  }
}

// ─────────────────────────────────────────────────────────────
// 연산 — s > upper, (조건) | (조건), df - df.min(), s * 2 …
// ─────────────────────────────────────────────────────────────
const CMP = new Set(['>', '<', '>=', '<=', '==', '!=']);

function scalarOp(op, x, y) {
  switch (op) {
    case '+': return x + y;
    case '-': return x - y;
    case '*': return x * y;
    case '/': return x / y;
    case '//': return Math.floor(x / y);
    case '%': return ((x % y) + y) % y;
    case '**': return x ** y;
    case '>': return x > y;
    case '<': return x < y;
    case '>=': return x >= y;
    case '<=': return x <= y;
    case '==': return x === y;
    case '!=': return x !== y;
    case '&': return Boolean(x) && Boolean(y);
    case '|': return Boolean(x) || Boolean(y);
  }
  throw new Error(op);
}

function resultDtype(op, da, db) {
  if (CMP.has(op)) return 'bool';
  if (op === '&' || op === '|' || op === '^') return da === 'bool' && db === 'bool' ? 'bool' : intResult(da, db);
  if (op === '/') return 'float64';
  if (op === '**' && db === 'float64') return 'float64';
  if (da === 'float64' || db === 'float64') return 'float64';
  return intResult(da, db);
}
// 정수끼리 — 'pyint'(파이썬 정수)는 짝의 정수 dtype 을 따른다(numpy 2 의 NEP 50)
function intResult(da, db) {
  const ds = [da, db].filter((d) => d !== 'pyint');
  if (ds.length && ds.every((d) => d === 'int32')) return 'int32';
  return 'int64';
}

function scalarInfo(v) {
  if (v instanceof Num) return { v: v.v, dtype: v.isFloat ? 'float64' : v.k === 'b_' ? 'bool' : v.k === 'int' ? 'pyint' : v.k === 'i32' ? 'int32' : 'int64' };
  if (typeof v === 'boolean') return { v, dtype: 'bool' };
  if (typeof v === 'string') return { v, dtype: 'object' };
  if (v instanceof Timestamp) return { v: v.ms, dtype: DT };
  if (v === null) return { v: NaN, dtype: 'float64' };
  return null;
}

function checkLogical(op, dtype) {
  if ((op === '&' || op === '|') && dtype !== 'bool' && !isIntD(dtype) && dtype !== 'pyint') {
    throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${dtype === 'float64' ? 'float' : dtype === 'object' ? 'str' : dtype}' and 'bool'`,
      `조건을 ${op} 로 이을 때는 조건마다 괄호로 감싸야 합니다.\n예) (s > upper) ${op} (s < lower)\n괄호가 없으면 파이썬은 ${op} 를 > · < 보다 먼저 계산합니다.`);
  }
}

// 연산 한 번. 판다스·넘파이 값이 끼어 있으면 여기서 처리하고, 아니면 undefined.
export function pandasBinop(op, a, b) {
  const aS = a instanceof Series, bS = b instanceof Series;
  const aD = a instanceof DataFrame, bD = b instanceof DataFrame;
  if (!aS && !bS && !aD && !bD) return timeScalarOp(op, a, b);
  const timed = timeSeriesOp(op, a, b);
  if (timed !== undefined) return timed;

  if ((aS || bS) && !aD && !bD) {
    const s = aS ? a : b;
    if (aS && bS) {
      let bv = b.values;
      if (!a.index.equals(b.index)) bv = a.index.labels.map((l) => { const p = b.index.pos(l); return p === undefined ? NaN : b.values[p]; });
      // 글자 + 글자 — 칸마다 이어 붙인다
      if (op === '+' && a.dtype === 'object' && b.dtype === 'object') {
        return new Series(a.values.map((x, i) => (isMissing(x) || isMissing(bv[i]) ? NaN : pyStr(x) + pyStr(bv[i]))), a.index, { name: a.name === b.name ? a.name : null, dtype: 'object' });
      }
      if ((a.dtype === DT) !== (b.dtype === DT) && !CMP.has(op)) throw new NotSupported('날짜와 수의 계산');
      if (a.dtype === DT && b.dtype === DT && !CMP.has(op)) throw new NotSupported('날짜끼리 빼기(기간 계산)');
      checkLogical(op, a.dtype); checkLogical(op, b.dtype);
      const dtype = resultDtype(op, a.dtype, b.dtype);
      return new Series(a.values.map((x, i) => elem(op, x, bv[i], dtype)), a.index, { name: a.name === b.name ? a.name : null, dtype });
    }
    const other = aS ? b : a;
    const info = scalarInfo(other);
    if (!info) throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);
    if (s.dtype === DT) {
      if (!CMP.has(op)) throw new NotSupported('날짜 열의 덧셈·뺄셈(기간 계산)');
      const ms = dateOperand(other);
      const vals = s.values.map((x) => (aS ? elem(op, x, ms, 'bool') : elem(op, ms, x, 'bool')));
      return new Series(vals, s.index, { name: s.name, dtype: 'bool' });
    }
    if (op === '+' && s.dtype === 'object' && info.dtype === 'object') {
      return new Series(s.values.map((x) => (isMissing(x) ? NaN : aS ? pyStr(x) + info.v : info.v + pyStr(x))), s.index, { name: s.name, dtype: 'object' });
    }
    checkLogical(op, s.dtype);
    if (op === '&' || op === '|') checkLogical(op, info.dtype);
    if (s.dtype === 'object' && !CMP.has(op)) {
      throw new PyError('TypeError', `unsupported operand type(s) for ${op}: 'str' and '${typeName(other)}'`, `'${s.name}' 열은 글자라서 계산할 수 없습니다. 숫자로 바꾸려면 pd.to_numeric( ) 이나 astype(int) 를 먼저 쓰세요.`);
    }
    if (s.dtype === 'object' && CMP.has(op) && op !== '==' && op !== '!=' && typeof info.v !== 'string') {
      throw new PyError('TypeError', `'${op}' not supported between instances of 'str' and '${typeName(other)}'`, `'${s.name}' 열은 글자라서 수와 크기를 비교할 수 없습니다.`);
    }
    const dtype = resultDtype(op, aS ? s.dtype : info.dtype, aS ? info.dtype : s.dtype);
    const vals = s.values.map((x) => (aS ? elem(op, x, info.v, dtype) : elem(op, info.v, x, dtype)));
    return new Series(vals, s.index, { name: s.name, dtype });
  }

  // DataFrame 이 낀 계산 — 열마다
  const df = aD ? a : b;
  const out = {}, dtypes = {};
  for (const c of df.columns) {
    const left = aD ? new Series(a.data[c], a.index, { name: c, dtype: a.dtypes[c] }) : a instanceof Series ? pickFromSeries(a, c, df) : a;
    const right = bD ? (c in b.data ? new Series(b.data[c], b.index, { name: c, dtype: b.dtypes[c] }) : NaN) : b instanceof Series ? pickFromSeries(b, c, df) : b;
    const r = pandasBinop(op, left, right) ?? pandasBinop(op, left instanceof Series ? left : right, left instanceof Series ? right : left);
    out[c] = r.values; dtypes[c] = r.dtype;
  }
  return df.keepMeta(new DataFrame([...df.columns], out, df.index, dtypes));
}

// ── 날짜·기간 계산 ──
// 값 하나끼리 (Timestamp ± Timedelta, Timestamp − Timestamp, Timedelta × 수 …) — 해당 없으면 undefined
const tdOf = (v) => (v instanceof Timedelta ? v.ms : null);
const tsOf = (v) => (v instanceof Timestamp ? v.ms : null);
function timeScalarOp(op, a, b) {
  const ta = tsOf(a), tb = tsOf(b), da = tdOf(a), db = tdOf(b);
  if (ta === null && tb === null && da === null && db === null) return undefined;
  if (CMP.has(op)) {
    const x = ta ?? da, y = tb ?? db ?? (typeof b === 'string' && ta !== null ? dateOperand(b) : null);
    if (x !== null && y !== null) return scalarOp(op, x, y);
    return undefined;
  }
  if (ta !== null && db !== null && (op === '+' || op === '-')) return new Timestamp(op === '+' ? ta + db : ta - db);
  if (da !== null && tb !== null && op === '+') return new Timestamp(tb + da);
  if (ta !== null && tb !== null && op === '-') return new Timedelta(ta - tb);
  if (da !== null && db !== null && (op === '+' || op === '-')) return new Timedelta(op === '+' ? da + db : da - db);
  if (da !== null && db !== null && op === '/') return new Num(da / db, 'float');
  if (da !== null && isNumberLike(b) && (op === '*' || op === '/')) return new Timedelta(op === '*' ? da * toNumber(b) : da / toNumber(b));
  if (db !== null && isNumberLike(a) && op === '*') return new Timedelta(db * toNumber(a));
  throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`, '날짜끼리는 빼기만, 날짜와 기간은 더하기·빼기만 할 수 있습니다.');
}
// 시리즈가 낀 날짜·기간 계산 — 해당 없으면 undefined
function timeSeriesOp(op, a, b) {
  const aS = a instanceof Series, bS = b instanceof Series;
  if (!aS && !bS) return undefined;
  const s = aS ? a : b;
  const other = aS ? b : a;
  const isTime = (v) => v instanceof Timestamp || v instanceof Timedelta || (v instanceof Series && (v.dtype === DT || v.dtype === TD));
  if (!(s.dtype === DT || s.dtype === TD) && !isTime(other)) return undefined;
  if (s.dtype === DT && CMP.has(op) && !(other instanceof Series)) return undefined; // 글자와 비교는 아래(원래 길)에서
  const kindOf = (v) => (v instanceof Series ? v.dtype : v instanceof Timestamp ? DT : v instanceof Timedelta ? TD : isNumberLike(v) ? 'num' : 'x');
  const ka = kindOf(a), kb = kindOf(b);
  const vals = (v, n) => (v instanceof Series ? (aS && bS && !a.index.equals(b.index) && v === b ? a.index.labels.map((l) => { const p = b.index.pos(l); return p === undefined ? NaN : b.values[p]; }) : v.values) : Array(n).fill(v instanceof Timestamp || v instanceof Timedelta ? v.ms : toNumber(v)));
  const n = s.length;
  const xa = vals(a, n), xb = vals(b, n);
  const out = (arr, dtype) => new Series(arr, s.index, { name: aS && bS ? (a.name === b.name ? a.name : null) : s.name, dtype });
  if (CMP.has(op) && ka === kb) return out(xa.map((x, i) => elem(op, x, xb[i], 'bool')), 'bool');
  if (op === '-' && ka === DT && kb === DT) return out(xa.map((x, i) => x - xb[i]), TD);
  if ((op === '+' || op === '-') && ka === DT && kb === TD) return out(xa.map((x, i) => (op === '+' ? x + xb[i] : x - xb[i])), DT);
  if (op === '+' && ka === TD && kb === DT) return out(xa.map((x, i) => x + xb[i]), DT);
  if ((op === '+' || op === '-') && ka === TD && kb === TD) return out(xa.map((x, i) => (op === '+' ? x + xb[i] : x - xb[i])), TD);
  if (op === '/' && ka === TD && kb === TD) return out(xa.map((x, i) => x / xb[i]), 'float64');
  if ((op === '*' || op === '/') && ka === TD && kb === 'num') return out(xa.map((x, i) => (op === '*' ? x * xb[i] : x / xb[i])), TD);
  if (ka === DT && kb === 'num' || ka === 'num' && kb === DT) throw new PyError('TypeError', `unsupported operand type(s) for ${op}: 'DatetimeArray' and '${kb === 'num' ? 'int' : 'DatetimeArray'}'`, '날짜에 수를 바로 더할 수 없습니다. pd.Timedelta(days=…) 로 기간을 만들어 더하세요.');
  throw new NotSupported(`날짜·기간의 ${op} 계산`);
}

// df - df.min() 처럼 표와 시리즈를 계산하면 시리즈의 이름표가 열 이름과 짝지어진다
function pickFromSeries(s, col, df) {
  const p = s.index.pos(col);
  const v = p === undefined ? NaN : s.values[p];
  return box(v, s.dtype);
}

function elem(op, x, y, dtype) {
  if (x instanceof Num) x = x.v;
  if (y instanceof Num) y = y.v;
  if (CMP.has(op)) {
    if ((typeof x === 'number' && Number.isNaN(x)) || (typeof y === 'number' && Number.isNaN(y))) return op === '!=';
    return scalarOp(op, x, y);
  }
  if (dtype === 'bool') return scalarOp(op, x, y);
  if (isIntD(dtype) && (op === '&' || op === '|' || op === '^')) { const xx = Number(x), yy = Number(y); return op === '&' ? xx & yy : op === '|' ? xx | yy : xx ^ yy; }
  return scalarOp(op, Number(x), Number(y));
}

export function pandasUnary(op, v) {
  if (v instanceof Series) {
    if (op === '~') {
      if (v.dtype !== 'bool') throw new PyError('TypeError', "bad operand type for unary ~: 'float'");
      return v.copyWith(v.values.map((x) => !x));
    }
    if (op === '-') return v.copyWith(v.requireNumeric('부호 바꾸기').map((x) => -x));
    return v;
  }
  if (v instanceof DataFrame && op === '~') return mapFrame(v, (x) => !x, 'bool');
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// 화면 표기 (repr)
// ─────────────────────────────────────────────────────────────
const MAX_ROWS = 60, MIN_ROWS = 10;

// 열 하나의 값들을 글자로 — 앞에 부호 자리(빈칸)를 둔다
function formatValues(values, dtype) {
  if (dtype === 'float64') {
    const s = pandasFloatColumn(values);
    // 너무 크거나 작은 값이 섞이면 지수 표기로
    const abs = values.filter((x) => !Number.isNaN(x)).map(Math.abs);
    const withSign = s.map((x, i) => (x === 'NaN' ? 'NaN' : Object.is(values[i], -0) ? '-' + x : (values[i] < 0 ? '' : ' ') + x));
    const tooLong = Math.max(0, ...withSign.map((x) => x.length)) > 12;
    if (abs.some((x) => x > 0 && x < 1e-6) || (tooLong && abs.some((x) => x > 1e6))) {
      return values.map((x) => (Number.isNaN(x) ? 'NaN' : (x < 0 ? '' : ' ') + expPy(x)));
    }
    return withSign;
  }
  if (isIntD(dtype)) return values.map((x) => (x < 0 ? '' : ' ') + String(x));
  if (dtype === 'bool') return values.map((x) => ' ' + (x ? 'True' : 'False'));
  if (dtype === DT) return formatDates(values);
  if (dtype === TD) return formatTds(values);
  return values.map((x) => {
    if (isMissing(x)) return x === NaT ? ' NaT' : ' NaN';
    if (x instanceof Num && x.isFloat) return ' ' + pandasFloatSingle(x.v).replace(/^-/, '-');
    if (x instanceof Num) return ' ' + String(x.v);
    if (typeof x === 'boolean') return ' ' + (x ? 'True' : 'False');
    return ' ' + thing(x);
  }).map((x) => x.replace(/^ -/, '-'));
}
// pandas 의 pprint_thing — 리스트는 [a, b] (따옴표 없이)
function thing(x) {
  if (Array.isArray(x)) return '[' + x.map(thing).join(', ') + ']';
  if (x instanceof Num) return pyStr(x);
  return pyStr(x);
}

function expPy(x) {
  const [m, e] = x.toExponential(6).split('e');
  const n = Number(e);
  return m.replace('-', '') + 'e' + (n < 0 ? '-' : '+') + String(Math.abs(n)).padStart(2, '0');
}

function truncatedRows(n) {
  if (n <= MAX_ROWS) return { rows: [...Array(n).keys()], cut: -1 };
  const half = MIN_ROWS / 2;
  return { rows: [...Array(half).keys(), ...Array.from({ length: half }, (_, i) => n - half + i)], cut: half };
}

function labelStr(l) {
  if (l instanceof Num) return pyStr(l);
  return typeof l === 'number' ? String(l) : String(l);
}

// pandas.io.formats.printing.adjoin — 열마다 (가장 긴 글자 + 간격) 으로 왼쪽 맞춤해 잇는다
function adjoin(space, lists) {
  const lengths = lists.map((l, i) => Math.max(...l.map((x) => x.length)) + (i < lists.length - 1 ? space : 0));
  const n = Math.max(...lists.map((l) => l.length));
  const lines = [];
  for (let r = 0; r < n; r++) lines.push(lists.map((l, i) => (l[r] ?? '').padEnd(lengths[i])).join(''));
  return lines.join('\n');
}
// pandas 의 _binify · _join_multiline — 한 줄에 다 안 들어가면 열을 여러 덩어리로
function joinMultiline(strcols, lineWidth) {
  const idx = strcols[0], rest = strcols.slice(1);
  const lwidth = lineWidth - (Math.max(...idx.map((x) => x.length)) + 1);
  const widths = rest.map((col) => (col.length ? Math.max(...col.map((x) => x.length)) : 0));
  const bins = [];
  let cur = 0;
  widths.forEach((w, i) => {
    cur += w + 1;
    const wrap = i === widths.length - 1 ? cur + 1 > lwidth && i > 0 : cur + 2 > lwidth && i > 0;
    if (wrap) { bins.push(i); cur = w + 1; }
  });
  bins.push(widths.length);
  const blocks = [];
  let start = 0;
  bins.forEach((end, i) => {
    const row = [idx, ...rest.slice(start, end)];
    if (bins.length > 1) {
      const nrows = row[row.length - 1].length;
      if (end <= rest.length && i < bins.length - 1) row.push([' \\', ...Array(nrows - 1).fill('  ')]);
      else row.push(Array(nrows).fill(' '));
    }
    blocks.push(adjoin(1, row));
    start = end;
  });
  return blocks.join('\n\n');
}

// pandas 의 sparsify_labels — 위 줄과 같은 바깥 단계 이름표는 비워 둔다
function sparsify(levels, start) {
  const out = levels.map((l) => [...l]);
  const n = levels[0].length;
  for (let r = start + 1; r < n; r++) {
    for (let j = 0; j < levels.length - 1; j++) {
      if (levels.slice(0, j + 1).every((lv) => lv[r] === lv[r - 1])) out[j][r] = '';
      else break;
    }
  }
  return out;
}
// 이름표 단계마다 [이름, ...보일 줄들] (줄여 보일 때는 rows 만)
function indexLevels(index, rows) {
  if (index instanceof MultiIndex) {
    const f = index.formattedLevels();
    const lv = f.map((col, j) => [index.names[j] == null ? '' : String(index.names[j]), ...rows.map((i) => col[i])]);
    return sparsify(lv, 1);
  }
  const f = index.formatted();
  return [[index.name == null ? '' : String(index.name), ...rows.map((i) => f[i])]];
}

export function renderFrame(df) {
  const n = df.nrows;
  if (df.columns.length === 0 || n === 0) {
    const cols = '[' + df.columns.map((c) => c).join(', ') + ']';
    const idx = '[' + df.index.labels.map(labelStr).join(', ') + ']';
    return `Empty DataFrame\nColumns: ${cols}\nIndex: ${idx}`;
  }
  const { rows, cut } = truncatedRows(n);
  const mi = df.index instanceof MultiIndex;
  const levels = indexLevels(df.index, rows);
  // 이름표에 이름이 있으면(groupby 결과 등) 머리글 아래에 그 이름만 적힌 줄이 하나 더 생긴다
  const named = mi ? df.index.names.every((x) => x != null) : df.index.name != null;
  const H = named ? 2 : 1;
  let idxLines;
  if (mi) {
    const fixedLv = levels.map((l) => { const w = Math.max(...l.map((x) => x.length)); return l.map((x) => x.padEnd(w)); });
    idxLines = adjoin(1, named ? fixedLv : fixedLv.map((l) => l.slice(1))).split('\n');
  } else idxLines = named ? levels[0] : levels[0].slice(1);
  const colHead = df.columnsName != null ? String(df.columnsName) : '';
  const idxW = Math.max(0, ...idxLines.map((x) => x.length), colHead.length);
  const idxCol = [colHead, ...idxLines].map((x) => x.padEnd(idxW));
  const strcols = [idxCol];
  for (const c of df.columns) {
    const dt = df.dtypes[c];
    const header = (NUMERIC.has(dt) ? ' ' : '') + String(c);
    const vals = formatValues(rows.map((i) => df.data[c][i]), dt);
    const w = Math.max(header.length, ...vals.map((x) => x.length));
    strcols.push([header.padStart(w), ...(named ? [''.padStart(w)] : []), ...vals.map((x) => x.padStart(w))]);
  }
  if (cut >= 0) {
    strcols.forEach((col, ix) => {
      const cw = col[cut + H - 1].length;
      const dots = cw > 3 ? '...' : '..';
      col.splice(cut + H, 0, ix === 0 ? dots.padEnd(cw) : dots.padStart(cw));
    });
  }
  let out = joinMultiline(strcols, 80);
  if (cut >= 0) out += `\n\n[${n} rows x ${df.columns.length} columns]`;
  return out;
}

// HTML 표로 그릴 칸 — pandas 의 _repr_html_ 처럼 60줄이 넘으면 앞뒤 5줄만
export function frameTable(df) {
  const n = df.nrows;
  const { rows, cut } = truncatedRows(n);
  const levels = indexLevels(df.index, rows);
  const mi = df.index instanceof MultiIndex;
  const cols = df.columns.map((c) => ({ name: String(c), numeric: NUMERIC.has(df.dtypes[c]),
    cells: formatValues(rows.map((i) => df.data[c][i]), df.dtypes[c]).map((x) => x.trim()) }));
  const names = levels.map((l) => l[0]);
  return {
    index: levels[levels.length - 1].slice(1), levels: levels.map((l) => l.slice(1)), cols, cut, nrows: n, ncols: df.columns.length,
    indexName: mi ? (names.some(Boolean) ? names.join(' / ') : null) : df.index.name == null ? null : String(df.index.name),
    indexNames: names, columnsName: df.columnsName == null ? null : String(df.columnsName),
  };
}

export function renderSeries(s) {
  const n = s.length;
  const nameTxt = s.name == null ? null : `Name: ${typeof s.name === 'string' ? s.name : labelStr(s.name)}`;
  const dtypeTxt = `dtype: ${s.dtype}`;
  if (n === 0) {
    return `Series([], ${[nameTxt, dtypeTxt].filter(Boolean).join(', ')})`;
  }
  const { rows, cut } = truncatedRows(n);
  let vals = formatValues(rows.map((i) => s.values[i]), s.dtype);
  const vw = Math.max(...vals.map((x) => x.length));
  vals = vals.map((x) => x.padStart(vw));
  const mi = s.index instanceof MultiIndex;
  let head = null, idx;
  if (mi) {
    const lines = adjoin(2, indexLevels(s.index, rows)).split('\n');
    if (s.index.names.some((x) => x != null && x !== '')) head = lines[0];
    idx = lines.slice(1);
  } else {
    idx = s.index.formatted();
    idx = rows.map((i) => idx[i]);
    if (s.index.name != null) head = String(s.index.name);
  }
  if (cut >= 0) {
    vals.splice(cut, 0, center(vw > 3 ? '...' : '..', vw));
    idx.splice(cut, 0, '');
  }
  const iw = Math.max(...idx.map((x) => x.length));
  const lines = idx.map((l, i) => l.padEnd(iw) + '   ' + vals[i]);
  const out = (head != null ? head + '\n' : '') + lines.join('\n');
  // 이름표가 기간(Period)이면 맨 앞에 Freq 가 붙는다 — Freq: Q-DEC, Name: …
  const freq = !mi && s.index.dtype.startsWith('period[') ?`Freq: ${s.index.dtype.slice(7, -1)}` : null;
  const footer = [freq, nameTxt, cut >= 0 ? `Length: ${n}` : null, dtypeTxt].filter(Boolean).join(', ');
  return out + '\n' + footer;
}

export { fixed };
