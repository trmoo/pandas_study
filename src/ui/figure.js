// © 2026 티쳐무 · 학교 수업 목적으로만 사용
// 그림판(Figure) → SVG. matplotlib 기본 모양(100 dpi, 10pt 글자, 0.8pt 테두리)을 따라 그린다.
// 칸 위치·보이는 범위·눈금은 엔진(src/engine)이 matplotlib 과 같은 방법으로 셈한 값을 그대로 쓴다.
// 글꼴·크기를 SVG 속성으로 직접 적어 둔다 — PDF 로 옮길 때 CSS 없이도 똑같이 보이게.
import { svg, h } from '../lib/ui.js';
import { viewLimits, axesBox, fontPt } from '../engine/plotting.js';
import { axisTickInfo } from '../engine/figsummary.js';
import { parseColor } from '../engine/colors.js';
import { str as pyStr } from '../engine/pyvalues.js';

const FONT = "'DejaVu Sans', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
const PX = 100 / 72; // 1pt → px (100 dpi)
const INK = '#000000';

function textEl(x, y, s, { size = 10, anchor = 'middle', base = 'middle', weight = null, color = INK, rotate = null } = {}) {
  const attrs = { x, y, 'font-family': FONT, 'font-size': (size * PX).toFixed(2), 'text-anchor': anchor, 'dominant-baseline': base, fill: color };
  if (weight) attrs['font-weight'] = weight;
  if (rotate != null) attrs.transform = `rotate(${rotate} ${x} ${y})`;
  return svg('text', attrs, s);
}

function colorOf(props, fallback = INK) {
  const c = props?.color ?? props?.c;
  if (c == null) return fallback;
  const p = parseColor(typeof c === 'string' ? c : c);
  return p ? p[0] : fallback;
}
const weightOf = (props) => {
  const w = props?.fontweight ?? props?.weight;
  return w == null ? null : typeof w === 'string' ? w : String(pyStr(w));
};

// 글자 폭 어림 (숫자·영문은 0.6em, 한글은 1em)
function textWidth(s, sizePt) {
  let w = 0;
  for (const ch of String(s)) w += /[ᄀ-ᇿ㄰-㆏가-힯　-鿿]/.test(ch) ? 1 : 0.6;
  return w * sizePt * PX;
}

// 점 모양 하나
function marker(kind, cx, cy, r, fill, stroke, sw, opacity) {
  const base = { fill, stroke, 'stroke-width': sw, 'fill-opacity': opacity, 'stroke-opacity': opacity };
  const poly = (pts) => svg('polygon', { ...base, points: pts.map(([x, y]) => `${(cx + x * r).toFixed(2)},${(cy + y * r).toFixed(2)}`).join(' ') });
  switch (kind) {
    case 's': return svg('rect', { ...base, x: cx - r * 0.886, y: cy - r * 0.886, width: r * 1.772, height: r * 1.772 });
    case '^': return poly([[0, -1.2], [1.1, 0.8], [-1.1, 0.8]]);
    case 'v': return poly([[0, 1.2], [1.1, -0.8], [-1.1, -0.8]]);
    case '<': return poly([[-1.2, 0], [0.8, -1.1], [0.8, 1.1]]);
    case '>': return poly([[1.2, 0], [-0.8, -1.1], [-0.8, 1.1]]);
    case 'D': case 'd': return poly([[0, -1.25], [kind === 'd' ? 0.8 : 1.25, 0], [0, 1.25], [kind === 'd' ? -0.8 : -1.25, 0]]);
    case '*': {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.5 : 1.3; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      return poly(pts);
    }
    case 'p': case 'h': case 'H': case '8': {
      const k = kind === 'p' ? 5 : kind === '8' ? 8 : 6, pts = [];
      for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / k; pts.push([Math.cos(a) * 1.1, Math.sin(a) * 1.1]); }
      return poly(pts);
    }
    case 'x': case 'X': case '+': case 'P': case '1': case '2': case '3': case '4': case '|': case '_': {
      const line = (x1, y1, x2, y2) => `M${cx + x1 * r},${cy + y1 * r}L${cx + x2 * r},${cy + y2 * r}`;
      const d = kind === 'x' || kind === 'X' ? line(-1, -1, 1, 1) + line(-1, 1, 1, -1)
        : kind === '|' ? line(0, -1, 0, 1) : kind === '_' ? line(-1, 0, 1, 0) : line(-1, 0, 1, 0) + line(0, -1, 0, 1);
      return svg('path', { d, stroke: fill === 'none' ? stroke : fill, 'stroke-width': Math.max(1, r * 0.35), fill: 'none', 'stroke-opacity': opacity });
    }
    case '.': return svg('circle', { ...base, cx, cy, r: r * 0.5 });
    case ',': return svg('rect', { ...base, x: cx - 0.5, y: cy - 0.5, width: 1, height: 1 });
    default: return svg('circle', { ...base, cx, cy, r });
  }
}

const DASH = { '--': '5.55,2.4', '-.': '9.6,2.4,1.5,2.4', ':': '1.5,2.475' };

// 원 조각 하나 (각은 도, 반시계 방향 · 화면은 y 가 아래로 자라므로 부호를 뒤집는다)
function wedgePath(cx, cy, r, t1, t2) {
  const pt = (t) => [cx + r * Math.cos((t * Math.PI) / 180), cy - r * Math.sin((t * Math.PI) / 180)];
  if (t2 - t1 >= 359.999) {
    const [ax, ay] = pt(t1), [bx, by] = pt(t1 + 180);
    return `M${ax},${ay}A${r},${r} 0 1 0 ${bx},${by}A${r},${r} 0 1 0 ${ax},${ay}Z`;
  }
  const [x1, y1] = pt(t1), [x2, y2] = pt(t2);
  const large = t2 - t1 > 180 ? 1 : 0;
  return `M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${large} 0 ${x2},${y2}Z`;
}

let clipId = 0;

export function figureSVG(fig) {
  const W = fig.w * 100, H = fig.h * 100;
  const root = svg('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'figure', role: 'img' });
  root.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));
  const labelsForAria = [];
  if (fig.suptitle) root.appendChild(textEl(W / 2, H * 0.02, fig.suptitle, { size: 12, base: 'hanging' }));

  for (const ax of fig.axes) {
    const box = axesBox(fig, ax);
    const { xlim, ylim } = viewLimits(ax);
    const x0 = box[0] * W, y0 = (1 - box[1] - box[3]) * H, w = box[2] * W, hh = box[3] * H;
    const X = (v) => x0 + ((v - xlim[0]) / (xlim[1] - xlim[0])) * w;
    const Y = (v) => y0 + hh - ((v - ylim[0]) / (ylim[1] - ylim[0])) * hh;
    const sx = w / (xlim[1] - xlim[0]);
    const g = svg('g', {});
    const id = `clip${++clipId}`;
    g.appendChild(svg('defs', {}, svg('clipPath', { id }, svg('rect', { x: x0, y: y0, width: w, height: hh }))));
    const xt = ax.axisOn ? axisTickInfo(fig, ax, 'x', box, xlim) : { ticks: [] };
    const yt = ax.axisOn ? axisTickInfo(fig, ax, 'y', box, ylim) : { ticks: [] };

    // 격자 (자료보다 뒤)
    if (ax.grid && ax.axisOn) {
      const gc = colorOf(ax.gridProps, '#b0b0b0');
      if (ax.gridAxis !== 'y') for (const [t] of xt.ticks) g.appendChild(svg('line', { x1: X(t), x2: X(t), y1: y0, y2: y0 + hh, stroke: gc, 'stroke-width': 0.8 * PX }));
      if (ax.gridAxis !== 'x') for (const [t] of yt.ticks) g.appendChild(svg('line', { x1: x0, x2: x0 + w, y1: Y(t), y2: Y(t), stroke: gc, 'stroke-width': 0.8 * PX }));
    }

    const data = svg('g', { 'clip-path': `url(#${id})` });
    for (const a of ax.artists) {
      if (a.kind === 'scatter') {
        const pts = svg('g', {});
        for (let i = 0; i < a.xs.length; i++) {
          if (!Number.isFinite(a.xs[i]) || !Number.isFinite(a.ys[i])) continue;
          const [fc, fa] = a.colors[a.colors.length === 1 ? 0 : i] ?? a.colors[0];
          const s = a.sizes[a.sizes.length === 1 ? 0 : i] ?? a.sizes[0];
          const r = (Math.sqrt(Math.max(s, 0)) / 2) * PX;
          const op = a.alpha ?? fa;
          const ec = a.edgecolor === 'face' ? fc : a.edgecolor[0];
          const m = marker(a.marker, X(a.xs[i]), Y(a.ys[i]), r, fc, ec, a.edgecolor === 'face' ? 0 : a.linewidth * PX, op);
          m.appendChild(svg('title', {}, `(${fmtNum(a.xs[i], ax.xcats)}, ${fmtNum(a.ys[i], ax.ycats)})`));
          pts.appendChild(m);
        }
        data.appendChild(pts);
      } else if (a.kind === 'line') {
        const [lc] = a.color;
        const seq = [];
        a.xs.forEach((x, i) => { if (Number.isFinite(x) && Number.isFinite(a.ys[i])) seq.push(`${X(x).toFixed(2)},${Y(a.ys[i]).toFixed(2)}`); });
        if (a.linestyle !== 'None' && a.linestyle !== '' && a.linestyle !== ' ') {
          data.appendChild(svg('polyline', { points: seq.join(' '), fill: 'none', stroke: lc, 'stroke-width': a.linewidth * PX,
            'stroke-dasharray': DASH[a.linestyle] ?? null, 'stroke-opacity': a.alpha ?? 1, 'stroke-linejoin': 'round' }));
        }
        if (a.marker) {
          a.xs.forEach((x, i) => {
            if (Number.isFinite(x) && Number.isFinite(a.ys[i])) data.appendChild(marker(a.marker, X(x), Y(a.ys[i]), (a.markersize / 2) * PX, lc, lc, 0, a.alpha ?? 1));
          });
        }
      } else if (a.kind === 'text') {
        data.appendChild(textEl(X(a.x), Y(a.y), a.s, { size: fontPt(a.props, 10), anchor: 'start', base: 'auto', color: colorOf(a.props) }));
      }
    }
    g.appendChild(data);

    // 원 그래프 (칸 밖으로 나가도 잘리지 않는다 — clip_on=False)
    for (const a of ax.artists.filter((q) => q.kind === 'pie')) {
      const ec = a.wedgeprops?.edgecolor ?? a.wedgeprops?.ec;
      const lw = a.wedgeprops?.linewidth ?? a.wedgeprops?.lw;
      for (const p of a.parts) {
        const cx = X(p.x), cy = Y(p.y), r = p.r * sx;
        const d = wedgePath(cx, cy, r, p.t1, p.t2);
        if (a.shadow) g.appendChild(svg('path', { d: wedgePath(cx + 0.02 * r, cy + 0.02 * r, r, p.t1, p.t2), fill: '#000000', 'fill-opacity': 0.25 }));
        const wedge = svg('path', { d, fill: p.color, 'fill-opacity': p.alpha ?? 1,
          stroke: ec != null ? (parseColor(ec)?.[0] ?? 'none') : 'none', 'stroke-width': lw != null ? Number(lw.v ?? lw) * PX : 0 });
        const pct = ((p.t2 - p.t1) / 360) * 100;
        wedge.appendChild(svg('title', {}, `${p.label || '(이름 없음)'} — ${pct.toFixed(1)}%`));
        g.appendChild(wedge);
        labelsForAria.push(`${p.label} ${pct.toFixed(1)}%`);
      }
      for (const p of a.parts) {
        for (const t of [p.text, p.autotext]) {
          if (!t || t.text === '') continue;
          const tx = X(t.x.v), ty = Y(t.y.v);
          const anchor = t.props.ha === 'left' ? 'start' : t.props.ha === 'right' ? 'end' : 'middle';
          g.appendChild(textEl(tx, ty, t.text, { size: fontPt(t.props, 10), anchor, base: 'central', color: colorOf(t.props), weight: weightOf(t.props) }));
        }
      }
    }

    // 상자그림 (DataFrame.boxplot)
    if (ax.boxes.length) drawBoxes(g, ax, X, Y, w);

    // 테두리 · 눈금 · 눈금 글자
    const TL = 3.5 * PX, PAD = 3.5 * PX;
    let xLabelBottom = y0 + hh, yLabelLeft = x0;
    if (ax.frameOn && ax.axisOn) {
      g.appendChild(svg('rect', { x: x0, y: y0, width: w, height: hh, fill: 'none', stroke: INK, 'stroke-width': 0.8 * PX }));
    }
    if (ax.axisOn) {
      const rotX = ax.xrotation || 0;
      for (const [t, lab] of xt.ticks) {
        const x = X(t);
        g.appendChild(svg('line', { x1: x, x2: x, y1: y0 + hh, y2: y0 + hh + TL, stroke: INK, 'stroke-width': 0.8 * PX }));
        g.appendChild(textEl(x, y0 + hh + TL + PAD, lab, { anchor: rotX ? 'end' : 'middle', base: 'hanging', rotate: rotX ? -rotX : null }));
      }
      if (xt.ticks.length) xLabelBottom = y0 + hh + TL + PAD + 10 * PX * 1.15 + (rotX ? Math.max(...xt.ticks.map(([, l]) => textWidth(l, 10))) * Math.sin((rotX * Math.PI) / 180) : 0);
      let maxW = 0;
      for (const [t, lab] of yt.ticks) {
        const y = Y(t);
        g.appendChild(svg('line', { x1: x0 - TL, x2: x0, y1: y, y2: y, stroke: INK, 'stroke-width': 0.8 * PX }));
        g.appendChild(textEl(x0 - TL - PAD, y, lab, { anchor: 'end', base: 'central' }));
        maxW = Math.max(maxW, textWidth(lab, 10));
      }
      if (yt.ticks.length) yLabelLeft = x0 - TL - PAD - maxW;
      if (xt.offsetText) g.appendChild(textEl(x0 + w, xLabelBottom + 2, xt.offsetText, { anchor: 'end', base: 'hanging' }));
      if (yt.offsetText) g.appendChild(textEl(x0, y0 - 4, yt.offsetText, { anchor: 'start', base: 'auto' }));
    }
    // 축 이름 · 제목
    if (ax.xlabel) g.appendChild(textEl(x0 + w / 2, xLabelBottom + 4 * PX, ax.xlabel, { size: fontPt(ax.xlabelProps, 10), base: 'hanging', color: colorOf(ax.xlabelProps), weight: weightOf(ax.xlabelProps) }));
    if (ax.ylabel) {
      const lx = yLabelLeft - 4 * PX;
      g.appendChild(textEl(lx, y0 + hh / 2, ax.ylabel, { size: fontPt(ax.ylabelProps, 10), base: 'auto', rotate: -90, color: colorOf(ax.ylabelProps), weight: weightOf(ax.ylabelProps) }));
    }
    for (const [loc, t] of Object.entries(ax.titles)) {
      if (!t) continue;
      const tx = loc === 'left' ? x0 : loc === 'right' ? x0 + w : x0 + w / 2;
      g.appendChild(textEl(tx, y0 - 6 * PX, t, { size: fontPt(ax.titleProps, 12), anchor: loc === 'left' ? 'start' : loc === 'right' ? 'end' : 'middle', base: 'auto',
        color: colorOf(ax.titleProps), weight: weightOf(ax.titleProps) }));
    }
    if (ax.legend && ax.legend.entries.length) drawLegend(g, ax, x0, y0, w, hh, X, Y);
    root.appendChild(g);
  }
  const titles = fig.axes.flatMap((a) => [a.titles.center, a.xlabel && `가로축 ${a.xlabel}`, a.ylabel && `세로축 ${a.ylabel}`]).filter(Boolean);
  root.setAttribute('aria-label', ['그래프', ...titles, ...labelsForAria].join(' · '));
  return root;
}

function fmtNum(v, cats) {
  if (cats) return cats[v] ?? v;
  return Math.abs(v) >= 1000 ? String(Math.round(v * 100) / 100) : String(Math.round(v * 1000) / 1000);
}

// 범례 — 'best' 는 점이 가장 적게 가려지는 모서리를 고른다
function drawLegend(g, ax, x0, y0, w, hh, X, Y) {
  const L = ax.legend, fs = L.fontsize || 10;
  const rowH = fs * PX * 1.45, pad = fs * PX * 0.5, handleW = fs * PX * 2;
  const textW = Math.max(...L.entries.map((e) => textWidth(e.label, fs)), L.title ? textWidth(L.title, fs) : 0);
  const bw = pad * 2 + handleW + fs * PX * 0.8 + textW, bh = pad * 2 + rowH * (L.entries.length + (L.title ? 1 : 0));
  const m = fs * PX * 0.5;
  const spots = {
    'upper right': [x0 + w - bw - m, y0 + m], 'upper left': [x0 + m, y0 + m], 'lower left': [x0 + m, y0 + hh - bh - m],
    'lower right': [x0 + w - bw - m, y0 + hh - bh - m], right: [x0 + w - bw - m, y0 + (hh - bh) / 2], 'center left': [x0 + m, y0 + (hh - bh) / 2],
    'center right': [x0 + w - bw - m, y0 + (hh - bh) / 2], 'lower center': [x0 + (w - bw) / 2, y0 + hh - bh - m],
    'upper center': [x0 + (w - bw) / 2, y0 + m], center: [x0 + (w - bw) / 2, y0 + (hh - bh) / 2],
  };
  const codes = ['best', 'upper right', 'upper left', 'lower left', 'lower right', 'right', 'center left', 'center right', 'lower center', 'upper center', 'center'];
  let loc = typeof L.loc === 'number' ? codes[L.loc] ?? 'best' : L.loc;
  if (!spots[loc]) {
    const pts = [];
    for (const a of ax.artists) if (a.kind === 'scatter' || a.kind === 'line') a.xs.forEach((x, i) => { if (Number.isFinite(x) && Number.isFinite(a.ys[i])) pts.push([X(x), Y(a.ys[i])]); });
    let best = 'upper right', bestN = Infinity;
    for (const k of codes.slice(1)) {
      const [lx, ly] = spots[k];
      const n = pts.filter(([px, py]) => px >= lx && px <= lx + bw && py >= ly && py <= ly + bh).length;
      if (n < bestN) { bestN = n; best = k; }
    }
    loc = best;
  }
  const [lx, ly] = spots[loc];
  const lg = svg('g', {});
  if (L.frameon) lg.appendChild(svg('rect', { x: lx, y: ly, width: bw, height: bh, rx: 3, fill: '#ffffff', 'fill-opacity': 0.8, stroke: '#cccccc', 'stroke-width': 1 }));
  let yy = ly + pad + rowH / 2;
  if (L.title) { lg.appendChild(textEl(lx + bw / 2, yy, L.title, { size: fs, base: 'central' })); yy += rowH; }
  for (const e of L.entries) {
    const hx = lx + pad, hy = yy;
    if (e.type === 'patch') lg.appendChild(svg('rect', { x: hx, y: hy - fs * PX * 0.35, width: handleW, height: fs * PX * 0.7, fill: e.color, 'fill-opacity': e.alpha ?? 1 }));
    else if (e.type === 'scatter') lg.appendChild(marker(e.marker, hx + handleW / 2, hy, 3 * PX, e.color, e.color, 0, e.alpha ?? 1));
    else {
      if (e.linestyle !== 'None') lg.appendChild(svg('line', { x1: hx, x2: hx + handleW, y1: hy, y2: hy, stroke: e.color, 'stroke-width': 1.5 * PX, 'stroke-dasharray': DASH[e.linestyle] ?? null }));
      if (e.marker) lg.appendChild(marker(e.marker, hx + handleW / 2, hy, 3 * PX, e.color, e.color, 0, 1));
    }
    lg.appendChild(textEl(hx + handleW + fs * PX * 0.8, hy, e.label, { size: fs, anchor: 'start', base: 'central' }));
    yy += rowH;
  }
  g.appendChild(lg);
}

function drawBoxes(g, ax, X, Y) {
  const BLUE = '#1f77b4', ORANGE = '#ff7f0e';
  ax.boxes.forEach((b, i) => {
    const s = b.stats; if (!s) return;
    const cx = X(i + 1), half = (X(i + 1.25) - X(i + 0.75)) / 2;
    const ln = (x1, y1, x2, y2, c = BLUE) => g.appendChild(svg('line', { x1, y1, x2, y2, stroke: c, 'stroke-width': 1 * PX }));
    ln(cx, Y(s.q1), cx, Y(s.whislo)); ln(cx, Y(s.q3), cx, Y(s.whishi));
    ln(cx - half / 2, Y(s.whislo), cx + half / 2, Y(s.whislo)); ln(cx - half / 2, Y(s.whishi), cx + half / 2, Y(s.whishi));
    g.appendChild(svg('rect', { x: cx - half, y: Y(s.q3), width: half * 2, height: Math.max(0.5, Y(s.q1) - Y(s.q3)), fill: 'none', stroke: BLUE, 'stroke-width': PX }));
    ln(cx - half, Y(s.med), cx + half, Y(s.med), ORANGE);
    for (const f of s.fliers) g.appendChild(svg('circle', { cx, cy: Y(f), r: 3 * PX, fill: 'none', stroke: INK, 'stroke-width': PX }));
    g.appendChild(textEl(cx, Y(ax.boxes.length ? viewLimits(ax).ylim[0] : 0) + 3.5 * PX * 2, b.label, { base: 'hanging' }));
  });
}

// 화면에 붙일 상자 — 교실 화면에서도 보이게 가로 폭에 맞춰 늘린다
export function renderFigure(fig) {
  const el = figureSVG(fig);
  return h('div', { class: 'figure-wrap', style: { maxWidth: `${Math.min(fig.w * 100 * 1.25, 1000)}px` } }, el);
}
