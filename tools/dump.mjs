// © 2026 티쳐무 · 모든 권리 보유
// 레슨을 정답으로 실행해 셀마다 결과를 찍는다 — 「결과 읽는 법」 문구를 쓸 때 숫자를 확인하는 도구.
//   node tools/dump.mjs <레슨 id 일부>
import { readFileSync, readdirSync } from 'fs';
import { Kernel } from '../src/engine/interp.js';

const ROOT = new URL('..', import.meta.url);
const FILES = Object.fromEntries(readdirSync(new URL('src/data/', ROOT)).filter((f) => f.endsWith('.csv')).map((f) => [f, readFileSync(new URL('src/data/' + f, ROOT), 'utf8')]));
const want = process.argv[2] ?? '';
const mods = ['t1-start', 't2-look', 't3-select', 't4-clean', 't5-summary', 't6-combine'];
for (const m of mods) {
  let T;
  try { T = Object.values(await import(`../src/lessons/${m}.js`))[0]; } catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND') continue; throw e; }
  for (const l of T.lessons) {
    if (!l.id.includes(want)) continue;
    const k = new Kernel({ files: FILES });
    console.log(`\n████ ${l.id} — ${l.title}`);
    for (const c of l.cells) {
      if (!['code', 'example', 'predict'].includes(c.kind)) continue;
      const code = c.blanks?.length ? c.code.replace(/【(\d+)】/g, (_, n) => c.blanks[n].answers[0]) : c.code;
      const r = k.run(code);
      console.log(`── [${c.kind}] ${c.id}: ${code.split('\n').slice(-1)[0]}`);
      for (const it of r.items) if (it.kind !== 'figure') console.log((it.kind === 'stderr' ? '⚠ ' : '') + it.text.replace(/\n$/, ''));
      if (r.error) console.log(`!! ${r.error.type}: ${r.error.message}`);
    }
  }
}
