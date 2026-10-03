// © 2026 티쳐무 · 모든 권리 보유
// Ⅶ. 종합 미션 화면 — 작업형1 꼴 문제 10개. 문제마다 새로 불러온 표에서 학생 코드를 돌려 print 출력으로 채점한다.
import { h, rich, toast, loadStore, saveStore, fill } from '../lib/ui.js';
import { Kernel } from '../engine/interp.js';
import { MISSIONS, MISSION_SETUP } from '../lessons/missions.js';
import { highlight, renderResult } from './output.js';

const STARS = ['', '★', '★★', '★★★'];
const stdoutOf = (r) => r.items.filter((it) => it.kind === 'stdout').map((it) => it.text).join('');

export function buildMissions(files, onProgress) {
  const store = loadStore();
  // 정답 출력은 미리 계산해 둔다(학생에게는 보이지 않는다)
  const expected = new Map(MISSIONS.map((m) => { const k = new Kernel({ files }); k.run(MISSION_SETUP); return [m.id, stdoutOf(k.run(m.answer)).trim()]; }));
  const score = h('div', { class: 'mission-score' });
  const updateScore = () => {
    const n = MISSIONS.filter((m) => store.missions[m.id]).length;
    fill(score, h('strong', {}, `${n} / ${MISSIONS.length}`), ' 문제 해결', n === MISSIONS.length ? ' 🎉 모두 풀었어요!' : '');
    onProgress?.();
  };

  // 데이터 미리 보기
  const pk = new Kernel({ files });
  pk.run(MISSION_SETUP);
  const preview = renderResult(pk.run('b.head()'));
  const info = renderResult(pk.run('b.info()'));

  const COLS = [['대여번호', '대여 한 건의 번호'], ['대여일시', '빌린 날짜와 시각 (글자) — 2025년 5월 1일 ~ 14일'], ['대여소 · 구', '빌린 곳과 그곳이 속한 구(물빛구·중앙구·배움구)'],
    ['회원', '정기권 / 일일권'], ['나이대', '10대 ~ 60대 (빈칸 있음)'], ['이용시간', '분 — 반납을 잊은 아주 긴 기록이 섞여 있음'], ['이동거리', 'km (빈칸 있음)'], ['기온', '빌린 때의 기온(℃)']];

  const cards = MISSIONS.map((m, idx) => missionCard(m, idx, files, expected.get(m.id), store, updateScore));
  queueMicrotask(updateScore);
  return h('div', { class: 'notebook missions' },
    h('section', { class: 'hero' },
      h('h2', {}, '🏁 한빛시 공유자전거 — 작업형1 미션 10'),
      h('ul', { class: 'goals' },
        h('li', {}, '빅데이터분석기사 작업형1 처럼, 데이터를 처리해 답 하나를 print( ) 로 출력하는 문제입니다.'),
        h('li', {}, '문제마다 표를 새로 불러온 상태에서 시작합니다 — 아래 준비 코드가 이미 실행되어 있어요.'),
        h('li', {}, '출력한 글자가 정답과 같으면 통과입니다. 소수 자리 등 문제의 지시를 지키세요.')),
      score),
    h('section', { class: 'cell example' },
      h('header', {}, h('h4', {}, '준비 코드 (문제마다 자동으로 실행됨)')),
      h('div', { class: 'codebox' }, h('pre', { class: 'code' }, highlight(MISSION_SETUP))),
      h('details', { class: 'mission-data', open: true }, h('summary', {}, 'bike.csv 미리 보기'),
        h('p', { class: 'what' }, '지어낸 도시 「한빛시」 의 공유자전거 대여 기록 303건입니다(지어낸 자료).'),
        h('table', { class: 'tip-table' }, h('tbody', {}, COLS.map(([a, b]) => h('tr', {}, h('th', {}, a), h('td', {}, b))))),
        preview, info)),
    ...cards);
}

function missionCard(m, idx, files, want, store, updateScore) {
  const area = h('textarea', { class: 'free-code', spellcheck: 'false', rows: 4, placeholder: '# 여기에 코드를 쓰고, 답은 print( ) 로 출력하세요\n' });
  store.missionCode ??= {};
  area.value = store.missionCode[m.id] ?? '';
  const out = h('div', { class: 'output' });
  const fb = h('div', { class: 'feedback' });
  const hintBox = h('div', { class: 'hintbox' });
  const badge = h('span', { class: `badge ${store.missions[m.id] ? 'before' : ''}` }, store.missions[m.id] ? '✅ 해결' : '');
  let hintLevel = 0;
  const fit = () => { area.style.height = 'auto'; area.style.height = `${Math.max(area.scrollHeight, 110)}px`; };
  const run = () => {
    if (!area.value.trim()) { toast('코드를 먼저 써 보세요.'); return; }
    const k = new Kernel({ files });
    k.run(MISSION_SETUP);
    const r = k.run(area.value);
    fill(out, renderResult(r));
    const got = stdoutOf(r).trim();
    const disp = r.items.find((it) => it.kind === 'display');
    if (r.error) { fill(fb, h('div', { class: 'fb error' }, '❌ 오류가 났습니다. 아래 💡 도움말을 읽어 보세요.')); badge.textContent = '❌'; badge.className = 'badge error'; return; }
    if (got === want) {
      fill(fb, h('div', { class: 'fb pass' }, `✅ 정답입니다! 출력: ${want}`));
      badge.textContent = '✅ 해결'; badge.className = 'badge pass';
      if (!store.missions[m.id]) { store.missions[m.id] = 1; saveStore(); updateScore(); }
      return;
    }
    // print 없이 마지막 줄로 값만 보인 경우
    const shown = disp ? disp.text.replace(/^np\.(?:float|int)\d+\((.*)\)$/, '$1').replace(/^'(.*)'$/, '$1') : null;
    if (!got && shown === want) {
      fill(fb, h('div', { class: 'fb mismatch' }, '⚠️ 값은 맞았어요! 하지만 시험에서는 print( ) 로 출력해야 채점됩니다. print( ) 로 감싸 다시 실행하세요.'));
      return;
    }
    fill(fb, h('div', { class: 'fb mismatch' }, got ? '⚠️ 출력한 값이 정답과 다릅니다. 문제의 조건(소수 자리·빈칸 처리·중복 포함 여부)을 다시 읽어 보세요.' : '⚠️ 아무것도 출력하지 않았습니다. 답을 print( ) 로 출력하세요.'));
  };
  const hint = () => {
    hintLevel = Math.min(hintLevel + 1, 3);
    fill(hintBox, h('div', { class: 'hints' },
      h('div', { class: 'hint-level' }, `💡 힌트 ${hintLevel}단계`, hintLevel < 3 ? h('span', { class: 'sub' }, ' — 한 번 더 누르면 더 자세히') : ''),
      h('ul', {}, m.hints.slice(0, hintLevel).map((t, i) => (i === 2 ? h('li', {}, '정답 코드:', h('pre', { class: 'code small' }, highlight(t))) : h('li', {}, rich(t))))),
      hintLevel >= 3 && h('button', { class: 'btn', onClick: () => { area.value = m.hints[2]; area.dispatchEvent(new Event('input')); toast('정답 코드를 넣었어요. ▶ 실행으로 확인하세요.'); } }, '🔑 정답 코드 넣기')));
  };
  area.addEventListener('input', () => { store.missionCode[m.id] = area.value; saveStore(); fit(); });
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey || e.metaKey)) { e.preventDefault(); run(); }
    if (e.key === 'Tab') { e.preventDefault(); area.setRangeText('    ', area.selectionStart, area.selectionEnd, 'end'); }
  });
  queueMicrotask(fit);
  return h('section', { class: 'cell mission', id: `cell-${m.id}` },
    h('header', {}, h('span', { class: 'cnum' }, `${idx + 1}`), h('h4', {}, m.title), h('span', { class: 'kind' }, STARS[m.level]), badge),
    h('p', { class: 'mission-text' }, m.text),
    h('div', { class: 'codebox' }, area, h('div', { class: 'cellbtns' },
      h('button', { class: 'btn run', onClick: run, title: 'Ctrl+Enter' }, '▶ 실행·채점'),
      h('button', { class: 'btn', onClick: hint }, '💡 힌트'),
      h('button', { class: 'btn ghost', onClick: () => { area.value = ''; area.dispatchEvent(new Event('input')); fill(out); fill(fb); }, title: '지우기' }, '↺'))),
    hintBox, fb, out);
}
