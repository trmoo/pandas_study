// © 2026 티쳐무 · 학교 수업 목적으로만 사용
// matplotlib.pyplot 흉내 — 산점도(scatter) · 원 그래프(pie) · 선/점 그래프(plot) · 제목 · 축 이름 · 범례.
// 그림을 "그리는" 일은 화면 쪽(src/ui/figure.js)이 SVG 로 하고, 여기서는 무엇을 그렸는지만 기록한다.
//
// 코랩(matplotlib 3.10)과 같게 만든 것
//   · 원 그래프 조각 비율은 float32 로 셈한다(matplotlib 이 np.float32 로 바꿔서 셈한다).
//     그래서 셀 마지막 줄에 plt.pie(...) 를 두면 찍히는 Text(…) 의 자리 숫자까지 같다.
//   · 셀 마지막 줄 값의 모양 — PathCollection·Legend 는 <… at 0x…>, 제목은 Text(0.5, 1.0, '…').
//   · 빈 그림판은 그림 대신 <Figure size 800x600 with 0 Axes> 글자로 나온다.
import {
  PyFunc, PyError, Tuple, Dict, Num, Module, NotSupported, parseArgs, REQUIRED, toNumber,
  pyInt, pyFloatNum, f64, str as pyStr, strRepr, repr as pyRepr, typeName,
} from './pyvalues.js';
import { percentileSorted, pairwiseSum, pyFloat, fixed } from './numfmt.js';
import { NDArray } from './ndarray.js';
import { CYCLE, parseColor, viridis } from './colors.js';
import { autoLimits } from './ticks.js';

const f32 = Math.fround;
const ONLY = '이 시험지에서는 산점도(plt.scatter)와 원 그래프(plt.pie), 선·점 그래프(plt.plot)만 그릴 수 있습니다.';

// ── 가짜 메모리 주소 — 코랩처럼 14자리로 만든다 (길이가 같아야 IPython 의 줄 바꿈도 같다) ──
let addrNext = 0x7f3a1c2d4e10;
export function fakeAddr() { addrNext += 0x2a0 + (addrNext % 5) * 0x40; return '0x' + addrNext.toString(16); }

// ── 그림 요소들 ─────────────────────────────────────────
export class MplObject {
  constructor(cls) { this.cls = cls; this.addr = fakeAddr(); }
  get pyType() { return this.cls.split('.').pop(); }
  repr() { return `<${this.cls} at ${this.addr}>`; }          // IPython 이 찍는 모양
  str() { return `<${this.cls} object at ${this.addr}>`; }    // print() 가 찍는 모양
  equals(o) { return o instanceof MplObject && o.cls === this.cls; }
}

export class Text {
  constructor(x, y, text, props = {}) { this.x = x; this.y = y; this.text = text; this.props = props; }
  get pyType() { return 'Text'; }
  repr() { return `Text(${pyRepr(this.x)}, ${pyRepr(this.y)}, ${strRepr(this.text)})`; }
  equals(o) { return o instanceof Text && o.text === this.text; }
  getattr(name) {
    const self = this;
    const setter = (prop) => new PyFunc(name, (a) => { self.props[prop] = a[0]; return null; }, { owner: 'Text', self });
    switch (name) {
      case 'get_text': return new PyFunc(name, () => self.text, { owner: 'Text', self });
      case 'set_text': return new PyFunc(name, (a) => { self.text = pyStr(a[0]); return null; }, { owner: 'Text', self });
      case 'set_color': return setter('color');
      case 'set_fontsize': case 'set_size': return setter('fontsize');
      case 'set_fontweight': case 'set_weight': return setter('fontweight');
      default: return undefined;
    }
  }
}

export class Figure {
  constructor(w = 6.4, h = 4.8) {
    this.w = w; this.h = h; this.axes = []; this.current = null; this.suptitle = null; this.addr = fakeAddr();
  }
  get pyType() { return 'Figure'; }
  repr() { return `<Figure size ${gfmt(this.w * 100)}x${gfmt(this.h * 100)} with ${this.axes.length} Axes>`; }
  equals(o) { return o instanceof Figure && o.axes.length === this.axes.length; }
  getattr(name) { return figureMethod(this, name); }
}

export class Axes {
  constructor(fig, nrows = 1, ncols = 1, index = 1) {
    this.fig = fig; this.nrows = nrows; this.ncols = ncols; this.index = index;
    this.titles = { left: '', center: '', right: '' }; this.titleProps = {};
    this.xlabel = ''; this.ylabel = ''; this.xlabelProps = {}; this.ylabelProps = {};
    this.artists = [];         // {kind: 'scatter' | 'line' | 'pie' | 'text'}
    this.boxes = [];           // 상자그림 (DataFrame.boxplot)
    this.grid = false; this.gridAxis = 'both'; this.gridProps = {};
    this.legend = null;
    this.aspect = 'auto'; this.adjustable = 'box';
    this.frameOn = true; this.axisOn = true;
    this.xlimUser = null; this.ylimUser = null;
    this.xticksUser = null; this.yticksUser = null; this.xrotation = 0; this.yrotation = 0;
    this.xcats = null; this.ycats = null;   // 글자 값이 들어온 축 (범주 축)
    this.patchN = 0; this.lineN = 0; this.childN = 0;
    this.addr = fakeAddr();
  }
  get pyType() { return 'Axes'; }
  get title() { return this.titles.center; }
  repr() {
    const f = [];
    const t = Object.entries(this.titles).filter(([, v]) => v);
    if (t.length) f.push(`title={${t.map(([k, v]) => `'${k}': ${strRepr(v)}`).join(', ')}}`);
    if (this.xlabel) f.push(`xlabel=${strRepr(this.xlabel)}`);
    if (this.ylabel) f.push(`ylabel=${strRepr(this.ylabel)}`);
    return `<Axes: ${f.join(', ')}>`;
  }
  equals(o) { return o instanceof Axes && o.repr() === this.repr(); }
  nextPatchColor() { return CYCLE[this.patchN++ % CYCLE.length]; }
  nextLineColor() { return CYCLE[this.lineN++ % CYCLE.length]; }
  getattr(name) { return axesMethod(this, name); }
}

function gfmt(v) { return String(Number(v.toPrecision(6))); }

// ── 값 꺼내기 (Series · 배열 · 리스트 · 튜플 · Index) ─────────────────
function unboxAny(x) {
  if (x instanceof Num) return x.v;
  if (typeof x === 'boolean') return x ? 1 : 0;
  return x;
}
export function valuesOf(v) {
  if (v == null) return null;
  if (v?.pyType === 'Series') return { vals: [...v.values], name: v.name, index: v.index, series: v };
  if (v instanceof NDArray) return { vals: [...v.data].map(unboxAny) };
  if (Array.isArray(v)) return { vals: v.map(unboxAny) };
  if (v instanceof Tuple) return { vals: v.items.map(unboxAny) };
  if (v?.pyType === 'Index' || v?.pyType === 'RangeIndex') return { vals: [...v.labels].map(unboxAny) };
  if (v instanceof Num || typeof v === 'boolean') return { vals: [unboxAny(v)] };
  if (typeof v === 'string') return { vals: [v] };
  if (v?.pyType === 'DataFrame') {
    throw new PyError('ValueError', 'x must be 1D', '표 전체가 아니라 열 하나를 넣으세요. 예) df[\'열이름\']');
  }
  throw new PyError('TypeError', `could not convert '${typeName(v)}' to numbers`, '그래프에는 열(시리즈)이나 수 목록을 넣습니다.');
}
const isStr = (x) => typeof x === 'string';

// 축 하나에 들어갈 값 — 글자가 섞이면 범주 축으로 (matplotlib 처럼 나온 차례대로 0, 1, 2 …)
function axisValues(ax, which, v) {
  const { vals } = valuesOf(v);
  if (vals.some((x) => isStr(x))) {
    const key = which === 'x' ? 'xcats' : 'ycats';
    if (!ax[key]) ax[key] = [];
    const cats = ax[key];
    return vals.map((x) => {
      if (typeof x === 'number' && Number.isNaN(x)) return NaN;
      const s = pyStr(x);
      let i = cats.indexOf(s);
      if (i < 0) { cats.push(s); i = cats.length - 1; }
      return i;
    });
  }
  return vals.map((x) => (typeof x === 'number' ? x : NaN));
}

// data= 로 표를 넘기면 글자 인자를 열 이름으로 읽는다
function fromData(data, v) {
  if (data && isStr(v) && data?.pyType === 'DataFrame' && v in data.data) return data.col(v);
  if (data && isStr(v) && data instanceof Dict) { for (const [k, x] of data.map) if (k === v) return x; }
  return v;
}

// ── 글자 속성 (제목·축 이름에 붙는 fontsize= 등) ──────────────────────────
const TEXT_PROPS = new Set(['fontsize', 'size', 'color', 'fontweight', 'weight', 'fontfamily', 'family', 'fontname',
  'fontproperties', 'font_properties', 'fontstyle', 'style', 'rotation', 'ha', 'horizontalalignment', 'va',
  'verticalalignment', 'alpha', 'backgroundcolor', 'bbox', 'wrap', 'zorder', 'visible', 'linespacing', 'fontvariant',
  'variant', 'fontstretch', 'stretch', 'label', 'usetex', 'clip_on', 'fontdict', 'x', 'y', 'rotation_mode', 'font']);
function textProps(kw, allowed, fname) {
  const props = {};
  for (const [k, v] of kw) {
    if (allowed.includes(k)) continue;
    if (!TEXT_PROPS.has(k)) {
      throw new PyError('AttributeError', `Text.set() got an unexpected keyword argument '${k}'`,
        `${fname}( ) 에는 ${k}= 를 쓸 수 없습니다. 글자 크기는 fontsize=, 색은 color= 로 씁니다.`);
    }
    props[k] = v;
  }
  if (kw.has('fontdict') && kw.get('fontdict') instanceof Dict) {
    for (const [k, v] of kw.get('fontdict').map) props[pyStr(k)] = v;
  }
  return props;
}
export const FONT_SCALE = { 'xx-small': 0.579, 'x-small': 0.694, small: 0.833, medium: 1, large: 1.2, 'x-large': 1.44, 'xx-large': 1.728, larger: 1.2, smaller: 0.833 };
export function fontPt(props, base) {
  const v = props?.fontsize ?? props?.size;
  if (v instanceof Num) return v.v;
  if (isStr(v) && FONT_SCALE[v]) return 10 * FONT_SCALE[v];
  return base;
}

// ── 마커 ─────────────────────────────────────────────
const MARKERS = new Set(['o', '.', ',', 's', '^', 'v', '<', '>', 'x', '+', '*', 'D', 'd', 'p', 'h', 'H', '8', 'P', 'X', '|', '_', '1', '2', '3', '4']);
function checkMarker(m) {
  if (m == null) return 'o';
  const s = pyStr(m);
  if (!MARKERS.has(s)) throw new PyError('ValueError', `Unrecognized marker style ${strRepr(s)}`, "점 모양(marker)은 'o'·'s'·'^'·'x'·'*' 등을 씁니다.");
  return s;
}

// ── 산점도 ─────────────────────────────────────────────
const SCATTER_POS = ['x', 'y', 's', 'c', 'marker', 'cmap', 'norm', 'vmin', 'vmax', 'alpha', 'linewidths'];
const SCATTER_KW = new Set([...SCATTER_POS, 'edgecolors', 'plotnonfinite', 'data', 'color', 'label', 'zorder', 'facecolor',
  'facecolors', 'edgecolor', 'linewidth', 'lw', 'ec', 'fc', 'colorizer']);

function scatter(ax, args, kw) {
  if (args.length > SCATTER_POS.length) throw new PyError('TypeError', `scatter() takes from 2 to ${SCATTER_POS.length} positional arguments but ${args.length} were given`);
  const o = {};
  SCATTER_POS.forEach((n, i) => {
    if (i < args.length) {
      if (kw.has(n)) throw new PyError('TypeError', `scatter() got multiple values for argument '${n}'`);
      o[n] = args[i];
    } else if (kw.has(n)) o[n] = kw.get(n);
  });
  for (const [k, v] of kw) {
    if (SCATTER_POS.includes(k)) continue;
    if (!SCATTER_KW.has(k)) {
      throw new PyError('AttributeError', `PathCollection.set() got an unexpected keyword argument '${k}'`,
        `plt.scatter( ) 에는 ${k}= 를 쓸 수 없습니다. 점 크기는 s=, 색은 color= 또는 c=, 투명도는 alpha= 입니다.`);
    }
    o[k] = v;
  }
  if (o.x === undefined && o.y === undefined) throw new PyError('TypeError', "scatter() missing 2 required positional arguments: 'x' and 'y'", 'plt.scatter(가로축 열, 세로축 열) 처럼 두 열을 넣습니다.');
  if (o.y === undefined) throw new PyError('TypeError', "scatter() missing 1 required positional argument: 'y'", 'plt.scatter(가로축 열, 세로축 열) 처럼 두 열을 넣어야 합니다. 지금은 하나만 넣었습니다.');
  const data = o.data;
  for (const k of ['x', 'y', 's', 'c']) if (o[k] !== undefined) o[k] = fromData(data, o[k]);

  const xs = axisValues(ax, 'x', o.x), ys = axisValues(ax, 'y', o.y);
  if (xs.length !== ys.length) throw new PyError('ValueError', 'x and y must be the same size', '가로축과 세로축에 넣은 값의 개수가 같아야 합니다.');
  const n = xs.length;

  let sizes = [36];
  if (o.s != null) sizes = valuesOf(o.s).vals.map(Number);

  if (o.c != null && o.color != null) {
    throw new PyError('ValueError', "Supply a 'c' argument or a 'color' kwarg but not both; they differ but their functionalities overlap.",
      'c= 와 color= 는 하나만 씁니다.');
  }
  let colors;
  const fc = o.color ?? o.facecolor ?? o.facecolors ?? o.fc;
  if (fc != null) {
    const one = parseColor(fc);
    if (one) colors = [one];
    else {
      const many = isStr(fc) ? null : valuesOf(fc).vals.map(parseColor);
      if (!many || many.some((c) => !c)) {
        throw new PyError('ValueError', "'color' kwarg must be a color or sequence of color specs.  For a sequence of values to be color-mapped, use the 'c' argument instead.",
          "색 이름을 알아보지 못했습니다. color='red'·'blue'·'skyblue' 처럼 영어 색 이름을 쓰세요.");
      }
      colors = many;
    }
  } else if (o.c != null) {
    if (isStr(o.c)) {
      const one = parseColor(o.c);
      if (!one) {
        throw new PyError('ValueError', `'c' argument must be a color, a sequence of colors, or a sequence of numbers, not ${strRepr(o.c)}`,
          "색 이름을 알아보지 못했습니다. c='red'·'green' 처럼 영어 색 이름을 쓰세요.");
      }
      colors = [one];
    } else {
      const vals = valuesOf(o.c).vals;
      if (vals.every((x) => typeof x === 'number')) {
        const fin = vals.filter((x) => Number.isFinite(x));
        let lo = o.vmin != null ? toNumber(o.vmin) : Math.min(...fin), hi = o.vmax != null ? toNumber(o.vmax) : Math.max(...fin);
        if (hi === lo) hi = lo + 1;
        colors = vals.map((x) => [viridis((x - lo) / (hi - lo)), 1]);
      } else {
        const many = vals.map((x) => (isStr(x) ? parseColor(x) : null));
        if (many.some((c) => !c)) {
          throw new PyError('ValueError', "'c' argument must be a color, a sequence of colors, or a sequence of numbers",
            'c= 에는 색 이름이나 수를 넣습니다. 글자 열을 색으로 쓰려면 먼저 색으로 바꿔야 합니다.');
        }
        colors = many;
      }
    }
  } else colors = [[ax.nextPatchColor(), 1]];

  const alpha = o.alpha != null ? toNumber(o.alpha) : null;
  const marker = checkMarker(o.marker);
  const label = o.label != null ? pyStr(o.label) : `_child${ax.childN}`;
  ax.childN++;
  let ec = o.edgecolors ?? o.edgecolor ?? o.ec ?? 'face';
  ec = isStr(ec) && ec === 'face' ? 'face' : (parseColor(ec) ?? 'face');
  const lw = o.linewidths ?? o.linewidth ?? o.lw;
  ax.artists.push({ kind: 'scatter', xs, ys, n, sizes, colors, alpha, marker, label, edgecolor: ec, linewidth: lw != null ? Number(valuesOf(lw).vals[0]) : 1 });
  return new MplObject('matplotlib.collections.PathCollection');
}

// ── 원 그래프 ─────────────────────────────────────────
// numpy 의 float32 합 (짝수 묶음 덧셈, float32 로 셈한다)
function sum32(a) {
  const n = a.length;
  if (n < 8) { let r = -0; for (let i = 0; i < n; i++) r = f32(r + a[i]); return r; }
  if (n <= 128) {
    const r = a.slice(0, 8);
    let i;
    for (i = 8; i < n - (n % 8); i += 8) for (let j = 0; j < 8; j++) r[j] = f32(r[j] + a[i + j]);
    let res = f32(f32(f32(r[0] + r[1]) + f32(r[2] + r[3])) + f32(f32(r[4] + r[5]) + f32(r[6] + r[7])));
    for (; i < n; i++) res = f32(res + a[i]);
    return res;
  }
  let n2 = Math.floor(n / 2); n2 -= n2 % 8;
  return f32(sum32(a.slice(0, n2)) + sum32(a.slice(n2)));
}

// 파이썬 % 서식 — autopct='%1.1f%%' 같은 것 (값 하나)
export function percentFormat(fmt, value) {
  let used = false;
  const out = fmt.replace(/%([#0\- +]*)(\d+|\*)?(?:\.(\d+))?([diouxXeEfFgGsr%])/g, (m, flags, width, prec, conv) => {
    if (conv === '%') return '%';
    if (used) throw new PyError('TypeError', 'not enough arguments for format string', "autopct 에는 % 서식이 하나만 들어갑니다. 예) autopct='%1.1f%%'");
    used = true;
    let s;
    const p = prec != null ? Number(prec) : 6;
    if ('fF'.includes(conv)) s = fixed(value, p);
    else if ('di'.includes(conv)) s = String(Math.trunc(value));
    else if ('eE'.includes(conv)) {
      const [mm, e] = value.toExponential(p).split('e');
      s = mm + 'e' + (Number(e) < 0 ? '-' : '+') + String(Math.abs(Number(e))).padStart(2, '0');
      if (conv === 'E') s = s.toUpperCase();
    } else if ('gG'.includes(conv)) s = String(Number(value.toPrecision(Math.max(p, 1))));
    else s = float32Str(value);
    if (flags.includes('+') && value >= 0) s = '+' + s;
    else if (flags.includes(' ') && value >= 0) s = ' ' + s;
    const w = width && width !== '*' ? Number(width) : 0;
    if (s.length < w) s = flags.includes('-') ? s.padEnd(w) : flags.includes('0') ? s.replace(/^([+ -]?)/, (sg) => sg + '0'.repeat(w - s.length)) : s.padStart(w);
    return s;
  });
  if (!used) throw new PyError('TypeError', 'not all arguments converted during string formatting', "autopct 에는 비율이 들어갈 자리 % 서식이 있어야 합니다. 예) autopct='%1.1f%%'");
  return out;
}
// str(np.float32(x)) — float32 로 되돌렸을 때 같아지는 가장 짧은 표기
function float32Str(x) {
  for (let p = 1; p <= 9; p++) { const s = Number(x.toPrecision(p)); if (f32(s) === x) return pyFloat(s); }
  return pyFloat(x);
}

const PIE_SPEC = [['x', REQUIRED], ['explode', null], ['labels', null], ['colors', null], ['autopct', null], ['pctdistance', pyFloatNum(0.6)],
  ['shadow', false], ['labeldistance', pyFloatNum(1.1)], ['startangle', pyInt(0)], ['radius', pyInt(1)], ['counterclock', true],
  ['wedgeprops', null], ['textprops', null], ['center', new Tuple([pyInt(0), pyInt(0)])], ['frame', false], ['rotatelabels', false],
  ['normalize', true], ['hatch', null], ['data', null]];

function pie(ax, args, kw, ctx) {
  const o = parseArgs('pie', args, kw, PIE_SPEC);
  ax.aspect = 'equal'; ax.adjustable = 'box';
  for (const k of ['x', 'labels', 'colors', 'explode']) if (o[k] != null) o[k] = fromData(o.data, o[k]);
  const raw = valuesOf(o.x).vals;
  const bad = raw.find((v) => isStr(v));
  if (bad !== undefined) {
    throw new PyError('ValueError', `could not convert string to float: ${strRepr(bad)}`,
      '원 그래프에는 글자가 아니라 개수(수)를 넣습니다. 먼저 value_counts( ) 로 값마다 몇 줄인지 세어 넣으세요.');
  }
  const xs = raw.map((v) => f32(v));
  if (xs.some((v) => v < 0)) throw new PyError('ValueError', "Wedge sizes 'x' must be non negative values", '원 그래프에는 음수를 넣을 수 없습니다.');
  const sx = sum32(xs);
  let fr = xs;
  if (o.normalize !== false) fr = xs.map((v) => f32(v / sx));
  else if (sx > 1) throw new PyError('ValueError', 'Cannot plot an unnormalized pie with sum(x) > 1');
  const n = xs.length;
  const labels = o.labels == null ? Array(n).fill('') : valuesOf(o.labels).vals.map((v) => (typeof v === 'number' ? pyStr(Number.isInteger(v) ? pyInt(v) : pyFloatNum(v)) : pyStr(v)));
  const explode = o.explode == null ? Array(n).fill(0) : valuesOf(o.explode).vals.map(Number);
  if (labels.length !== n) throw new PyError('ValueError', `'labels' must be of length 'x', not ${labels.length}`, `이름표(labels)가 ${labels.length}개인데 조각은 ${n}개입니다. 개수를 맞추세요.`);
  if (explode.length !== n) throw new PyError('ValueError', `'explode' must be of length 'x', not ${explode.length}`, `explode 는 조각 수(${n}개)만큼 적어야 합니다.`);
  let nextColor;
  if (o.colors != null) {
    const list = valuesOf(o.colors).vals.map((c) => {
      const pc = parseColor(c);
      if (!pc) throw new PyError('ValueError', `Invalid RGBA argument: ${isStr(c) ? strRepr(c) : pyStr(c)}`, "색 이름을 알아보지 못했습니다. colors=['gold', 'skyblue'] 처럼 영어 색 이름을 쓰세요.");
      return pc;
    });
    let k = 0; nextColor = () => list[k++ % list.length];
  } else nextColor = () => [ax.nextPatchColor(), 1];
  const radius = toNumber(o.radius), startangle = toNumber(o.startangle);
  if (!(radius > 0)) throw new PyError('ValueError', `radius must be a positive number, not ${pyStr(o.radius)}`);
  const center = (o.center instanceof Tuple ? o.center.items : valuesOf(o.center).vals.map((v) => pyFloatNum(v))).map((v) => (v instanceof Num ? v.v : v));
  const ld = o.labeldistance == null ? null : toNumber(o.labeldistance);
  const pd = toNumber(o.pctdistance);
  const autopct = o.autopct;
  if (autopct != null && !isStr(autopct) && !(autopct instanceof PyFunc)) {
    throw new PyError('TypeError', 'autopct must be callable or a format string', "autopct 에는 '%1.1f%%' 같은 서식 글자를 넣습니다.");
  }
  const textprops = o.textprops instanceof Dict ? Object.fromEntries([...o.textprops.map].map(([k, v]) => [pyStr(k), v])) : {};
  const wedgeprops = o.wedgeprops instanceof Dict ? Object.fromEntries([...o.wedgeprops.map].map(([k, v]) => [pyStr(k), v])) : {};

  const wedges = [], texts = [], autotexts = [], parts = [];
  let theta1 = startangle / 360; // 처음은 파이썬 실수, 한 번 더하면 float32 가 된다 (numpy 2 의 규칙)
  for (let i = 0; i < n; i++) {
    const frac = fr[i];
    const theta2 = o.counterclock !== false ? f32(f32(theta1) + frac) : f32(f32(theta1) - frac);
    const thetam = f32(f32(Math.PI) * f32(f32(theta1) + theta2));
    let x = center[0], y = center[1];
    x += explode[i] * Math.cos(thetam);
    y += explode[i] * Math.sin(thetam);
    const [color, alpha] = nextColor();
    const w = new MplObject('matplotlib.patches.Wedge');
    wedges.push(w);
    const part = { x, y, r: radius, t1: 360 * Math.min(theta1, theta2), t2: 360 * Math.max(theta1, theta2), color, alpha, label: labels[i], explode: explode[i] };
    if (ld !== null) {
      const xt = x + ld * radius * Math.cos(thetam), yt = y + ld * radius * Math.sin(thetam);
      const t = new Text(pyFloatNum(xt), pyFloatNum(yt), labels[i], { ...textprops, ha: xt > 0 ? 'left' : 'right', va: 'center' });
      texts.push(t); part.text = t;
    }
    if (autopct != null) {
      const xt = x + pd * radius * Math.cos(thetam), yt = y + pd * radius * Math.sin(thetam);
      const pct = f32(100 * frac);
      const s = isStr(autopct) ? percentFormat(autopct, pct) : pyStr(autopct.fn([pyFloatNum(pct)], new Map(), ctx));
      const t = new Text(pyFloatNum(xt), pyFloatNum(yt), s, { ...textprops, ha: 'center', va: 'center' });
      autotexts.push(t); part.autotext = t;
    }
    parts.push(part);
    theta1 = theta2;
  }
  ax.aspect = 'equal';
  if (o.frame !== true) {
    ax.frameOn = false; ax.xticksUser = []; ax.yticksUser = [];
    ax.xlimUser = [-1.25 + center[0], 1.25 + center[0]]; ax.ylimUser = [-1.25 + center[1], 1.25 + center[1]];
  }
  ax.artists.push({ kind: 'pie', parts, shadow: o.shadow === true, wedgeprops });
  return autopct != null ? new Tuple([wedges, texts, autotexts]) : new Tuple([wedges, texts]);
}

// ── 선·점 그래프 (plt.plot) ───────────────────────────────
const LINESTYLES = ['--', '-.', '-', ':'];
function parseFmt(fmt) {
  const r = {};
  let s = fmt;
  for (const ls of LINESTYLES) if (s.includes(ls)) { r.linestyle = ls; s = s.replace(ls, ''); break; }
  const cn = /C\d/.exec(s);
  if (cn) { r.color = cn[0]; s = s.replace(cn[0], ''); }
  for (const ch of s) {
    if ('bgrcmykw'.includes(ch) && !r.color) r.color = ch;
    else if (MARKERS.has(ch) && !r.marker) r.marker = ch;
    else throw new PyError('ValueError', `${strRepr(fmt)} is not a valid format string (unrecognized character ${strRepr(ch)})`, "모양 글자는 'o'(점)·'-'(선)·'r'(빨강) 처럼 씁니다.");
  }
  if (r.marker && !r.linestyle) r.linestyle = 'None';
  return r;
}
const PLOT_KW = new Set(['color', 'c', 'marker', 'linestyle', 'ls', 'linewidth', 'lw', 'markersize', 'ms', 'label', 'alpha', 'data',
  'markerfacecolor', 'mfc', 'markeredgecolor', 'mec', 'zorder', 'drawstyle', 'scalex', 'scaley']);
function plotLines(ax, args, kw) {
  for (const k of kw.keys()) if (!PLOT_KW.has(k)) throw new PyError('AttributeError', `Line2D.set() got an unexpected keyword argument '${k}'`);
  const data = kw.get('data');
  const groups = [];
  let i = 0;
  while (i < args.length) {
    const a = fromData(data, args[i]), b = args[i + 1] !== undefined ? fromData(data, args[i + 1]) : undefined, c = args[i + 2];
    if (b === undefined || (isStr(b) && !(data && data?.data?.[b]))) { groups.push({ x: null, y: a, fmt: isStr(b) ? b : null }); i += isStr(b) ? 2 : 1; }
    else if (isStr(c)) { groups.push({ x: a, y: b, fmt: c }); i += 3; }
    else { groups.push({ x: a, y: b, fmt: null }); i += 2; }
  }
  if (!groups.length) return [];
  const out = [];
  for (const g of groups) {
    const ys = axisValues(ax, 'y', g.y);
    let xs;
    if (g.x != null) xs = axisValues(ax, 'x', g.x);
    else if (g.y?.pyType === 'Series') xs = g.y.index.labels.map((l) => (typeof l === 'number' ? l : NaN));
    else xs = ys.map((_, k) => k);
    if (xs.length !== ys.length) throw new PyError('ValueError', `x and y must have same first dimension, but have shapes (${xs.length},) and (${ys.length},)`);
    const f = g.fmt ? parseFmt(g.fmt) : {};
    const colorSpec = kw.get('color') ?? kw.get('c') ?? f.color;
    const color = colorSpec != null ? (parseColor(colorSpec) ?? (() => { throw new PyError('ValueError', `${strRepr(pyStr(colorSpec))} is not a valid value for color`); })()) : [ax.nextLineColor(), 1];
    const ls = kw.has('linestyle') ? pyStr(kw.get('linestyle')) : kw.has('ls') ? pyStr(kw.get('ls')) : (f.linestyle ?? '-');
    const mk = kw.has('marker') ? pyStr(kw.get('marker')) : (f.marker ?? null);
    if (mk) checkMarker(mk);
    const label = kw.has('label') ? pyStr(kw.get('label')) : `_child${ax.childN}`;
    ax.childN++;
    const num = (k, d) => (kw.has(k) ? toNumber(kw.get(k)) : d);
    ax.artists.push({ kind: 'line', xs, ys, color, alpha: kw.has('alpha') ? toNumber(kw.get('alpha')) : null, linestyle: ls,
      marker: mk, markersize: num('markersize', num('ms', 6)), linewidth: num('linewidth', num('lw', 1.5)), label });
    out.push(new MplObject('matplotlib.lines.Line2D'));
  }
  return out;
}

// ── 범례 ─────────────────────────────────────────────
const LEGEND_KW = new Set(['loc', 'title', 'fontsize', 'ncol', 'ncols', 'frameon', 'bbox_to_anchor', 'shadow', 'framealpha',
  'title_fontsize', 'markerscale', 'prop', 'facecolor', 'edgecolor', 'borderaxespad', 'labelspacing', 'handlelength',
  'columnspacing', 'reverse', 'labels', 'handles', 'fancybox', 'numpoints', 'scatterpoints', 'labelcolor', 'alignment']);
function handlesOf(ax) {
  const hs = [];
  for (const a of ax.artists) {
    if (a.kind === 'line') hs.push({ type: 'line', a, get label() { return a.label; }, set label(v) { a.label = v; } });
    if (a.kind === 'scatter') hs.push({ type: 'scatter', a, get label() { return a.label; }, set label(v) { a.label = v; } });
    if (a.kind === 'pie') for (const p of a.parts) hs.push({ type: 'patch', a: p, get label() { return p.label; }, set label(v) { p.label = v; } });
  }
  return hs;
}
function legend(ax, args, kw, ctx) {
  for (const k of kw.keys()) if (!LEGEND_KW.has(k)) throw new PyError('TypeError', `Legend.__init__() got an unexpected keyword argument '${k}'`);
  let labels = kw.has('labels') ? valuesOf(kw.get('labels')).vals.map(pyStr) : null;
  if (args.length === 1) labels = valuesOf(args[0]).vals.map(pyStr);
  if (args.length >= 2) labels = valuesOf(args[1]).vals.map(pyStr);
  const hs = handlesOf(ax);
  let entries;
  if (labels) {
    entries = hs.slice(0, labels.length).map((hd, i) => ({ ...entryOf(hd), label: labels[i] }));
  } else {
    entries = hs.filter((hd) => hd.label && !hd.label.startsWith('_')).map(entryOf);
    if (!entries.length) {
      ctx.warn('UserWarning: No artists with labels found to put in legend.  Note that artists whose label start with an underscore are ignored when legend() is called with no argument.');
    }
  }
  const loc = kw.has('loc') ? kw.get('loc') : 'best';
  ax.legend = { entries, loc: loc instanceof Num ? loc.v : pyStr(loc), title: kw.has('title') ? pyStr(kw.get('title')) : null,
    fontsize: fontPt({ fontsize: kw.get('fontsize') }, 10), frameon: kw.get('frameon') !== false };
  return new MplObject('matplotlib.legend.Legend');
}
function entryOf(hd) {
  if (hd.type === 'patch') return { type: 'patch', color: hd.a.color, alpha: hd.a.alpha, label: hd.label };
  if (hd.type === 'scatter') return { type: 'scatter', color: hd.a.colors[0][0], alpha: hd.a.alpha, marker: hd.a.marker, label: hd.label };
  return { type: 'line', color: hd.a.color[0], linestyle: hd.a.linestyle, marker: hd.a.marker, label: hd.label };
}

// ── 보이는 범위 (자료 범위 + 5% 여백, 원 그래프는 ±1.25, 사용자가 정한 범위가 먼저) ─────
export function dataLimits(ax) {
  const xs = [], ys = [];
  for (const a of ax.artists) {
    if (a.kind === 'scatter' || a.kind === 'line') {
      for (let i = 0; i < a.xs.length; i++) if (Number.isFinite(a.xs[i]) && Number.isFinite(a.ys[i])) { xs.push(a.xs[i]); ys.push(a.ys[i]); }
    }
    if (a.kind === 'text') { xs.push(a.x); ys.push(a.y); }
    if (a.kind === 'pie') for (const p of a.parts) {
      const pts = [[p.x, p.y]];
      const angs = [p.t1, p.t2];
      for (let k = Math.ceil(p.t1 / 90); k * 90 < p.t2; k++) if (k * 90 > p.t1) angs.push(k * 90); // 축과 만나는 점 (시계 방향이면 각이 음수)
      for (const d of angs) pts.push([p.x + p.r * Math.cos((d * Math.PI) / 180), p.y + p.r * Math.sin((d * Math.PI) / 180)]);
      for (const [x, y] of pts) { xs.push(x); ys.push(y); }
    }
  }
  for (const b of ax.boxes) if (b.stats) ys.push(b.stats.whislo, b.stats.whishi, ...b.stats.fliers);
  return { xs, ys };
}
export function viewLimits(ax) {
  const { xs, ys } = dataLimits(ax);
  let xl = ax.xlimUser, yl = ax.ylimUser;
  const auto = (v, cats) => {
    if (!v.length) return [0, 1];
    if (cats && cats.length === 1) return autoLimits(0, 0);
    return autoLimits(Math.min(...v), Math.max(...v));
  };
  if (ax.boxes.length) {
    const n = ax.boxes.length;
    xl = xl ?? [0.5, n + 0.5];
    if (!yl) { const v = ys.length ? [Math.min(...ys), Math.max(...ys)] : [0, 1]; yl = autoLimits(v[0], v[1]); }
  }
  let xlim = xl ?? auto(xs, ax.xcats), ylim = yl ?? auto(ys, ax.ycats);
  // axis('equal') — 칸은 그대로 두고 범위를 넓혀 가로·세로 눈금 간격을 같게 (matplotlib 의 apply_aspect, adjustable='datalim')
  if (ax.aspect === 'equal' && ax.adjustable === 'datalim' && xs.length) {
    const box = cellBox(ax);
    const dataRatio = (ax.fig.h / ax.fig.w) * (box[3] / box[2]);
    const xsize = xlim[1] - xlim[0], ysize = ylim[1] - ylim[0];
    const yExp = (dataRatio * xsize) / ysize - 1;
    if (Math.abs(yExp) >= 0.005) {
      const xr = 1.05 * (Math.max(...xs) - Math.min(...xs)), yr = 1.05 * (Math.max(...ys) - Math.min(...ys));
      const xmarg = xsize - xr, ymarg = ysize - yr;
      const Ysize = dataRatio * xsize, Xsize = ysize / dataRatio;
      const Xmarg = Xsize - xr, Ymarg = Ysize - yr;
      const adjY = xmarg > 0 && ymarg > 0 ? (Ymarg > 0 && yExp < 0) || (Xmarg < 0 && yExp > 0) : yExp > 0;
      if (adjY) { const c = (ylim[0] + ylim[1]) / 2; ylim = [c - Ysize / 2, c + Ysize / 2]; }
      else { const c = (xlim[0] + xlim[1]) / 2; xlim = [c - Xsize / 2, c + Xsize / 2]; }
    }
  }
  return { xlim, ylim };
}

// ── 칸(Axes) 배치 — matplotlib 기본 여백 (left .125, right .9, bottom .11, top .88, 간격 .2) ──
// 칸 자리 (비율을 맞추기 전)
export function cellBox(ax) {
  const L = 0.125, R = 0.9, B = 0.11, T = 0.88, WS = 0.2, HS = 0.2;
  const cellW = (R - L) / (ax.ncols + WS * (ax.ncols - 1));
  const cellH = (T - B) / (ax.nrows + HS * (ax.nrows - 1));
  const col = (ax.index - 1) % ax.ncols, row = Math.floor((ax.index - 1) / ax.ncols);
  return [L + col * cellW * (1 + WS), T - cellH - row * cellH * (1 + HS), cellW, cellH];
}

export function axesBox(fig, ax) {
  const L = 0.125, R = 0.9, B = 0.11, T = 0.88, WS = 0.2, HS = 0.2;
  const cellW = (R - L) / (ax.ncols + WS * (ax.ncols - 1));
  const cellH = (T - B) / (ax.nrows + HS * (ax.nrows - 1));
  const col = (ax.index - 1) % ax.ncols, row = Math.floor((ax.index - 1) / ax.ncols);
  let left = L + col * cellW * (1 + WS);
  let bottom = T - cellH - row * cellH * (1 + HS);
  let w = cellW, h = cellH;
  if (ax.aspect === 'equal' && ax.adjustable === 'box') {
    const { xlim, ylim } = viewLimits(ax);
    const ratio = Math.abs(ylim[1] - ylim[0]) / Math.abs(xlim[1] - xlim[0]);
    const physW = w * fig.w, physH = h * fig.h;
    if (physH / physW > ratio) { const nh = (physW * ratio) / fig.h; bottom += (h - nh) / 2; h = nh; }
    else { const nw = physH / ratio / fig.w; left += (w - nw) / 2; w = nw; }
  }
  return [left, bottom, w, h];
}

// ── 상자그림 수치 (DataFrame.boxplot 이 쓴다) ─────────────
export function boxStats(values, whis = 1.5) {
  const x = values.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  if (!x.length) return null;
  const q1 = percentileSorted(x, 25), med = percentileSorted(x, 50), q3 = percentileSorted(x, 75);
  const iqr = q3 - q1;
  const loval = q1 - whis * iqr, hival = q3 + whis * iqr;
  const inHi = x.filter((v) => v <= hival), inLo = x.filter((v) => v >= loval);
  const whishi = inHi.length && inHi[inHi.length - 1] >= q3 ? inHi[inHi.length - 1] : q3;
  const whislo = inLo.length && inLo[0] <= q1 ? inLo[0] : q1;
  return { whislo, q1, med, q3, whishi, fliers: x.filter((v) => v < whislo || v > whishi) };
}

// ── 그림 상태 — 셀 하나를 실행하는 동안의 "현재 그림판" ──────────
export class PlotState {
  constructor(onShow) { this.figs = []; this.cur = null; this.onShow = onShow; }
  figure(size) {
    const [w, h] = size ?? [6.4, 4.8];
    const f = new Figure(w, h);
    this.figs.push(f); this.cur = f;
    return f;
  }
  gcf() { return this.cur && this.figs.includes(this.cur) ? this.cur : this.figure(); }
  gca() {
    const f = this.gcf();
    if (!f.current) { f.current = new Axes(f); f.axes.push(f.current); }
    return f.current;
  }
  subplot(nrows, ncols, index) {
    const f = this.gcf();
    if (index < 1 || index > nrows * ncols) {
      throw new PyError('ValueError', `num must be an integer with 1 <= num <= ${nrows * ncols}, not ${index}`,
        `plt.subplot(${nrows}, ${ncols}, 번호) 의 번호는 1 부터 ${nrows * ncols} 사이여야 합니다.`);
    }
    let ax = f.axes.find((a) => a.nrows === nrows && a.ncols === ncols && a.index === index);
    if (!ax) {
      f.axes = f.axes.filter((a) => !(a.nrows === 1 && a.ncols === 1 && nrows * ncols > 1 && !a.artists.length && !a.boxes.length));
      ax = new Axes(f, nrows, ncols, index); f.axes.push(ax);
    }
    f.current = ax;
    return ax;
  }
  subplots(nrows, ncols, size) {
    const f = this.figure(size);
    const axes = [];
    for (let i = 0; i < nrows * ncols; i++) { const a = new Axes(f, nrows, ncols, i + 1); f.axes.push(a); axes.push(a); }
    f.current = axes[0];
    return [f, axes];
  }
  close(which) {
    if (which === 'all') { this.figs = []; this.cur = null; return; }
    const target = which instanceof Figure ? which : this.cur;
    this.figs = this.figs.filter((f) => f !== target);
    this.cur = this.figs[this.figs.length - 1] ?? null;
  }
  boxplot(boxes, { grid = true, figsize = null } = {}) {
    if (figsize) this.figure(figsize.items.map((v) => toNumber(v)));
    const ax = this.gca();
    ax.boxes = boxes.map((b) => ({ ...b, stats: boxStats(b.values) }));
    ax.grid = grid;
    return ax;
  }
  // pandas 의 df.plot.scatter(x=, y=) — 새 그림판을 만들고 열 이름을 축 이름으로 단다
  pandasScatter(df, o, kw, ctx) {
    if (o.x == null || o.y == null) throw new PyError('ValueError', 'scatter requires an x and y column', "df.plot.scatter(x='가로 열', y='세로 열') 처럼 두 열 이름을 적습니다.");
    const xcol = df.col(pyStr(o.x)), ycol = df.col(pyStr(o.y));
    const f = this.figure(o.figsize ? valuesOf(o.figsize).vals.map(Number) : null);
    const ax = new Axes(f); f.axes.push(ax); f.current = ax;
    const skw = new Map([['s', o.s ?? pyInt(20)]]);
    for (const k of ['c', 'color', 'alpha', 'marker', 'label', 'edgecolors']) if (kw.has(k)) skw.set(k, kw.get(k));
    if (!skw.has('c') && !skw.has('color')) skw.set('color', '#1f77b4');
    scatter(ax, [xcol, ycol], skw);
    ax.xlabel = o.xlabel != null ? pyStr(o.xlabel) : pyStr(o.x);
    ax.ylabel = o.ylabel != null ? pyStr(o.ylabel) : pyStr(o.y);
    if (o.title != null) ax.titles.center = pyStr(o.title);
    if (o.grid === true) ax.grid = true;
    return ax;
  }
  // pandas 의 Series.plot.pie() — 이름표는 index, 세로축 이름은 시리즈 이름(value_counts 면 'count')
  pandasPie(s, o, kw, ctx) {
    if (s.values.some((v) => typeof v === 'number' && v < 0)) throw new PyError('ValueError', "pie plot doesn't allow negative values");
    const f = this.figure(o.figsize ? valuesOf(o.figsize).vals.map(Number) : null);
    const ax = new Axes(f); f.axes.push(ax); f.current = ax;
    const pkw = new Map();
    for (const [k, v] of kw) if (!['kind', 'figsize', 'title', 'legend', 'ylabel', 'xlabel', 'grid', 'subplots'].includes(k)) pkw.set(k, v);
    if (!pkw.has('labels')) pkw.set('labels', s.index.labels.map((l) => (typeof l === 'number' ? pyStr(Number.isInteger(l) ? pyInt(l) : pyFloatNum(l)) : pyStr(l))));
    if (!pkw.has('colors')) pkw.set('colors', CYCLE.slice(0, s.values.length).concat(CYCLE).slice(0, Math.max(s.values.length, 1)));
    pie(ax, [s], pkw, ctx);
    const yl = o.ylabel !== undefined && o.ylabel !== null ? pyStr(o.ylabel) : (s.name == null ? '' : pyStr(s.name));
    ax.ylabel = yl;
    if (o.title != null) ax.titles.center = pyStr(o.title);
    if (o.legend === true) legend(ax, [], new Map(), ctx);
    return ax;
  }
  // plt.show() 또는 셀이 끝날 때 — 그린 그림판을 모두 내보내고 비운다
  flush() {
    const out = this.figs;
    this.figs = []; this.cur = null;
    out.forEach((f) => this.onShow(f));
  }
}

// ── 칸(Axes)의 명령 — plt.xxx 와 ax.xxx 가 같은 일을 한다 ─────────
function setTitle(ax, a, k, fname) {
  const o = parseArgs(fname, a.slice(0, 1), new Map([...k].filter(([n]) => n === 'label')), [['label', REQUIRED]]);
  const props = textProps(k, ['label', 'loc', 'pad', 'y', 'fontdict'], fname);
  const loc = k.has('loc') ? pyStr(k.get('loc')) : 'center';
  if (!['left', 'center', 'right'].includes(loc)) throw new PyError('ValueError', `'${loc}' is not a valid value for loc; supported values are 'left', 'center', 'right'`);
  ax.titles[loc] = pyStr(o.label); ax.titleProps = props;
  return new Text(pyFloatNum({ left: 0, center: 0.5, right: 1 }[loc]), pyFloatNum(1.0), pyStr(o.label), props);
}
function setLabel(ax, which, a, k, fname) {
  const key = which === 'x' ? 'xlabel' : 'ylabel';
  const o = parseArgs(fname, a.slice(0, 1), new Map([...k].filter(([n]) => n === key)), [[key, REQUIRED]]);
  const props = textProps(k, [key, 'labelpad', 'loc', 'fontdict'], fname);
  ax[key] = pyStr(o[key]); ax[key + 'Props'] = props;
  return which === 'x' ? new Text(pyFloatNum(0.5), pyInt(0), ax[key], props) : new Text(pyInt(0), pyFloatNum(0.5), ax[key], props);
}
function setGrid(ax, a, k) {
  const visible = a.length ? a[0] : k.has('visible') ? k.get('visible') : k.has('b') ? k.get('b') : null;
  const others = [...k.keys()].filter((n) => !['visible', 'b', 'which', 'axis'].includes(n));
  if (visible == null && !others.length) ax.grid = !ax.grid;
  else ax.grid = visible == null ? true : visible !== false;
  ax.gridAxis = k.has('axis') ? pyStr(k.get('axis')) : 'both';
  ax.gridProps = Object.fromEntries(others.map((n) => [n, k.get(n)]));
  return null;
}
function limits(ax, which, a, k) {
  const key = which === 'x' ? 'xlimUser' : 'ylimUser';
  let lo = null, hi = null;
  if (a.length === 1) { const v = valuesOf(a[0]).vals; [lo, hi] = v; }
  else if (a.length >= 2) { lo = a[0] == null ? null : toNumber(a[0]); hi = a[1] == null ? null : toNumber(a[1]); }
  const lk = which === 'x' ? ['left', 'right', 'xmin', 'xmax'] : ['bottom', 'top', 'ymin', 'ymax'];
  if (k.has(lk[0]) || k.has(lk[2])) lo = toNumber(k.get(lk[0]) ?? k.get(lk[2]));
  if (k.has(lk[1]) || k.has(lk[3])) hi = toNumber(k.get(lk[1]) ?? k.get(lk[3]));
  if (lo != null || hi != null) {
    const cur = viewLimits(ax)[which === 'x' ? 'xlim' : 'ylim'];
    ax[key] = [lo ?? cur[0], hi ?? cur[1]];
  }
  const now = viewLimits(ax)[which === 'x' ? 'xlim' : 'ylim'];
  return new Tuple([f64(now[0]), f64(now[1])]);
}
function axisCmd(ax, a, k) {
  const arg = a[0];
  if (isStr(arg)) {
    const s = arg.toLowerCase();
    if (s === 'off') ax.axisOn = false;
    else if (s === 'on') ax.axisOn = true;
    else if (s === 'equal' || s === 'scaled' || s === 'square' || s === 'image') { ax.xlimUser = null; ax.ylimUser = null; ax.aspect = 'equal'; ax.adjustable = 'datalim'; }
    else if (!['auto', 'tight', 'normal'].includes(s)) throw new PyError('ValueError', `Unrecognized string '${arg}' to axis; try 'on' or 'off'`);
  } else if (arg != null) {
    const v = valuesOf(arg).vals;
    if (v.length !== 4) throw new PyError('TypeError', 'The first argument to axis() must be an iterable of the form [xmin, xmax, ymin, ymax]');
    ax.xlimUser = [v[0], v[1]]; ax.ylimUser = [v[2], v[3]];
  }
  const { xlim, ylim } = viewLimits(ax);
  return new Tuple([f64(xlim[0]), f64(xlim[1]), f64(ylim[0]), f64(ylim[1])]);
}
function ticksCmd(ax, which, a, k) {
  if (a.length) ax[which + 'ticksUser'] = valuesOf(a[0]).vals.map(Number);
  if (a.length > 1) ax[which + 'tickLabels'] = valuesOf(a[1]).vals.map(pyStr);
  if (k.has('rotation')) ax[which + 'rotation'] = toNumber(k.get('rotation'));
  return null;
}
function textCmd(ax, a, k) {
  const o = parseArgs('text', a, new Map([...k].filter(([n]) => ['x', 'y', 's'].includes(n))), [['x', REQUIRED], ['y', REQUIRED], ['s', REQUIRED]]);
  const props = textProps(k, ['x', 'y', 's', 'fontdict', 'transform'], 'text');
  ax.artists.push({ kind: 'text', x: toNumber(o.x), y: toNumber(o.y), s: pyStr(o.s), props });
  return new Text(o.x, o.y, pyStr(o.s), props);
}

const NOT_HERE = (what) => new PyFunc(what, () => { throw new NotSupported(`${what} — ${ONLY}`); }, { kind: 'function' });

function axesMethod(ax, name) {
  const m = (fn) => new PyFunc(name, (a, k, ctx) => fn(a, k, ctx), { owner: 'Axes', self: ax });
  switch (name) {
    case 'scatter': return m((a, k) => scatter(ax, a, k));
    case 'pie': return m((a, k, ctx) => pie(ax, a, k, ctx));
    case 'plot': return m((a, k) => plotLines(ax, a, k));
    case 'set_title': return m((a, k) => setTitle(ax, a, k, 'set_title'));
    case 'set_xlabel': return m((a, k) => setLabel(ax, 'x', a, k, 'set_xlabel'));
    case 'set_ylabel': return m((a, k) => setLabel(ax, 'y', a, k, 'set_ylabel'));
    case 'legend': return m((a, k, ctx) => legend(ax, a, k, ctx));
    case 'grid': return m((a, k) => setGrid(ax, a, k));
    case 'set_xlim': return m((a, k) => limits(ax, 'x', a, k));
    case 'set_ylim': return m((a, k) => limits(ax, 'y', a, k));
    case 'axis': return m((a, k) => axisCmd(ax, a, k));
    case 'text': return m((a, k) => textCmd(ax, a, k));
    case 'set_aspect': return m((a) => { ax.aspect = pyStr(a[0]) === 'equal' ? 'equal' : 'auto'; return null; });
    case 'get_title': return m(() => ax.titles.center);
    case 'get_xlabel': return m(() => ax.xlabel);
    case 'get_ylabel': return m(() => ax.ylabel);
    case 'set': return m((a, k) => {
      if (k.has('title')) ax.titles.center = pyStr(k.get('title'));
      if (k.has('xlabel')) ax.xlabel = pyStr(k.get('xlabel'));
      if (k.has('ylabel')) ax.ylabel = pyStr(k.get('ylabel'));
      if (k.has('xlim')) ax.xlimUser = valuesOf(k.get('xlim')).vals;
      if (k.has('ylim')) ax.ylimUser = valuesOf(k.get('ylim')).vals;
      return null;
    });
    case 'set_xticks': return m((a, k) => ticksCmd(ax, 'x', a, k));
    case 'set_yticks': return m((a, k) => ticksCmd(ax, 'y', a, k));
    case 'tick_params': return m(() => null);
    case 'bar': case 'barh': case 'hist': case 'boxplot': case 'violinplot': case 'imshow': case 'fill_between': case 'stem': case 'annotate':
      return new PyFunc(name, () => { throw new NotSupported(`ax.${name}( ) — ${ONLY}`); }, { owner: 'Axes', self: ax });
    default: return undefined;
  }
}

function figureMethod(fig, name) {
  const m = (fn) => new PyFunc(name, (a, k, ctx) => fn(a, k, ctx), { owner: 'Figure', self: fig });
  switch (name) {
    case 'suptitle': return m((a) => { fig.suptitle = pyStr(a[0]); return new Text(pyFloatNum(0.5), pyFloatNum(0.98), fig.suptitle); });
    case 'tight_layout': return m(() => null);
    case 'savefig': return m((a, k, ctx) => { ctx.note('그림 파일 저장은 이 시험지에서 하지 않습니다. 그림은 아래에 그대로 보이고, 답안을 저장하면 함께 남습니다.'); return null; });
    case 'add_subplot': return m((a) => {
      let nums = a.map((v) => toNumber(v));
      if (nums.length === 0) nums = [1, 1, 1];
      if (nums.length === 1) nums = [Math.floor(nums[0] / 100), Math.floor(nums[0] / 10) % 10, nums[0] % 10];
      const ax = new Axes(fig, nums[0], nums[1], nums[2]); fig.axes.push(ax); fig.current = ax; return ax;
    });
    case 'gca': return m(() => { if (!fig.current) { fig.current = new Axes(fig); fig.axes.push(fig.current); } return fig.current; });
    case 'axes': return fig.axes.slice();
    default: return undefined;
  }
}

// ── rcParams (글꼴 설정 줄이 오류 없이 지나가게) ────────────────────
class RcParams {
  constructor() { this.map = new Map([['font.family', ['sans-serif']], ['axes.unicode_minus', true], ['figure.figsize', [6.4, 4.8]]]); }
  get pyType() { return 'RcParams'; }
  repr() { return 'RcParams({…})'; }
  getitem(k) {
    const key = pyStr(k);
    if (!this.map.has(key)) throw new PyError('KeyError', `${strRepr(key)} is not a valid rc parameter (see rcParams.keys() for a list of valid parameters)`);
    const v = this.map.get(key);
    return Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? pyFloatNum(x) : x)) : v;
  }
  setitem(k, v) { this.map.set(pyStr(k), v); }
  getattr(name) {
    if (name === 'update') return new PyFunc('update', () => null, { owner: 'RcParams', self: this });
    return undefined;
  }
}
export const rcParams = new RcParams();

// ── pyplot 모듈 ─────────────────────────────────────────
export function pyplotAttrs(ctxGetter) {
  const fn = (name, body) => new PyFunc(name, (args, kw) => body(args, kw, ctxGetter()), { kind: 'function' });
  const need = { scatter: ['x', 'y'], pie: ['x'], title: ['label'], xlabel: ['xlabel'], ylabel: ['ylabel'], text: ['x', 'y', 's'] };
  const precheck = (name, a, k) => {
    const req = need[name];
    if (req) {
      const miss = req.filter((n, i) => i >= a.length && !k.has(n));
      if (miss.length) {
        const list = miss.length === 1 ? `'${miss[0]}'` : miss.slice(0, -1).map((m) => `'${m}'`).join(', ') + ` and '${miss[miss.length - 1]}'`;
        const hint = name === 'scatter' ? 'plt.scatter(가로축 열, 세로축 열) 처럼 두 열을 넣어야 합니다.' : `${name}( ) 괄호 안에 넣을 값을 빠뜨렸습니다.`;
        throw new PyError('TypeError', `${name}() missing ${miss.length} required positional argument${miss.length > 1 ? 's' : ''}: ${list}`, hint);
      }
    }
    if (name === 'pie') for (const kk of k.keys()) if (!PIE_SPEC.some(([n]) => n === kk)) throw new PyError('TypeError', `pie() got an unexpected keyword argument '${kk}'`, `plt.pie( ) 에는 ${kk}= 를 쓸 수 없습니다.`);
  };
  const onAx = (name, body) => fn(name, (a, k, ctx) => { precheck(name, a, k); return body(ctx.plt.gca(), a, k, ctx); });
  return {
    figure: fn('figure', (args, kw, ctx) => {
      const o = parseArgs('figure', args, new Map([...kw].filter(([k]) => ['num', 'figsize', 'dpi'].includes(k))), [['num', null], ['figsize', null], ['dpi', null]]);
      let size = null;
      if (o.figsize) {
        const items = valuesOf(o.figsize).vals;
        if (items.length !== 2) throw new PyError('ValueError', 'figsize must be a tuple of 2 numbers', 'figsize 는 (가로, 세로) 두 수로 적습니다. 예) figsize=(8, 6)');
        size = items.map(Number);
      }
      return ctx.plt.figure(size);
    }),
    subplot: fn('subplot', (args, kw, ctx) => {
      let nums = args.map((a) => toNumber(a));
      if (nums.length === 0) nums = [1, 1, 1];   // plt.subplot() 은 subplot(111) 과 같다
      if (nums.length === 1) {
        const v = nums[0];
        if (v < 111 || v > 999) throw new PyError('ValueError', `Integer subplot specification must be a three-digit number, not ${v}`, 'plt.subplot(1, 2, 1) 처럼 세 수를 쓰거나 121 처럼 세 자리 수로 씁니다.');
        nums = [Math.floor(v / 100), Math.floor(v / 10) % 10, v % 10];
      }
      if (nums.length !== 3) throw new PyError('TypeError', `subplot() takes 1 or 3 positional arguments but ${nums.length} were given`, 'plt.subplot(행 수, 열 수, 몇 번째 칸) 세 수를 넣습니다.');
      return ctx.plt.subplot(nums[0], nums[1], nums[2]);
    }),
    subplots: fn('subplots', (args, kw, ctx) => {
      const o = parseArgs('subplots', args, new Map([...kw].filter(([k]) => ['nrows', 'ncols', 'figsize'].includes(k))), [['nrows', pyInt(1)], ['ncols', pyInt(1)], ['figsize', null]]);
      const size = o.figsize ? valuesOf(o.figsize).vals.map(Number) : null;
      const [f, axes] = ctx.plt.subplots(toNumber(o.nrows), toNumber(o.ncols), size);
      return new Tuple([f, axes.length === 1 ? axes[0] : axes]);
    }),
    gcf: fn('gcf', (a, k, ctx) => ctx.plt.gcf()),
    gca: fn('gca', (a, k, ctx) => ctx.plt.gca()),
    close: fn('close', (a, k, ctx) => { ctx.plt.close(a[0] ?? null); return null; }),
    show: fn('show', (a, k, ctx) => { ctx.plt.flush(); return null; }),
    scatter: onAx('scatter', (ax, a, k) => scatter(ax, a, k)),
    pie: onAx('pie', (ax, a, k, ctx) => pie(ax, a, k, ctx)),
    plot: onAx('plot', (ax, a, k) => plotLines(ax, a, k)),
    title: onAx('title', (ax, a, k) => setTitle(ax, a, k, 'title')),
    xlabel: onAx('xlabel', (ax, a, k) => setLabel(ax, 'x', a, k, 'xlabel')),
    ylabel: onAx('ylabel', (ax, a, k) => setLabel(ax, 'y', a, k, 'ylabel')),
    legend: onAx('legend', (ax, a, k, ctx) => legend(ax, a, k, ctx)),
    grid: onAx('grid', (ax, a, k) => setGrid(ax, a, k)),
    xlim: onAx('xlim', (ax, a, k) => limits(ax, 'x', a, k)),
    ylim: onAx('ylim', (ax, a, k) => limits(ax, 'y', a, k)),
    axis: onAx('axis', (ax, a, k) => axisCmd(ax, a, k)),
    xticks: onAx('xticks', (ax, a, k) => ticksCmd(ax, 'x', a, k)),
    yticks: onAx('yticks', (ax, a, k) => ticksCmd(ax, 'y', a, k)),
    text: onAx('text', (ax, a, k) => textCmd(ax, a, k)),
    suptitle: fn('suptitle', (a, k, ctx) => { const f = ctx.plt.gcf(); f.suptitle = pyStr(a[0]); return new Text(pyFloatNum(0.5), pyFloatNum(0.98), f.suptitle); }),
    tight_layout: fn('tight_layout', () => null),
    rc: fn('rc', () => null),
    rcParams,
    savefig: fn('savefig', (a, k, ctx) => { ctx.note('그림 파일 저장은 이 시험지에서 하지 않습니다. 그림은 아래에 그대로 보이고, 답안을 저장하면 함께 남습니다.'); return null; }),
    style: new Module('matplotlib.style', { use: fn('use', () => null), available: ['default', 'ggplot', 'seaborn-v0_8'] }),
    bar: NOT_HERE('plt.bar( )'), barh: NOT_HERE('plt.barh( )'), hist: NOT_HERE('plt.hist( )'), boxplot: NOT_HERE('plt.boxplot( )'),
    violinplot: NOT_HERE('plt.violinplot( )'), imshow: NOT_HERE('plt.imshow( )'), colorbar: NOT_HERE('plt.colorbar( )'),
    fill_between: NOT_HERE('plt.fill_between( )'), stem: NOT_HERE('plt.stem( )'), annotate: NOT_HERE('plt.annotate( )'),
    stackplot: NOT_HERE('plt.stackplot( )'), polar: NOT_HERE('plt.polar( )'), twinx: NOT_HERE('plt.twinx( )'),
  };
}

// matplotlib.font_manager — 코랩에서 한글 글꼴을 넣던 줄이 오류 없이 지나가게 (이 시험지는 한글이 그대로 나온다)
export function fontManagerModule() {
  const noop = (name) => new PyFunc(name, () => null, { kind: 'function' });
  const fm = { get pyType() { return 'FontManager'; }, repr: () => '<matplotlib.font_manager.FontManager object>', getattr: (n) => (['addfont', '_load_fontmanager'].includes(n) ? noop(n) : n === 'ttflist' ? [] : undefined) };
  const props = { get pyType() { return 'FontProperties'; }, repr: () => '<matplotlib.font_manager.FontProperties object>', getattr: (n) => (n === 'get_name' ? new PyFunc(n, () => 'NanumGothic') : undefined) };
  return new Module('matplotlib.font_manager', {
    fontManager: fm,
    FontProperties: new PyFunc('FontProperties', () => props, { kind: 'function' }),
    findSystemFonts: new PyFunc('findSystemFonts', () => [], { kind: 'function' }),
    findfont: new PyFunc('findfont', () => 'NanumGothic.ttf', { kind: 'function' }),
    _rebuild: noop('_rebuild'),
  });
}
