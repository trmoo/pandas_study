// © 2026 티쳐무 · 학교 수업 목적으로만 사용
// matplotlib 의 눈금 고르기(AutoLocator = MaxNLocator)와 눈금 글자(ScalarFormatter) 흉내.
// 산점도 축에 찍히는 눈금이 코랩과 똑같게 하려고 matplotlib 3.10 의 계산 순서를 그대로 옮겼다.
// (화면을 만들지 않으므로 node 시험에서 그대로 불러 쓴다.)
import { fixed } from './numfmt.js';

const STEPS = [1, 2, 2.5, 5, 10];
// [1,2,2.5,5,10] → [0.1,0.2,0.25,0.5, 1,2,2.5,5,10, 20]
const EXTENDED = [...STEPS.slice(0, -1).map((s) => 0.1 * s), ...STEPS, 10 * STEPS[1]];

// 파이썬의 실수 divmod — 나머지 부호가 나누는 수를 따른다
export function pyDivmod(x, y) {
  let mod = x % y;
  let div = (x - mod) / y;
  if (mod && (y < 0) !== (mod < 0)) { mod += y; div -= 1; }
  let floordiv;
  if (div) { floordiv = Math.floor(div); if (div - floordiv > 0.5) floordiv += 1; } else floordiv = 0;
  return [floordiv, mod];
}

function scaleRange(vmin, vmax, n = 1, threshold = 100) {
  const dv = Math.abs(vmax - vmin);
  const meanv = (vmax + vmin) / 2;
  let offset = 0;
  if (!(Math.abs(meanv) / dv < threshold)) offset = Math.sign(meanv) * 10 ** Math.floor(Math.log10(Math.abs(meanv)));
  const scale = 10 ** Math.floor(Math.log10(dv / n));
  return [scale, offset];
}

class Edge {
  constructor(step, offset) { this.step = step; this.offset = Math.abs(offset); }
  closeto(ms, edge) {
    let tol = 1e-10;
    if (this.offset > 0) {
      const digits = Math.log10(this.offset / this.step);
      tol = Math.min(0.4999, Math.max(1e-10, 10 ** (digits - 12)));
    }
    return Math.abs(ms - edge) < tol;
  }
  le(x) { const [d, m] = pyDivmod(x, this.step); return this.closeto(m / this.step, 1) ? d + 1 : d; }
  ge(x) { const [d, m] = pyDivmod(x, this.step); return this.closeto(m / this.step, 0) ? d : d + 1; }
}

// matplotlib.transforms.nonsingular — 범위가 0 이면 조금 넓힌다
export function nonsingular(vmin, vmax, expander = 0.001, tiny = 1e-15) {
  if (!Number.isFinite(vmin) || !Number.isFinite(vmax)) return [-expander, expander];
  let swapped = false;
  if (vmax < vmin) { [vmin, vmax] = [vmax, vmin]; swapped = true; }
  const maxabs = Math.max(Math.abs(vmin), Math.abs(vmax));
  if (maxabs < (1e6 / tiny) * Number.MIN_VALUE) { vmin = -expander; vmax = expander; }
  else if (vmax - vmin <= maxabs * tiny) {
    if (vmax === 0 && vmin === 0) { vmin = -expander; vmax = expander; }
    else { vmin -= expander * Math.abs(vmin); vmax += expander * Math.abs(vmax); }
  }
  if (swapped) [vmin, vmax] = [vmax, vmin];
  return [vmin, vmax];
}

// MaxNLocator._raw_ticks (steps=[1,2,2.5,5,10], min_n_ticks=2)
export function rawTicks(vmin, vmax, nbins) {
  [vmin, vmax] = nonsingular(vmin, vmax, 1e-13, 1e-14);
  const [scale, offset] = scaleRange(vmin, vmax, nbins);
  const lo = vmin - offset, hi = vmax - offset;
  const steps = EXTENDED.map((s) => s * scale);
  const rawStep = (hi - lo) / nbins;
  const istep = steps.findIndex((s) => s >= rawStep);
  let ticks = [];
  for (let i = istep; i >= 0; i--) {
    const step = steps[i];
    const best = pyDivmod(lo, step)[0] * step;
    const edge = new Edge(step, offset);
    const low = edge.le(lo - best), high = edge.ge(hi - best);
    ticks = [];
    for (let k = low; k <= high; k++) ticks.push(k * step + best);
    if (ticks.filter((t) => t <= hi && t >= lo).length >= 2) break;
  }
  return ticks.map((t) => t + offset);
}

// 데이터 범위 → 보이는 범위 (axes.xmargin = 0.05, autolimit_mode = 'data')
export function autoLimits(lo, hi, margin = 0.05) {
  [lo, hi] = nonsingular(lo, hi, 0.001, 1e-15);
  const delta = (hi - lo) * margin;
  return [lo - delta, hi + delta];
}

// 축 길이(포인트)에 들어갈 눈금 수 — XAxis/YAxis.get_tick_space, 9 를 넘지 않는다
export function tickSpace(lengthPt, labelSizePt, isX) {
  const n = Math.floor(lengthPt / (labelSizePt * (isX ? 3 : 2)));
  return Math.min(Math.max(n, 1), 9);
}

// 보이는 범위 안(아주 조금의 여유)에 드는 눈금만
export function visibleTicks(locs, vmin, vmax) {
  const [a, b] = vmin <= vmax ? [vmin, vmax] : [vmax, vmin];
  const tol = 1e-10 * (b - a);
  return locs.filter((l) => l >= a - tol && l <= b + tol);
}

function npRoundHalfEven(x, d) {
  const y = x * 10 ** d;
  let r = Math.round(y);
  if (Math.abs(y - Math.trunc(y)) === 0.5) r = 2 * Math.round(y / 2);
  return r / 10 ** d;
}

// ScalarFormatter — 오프셋·지수·소수 자릿수를 정하고 글자를 만든다
export function formatTicks(locs, vmin, vmax) {
  const [a, b] = vmin <= vmax ? [vmin, vmax] : [vmax, vmin];
  const vis = locs.filter((l) => a <= l && l <= b);
  // ① 오프셋
  let offset = 0;
  if (vis.length) {
    const lmin = Math.min(...vis), lmax = Math.max(...vis);
    if (!(lmin === lmax || (lmin <= 0 && lmax >= 0))) {
      const [absMin, absMax] = [Math.abs(lmin), Math.abs(lmax)].sort((p, q) => p - q);
      const sign = lmin < 0 ? -1 : 1;
      const oomMax = Math.ceil(Math.log10(absMax));
      let oom = null;
      for (let o = oomMax; o > oomMax - 400; o--) {
        if (Math.floor(absMin / 10 ** o) !== Math.floor(absMax / 10 ** o)) { oom = 1 + o; break; }
      }
      if (oom !== null && (absMax - absMin) / 10 ** oom <= 1e-2) {
        for (let o = oomMax; o > oomMax - 400; o--) {
          if (Math.floor(absMax / 10 ** o) - Math.floor(absMin / 10 ** o) > 1) { oom = 1 + o; break; }
        }
      }
      if (oom !== null && Math.floor(absMax / 10 ** oom) >= 10 ** 3) offset = sign * Math.floor(absMax / 10 ** oom) * 10 ** oom;
    }
  }
  // ② 지수(1e6 이상 · 1e-5 이하일 때만)
  let order = 0;
  if (vis.length) {
    let oom;
    if (offset) oom = Math.floor(Math.log10(b - a));
    else { const v = Math.max(...vis.map(Math.abs)); oom = v === 0 ? 0 : Math.floor(Math.log10(v)); }
    if (oom <= -5 || oom >= 6) order = oom;
  }
  // ③ 소수 자릿수 — 모든 눈금이 서로 구별되는 가장 적은 자리
  const base = locs.length < 2 ? [...locs, a, b] : locs;
  let xs = base.map((l) => (l - offset) / 10 ** order);
  let range = Math.max(...xs) - Math.min(...xs);
  if (range === 0) range = Math.max(...xs.map(Math.abs));
  if (range === 0) range = 1;
  if (locs.length < 2) xs = xs.slice(0, -2);
  const rangeOom = Math.floor(Math.log10(range));
  let sig = Math.max(0, 3 - rangeOom);
  const thresh = 1e-3 * 10 ** rangeOom;
  while (sig >= 0) {
    if (Math.max(...xs.map((x) => Math.abs(x - npRoundHalfEven(x, sig)))) < thresh) sig -= 1;
    else break;
  }
  sig += 1;
  const labels = locs.map((l) => {
    let x = (l - offset) / 10 ** order;
    if (Math.abs(x) < 1e-8) x = 0;
    return fixed(x, sig).replace('-', '−');
  });
  let offsetText = '';
  if (locs.length && (order || offset)) {
    let off = '';
    if (offset) {
      const e = Math.floor(Math.log10(Math.abs(offset)));
      const s = Math.round((offset / 10 ** e) * 1e10) / 1e10;
      const sig2 = s % 1 === 0 ? String(s) : String(Number(s.toPrecision(10)));
      off = (offset > 0 ? '+' : '') + (e === 0 ? sig2 : `${sig2}e${e}`);
    }
    offsetText = ((order ? `1e${order}` : '') + off).replace(/-/g, '−');
  }
  return { labels, offsetText };
}

// 축 하나의 눈금을 통째로: 보이는 범위 · 눈금 위치 · 글자
export function axisTicks(vmin, vmax, lengthPt, labelSizePt, isX) {
  const nb = tickSpace(lengthPt, labelSizePt, isX);
  const all = rawTicks(Math.min(vmin, vmax), Math.max(vmin, vmax), nb);
  const { labels, offsetText } = formatTicks(all, vmin, vmax);
  const shown = [];
  const vis = new Set(visibleTicks(all, vmin, vmax));
  all.forEach((l, i) => { if (vis.has(l)) shown.push([l, labels[i]]); });
  return { ticks: shown, offsetText };
}
