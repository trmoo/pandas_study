// © 2026 티쳐무 · 모든 권리 보유
// 진짜 pandas 2.2 · IPython 으로 만든 기준(test/golden.json)과 엔진 출력을 칸마다 맞대 본다.
// 기준 다시 만들기: npm run scenarios → (pandas 2.2 파이썬) tools/golden.py
// ⚠ 레슨(lesson:·missions)은 한 칸도 빠짐없이 같아야 한다. 시험용 코드(probe:)는 엔진이 🚧(지원하지 않음)로
//   알리는 것까지는 봐준다 — 학생에게 「아직 안 되는 명령」이라고 정직하게 말하는 것이므로.
import { readFileSync, readdirSync } from 'fs';
import { Kernel } from '../src/engine/interp.js';

const ROOT = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const scenarios = JSON.parse(read('test/scenarios.json'));
const golden = JSON.parse(read('test/golden.json'));
const FILES = Object.fromEntries(readdirSync(new URL('src/data/', ROOT)).filter((f) => f.endsWith('.csv'))
  .map((f) => [f, read('src/data/' + f)]));

const ADDR = /\b0x[0-9a-fA-F]+/g;
const norm = (s) => (s ?? '').replace(ADDR, '0x…');
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
function sameExceptLastDigits(a, b) {
  const re = /-?\d+\.\d+(e-?\d+)?/g;
  const na = a.match(re), nb = b.match(re);
  if (!na || !nb || na.length !== nb.length) return false;
  if (a.replace(re, '#') !== b.replace(re, '#')) return false;
  return na.every((x, i) => near(Number(x), Number(nb[i]), 1e-14));
}
function warnList(items, code) {
  const lines = code.split('\n').map((l) => l.trim()).filter(Boolean);
  return items.filter((it) => it.kind === 'stderr').flatMap((it) =>
    it.text.split('\n').map((l) => /(\w+Warning): (.*)$/.exec(l.replace(/^<ipython-input-\d+>:\d+: /, ''))).filter(Boolean)
      .map((m) => {
        let msg = m[2];
        for (const ln of lines) if (msg.endsWith('  ' + ln)) { msg = msg.slice(0, -ln.length - 2); break; }
        return `${m[1]}: ${msg.replace(/\s+\S*\(.*$/, '').trim()}`;
      }));
}

export default function run(t) {
  let cells = 0, unsupported = 0, nearOnly = 0;
  const unsupportedList = [];
  for (const sc of scenarios) {
    const k = new Kernel({ files: { ...FILES } });
    const gold = golden[sc.id];
    if (!gold) { t.check(`${sc.id} — 기준 없음 (tools/golden.py 를 다시 돌리세요)`, false); continue; }
    const strict = !sc.id.startsWith('probe:');
    sc.cells.forEach((code, i) => {
      cells++;
      const r = k.run(code);
      const g = gold[i];
      const where = `${sc.id} #${i}`;
      if (!g) { t.check(where + ' — 기준 없음', false); return; }
      if (!strict && r.error?.type === 'NotSupported' && !g.error) { unsupported++; unsupportedList.push(`${where}: ${code.split('\n').pop()}`); return; }
      const bad = [];
      const stdout = r.items.filter((it) => it.kind === 'stdout').map((it) => it.text).join('');
      // 기준은 윈도우에서 만들어 to_csv( ) 글자의 줄바꿈이 \r\n 이다 — 코랩(리눅스)처럼 \n 으로 견준다
      const gout = g.stdout.replace(/\r\n/g, '\n');
      if (stdout !== gout) bad.push(`stdout\n--- 기대\n${gout}\n--- 엔진\n${stdout}`);
      const disp = r.items.find((it) => it.kind === 'display');
      const d = disp ? norm(disp.text) : null;
      const gd = g.display === null ? null : norm(g.display);
      if (d !== gd) {
        if (d && gd && sameExceptLastDigits(d, gd)) nearOnly++;
        else bad.push(`display\n--- 기대\n${gd}\n--- 엔진\n${d}`);
      }
      const err = r.error ? [r.error.type, r.error.message.split('\n')[0]] : null;
      if (JSON.stringify(err) !== JSON.stringify(g.error)) bad.push(`error: 기대 ${JSON.stringify(g.error)} / 엔진 ${JSON.stringify(err)}${r.error?.type === 'InternalError' ? '\n' + r.error.stack : ''}`);
      const w = warnList(r.items, code).map((x) => x.trim());
      const gw = g.warnings.map((x) => x.replace(/\s+\S*\(.*$/, '').trim());
      if (JSON.stringify(w) !== JSON.stringify(gw)) bad.push(`warnings: 기대 ${JSON.stringify(gw)} / 엔진 ${JSON.stringify(w)}`);
      t.check(where + '\n' + code, bad.length === 0, bad.join('\n'));
    });
  }
  t.info(`기준 대조 — 셀 ${cells}개 (🚧 지원하지 않음으로 넘긴 시험 코드 ${unsupported}개, 끝자리만 다른 것 ${nearOnly}개)`);
  if (process.env.SHOW_UNSUPPORTED) console.log(unsupportedList.join('\n'));
}
