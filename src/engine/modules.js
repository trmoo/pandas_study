// © 2026 티쳐무 · 모든 권리 보유
// import 로 가져오는 모듈들 — pandas · numpy · matplotlib · sklearn · google.colab
import {
  Module, PyFunc, PyError, NotSupported, Tuple, Dict, Num, f64, pyInt, pyFloatNum,
  parseArgs, REQUIRED, toNumber, typeName, str as pyStr, repr,
} from './pyvalues.js';
import { DataFrame, Series, Index, MultiIndex, isMissing, seriesFromValues, meltFrame } from './pandas.js';
import { mergeFrames, concatFrames, pivotTable, crosstab, toDatetime, toNumeric } from './combine.js';
import { DT, Timestamp, Timedelta } from './datetime.js';
import { NDArray, percentileOf, roundHalfEven } from './ndarray.js';
import { pyplotAttrs, rcParams, fontManagerModule } from './plotting.js';
import { pairwiseSum } from './numfmt.js';

// 진짜로 있는 파이썬 모듈 — import 하면 "없는 모듈"이 아니라 "지원하지 않음"으로 알려 준다
export const KNOWN_REAL_MODULES = new Set(['seaborn', 'scipy', 'os', 'sys', 'math', 'random', 'statistics', 'json', 'csv',
  'datetime', 'time', 're', 'collections', 'itertools', 'plotly', 'tensorflow', 'keras', 'torch', 'requests', 'warnings',
  'pydataset', 'openpyxl', 'xgboost', 'lightgbm', 'statsmodels']);

const fn = (name, body) => new PyFunc(name, body, { kind: 'function' });

// 무엇이 들어와도 수 배열로 (np 함수들이 받는 값)
function toFloatArray(v, fname) {
  if (v instanceof Series) {
    if (v.dtype === 'object') throw new PyError('TypeError', `could not convert string to float: '${v.values.find((x) => typeof x === 'string')}'`, `'${v.name}' 열은 글자라서 ${fname}( ) 에 넣을 수 없습니다.`);
    return v.values.map(Number);
  }
  if (v instanceof NDArray) return v.data.map(Number);
  if (Array.isArray(v)) return v.map((x) => toNumber(x));
  if (v instanceof Tuple) return v.items.map((x) => toNumber(x));
  if (v instanceof DataFrame) {
    const cols = v.columns.filter((c) => v.dtypes[c] !== 'object');
    if (cols.length !== v.columns.length) throw new PyError('TypeError', `could not convert string to float`, `표에 글자 열이 섞여 있어 ${fname}( ) 을 계산할 수 없습니다.`);
    return cols.flatMap((c) => v.data[c]);
  }
  return [toNumber(v)];
}

function readCsv(files) {
  return fn('read_csv', (args, kw) => {
    const o = parseArgs('read_csv', args, kw, [['filepath_or_buffer', REQUIRED], ['sep', ','], ['delimiter', null], ['header', 'infer'], ['names', null], ['index_col', null],
      ['usecols', null], ['dtype', null], ['encoding', null], ['parse_dates', null], ['na_values', null], ['nrows', null], ['skiprows', null], ['thousands', null]]);
    const path = pyStr(o.filepath_or_buffer);
    let base = path.replace(/\\/g, '/').replace(/^(\.\/|\/content\/)/, '');
    // 코랩 폴더 경로(/content/drive/…/menu.csv)로 적어도 파일 이름만 맞으면 연다
    if (files[base] === undefined && files[base.replace(/^.*\//, '')] !== undefined) base = base.replace(/^.*\//, '');
    const text = files[base];
    if (text === undefined) {
      const known = Object.keys(files).join(', ');
      let hint = `이 실습실에 들어 있는 파일: ${known}. 파일 이름을 따옴표 안에 정확히 적으세요.`;
      if (/^https?:/.test(path)) hint = '이 실습실은 인터넷에서 파일을 받아 오지 않습니다. ' + hint;
      throw new PyError('FileNotFoundError', `[Errno 2] No such file or directory: '${path}'`, hint);
    }
    for (const k of ['names', 'dtype', 'na_values', 'nrows', 'skiprows', 'thousands']) if (o[k] != null) throw new NotSupported(`read_csv(${k}=…)`);
    if (o.header !== 'infer' && !(o.header instanceof Num && o.header.v === 0)) throw new NotSupported('read_csv(header=…)');
    const ic = o.index_col == null || o.index_col === false ? null : o.index_col instanceof Num ? o.index_col.v : pyStr(o.index_col);
    const pdates = o.parse_dates == null || o.parse_dates === false ? null : Array.isArray(o.parse_dates) ? o.parse_dates.map(pyStr) : o.parse_dates === true ? null : [pyStr(o.parse_dates)];
    const uc = o.usecols == null ? null : o.usecols.map(pyStr);
    return DataFrame.fromCSV(text, { indexCol: ic, parseDates: pdates, sep: pyStr(o.delimiter ?? o.sep), usecols: uc });
  });
}

function makeDataFrame() {
  const idxOf = (v) => (v instanceof Index ? v : new Index(Array.isArray(v) ? v.map((x) => (x instanceof Num ? x.v : x)) : v instanceof Series ? v.values : []));
  let idx = null;
  const f = fn('DataFrame', (args, kw) => {
    const o = parseArgs('DataFrame', args, kw, [['data', null], ['index', null], ['columns', null], ['dtype', null]]);
    idx = o.index;
    const cols = o.columns == null ? null : o.columns instanceof Index ? o.columns.labels.map(String) : Array.isArray(o.columns) ? o.columns.map(pyStr) : null;
    const d = o.data;
    if (d instanceof NDArray) {
      if (d.ndim !== 2) throw new PyError('ValueError', 'Must pass 2-d input. shape=(' + d.shape.join(', ') + ',)', '표는 2차원(행×열) 배열로 만듭니다.');
      const [r, c] = d.shape;
      const names = cols ?? Array.from({ length: c }, (_, j) => j);
      if (names.length !== c) {
        throw new PyError('ValueError', `Shape of passed values is (${r}, ${c}), indices imply (${r}, ${names.length})`,
          `배열은 ${c}열인데 열 이름은 ${names.length}개입니다. 개수를 맞춰야 합니다.`);
      }
      const data = {}, dtypes = {};
      names.forEach((nm, j) => { data[nm] = d.col(j); dtypes[nm] = d.dtype === 'object' ? 'object' : 'float64'; });
      return new DataFrame(names, data, Index.range(r), dtypes);
    }
    if (d instanceof DataFrame) {
      const out = d.copy();
      return cols ? out.selectColumns(cols) : out;
    }
    if (d instanceof Dict) {
      const names = [...d.map.keys()].map((k) => (k instanceof Num ? k.v : pyStr(k)));
      const vals = [...d.map.values()];
      const data = {}, dtypes = {};
      // 시리즈로 만든 열들은 이름표로 줄을 맞춘다
      const firstS = vals.find((v) => v instanceof Series);
      const allScalar = vals.every((v) => !(v instanceof Series) && !Array.isArray(v) && !(v instanceof NDArray) && !(v instanceof Tuple));
      let index = idx ? idxOf(idx) : null;
      if (!index && firstS) {
        const labels = [];
        const seen = new Set();
        vals.forEach((v) => { if (v instanceof Series) v.index.labels.forEach((l) => { if (!seen.has(l)) { seen.add(l); labels.push(l); } }); });
        index = vals.filter((v) => v instanceof Series).every((v) => v.index.equals(firstS.index)) ? firstS.index : new Index(labels);
      }
      if (allScalar && !index) throw new PyError('ValueError', 'If using all scalar values, you must pass an index', "값을 하나씩만 넣을 때는 index=[...] 를 함께 적어야 합니다. 또는 값을 리스트로 감싸세요. 예) {'가': [1]}");
      let n = index ? index.length : null;
      vals.forEach((v, j) => {
        let s;
        if (v instanceof Series) {
          const full = index.labels.every((l) => v.index.has(l));
          s = v.index.equals(index) ? v : new Series(index.labels.map((l) => { const p = v.index.pos(l); return p === undefined ? NaN : v.values[p]; }), index, { dtype: full ? v.dtype : v.dtype === 'int64' ? 'float64' : v.dtype });
        } else if (v instanceof NDArray) s = new Series([...v.data], Index.range(v.size), { dtype: v.dtype });
        else s = Series.fromPython(Array.isArray(v) ? v : v instanceof Tuple ? v.items : Array(n ?? 1).fill(v));
        data[names[j]] = [...s.values]; dtypes[names[j]] = s.dtype;
        if (n !== null && n !== s.length) throw new PyError('ValueError', 'All arrays must be of the same length', '열마다 값의 개수가 같아야 합니다.');
        n = s.length;
      });
      return new DataFrame(names, data, index ?? Index.range(n ?? 0), dtypes);
    }
    if (Array.isArray(d)) {
      const rows = d.map((r) => (Array.isArray(r) ? r : r instanceof Tuple ? r.items : [r]));
      const c = Math.max(0, ...rows.map((r) => r.length));
      const names = cols ?? Array.from({ length: c }, (_, j) => j);
      const data = {}, dtypes = {};
      names.forEach((nm, j) => { const s = Series.fromPython(rows.map((r) => r[j] ?? null)); data[nm] = s.values; dtypes[nm] = s.dtype; });
      const index = idx ? idxOf(idx) : Index.range(rows.length);
      if (index.length !== rows.length) throw new PyError('ValueError', `Shape of passed values is (${rows.length}, ${names.length}), indices imply (${index.length}, ${names.length})`, '줄 수와 index 에 적은 이름표 수를 맞추세요.');
      return new DataFrame(names, data, index, dtypes);
    }
    if (d === null) return new DataFrame(cols ?? [], Object.fromEntries((cols ?? []).map((c) => [c, []])), Index.range(0), Object.fromEntries((cols ?? []).map((c) => [c, 'object'])));
    throw new NotSupported(`pd.DataFrame(${typeName(d)})`);
  });
  f.kind = 'class'; f.owner = 'pandas.core.frame.DataFrame';
  return f;
}

// ── scikit-learn 의 척도 맞추기(스케일러) ──────────────────────
// MinMaxScaler: (x − 최솟값) ÷ (최댓값 − 최솟값) 을 sklearn 과 같은 순서로 계산한다.
//   scale = 1 / (max − min),  min_ = 0 − min × scale,  결과 = x × scale + min_
function asMatrix(X, who) {
  if (X instanceof DataFrame) {
    const obj = X.columns.find((c) => X.dtypes[c] === 'object');
    if (obj) {
      const bad = X.data[obj].find((x) => typeof x === 'string');
      throw new PyError('ValueError', `could not convert string to float: '${bad}'`,
        `'${obj}' 열은 글자라서 ${who} 에 넣을 수 없습니다. 숫자 열만 골라 넣으세요. 예) df[['열1', '열2']]`);
    }
    return { rows: X.nrows, cols: X.columns.length, get: (i, j) => X.data[X.columns[j]][i], names: X.columns };
  }
  if (X instanceof NDArray && X.ndim === 2) return { rows: X.shape[0], cols: X.shape[1], get: (i, j) => X.data[i * X.shape[1] + j] };
  if (X instanceof Series || (X instanceof NDArray && X.ndim === 1)) {
    throw new PyError('ValueError', 'Expected 2D array, got 1D array instead',
      '스케일러에는 표(2차원)를 넣어야 합니다. 열 하나만 넣으려면 대괄호를 두 겹으로 쓰세요. 예) df[[\'열이름\']]');
  }
  if (Array.isArray(X)) {
    const rows = X.map((r) => (Array.isArray(r) ? r.map((x) => toNumber(x)) : null));
    if (rows.some((r) => !r)) throw new PyError('ValueError', 'Expected 2D array, got 1D array instead', '스케일러에는 2차원 값(표)을 넣어야 합니다.');
    return { rows: rows.length, cols: rows[0]?.length ?? 0, get: (i, j) => rows[i][j] };
  }
  throw new PyError('TypeError', `${who} 에 넣을 수 없는 값입니다: ${typeName(X)}`);
}

function makeScaler(kindName) {
  const cls = new PyFunc(kindName, (args, kw) => {
    const o = kindName === 'MinMaxScaler'
      ? parseArgs('MinMaxScaler', args, kw, [['feature_range', new Tuple([pyInt(0), pyInt(1)])], ['copy', true], ['clip', false]])
      : parseArgs('StandardScaler', args, kw, [['copy', true], ['with_mean', true], ['with_std', true]]);
    return new Scaler(kindName, o);
  }, { kind: 'class', owner: `sklearn.preprocessing._data.${kindName}` });
  // MinMaxScaler.fit_transform(df) 처럼 괄호 없이 부르면
  cls.classAttrs = Object.fromEntries(['fit', 'transform', 'fit_transform'].map((m) => [m, new PyFunc(m, () => {
    throw new PyError('TypeError', `${m === 'fit_transform' ? 'TransformerMixin' : kindName}.${m}() missing 1 required positional argument: 'X'`,
      `${kindName} 뒤에 괄호 ( ) 를 붙여 스케일러를 먼저 만들어야 합니다. 예) ${kindName}().${m}(표)`);
  }, { kind: 'function' })]));
  return cls;
}

class Scaler {
  constructor(kind, opts) {
    this.kind = kind; this.opts = opts; this.fitted = false;
    if (kind === 'MinMaxScaler') {
      const fr = opts.feature_range instanceof Tuple ? opts.feature_range.items.map((v) => toNumber(v)) : [0, 1];
      this.range = fr;
    }
  }
  get pyType() { return this.kind; }
  repr() { return `${this.kind}()`; }
  equals(o) { return o instanceof Scaler && o.kind === this.kind && JSON.stringify([o.a, o.b]) === JSON.stringify([this.a, this.b]); }

  fit(X) {
    const m = asMatrix(X, `${this.kind}`);
    this.nFeatures = m.cols; this.names = m.names;
    const colVals = Array.from({ length: m.cols }, (_, j) => Array.from({ length: m.rows }, (_, i) => m.get(i, j)));
    if (this.kind === 'MinMaxScaler') {
      const [lo, hi] = this.range;
      this.dataMin = colVals.map((c) => nanMin(c));
      this.dataMax = colVals.map((c) => nanMax(c));
      const scale = this.dataMin.map((mn, j) => { const r = this.dataMax[j] - mn; return (hi - lo) / (r === 0 ? 1 : r); });
      this.a = scale;
      this.b = this.dataMin.map((mn, j) => lo - mn * scale[j]);
    } else {
      this.mean = colVals.map((c) => { const f = c.filter((x) => !Number.isNaN(x)); return pairwiseSum(f) / f.length; });
      this.std = colVals.map((c, j) => { const f = c.filter((x) => !Number.isNaN(x)); const v = pairwiseSum(f.map((x) => (x - this.mean[j]) ** 2)) / f.length; const s = Math.sqrt(v); return s === 0 ? 1 : s; });
    }
    this.fitted = true;
    return this;
  }
  transform(X) {
    if (!this.fitted) {
      throw new PyError('NotFittedError', `This ${this.kind} instance is not fitted yet. Call 'fit' with appropriate arguments before using this estimator.`,
        '먼저 fit( ) 으로 최솟값·최댓값을 배우게 한 뒤 transform( ) 해야 합니다. 한 번에 하려면 fit_transform( ) 을 쓰세요.');
    }
    const m = asMatrix(X, this.kind);
    if (m.cols !== this.nFeatures) {
      throw new PyError('ValueError', `X has ${m.cols} features, but ${this.kind} is expecting ${this.nFeatures} features as input.`);
    }
    const data = [];
    for (let i = 0; i < m.rows; i++) {
      for (let j = 0; j < m.cols; j++) {
        const x = m.get(i, j);
        if (this.kind === 'MinMaxScaler') { let y = x * this.a[j]; y += this.b[j]; data.push(y); }
        else data.push((x - this.mean[j]) / this.std[j]);
      }
    }
    return new NDArray(data, [m.rows, m.cols], 'float64');
  }
  getattr(name) {
    const b = (nm, f) => new PyFunc(nm, f, { owner: this.kind, self: this });
    switch (name) {
      case 'fit': return b('fit', (a, k) => { const { X } = parseArgs('fit', a, k, [['X', REQUIRED], ['y', null]]); return this.fit(X); });
      case 'transform': return b('transform', (a, k) => { const { X } = parseArgs('transform', a, k, [['X', REQUIRED]]); return this.transform(X); });
      case 'fit_transform': return b('fit_transform', (a, k) => { const { X } = parseArgs('fit_transform', a, k, [['X', REQUIRED], ['y', null]]); return this.fit(X).transform(X); });
      case 'data_min_': return this.fitted && this.dataMin ? new NDArray([...this.dataMin], [this.dataMin.length]) : undefined;
      case 'data_max_': return this.fitted && this.dataMax ? new NDArray([...this.dataMax], [this.dataMax.length]) : undefined;
      case 'mean_': return this.fitted && this.mean ? new NDArray([...this.mean], [this.mean.length]) : undefined;
    }
    return undefined;
  }
}

function nanMin(c) { const f = c.filter((x) => !Number.isNaN(x)); return f.length ? Math.min(...f) : NaN; }
function nanMax(c) { const f = c.filter((x) => !Number.isNaN(x)); return f.length ? Math.max(...f) : NaN; }

export function makeModules(ctxGetter) {
  const files = () => ctxGetter().files;

  const pandas = new Module('pandas', {});
  Object.assign(pandas.attrs, {
    read_csv: new PyFunc('read_csv', (a, k, ctx) => readCsv(ctx.files).fn(a, k, ctx), { kind: 'function' }),
    DataFrame: makeDataFrame(),
    Series: Object.assign(fn('Series', (args, kw) => {
      const o = parseArgs('Series', args, kw, [['data', null], ['index', null], ['dtype', null], ['name', null], ['copy', null]]);
      const index = o.index == null ? null : o.index instanceof Index ? o.index : new Index((Array.isArray(o.index) ? o.index : o.index instanceof Tuple ? o.index.items : []).map((x) => (x instanceof Num ? x.v : x instanceof Timestamp ? x.ms : x)));
      let s;
      const d = o.data;
      if (d instanceof Dict) {
        const keys = [...d.map.keys()].map((x) => (x instanceof Num ? x.v : x));
        s = Series.fromPython([...d.map.values()], { index: new Index(keys) });
        if (index) s = new Series(index.labels.map((l) => { const p = s.index.pos(l); return p === undefined ? NaN : s.values[p]; }), index, { dtype: index.labels.every((l) => s.index.has(l)) ? s.dtype : s.dtype === 'int64' ? 'float64' : s.dtype });
      } else if (d instanceof Series) {
        s = new Series([...d.values], index ?? d.index, { name: d.name, dtype: d.dtype });
      } else if (d instanceof NDArray) {
        s = new Series([...d.data], index ?? Index.range(d.size), { dtype: d.dtype === 'int64' || d.dtype === 'bool' ? d.dtype : d.dtype === 'object' || d.dtype === 'str' ? 'object' : 'float64' });
      } else if (d instanceof Index) {
        s = new Series([...d.labels], index ?? Index.range(d.length), { dtype: d.dtype });
      } else if (Array.isArray(d) || d instanceof Tuple) {
        const vals = Array.isArray(d) ? d : d.items;
        if (index && index.length !== vals.length) throw new PyError('ValueError', `Length of values (${vals.length}) does not match length of index (${index.length})`, '값의 개수와 index 이름표의 개수가 같아야 합니다.');
        s = Series.fromPython(vals, { index: index ?? Index.range(vals.length) });
      } else if (d == null) {
        s = new Series([], index ?? Index.range(0), { dtype: 'object' });
      } else {
        // 값 하나 — 이름표 수만큼 되풀이
        const n = index ? index.length : 1;
        s = Series.fromPython(Array(n).fill(d), { index: index ?? Index.range(1) });
      }
      if (o.dtype != null) s = s.getattr('astype').fn([o.dtype], new Map());
      if (o.name != null) s.name = o.name instanceof Num ? o.name.v : o.name;
      return s;
    }), { kind: 'class', owner: 'pandas.core.series.Series' }),
    merge: fn('merge', (a, k) => mergeFrames(a, k)),
    melt: fn('melt', (a, k) => meltFrame(a, k)),
    concat: fn('concat', (a, k) => concatFrames(a, k)),
    pivot_table: fn('pivot_table', (a, k) => pivotTable(a, k)),
    crosstab: fn('crosstab', (a, k) => crosstab(a, k)),
    to_datetime: fn('to_datetime', (a, k, ctx) => toDatetime(a, k, ctx)),
    // pd.Timedelta(days=99) · pd.Timedelta(hours=100) — 이름표는 모두 복수형(s)
    Timedelta: Object.assign(fn('Timedelta', (a, k) => {
      const UNITS = { weeks: 604800000, days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000, milliseconds: 1 };
      const SHORT = { W: 'weeks', D: 'days', d: 'days', day: 'days', days: 'days', h: 'hours', hour: 'hours', hours: 'hours', min: 'minutes', minute: 'minutes', minutes: 'minutes', m: 'minutes', s: 'seconds', second: 'seconds', seconds: 'seconds' };
      let ms = 0;
      for (const [key, v] of k) {
        if (key === 'unit') continue;
        if (!(key in UNITS)) {
          const sing = { week: 'weeks', day: 'days', hour: 'hours', minute: 'minutes', second: 'seconds' }[key];
          throw new PyError('ValueError', `cannot construct a Timedelta from the passed arguments, allowed keywords are [weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds]`,
            sing ? `${key}= 가 아니라 ${sing}= 입니다. Timedelta 의 이름은 모두 끝에 s 가 붙습니다(weeks·days·hours·minutes·seconds).` : '');
        }
        ms += toNumber(v) * UNITS[key];
      }
      if (a.length) {
        const unit = k.has('unit') ? pyStr(k.get('unit')) : 'ns';
        if (typeof a[0] === 'string') throw new NotSupported("pd.Timedelta('글자') — pd.Timedelta(days=1) 처럼 이름=값으로 쓰세요");
        if (!SHORT[unit]) throw new NotSupported(`pd.Timedelta(수, unit='${unit}')`);
        ms += toNumber(a[0]) * UNITS[SHORT[unit]];
      }
      return new Timedelta(ms);
    }), { kind: 'class', owner: 'pandas._libs.tslibs.timedeltas.Timedelta' }),
    to_numeric: fn('to_numeric', (a, k) => toNumeric(a, k)),
    notnull: fn('notnull', (a) => a[0]?.getattr?.('notnull')?.fn([], new Map()) ?? !isMissing(a[0] instanceof Num ? a[0].v : a[0])),
    notna: fn('notna', (a) => a[0]?.getattr?.('notna')?.fn([], new Map()) ?? !isMissing(a[0] instanceof Num ? a[0].v : a[0])),
    cut: fn('cut', () => { throw new NotSupported('pd.cut( ) — 구간 나누기는 이 실습실에서 아직 지원하지 않습니다. 치트시트의 예시를 코랩에서 해 보세요'); }),
    qcut: fn('qcut', () => { throw new NotSupported('pd.qcut( )'); }),
    get_dummies: fn('get_dummies', () => { throw new NotSupported('pd.get_dummies( ) — 원-핫 인코딩은 이 실습실에서 아직 지원하지 않습니다'); }),
    set_option: fn('set_option', () => null),
    isnull: fn('isnull', (a) => a[0]?.getattr?.('isnull')?.fn([], new Map()) ?? isMissing(a[0] instanceof Num ? a[0].v : a[0])),
    isna: fn('isna', (a) => a[0]?.getattr?.('isna')?.fn([], new Map()) ?? isMissing(a[0] instanceof Num ? a[0].v : a[0])),
    __version__: '2.2.2',
  });

  const npNan = pyFloatNum(NaN);
  const numpy = new Module('numpy', {
    percentile: fn('percentile', (args, kw, ctx) => {
      const { a, q } = parseArgs('percentile', args, kw, [['a', REQUIRED], ['q', REQUIRED], ['axis', null]]);
      const vals = toFloatArray(a, 'np.percentile');
      if (vals.some(Number.isNaN)) ctx.note('넣은 값에 빈칸(NaN)이 섞여 있어 결과가 nan 이 되었습니다. np.percentile 은 빈칸을 건너뛰지 않습니다. 결측치를 먼저 채우거나 지우세요.');
      if (Array.isArray(q) || q instanceof Tuple || q instanceof NDArray) {
        const qs = q instanceof NDArray ? q.data : (Array.isArray(q) ? q : q.items).map((x) => toNumber(x));
        qs.forEach((x) => { if (x < 0 || x > 100) throw new PyError('ValueError', 'Percentiles must be in the range [0, 100]', '백분위수는 0 부터 100 사이의 수로 적습니다. 예) [25, 75]'); });
        return new NDArray(qs.map((x) => percentileOf(vals, x)), [qs.length], 'float64');
      }
      const qq = toNumber(q);
      if (qq < 0 || qq > 100) throw new PyError('ValueError', 'Percentiles must be in the range [0, 100]', '백분위수는 0 부터 100 사이의 수로 적습니다. 1사분위수는 0.25 가 아니라 25 입니다.');
      return f64(percentileOf(vals, qq));
    }),
    quantile: fn('quantile', (args) => {
      const vals = toFloatArray(args[0], 'np.quantile');
      const q = args[1];
      if (Array.isArray(q)) return new NDArray(q.map((x) => percentileOf(vals, toNumber(x) * 100)), [q.length], 'float64');
      return f64(percentileOf(vals, toNumber(q) * 100));
    }),
    mean: fn('mean', (args) => {
      const a = args[0];
      if (a instanceof Series) return a.getattr('mean').fn([], new Map());
      const v = toFloatArray(a, 'np.mean');
      return f64(pairwiseSum(v) / v.length);
    }),
    median: fn('median', (args) => {
      const v = toFloatArray(args[0], 'np.median');
      if (v.some(Number.isNaN)) return f64(NaN);
      const s = [...v].sort((x, y) => x - y); const n = s.length;
      return f64(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2);
    }),
    std: fn('std', (args) => {
      const a = args[0];
      if (a instanceof Series) return a.getattr('std').fn([], new Map([['ddof', pyInt(0)]]));
      const v = toFloatArray(a, 'np.std'); const m = pairwiseSum(v) / v.length;
      return f64(Math.sqrt(pairwiseSum(v.map((x) => (x - m) ** 2)) / v.length));
    }),
    min: fn('min', (args) => f64(Math.min(...toFloatArray(args[0], 'np.min')))),
    max: fn('max', (args) => f64(Math.max(...toFloatArray(args[0], 'np.max')))),
    sum: fn('sum', (args) => f64(pairwiseSum(toFloatArray(args[0], 'np.sum')))),
    sqrt: fn('sqrt', (args) => f64(Math.sqrt(toNumber(args[0])))),
    isnan: fn('isnan', (args) => { const v = args[0]; return v instanceof Num ? new Num(Number.isNaN(v.v) ? 1 : 0, 'b_') : Number.isNaN(toNumber(v)); }),
    round: fn('round', (args) => {
      const v = args[0]; const d = args[1] ? toNumber(args[1]) : 0;
      if (v instanceof NDArray) return new NDArray(v.data.map((x) => roundHalfEven(x, d)), v.shape, v.dtype);
      return f64(roundHalfEven(toNumber(v), d));
    }),
    array: fn('array', (args) => {
      const d = args[0];
      if (Array.isArray(d) && d.every(Array.isArray)) return NDArray.from2D(d.map((r) => r.map((x) => toNumber(x))));
      if (Array.isArray(d)) return new NDArray(d.map((x) => toNumber(x)), [d.length]);
      if (d instanceof Series) return new NDArray([...d.values], [d.length], d.dtype);
      throw new NotSupported(`np.array(${typeName(d)})`);
    }),
    where: fn('where', (args, kw) => {
      const { condition, x, y } = parseArgs('where', args, kw, [['condition', REQUIRED], ['x', null], ['y', null]]);
      if (x == null || y == null) throw new NotSupported('np.where(조건) — 값 두 개를 함께 쓰세요. 예) np.where(조건, 참일 때, 거짓일 때)');
      const cond = condition instanceof Series ? condition.values : condition instanceof NDArray ? condition.data : Array.isArray(condition) ? condition.map((c) => Boolean(c instanceof Num ? c.v : c)) : null;
      if (!cond) throw new PyError('TypeError', 'np.where 의 조건에는 참·거짓이 담긴 시리즈를 넣습니다');
      const pick = (v, i) => (v instanceof Series ? v.values[i] : v instanceof NDArray ? v.data[i] : v instanceof Num ? v.v : v);
      const vals = cond.map((c, i) => (c ? pick(x, i) : pick(y, i)));
      const kinds = [x, y].map((v) => (v instanceof Series ? v.dtype : typeof v === 'string' ? 'str' : v instanceof Num ? (v.isFloat ? 'float64' : 'int64') : typeof v === 'boolean' ? 'bool' : 'object'));
      const dtype = kinds.every((k) => k === 'str') ? 'str' : kinds.includes('object') || kinds.includes('str') ? 'object' : kinds.includes('float64') ? 'float64' : kinds.every((k) => k === 'bool') ? 'bool' : 'int64';
      return new NDArray(vals, [vals.length], dtype);
    }),
    abs: fn('abs', (args) => { const v = args[0]; if (v instanceof Series) return v.getattr('abs').fn([], new Map()); return f64(Math.abs(toNumber(v))); }),
    nan: npNan,
    NaN: npNan,
    __version__: '2.0.2',
  });

  const pyplot = new Module('matplotlib.pyplot', pyplotAttrs(ctxGetter));
  // import matplotlib as plt 의 plt — figure 는 명령이 아니라 모듈이다(진짜 matplotlib 과 같게)
  const mplFigure = new Module('matplotlib.figure', {});
  const fontManager = fontManagerModule();
  const matplotlib = new Module('matplotlib', {
    pyplot, figure: mplFigure, font_manager: fontManager, rcParams, __version__: '3.10.0',
    rc: fn('rc', () => null), use: fn('use', () => null),
  });
  // 코랩 수업에서 한글 글꼴을 쓰려고 넣던 모듈 — 이 시험지는 한글이 그대로 나오므로 가져오기만 하고 아무 일도 하지 않는다
  const koreanize = new Module('koreanize_matplotlib', {});

  const preprocessing = new Module('sklearn.preprocessing', {
    MinMaxScaler: makeScaler('MinMaxScaler'),
    StandardScaler: makeScaler('StandardScaler'),
  });
  const sklearn = new Module('sklearn', { preprocessing, __version__: '1.6.1' });

  const colabFiles = new Module('google.colab.files', {
    upload: fn('upload', (a, k, ctx) => {
      const names = Object.keys(ctx.files);
      ctx.note('코랩에서는 여기서 파일 고르기 창이 뜹니다. 이 시험지에는 ' + names.join(', ') + ' 파일이 이미 들어 있어서 올릴 필요가 없습니다.');
      return new Dict(names.map((n) => [n, '...']));
    }),
  });
  const colab = new Module('google.colab', { files: colabFiles });
  const google = new Module('google', { colab });

  return {
    pandas, numpy, matplotlib, 'matplotlib.pyplot': pyplot, 'matplotlib.font_manager': fontManager, koreanize_matplotlib: koreanize,
    sklearn, 'sklearn.preprocessing': preprocessing,
    google, 'google.colab': colab,
  };
}
