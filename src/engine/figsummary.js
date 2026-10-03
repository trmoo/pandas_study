// © 2026 티쳐무 · 학교 수업 목적으로만 사용
// 그림판 하나를 "무엇이 어디에 그려졌는지"로 요약한다 — 화면(figure.js)과 시험(golden 대조)이 함께 쓴다.
// 칸 위치·보이는 범위·눈금·조각·글자 자리를 matplotlib 과 같은 방법으로 셈한다.
import { viewLimits, axesBox } from './plotting.js';
import { axisTicks, formatTicks } from './ticks.js';

// 눈금 — 범주 축이면 범주 이름, 사용자가 정한 눈금이면 그것, 아니면 matplotlib 자동 눈금
export function axisTickInfo(fig, ax, which, box, lim) {
  const user = which === 'x' ? ax.xticksUser : ax.yticksUser;
  const cats = which === 'x' ? ax.xcats : ax.ycats;
  const lenPt = (which === 'x' ? box[2] * fig.w : box[3] * fig.h) * 72;
  const [a, b] = lim[0] <= lim[1] ? lim : [lim[1], lim[0]];
  const tol = 1e-10 * (b - a);
  const inView = (t) => t >= a - tol && t <= b + tol;
  if (user) {
    const names = which === 'x' ? ax.xtickLabels : ax.ytickLabels;
    const { labels } = formatTicks(user, lim[0], lim[1]);
    return { ticks: user.map((t, i) => [t, names?.[i] ?? labels[i]]).filter(([t]) => inView(t)), offsetText: '' };
  }
  if (cats) return { ticks: cats.map((c, i) => [i, c]).filter(([t]) => inView(t)), offsetText: '' };
  return axisTicks(lim[0], lim[1], lenPt, 10, which === 'x');
}

const hexAlpha = (a) => {
  const y = a * 255;
  let r = Math.round(y);
  if (Math.abs(y - Math.trunc(y)) === 0.5) r = 2 * Math.round(y / 2); // 파이썬 round (짝수 쪽)
  return r.toString(16).padStart(2, '0');
};

export function summarizeFigure(fig) {
  if (!fig.axes.length) return { empty: fig.repr() };
  return {
    w: fig.w, h: fig.h,
    axes: fig.axes.map((ax) => {
      const { xlim, ylim } = viewLimits(ax);
      const pos = axesBox(fig, ax);
      const xt = axisTickInfo(fig, ax, 'x', pos, xlim), yt = axisTickInfo(fig, ax, 'y', pos, ylim);
      const pies = ax.artists.filter((a) => a.kind === 'pie');
      const texts = [];
      for (const p of pies) for (const part of p.parts) {  // matplotlib 은 조각마다 이름표 → 비율 순서로 글자를 단다
        if (part.text) texts.push(part.text);
        if (part.autotext) texts.push(part.autotext);
      }
      return {
        title: ax.titles.center, xlabel: ax.xlabel, ylabel: ax.ylabel, xlim, ylim, pos,
        frame: ax.frameOn, aspect: ax.aspect === 'equal' ? '1.0' : 'auto',
        xticks: xt.ticks, yticks: yt.ticks, grid: !!ax.grid && ax.gridAxis !== 'y',
        scatter: ax.artists.filter((a) => a.kind === 'scatter').map((a) => ({
          n: a.xs.filter((x, i) => Number.isFinite(x) && Number.isFinite(a.ys[i])).length,
          color: a.colors[0][0] + hexAlpha(a.alpha ?? a.colors[0][1]),
          size: a.sizes[0],
        })),
        wedges: pies.flatMap((p) => p.parts.map((q) => ({ t1: q.t1, t2: q.t2, color: q.color }))),
        texts: texts.map((t) => ({ x: t.x.v, y: t.y.v, s: t.text, ha: t.props.ha })),
        legend: ax.legend ? ax.legend.entries.map((e) => e.label) : null,
      };
    }),
  };
}
