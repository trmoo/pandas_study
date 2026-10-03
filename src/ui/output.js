// © 2026 티쳐무 · 모든 권리 보유
// 실행 결과 그리기 — print 글자, 셀 결과(표는 코랩처럼 칸이 있는 표로), 경고, 그림, 오류
import { h } from '../lib/ui.js';
import { renderFigure } from './figure.js';
import { DataFrame, frameTable } from '../engine/pandas.js';

// 코드 색칠 — 주석·글자·수·예약어·함수 이름
export function highlight(text) {
  const frag = document.createDocumentFragment();
  const re = /(#[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\b(?:import|from|as|True|False|None|and|or|not|in|is|def|return|if|elif|else|for|lambda)\b)|([A-Za-z_]\w*)(?=\()/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const cls = m[1] ? 'c-com' : m[2] ? 'c-str' : m[3] ? 'c-num' : m[4] ? 'c-kw' : 'c-fn';
    frag.appendChild(h('span', { class: cls }, m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

export const ERROR_KO = {
  SyntaxError: '문법 오류 — 파이썬이 문장을 읽지 못했습니다',
  IndentationError: '들여쓰기 오류 — 줄 앞의 빈칸이 맞지 않습니다',
  NameError: '이름 오류 — 아직 없는 이름을 썼습니다',
  AttributeError: '속성 오류 — 그런 명령어(속성)가 없습니다',
  KeyError: '열쇠 오류 — 그런 열(또는 이름표)이 없습니다',
  TypeError: '자료형 오류 — 값의 종류가 맞지 않습니다',
  ValueError: '값 오류 — 값이 알맞지 않습니다',
  IndexError: '위치 오류 — 범위를 벗어났습니다',
  FileNotFoundError: '파일 오류 — 그런 파일이 없습니다',
  ModuleNotFoundError: '모듈 오류 — 그런 라이브러리가 없습니다',
  ImportError: '가져오기 오류',
  ZeroDivisionError: '0 으로 나누었습니다',
  IntCastingNaNError: '빈칸(NaN)이 있어 정수로 바꿀 수 없습니다',
  MergeError: '합치기 오류 — 짝지을 열을 알 수 없습니다',
  RecursionError: '함수가 자기 자신을 너무 많이 불렀습니다',
  RuntimeError: '실행 오류',
};

// 표 — 코랩처럼 칸이 있는 표. 이름표가 여러 단계면 단계마다 칸을 하나씩.
export function renderTable(t) {
  const nLv = t.levels.length;
  const named = t.indexNames.some((x) => x !== '');
  const headRow = [h('th', { colspan: nLv > 1 ? nLv : null, class: 'colname' }, t.columnsName ?? ''), ...t.cols.map((c) => h('th', {}, c.name))];
  const head = [h('tr', {}, headRow)];
  if (named) head.push(h('tr', { class: 'idx-name' }, ...t.indexNames.map((n) => h('th', {}, n)), ...t.cols.map(() => h('th', {}, ''))));
  const rows = [];
  for (let r = 0; r < t.index.length; r++) {
    if (t.cut >= 0 && r === t.cut) rows.push(h('tr', { class: 'dots' }, ...t.levels.map(() => h('th', {}, '...')), ...t.cols.map(() => h('td', {}, '...'))));
    rows.push(h('tr', {}, ...t.levels.map((lv) => h('th', {}, lv[r])), ...t.cols.map((c) => h('td', { class: c.numeric ? 'num' : '' }, c.cells[r]))));
  }
  return h('div', { class: 'df-wrap' },
    h('table', { class: 'dataframe' }, h('thead', {}, head), h('tbody', {}, rows)),
    t.cut >= 0 && h('p', { class: 'df-dims' }, `${t.nrows} rows × ${t.ncols} columns`));
}

export function renderError(err) {
  if (err.type === 'NotSupported') {
    return h('div', { class: 'out-error unsupported' },
      h('div', { class: 'err-title' }, '🚧 이 실습실에서는 아직 실행할 수 없는 명령'),
      h('pre', { class: 'err-src' }, `----> ${err.line} ${err.source}`),
      h('div', { class: 'hint' }, '💡 ', err.hint.includes(' — ') ? err.hint : `${err.message} — 진짜 판다스에는 있지만 이 실습실의 엔진이 아직 흉내 내지 못하는 명령입니다. 코랩에서 해 보세요.`));
  }
  if (err.type === 'InternalError') {
    return h('div', { class: 'out-error unsupported' },
      h('div', { class: 'err-title' }, '⚙️ 실습실 엔진이 이 코드를 처리하지 못했습니다'),
      h('pre', {}, err.message),
      h('div', { class: 'hint' }, '💡 코드가 맞을 수도 있습니다. 코랩에서 확인해 보세요.'));
  }
  return h('div', { class: 'out-error' },
    h('pre', { class: 'err-head' }, `${err.type.padEnd(42)}Traceback (most recent call last)`),
    h('pre', { class: 'err-src' }, `----> ${err.line} ${err.source}`),
    h('pre', { class: 'err-msg' }, `${err.type}: ${err.message}`),
    ERROR_KO[err.type] && h('div', { class: 'err-ko' }, '🔎 ', ERROR_KO[err.type]),
    err.hint && h('div', { class: 'hint' }, '💡 ', err.hint));
}

// 경고 — 코랩에서도 똑같이 뜨는 FutureWarning 등. 접어 두고 한 줄로 알린다.
function renderWarnings(texts) {
  const lines = texts.join('').split('\n').filter(Boolean);
  const names = [...new Set(lines.map((l) => /(\w+Warning)/.exec(l)?.[1]).filter(Boolean))];
  return h('details', { class: 'out-warn' },
    h('summary', {}, `⚠️ 경고 ${names.join(' · ')} — 오류가 아니라 알림입니다. 코랩에서도 똑같이 나옵니다 (펼쳐 보기)`),
    h('pre', {}, lines.map((l) => l.replace(/^<ipython-input-\d+>:\d+: /, '')).join('\n')));
}

export function renderResult(result) {
  const box = h('div', { class: 'outputs' });
  const warns = result.items.filter((it) => it.kind === 'stderr').map((it) => it.text);
  if (warns.length) box.appendChild(renderWarnings(warns));
  for (const it of result.items) {
    if (it.kind === 'stdout') box.appendChild(h('pre', { class: 'out' }, it.text));
    else if (it.kind === 'display') {
      if (it.value instanceof DataFrame && it.value.nrows > 0 && it.value.columns.length > 0) box.appendChild(renderTable(frameTable(it.value)));
      else box.appendChild(h('pre', { class: 'out result' }, it.text));
    } else if (it.kind === 'figure') box.appendChild(renderFigure(it.fig));
    else if (it.kind === 'figtext') box.appendChild(h('pre', { class: 'out result' }, it.text));
    else if (it.kind === 'note') box.appendChild(h('div', { class: 'note' }, 'ℹ️ ', it.text));
  }
  if (result.error) box.appendChild(renderError(result.error));
  if (!box.childNodes.length) box.appendChild(h('div', { class: 'note quiet' }, '✔ 실행했습니다. 화면에 보여 줄 결과는 없습니다 (값을 변수에 담았거나, 마지막 줄이 계산 결과가 아닙니다).'));
  return box;
}
