// © 2026 티쳐무 · 모든 권리 보유
// 레슨 모음 — 단원(탭) 7개, 단원마다 레슨(노트북) 여러 개.
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것. node 로 불러다 시험한다(test/lessons.test.mjs).
//
// 레슨 하나 = 노트북 하나 = 커널(변수 보관함) 하나. 위에서부터 차례로 실행한다.
// 셀 종류
//   section : 소제목과 설명. text 안의 `코드` 는 코드 글꼴, **굵게** 는 굵게.
//   tip     : 꼭 기억할 점 상자. tone = key(★핵심) · warn(함정) · exam(시험) · compare(비교 표, table: {head, rows})
//   code    : 빈칸 【0】【1】… 을 채워 실행하는 셀 (채점함). blanks[n].answers 의 어느 것과 같아도 정답이고,
//             글자가 달라도 실행 결과·변수 값이 정답과 같으면 정답으로 인정한다(src/lessons/grade.js).
//             strict: true 인 빈칸은 글자까지 맞아야 한다(결과만으로는 틀렸는지 알 수 없는 자리).
//   example : 완성된 예제 — 실행만 한다(채점 안 함). 다음 셀이 이 결과를 쓸 수 있다.
//   predict : 「실행 결과 예측」 — 답을 고른 뒤 실행해서 확인한다. 코드는 커널에서 차례대로 돈다.
//   panel   : 눈으로 보기 도구 (src/ui/panels.js 의 이름)
//   free    : 자유 실험 칸
// read 에 적은 숫자는 test/lessons.test.mjs 가 실제 결과에 있는지 확인한다(readFree: true 면 건너뜀).
import { T1 } from './t1-start.js';
import { T2 } from './t2-look.js';
import { T3 } from './t3-select.js';
import { T4 } from './t4-clean.js';
import { T5 } from './t5-summary.js';
import { T6 } from './t6-combine.js';
import { PREDICT_LESSON } from './missions.js';

// Ⅶ. 종합 미션 — 미션 화면(special)과 결과 예측 노트북
const T7 = {
  id: 'mission', num: 'Ⅶ', icon: '🏁', title: '종합 미션', desc: '작업형1 꼴 미션 · 결과 예측',
  lessons: [
    { id: 'missions', title: '한빛시 공유자전거 — 작업형1 미션 10', short: '미션 10', special: 'missions', cells: [], quiz: [] },
    PREDICT_LESSON,
  ],
};

export const TABS = [T1, T2, T3, T4, T5, T6, T7];
export const LESSONS = TABS.flatMap((t) => t.lessons.map((l) => ({ ...l, tab: t.id })));

export function fillAnswers(cell, pick = (b) => b.answers[0]) {
  return cell.code.replace(/【(\d+)】/g, (_, n) => pick(cell.blanks[Number(n)], Number(n)));
}

export function splitTemplate(code) {
  const parts = [];
  let last = 0;
  for (const m of code.matchAll(/【(\d+)】/g)) {
    if (m.index > last) parts.push({ text: code.slice(last, m.index) });
    parts.push({ blank: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < code.length) parts.push({ text: code.slice(last) });
  return parts;
}

export const runnable = (c) => c.kind === 'code' || c.kind === 'example' || c.kind === 'predict';
export const graded = (c) => c.kind === 'code';
