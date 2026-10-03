// © 2026 티쳐무 · 모든 권리 보유
// 레슨 자료 점검 — 빈칸·정답·채점·「결과 읽는 법」의 숫자·확인 문제가 앞뒤가 맞는가
import { readFileSync, readdirSync } from 'fs';
import { Kernel } from '../src/engine/interp.js';
import { TABS, LESSONS, fillAnswers, runnable } from '../src/lessons/data.js';
import { MISSIONS, MISSION_SETUP } from '../src/lessons/missions.js';
import { grade, cellCode } from '../src/lessons/grade.js';

const ROOT = new URL('..', import.meta.url);
const FILES = Object.fromEntries(readdirSync(new URL('src/data/', ROOT)).filter((f) => f.endsWith('.csv')).map((f) => [f, readFileSync(new URL('src/data/' + f, ROOT), 'utf8')]));
const outText = (r) => r.items.map((it) => it.text ?? '').join('\n');

export default function run(t) {
  // ① 아이디가 겹치지 않는가
  const ids = new Set();
  for (const l of LESSONS) {
    t.check(`레슨 아이디 겹침 없음: ${l.id}`, !ids.has(l.id)); ids.add(l.id);
    for (const c of l.cells) if (c.id) { t.check(`셀 아이디 겹침 없음: ${c.id}`, !ids.has(c.id)); ids.add(c.id); }
  }
  t.check('단원 7개', TABS.length === 7);
  let cells = 0, blanks = 0, predicts = 0, quizzes = 0;
  for (const l of LESSONS) {
    if (l.special) continue;
    const k = new Kernel({ files: FILES });
    let context = ''; // 앞 셀들의 결과·코드 — 읽는 법이 앞의 결과를 가리킬 때도 있다
    for (const c of l.cells) {
      if (c.kind === 'tip') t.check(`${c.title} — tip 에 내용`, Boolean(c.text || c.table));
      if (!runnable(c)) continue;
      cells++;
      const where = `${l.id}/${c.id}`;
      // ② 빈칸 수와 【n】 표시가 맞는가
      if (c.kind === 'code') {
        const marks = [...c.code.matchAll(/【(\d+)】/g)].map((m) => Number(m[1]));
        t.check(`${where} — 빈칸 표시 ${marks.length}개 = blanks ${c.blanks.length}개`, marks.length === c.blanks.length && marks.every((n, i) => n === i));
        c.blanks.forEach((b, i) => t.check(`${where} 빈칸${i} — 정답·힌트`, b.answers?.length > 0 && Boolean(b.hint)));
        blanks += c.blanks.length;
      }
      const code = c.blanks?.length ? fillAnswers(c) : c.code;
      const r = k.run(code);
      // ③ 정답 코드가 오류 없이 도는가 (예측 문제는 일부러 오류를 보여 주는 것이 있다)
      if (c.kind !== 'predict') t.check(`${where} — 오류 없이 실행`, !r.error, r.error ? `${r.error.type}: ${r.error.message}` : '');
      // ④ 「결과 읽는 법」에 적은 수가 실제 결과(또는 코드)에 있는가
      if (c.read && !c.readFree && !r.error) {
        const nums = [...c.read.replace(/[−–]/g, '-').matchAll(/-?\d[\d]*(?:\.\d+)?/g)].map((m) => m[0]).filter((x) => x.replace('-', '').length >= 3);
        const hay = (outText(r) + '\n' + code + '\n' + (c.what ?? '') + '\n' + context).replace(/\s+/g, ' ');
        const outNums = [...hay.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
        // 반올림해 적은 수(4666.67)는 결과의 수(4666.666667)를 같은 자릿수로 반올림해 견준다
        const rounds = (x) => { const d = (x.split('.')[1] ?? '').length; return outNums.some((v) => Math.abs(v - Number(x)) < 0.5 * 10 ** -d + 1e-9); };
        const missing = nums.filter((x) => !hay.includes(x) && !hay.includes(x.replace(/\.0$/, '')) && !rounds(x) && !['2.2', '100'].includes(x));
        t.check(`${where} — 읽는 법의 수가 결과에 있음`, missing.length === 0, `결과에 없는 수: ${missing.join(', ')}\n--- 결과\n${outText(r)}`);
      }
      context += '\n' + outText(r) + '\n' + code;
      if (c.kind === 'predict') {
        predicts++;
        t.check(`${where} — 예측 문제 답 번호`, Number.isInteger(c.answer) && c.answer >= 0 && c.answer < c.choices.length && Boolean(c.why));
      }
    }
    for (const q of l.quiz ?? []) {
      quizzes++;
      t.check(`${l.id} 확인 문제 — ${q.q.slice(0, 20)}`, Number.isInteger(q.answer) && q.answer < q.choices.length && Boolean(q.why));
    }
  }
  // ⑤ 채점 — 정답은 통과, 엉뚱한 답은 통과하지 않는다
  let graded = 0;
  for (const l of LESSONS) {
    if (l.special) continue;
    for (const c of l.cells.filter((x) => x.kind === 'code')) {
      graded++;
      const right = c.blanks.map((b) => b.answers[0]);
      const k1 = new Kernel({ files: FILES });
      for (const x of l.cells) { if (!runnable(x)) continue; if (x === c) break; k1.run(x.blanks?.length ? fillAnswers(x) : x.code); }
      const r1 = k1.run(cellCode(c, right));
      t.check(`${l.id}/${c.id} — 정답이면 통과`, grade(l, c, right, r1, k1, FILES).status === 'pass');
      // 다른 정답 표기도 통과하는가
      c.blanks.forEach((b, i) => b.answers.slice(1).forEach((alt) => {
        const vals = right.map((v, j) => (j === i ? alt : v));
        const k2 = new Kernel({ files: FILES });
        for (const x of l.cells) { if (!runnable(x)) continue; if (x === c) break; k2.run(x.blanks?.length ? fillAnswers(x) : x.code); }
        const r2 = k2.run(cellCode(c, vals));
        t.check(`${l.id}/${c.id} — 다른 정답 「${alt}」 도 통과`, grade(l, c, vals, r2, k2, FILES).status === 'pass', r2.error ? r2.error.message : '');
      }));
      const wrong = right.map(() => 'zz9');
      const k3 = new Kernel({ files: FILES });
      for (const x of l.cells) { if (!runnable(x)) continue; if (x === c) break; k3.run(x.blanks?.length ? fillAnswers(x) : x.code); }
      const r3 = k3.run(cellCode(c, wrong));
      t.check(`${l.id}/${c.id} — 엉뚱한 답은 통과 못 함`, grade(l, c, wrong, r3, k3, FILES).status !== 'pass');
    }
  }
  // ⑥ 미션 — 정답 코드는 print 로 무언가를 찍는다
  for (const m of MISSIONS) {
    const k = new Kernel({ files: FILES });
    k.run(MISSION_SETUP);
    const r = k.run(m.answer);
    const out = r.items.filter((it) => it.kind === 'stdout').map((it) => it.text).join('');
    t.check(`미션 ${m.id} — 정답 코드가 print 로 답을 찍음`, !r.error && out.trim().length > 0, r.error?.message ?? '');
    t.check(`미션 ${m.id} — 힌트 3단계`, m.hints.length === 3);
  }
  t.info(`레슨 ${LESSONS.length}개 · 실행 셀 ${cells}개 · 빈칸 ${blanks}개 · 채점 셀 ${graded}개 · 예측 문제 ${predicts}개 · 확인 문제 ${quizzes}개 · 미션 ${MISSIONS.length}개`);
}
