// © 2026 티쳐무 · 모든 권리 보유
// 시험 모음 돌리기 — node test/run.mjs [이름 거르기]
//   test/*.test.mjs 마다 export default function(t) 를 부른다. t.check(이름, 참거짓, 자세히) · t.info(글)
import { readdirSync } from 'node:fs';

const filter = process.argv[2];
const files = readdirSync(new URL('.', import.meta.url)).filter((f) => f.endsWith('.test.mjs')).sort();
let pass = 0, fail = 0;
const failures = [];
for (const name of files) {
  const mod = await import(new URL(name, import.meta.url));
  const t = {
    check(label, ok, detail = '') {
      if (filter && !label.includes(filter)) return;
      if (ok) pass++; else { fail++; failures.push(`✗ [${name}] ${label}\n${detail}`); }
    },
    info(msg) { console.log(`ℹ️  [${name}] ${msg}`); },
  };
  try { await mod.default(t); } catch (e) { fail++; failures.push(`✗ [${name}] 시험 파일이 도중에 멈춤\n${e.stack}`); }
}
const LIMIT = Number(process.env.LIMIT ?? 25);
for (const f of failures.slice(0, LIMIT)) console.log(f + '\n');
if (failures.length > LIMIT) console.log(`… 그 밖에 ${failures.length - LIMIT}개 더 틀림`);
console.log(`\n${fail ? '❌' : '✅'} ${pass + fail}가지 중 ${pass} 통과${fail ? `, ${fail} 틀림` : ''}`);
process.exit(fail ? 1 : 0);
