// © 2026 티쳐무 · 모든 권리 보유
// 대조할 코드 모으기 → test/scenarios.json (tools/golden.py 가 이것을 진짜 pandas 로 돌린다)
//   ① 레슨마다: 정답을 채운 셀을 위에서부터 차례로 (학생이 [▶ 위에서부터 모두 실행] 한 것과 같다)
//   ② test/probes.mjs 의 시험용 코드
import { writeFileSync } from 'fs';
import { PROBES } from '../test/probes.mjs';

let lessonScenarios = [];
try {
  const { LESSONS, runnable, fillAnswers } = await import('../src/lessons/data.js');
  lessonScenarios = LESSONS.filter((l) => !l.special).map((l) => ({ id: `lesson:${l.id}`, cells: l.cells.filter(runnable).map((c) => (c.blanks?.length ? fillAnswers(c) : c.code)) }));
  const { MISSIONS, MISSION_SETUP } = await import('../src/lessons/missions.js');
  for (const m of MISSIONS) lessonScenarios.push({ id: `mission:${m.id}`, cells: [MISSION_SETUP, m.answer] });
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
}
const probeScenarios = Object.entries(PROBES).map(([id, cells]) => ({ id: `probe:${id}`, cells }));
const all = [...lessonScenarios, ...probeScenarios];
writeFileSync(new URL('../test/scenarios.json', import.meta.url), JSON.stringify(all, null, 1));
console.log(`시나리오 ${all.length}개 · 셀 ${all.reduce((n, s) => n + s.cells.length, 0)}개 → test/scenarios.json`);
