// © 2026 티쳐무 · 모든 권리 보유
// 레슨 하나 = 노트북 하나. 셀을 그리고, 실행하고, 채점하고, 힌트를 준다.
// 레슨마다 커널(변수 보관함)이 따로 있다 — 코랩에서 노트북 파일을 따로 여는 것과 같다.
import { h, rich, modal, toast, loadStore, saveStore, CIRCLED, fill } from '../lib/ui.js';
import { Kernel } from '../engine/interp.js';
import { splitTemplate, runnable, graded } from '../lessons/data.js';
import { grade, cellCode, normalize } from '../lessons/grade.js';
import { highlight, renderResult } from './output.js';
import { buildPanel } from './panels.js';
import { buildQuiz } from './quiz.js';

const TIP_ICON = { key: '⭐', warn: '⚠️', exam: '📝', compare: '⚖️' };
const TIP_LABEL = { key: '꼭 기억', warn: '함정 주의', exam: '시험 포인트', compare: '비교' };

export class Notebook {
  constructor(lesson, files, onProgress) {
    this.lesson = lesson;
    this.files = files;
    this.onProgress = onProgress;
    this.kernel = new Kernel({ files });
    this.cells = new Map(); // id → 셀 화면 상태
    this.el = this.build();
  }

  // ── 진행률 ──
  progress() {
    const store = loadStore();
    const main = this.lesson.cells.filter(graded);
    return { done: main.filter((c) => store.passed[c.id]).length, total: main.length };
  }
  updateProgress() {
    const p = this.progress();
    this.progressBar.style.width = p.total ? `${(p.done / p.total) * 100}%` : '0';
    fill(this.progressText, p.total ? `빈칸 셀 ${p.done} / ${p.total} 통과` : '');
    this.onProgress?.();
  }

  build() {
    const L = this.lesson;
    this.progressBar = h('div', { class: 'bar-fill' });
    this.progressText = h('span', {});
    const hero = h('section', { class: 'hero' },
      h('h2', {}, L.title),
      h('ul', { class: 'goals' }, L.goal.map((g) => h('li', {}, g))),
      h('div', { class: 'progress' }, h('div', { class: 'bar' }, this.progressBar), this.progressText));

    const toolbar = h('div', { class: 'toolbar' },
      h('button', { class: 'btn primary', onClick: () => this.runAll(), title: '빈칸을 채운 셀을 위에서부터 차례대로 실행합니다' }, '▶ 위에서부터 모두 실행'),
      h('button', { class: 'btn', onClick: () => this.restart(), title: '변수·실행 결과와 이 레슨의 빈칸 답을 지우고 처음 상태로 돌아갑니다' }, '🔄 다시 시작'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn ghost', onClick: () => this.teacherFill() }, '👩‍🏫 정답 채우기'));

    const body = h('div', { class: 'cells' });
    for (const c of L.cells) {
      if (c.kind === 'section') body.appendChild(h('div', { class: 'section-title' }, h('h3', {}, c.title), c.text && h('p', {}, rich(c.text))));
      else if (c.kind === 'tip') body.appendChild(this.buildTip(c));
      else if (c.kind === 'panel') body.appendChild(buildPanel(c.panel, this.files));
      else if (c.kind === 'free') body.appendChild(this.buildFree(c));
      else if (c.kind === 'predict') body.appendChild(this.buildPredict(c));
      else body.appendChild(this.buildCell(c));
    }
    if (L.quiz?.length) body.appendChild(buildQuiz(L));

    const root = h('div', { class: 'notebook' }, hero, toolbar, body);
    queueMicrotask(() => this.updateProgress());
    return root;
  }

  buildTip(c) {
    return h('aside', { class: `tip ${c.tone}` },
      h('div', { class: 'tip-head' }, h('span', { class: 'tip-tag' }, `${TIP_ICON[c.tone] ?? '💡'} ${TIP_LABEL[c.tone] ?? ''}`), h('strong', {}, c.title)),
      c.text && h('p', {}, rich(c.text)),
      c.table && h('div', { class: 'tip-table-wrap' }, h('table', { class: 'tip-table' },
        h('thead', {}, h('tr', {}, c.table.head.map((x) => h('th', {}, x)))),
        h('tbody', {}, c.table.rows.map((r) => h('tr', {}, r.map((x, i) => (i === 0 ? h('th', {}, rich(x)) : h('td', {}, rich(x))))))))));
  }

  // ── 코드 셀 (빈칸 · 예제) ──
  buildCell(cell) {
    const store = loadStore();
    const saved = store.answers[cell.id] ?? [];
    const state = { cell, inputs: [], hintLevel: 0, status: 'idle' };
    this.cells.set(cell.id, state);

    const pre = h('pre', { class: 'code' });
    for (const part of splitTemplate(cell.code)) {
      if (part.text !== undefined) { pre.appendChild(highlight(part.text)); continue; }
      const b = cell.blanks[part.blank];
      const longest = Math.max(...b.answers.map((a) => a.length), 3);
      const input = h('input', {
        class: 'blank', type: 'text', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off',
        placeholder: CIRCLED[part.blank], 'aria-label': `빈칸 ${part.blank + 1}`,
        style: { width: `calc(${longest + 1}ch + 14px)` },
      });
      input.value = saved[part.blank] ?? '';
      input.addEventListener('input', () => {
        input.classList.remove('ok', 'bad');
        input.style.width = `calc(${Math.max(longest, input.value.length) + 1}ch + 14px)`;
        store.answers[cell.id] = state.inputs.map((x) => x.value);
        saveStore();
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.runCell(cell.id); } });
      state.inputs[part.blank] = input;
      pre.appendChild(input);
    }

    state.num = h('span', { class: 'cnum' }, '[ ]');
    state.badge = h('span', { class: 'badge' });
    state.feedback = h('div', { class: 'feedback' });
    state.hintBox = h('div', { class: 'hintbox' });
    state.output = h('div', { class: 'output' });
    state.readBox = h('div', { class: 'readbox', hidden: true }, h('strong', {}, '📖 결과 읽는 법  '), rich(cell.read ?? ''));

    const isExample = cell.kind === 'example';
    const buttons = h('div', { class: 'cellbtns' },
      h('button', { class: 'btn run', onClick: () => this.runCell(cell.id), title: '실행 (빈칸에서 Enter)' }, '▶ 실행'),
      cell.blanks?.length ? h('button', { class: 'btn', onClick: () => this.hint(cell.id) }, '💡 힌트') : null,
      cell.blanks?.length ? h('button', { class: 'btn ghost', onClick: () => this.clearCell(cell.id), title: '빈칸 지우기' }, '↺') : null,
      h('button', { class: 'btn ghost', onClick: () => this.copyCode(cell, state), title: '코드를 복사해 코랩에 붙여 넣기' }, '📋'));

    state.el = h('section', { class: `cell ${cell.kind}`, id: `cell-${cell.id}` },
      h('header', {}, state.num, h('h4', {}, cell.title), isExample && h('span', { class: 'kind' }, '예제'), state.badge),
      cell.what && h('p', { class: 'what' }, rich(cell.what)),
      h('div', { class: 'codebox' }, pre, buttons),
      state.hintBox, state.feedback, state.output, cell.read ? state.readBox : null);

    if (store.passed[cell.id] && graded(cell)) this.setBadge(state, 'before');
    return state.el;
  }

  async copyCode(cell, state) {
    const code = cell.blanks?.length ? cellCode(cell, state.inputs.map((x) => x.value || '___')) : cell.code;
    try { await navigator.clipboard.writeText(code); toast('코드를 복사했어요. 코랩 셀에 붙여 넣어 보세요.'); }
    catch { toast('복사하지 못했어요. 코드를 직접 선택해 복사하세요.'); }
  }

  setBadge(state, status) {
    const map = {
      pass: ['✅ 통과', 'pass'], before: ['✅ 지난번에 통과', 'before'], error: ['❌ 오류', 'error'],
      mismatch: ['⚠️ 결과가 달라요', 'mismatch'], empty: ['✏️ 빈칸', 'empty'], done: ['✔ 실행됨', 'done'], idle: ['', ''],
    };
    const [text, cls] = map[status];
    state.badge.textContent = text;
    state.badge.className = `badge ${cls}`;
    state.el.classList.toggle('is-pass', status === 'pass');
  }

  // 셀 하나 실행 → 채점 → 화면 갱신. 통과(또는 예제 실행 성공)하면 true.
  runCell(id, { quiet = false } = {}) {
    const state = this.cells.get(id);
    const { cell } = state;
    const values = state.inputs.map((x) => x.value);

    if (cell.blanks?.some((_, i) => !normalize(values[i]))) {
      state.inputs.forEach((x) => x.classList.toggle('bad', !normalize(x.value)));
      this.setBadge(state, 'empty');
      fill(state.feedback, h('div', { class: 'fb empty' }, `✏️ 채워야 실행할 수 있어요. 비어 있는 빈칸: ${cell.blanks.map((_, i) => (!normalize(values[i]) ? CIRCLED[i] : '')).filter(Boolean).join(' ')}`));
      if (!quiet) state.inputs.find((x) => !normalize(x.value))?.focus();
      return false;
    }

    const result = this.kernel.run(cellCode(cell, values));
    state.num.textContent = `[${result.count}]`;
    fill(state.output, renderResult(result));

    if (cell.kind === 'example') {
      this.setBadge(state, result.error ? 'error' : 'done');
      state.readBox.hidden = Boolean(result.error);
      return !result.error;
    }

    const g = grade(this.lesson, cell, values, result, this.kernel, this.files);
    state.inputs.forEach((x, i) => {
      x.classList.remove('ok', 'bad');
      if (g.status === 'pass') x.classList.add('ok');
      else if (g.matches && g.matches[i] === false) x.classList.add('bad');
    });
    this.setBadge(state, g.status);
    state.readBox.hidden = g.status !== 'pass';
    fill(state.feedback, this.feedbackFor(g, cell, state));
    if (g.status === 'mismatch' && g.matches.some((m) => !m)) state.ranWrong = true;

    if (g.status === 'pass') {
      const store = loadStore();
      if (!store.passed[cell.id]) { store.passed[cell.id] = 1; saveStore(); }
      fill(state.hintBox);
      this.updateProgress();
    }
    return g.status === 'pass';
  }

  feedbackFor(g, cell, state) {
    if (g.status === 'pass') {
      const other = g.matches.some((m) => !m);
      return h('div', { class: 'fb pass' }, '✅ 정답과 같은 결과입니다!',
        other ? h('span', { class: 'sub' }, ' (정답과 다르게 썼지만 결과가 똑같아서 맞게 처리했어요)') : '');
    }
    if (g.status === 'error') {
      const wrong = g.matches.map((m, i) => (m ? '' : CIRCLED[i])).join('');
      return h('div', { class: 'fb error' }, '❌ 오류가 났습니다. 아래 빨간 상자의 💡 도움말을 읽어 보세요.',
        wrong ? h('div', { class: 'sub' }, `먼저 확인할 빈칸: ${wrong} (빨간 칸)`) : h('div', { class: 'sub' }, '빈칸은 맞는 것 같아요. 위쪽 셀을 먼저 실행했는지 확인하세요. [▶ 위에서부터 모두 실행] 을 눌러도 됩니다.'));
    }
    const lines = [];
    const wrong = g.matches.map((m, i) => (m ? '' : CIRCLED[i])).join('');
    const strict = (g.strictMiss ?? []).map((m, i) => (m ? CIRCLED[i] : '')).join('');
    if (strict) lines.push(`결과가 같아 보여도 명령어를 정확히 써야 하는 빈칸: ${strict}`);
    else if (wrong) lines.push(`다시 확인할 빈칸: ${wrong} (빨간 칸)`);
    else if (state?.ranWrong) lines.push('빈칸은 이제 맞았어요. 그런데 앞서 틀린 답으로 실행한 결과가 표에 남아 있습니다. [▶ 위에서부터 모두 실행] 을 누르면 처음부터 다시 계산합니다.');
    else lines.push('빈칸은 맞았어요. 위쪽 셀을 차례대로 실행하지 않았거나, 자유 실험에서 표를 바꿨을 수 있습니다. [▶ 위에서부터 모두 실행] 을 누르세요.');
    if (g.badVars?.length) lines.push(`기준과 값이 다른 변수: ${g.badVars.join(', ')}`);
    const expected = h('details', { class: 'expected' }, h('summary', {}, '기대한 결과 보기'), renderResult(g.ref));
    return h('div', { class: 'fb mismatch' }, '⚠️ 실행은 되었지만 기대한 결과와 다릅니다.',
      ...lines.map((l) => h('div', { class: 'sub' }, l)), g.sameOutput ? null : expected);
  }

  hint(id) {
    const state = this.cells.get(id);
    const { cell } = state;
    const store = loadStore();
    state.hintLevel = Math.min(state.hintLevel + 1, 3);
    const values = state.inputs.map((x) => x.value);
    const isRight = (i) => cell.blanks[i].answers.some((a) => normalize(a) === normalize(values[i]));
    const targets = cell.blanks.map((_, i) => i).filter((i) => !isRight(i));
    const list = targets.length ? targets : cell.blanks.map((_, i) => i);
    const rows = list.map((i) => h('li', {},
      h('span', { class: 'hnum' }, CIRCLED[i]), ' ', cell.blanks[i].hint,
      state.hintLevel >= 2 ? h('code', { class: 'pattern' }, pattern(cell.blanks[i].answers[0])) : null));
    fill(state.hintBox, h('div', { class: 'hints' },
      h('div', { class: 'hint-level' }, `💡 힌트 ${state.hintLevel}단계`, state.hintLevel < 3 ? h('span', { class: 'sub' }, ' — 한 번 더 누르면 더 자세히') : ''),
      h('ul', {}, rows),
      state.hintLevel >= 3 && h('button', {
        class: 'btn', onClick: () => {
          list.forEach((i) => { state.inputs[i].value = cell.blanks[i].answers[0]; state.inputs[i].dispatchEvent(new Event('input')); });
          store.answers[cell.id] = state.inputs.map((x) => x.value); saveStore();
          toast('정답을 넣었어요. ▶ 실행을 눌러 결과를 확인하세요.');
        },
      }, '🔑 정답 넣기')));
  }

  clearCell(id) {
    const state = this.cells.get(id);
    state.inputs.forEach((x) => { x.value = ''; x.dispatchEvent(new Event('input')); });
    state.hintLevel = 0;
    fill(state.hintBox);
    fill(state.feedback);
  }

  // ── 실행 결과 예측 ──
  buildPredict(cell) {
    const store = loadStore();
    store.predict ??= {};
    const state = { cell };
    this.cells.set(cell.id, state);
    state.num = h('span', { class: 'cnum' }, '[ ]');
    state.output = h('div', { class: 'output' });
    const why = h('div', { class: 'quiz-why' });
    const runBtn = h('button', { class: 'btn run', disabled: true, onClick: () => run() }, '▶ 실행해서 확인');
    const btns = cell.choices.map((c, ci) => h('button', { class: 'choice', onClick: () => pick(ci) }, `${'ㄱㄴㄷㄹㅁ'[ci]}. ${c}`));
    const run = () => {
      const r = this.kernel.run(cell.code);
      state.num.textContent = `[${r.count}]`;
      fill(state.output, renderResult(r));
      return !r.error || true;
    };
    state.run = run;
    const paint = () => {
      const ci = store.predict[cell.id];
      btns.forEach((b, i) => {
        b.classList.remove('right', 'wrong', 'dim');
        if (ci === undefined) return;
        if (i === cell.answer && ci === cell.answer) b.classList.add('right');
        else if (i === ci) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      runBtn.disabled = ci === undefined;
      if (ci === undefined) { fill(why); return; }
      fill(why, ci === cell.answer
        ? h('div', { class: 'fb pass' }, '⭕ 맞았어요! ', h('span', { class: 'sub' }, cell.why))
        : h('div', { class: 'fb mismatch' }, `❌ 정답은 ${'ㄱㄴㄷㄹㅁ'[cell.answer]} 입니다. `, h('span', { class: 'sub' }, cell.why)));
    };
    const pick = (ci) => { store.predict[cell.id] = ci; saveStore(); paint(); };
    state.repaint = paint;
    paint();
    const pre = h('pre', { class: 'code' }, highlight(cell.code));
    state.el = h('section', { class: 'cell predict', id: `cell-${cell.id}` },
      h('header', {}, state.num, h('h4', {}, `🤔 ${cell.title}`), h('span', { class: 'kind' }, '결과 예측')),
      h('div', { class: 'codebox' }, pre, h('div', { class: 'cellbtns' }, runBtn)),
      h('p', { class: 'what' }, cell.question ?? '이 코드를 실행하면 어떤 결과가 나올까요?'),
      h('div', { class: 'choices' }, btns), why, state.output);
    return state.el;
  }

  // 위에서부터 모두 실행 — 빈칸이 비었으면 거기서 멈춘다. 오류가 나도 예측 셀은 지나간다.
  runAll() {
    this.kernel = new Kernel({ files: this.files });
    for (const c of this.lesson.cells) {
      if (!runnable(c)) continue;
      const state = this.cells.get(c.id);
      if (c.kind === 'predict') { if (loadStore().predict?.[c.id] !== undefined) state.run(); else this.kernel.run(c.code); continue; }
      const empty = c.blanks?.some((_, i) => !normalize(state.inputs[i].value));
      if (empty) {
        state.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.runCell(c.id, { quiet: true });
        toast('빈칸을 채워야 이어서 실행할 수 있어요.');
        return;
      }
      const ok = this.runCell(c.id, { quiet: true });
      if (!ok) {
        state.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast('이 셀에서 멈췄어요. 도움말을 확인하세요.');
        return;
      }
    }
    toast('끝까지 실행했어요.');
  }

  async restart() {
    const ok = await modal('처음 상태로 다시 시작할까요?', '만든 변수와 실행 결과, 그리고 이 레슨의 빈칸에 쓴 답을 지웁니다. 통과 기록(✅)은 남습니다.', { ok: '다시 시작', cancel: '취소' });
    if (!ok) return;
    this.kernel = new Kernel({ files: this.files });
    for (const state of this.cells.values()) {
      fill(state.output);
      if (state.feedback) fill(state.feedback);
      if (state.hintBox) fill(state.hintBox);
      state.num.textContent = '[ ]';
      if (state.readBox) state.readBox.hidden = true;
      state.ranWrong = false;
      state.inputs?.forEach((x) => { x.value = ''; x.classList.remove('ok', 'bad'); x.dispatchEvent(new Event('input')); });
      state.hintLevel = 0;
      if (state.badge) this.setBadge(state, loadStore().passed[state.cell.id] && graded(state.cell) ? 'before' : 'idle');
    }
    toast('처음 상태로 돌아갔어요. 맨 위 셀부터 실행하세요.');
  }

  // 교사 시연·화면 캡처 — 묻지 않고 정답을 채워 끝까지 실행한다
  demo() {
    for (const state of this.cells.values()) {
      if (state.inputs?.length) state.inputs.forEach((x, i) => { x.value = state.cell.blanks[i].answers[0]; });
    }
    const store = loadStore();
    for (const c of this.lesson.cells) if (c.kind === 'predict') store.predict[c.id] ??= c.answer;
    this.runAll();
    for (const c of this.lesson.cells) if (c.kind === 'predict') this.cells.get(c.id).repaint?.();
  }

  async teacherFill() {
    const ok = await modal('정답을 모두 채울까요?', '교사 시연용입니다. 이 레슨의 모든 빈칸에 정답을 넣습니다(학생이 쓴 답은 지워집니다). 채운 뒤 [▶ 위에서부터 모두 실행] 을 누르세요.', { ok: '정답 채우기', cancel: '취소' });
    if (!ok) return;
    const store = loadStore();
    for (const state of this.cells.values()) {
      if (!state.inputs?.length) continue;
      state.inputs.forEach((x, i) => { x.value = state.cell.blanks[i].answers[0]; x.classList.remove('ok', 'bad'); });
      store.answers[state.cell.id] = state.inputs.map((x) => x.value);
    }
    saveStore();
    toast('정답을 채웠어요.');
  }

  // ── 자유 실험 셀 ──
  buildFree(cell) {
    const store = loadStore();
    const key = this.lesson.id;
    const area = h('textarea', { class: 'free-code', spellcheck: 'false', rows: 3, placeholder: '여기에 파이썬 코드를 쳐 보세요 (Ctrl+Enter 로 실행)' });
    area.value = store.free[key] ?? '';
    const out = h('div', { class: 'output' });
    const num = h('span', { class: 'cnum' }, '[ ]');
    const fit = () => { area.style.height = 'auto'; area.style.height = `${Math.max(area.scrollHeight, 90)}px`; };
    const run = () => {
      if (!area.value.trim()) { toast('코드를 먼저 쳐 보세요.'); return; }
      const r = this.kernel.run(area.value);
      num.textContent = `[${r.count}]`;
      fill(out, renderResult(r));
    };
    area.addEventListener('input', () => { store.free[key] = area.value; saveStore(); fit(); });
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey || e.metaKey)) { e.preventDefault(); run(); }
      if (e.key === 'Tab') { e.preventDefault(); area.setRangeText('    ', area.selectionStart, area.selectionEnd, 'end'); }
    });
    queueMicrotask(fit);
    return h('section', { class: 'cell free' },
      h('header', {}, num, h('h4', {}, cell.title)),
      h('p', { class: 'what' }, rich(cell.text)),
      h('div', { class: 'codebox' }, area, h('div', { class: 'cellbtns' },
        h('button', { class: 'btn run', onClick: run }, '▶ 실행'),
        h('button', { class: 'btn ghost', onClick: () => { area.value = ''; store.free[key] = ''; saveStore(); fill(out); fit(); } }, '↺'))),
      h('p', { class: 'tiny' }, '※ 위 셀에서 만든 변수를 그대로 쓸 수 있어요. 여기서 표를 바꾸면 위 셀의 채점이 달라질 수 있으니, 그럴 땐 [▶ 위에서부터 모두 실행].'),
      out);
  }
}

// 힌트 2단계 — 첫 글자만 보여 주고 나머지는 밑줄 (h___, q3 + _._ * ___)
export function pattern(answer) {
  let seenFirst = false;
  return answer.replace(/[A-Za-z0-9_가-힣]/g, (ch) => {
    if (!seenFirst) { seenFirst = true; return ch; }
    return '_';
  }).split('').join(' ').replace(/ {3}/g, '  ');
}
