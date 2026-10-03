/*!
 * 판다스 실습실 — © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 오픈소스 라이선스를 붙이지 않았습니다.
 */
// 시작점 — 단원 탭 7개 + 치트시트 + 안내. 주소 끝의 #단원/레슨 (예: #select/locs) 으로 바로 갈 수 있다.
// 레슨마다 노트북(과 그 커널)을 한 번만 만들어 두고, 탭을 옮겨도 실행 상태가 유지되게 한다.
import './style.css';
import menu from './data/menu.csv?raw';
import menuRaw from './data/menu_raw.csv?raw';
import orders from './data/orders.csv?raw';
import weather from './data/weather.csv?raw';
import bike from './data/bike.csv?raw';
import { h, loadStore, fill } from './lib/ui.js';
import { TABS, graded } from './lessons/data.js';
import { MISSIONS } from './lessons/missions.js';
import { Notebook } from './ui/notebook.js';
import { buildMissions } from './ui/missions.js';
import { buildGuide, buildCheat } from './ui/guide.js';

const files = { 'menu.csv': menu, 'menu_raw.csv': menuRaw, 'orders.csv': orders, 'weather.csv': weather, 'bike.csv': bike };
let views = new Map();
const DEMO = new URLSearchParams(location.search).has('demo');

const top = document.getElementById('top');
const tabs = document.getElementById('tabs');
const pills = document.getElementById('pills');
const main = document.getElementById('main');

top.append(
  h('a', { class: 'brand', href: '#start/series' },
    h('span', { class: 'logo', 'aria-hidden': 'true' }, '🐼'),
    h('div', {}, h('h1', {}, '판다스 실습실'), h('p', {}, '설치 없이 브라우저에서 — 판다스 기초부터 빅데이터분석기사 작업형1까지'))),
  h('div', { class: 'top-links' },
    h('a', { class: 'btn ghost light', href: '#cheat' }, '📝 치트시트'),
    h('a', { class: 'btn ghost light', href: '#guide' }, '📖 안내')));

function route() {
  const [a, b] = location.hash.slice(1).split('/');
  if (a === 'cheat' || a === 'guide') return { tab: a };
  const tab = TABS.find((t) => t.id === a) ?? TABS[0];
  const lesson = tab.lessons.find((l) => l.id === b) ?? tab.lessons[0];
  return { tab: tab.id, lesson: lesson.id };
}

function lessonProgress(l, store) {
  if (l.special === 'missions') return [MISSIONS.filter((m) => store.missions[m.id]).length, MISSIONS.length];
  const g = l.cells.filter(graded);
  if (!g.length) { const p = l.cells.filter((c) => c.kind === 'predict'); return [p.filter((c) => store.predict?.[c.id] !== undefined).length, p.length]; }
  return [g.filter((c) => store.passed[c.id]).length, g.length];
}

function drawNav() {
  const store = loadStore();
  const r = route();
  fill(tabs, ...TABS.map((t) => {
    const sum = t.lessons.map((l) => lessonProgress(l, store)).reduce((a, [d, n]) => [a[0] + d, a[1] + n], [0, 0]);
    const done = sum[1] && sum[0] === sum[1];
    return h('a', { class: `tab ${r.tab === t.id ? 'on' : ''}`, href: `#${t.id}/${t.lessons[0].id}`, 'aria-current': r.tab === t.id ? 'page' : null, title: t.desc },
      h('span', { class: 'tab-num' }, t.num), h('span', { class: 'tab-title' }, t.title),
      h('span', { class: `tab-prog ${done ? 'done' : ''}` }, done ? '✅' : `${sum[0]}/${sum[1]}`));
  }));
  const tab = TABS.find((t) => t.id === r.tab);
  if (!tab) { pills.hidden = true; return; }
  pills.hidden = false;
  fill(pills, tab.lessons.map((l, i) => {
    const [d, n] = lessonProgress(l, store);
    return h('a', { class: `pill ${r.lesson === l.id ? 'on' : ''}`, href: `#${tab.id}/${l.id}`, 'aria-current': r.lesson === l.id ? 'page' : null },
      h('span', { class: 'pill-num' }, `${tab.num}-${i + 1}`), l.short, n ? h('span', { class: `pill-prog ${d === n ? 'done' : ''}` }, d === n ? '✓' : `${d}/${n}`) : null);
  }));
}

function show() {
  const r = route();
  drawNav();
  const key = r.lesson ? `${r.tab}/${r.lesson}` : r.tab;
  if (!views.has(key)) {
    let el;
    if (r.tab === 'guide') el = buildGuide(() => { views = new Map(); location.hash = '#start/series'; show(); });
    else if (r.tab === 'cheat') el = buildCheat();
    else {
      const lesson = TABS.find((t) => t.id === r.tab).lessons.find((l) => l.id === r.lesson);
      if (lesson.special === 'missions') el = buildMissions(files, drawNav);
      else {
        const nb = new Notebook(lesson, files, drawNav);
        el = nb.el;
        // 주소에 ?demo 를 붙이면 정답을 채워 위에서부터 실행해 둔다(교사 시연·화면 캡처용)
        if (DEMO) queueMicrotask(() => nb.demo());
      }
    }
    views.set(key, el);
  }
  main.replaceChildren(views.get(key));
  window.scrollTo(0, 0);
}

// 도구 막대가 탭·알약 막대 바로 아래에 붙도록 높이를 알려 준다
const syncHeight = () => document.documentElement.style.setProperty('--nav-h', `${document.getElementById('nav').offsetHeight}px`);
new ResizeObserver(syncHeight).observe(document.getElementById('nav'));

window.addEventListener('hashchange', show);
show();
