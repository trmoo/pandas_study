// © 2026 티쳐무 · 모든 권리 보유
// 소스 전수 문법 검사 — 시험(npm test)은 화면 파일(src/ui)을 부르지 않으므로 빌드 전에 문법만 따로 본다.
// 그리고 소스마다 저작권 머리 주석이 있는지, 기본 대화상자(alert·confirm·prompt)를 쓰지 않는지 본다.
import { readdirSync, readFileSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|mjs)$/.test(f)) files.push(p); } };
walk(join(root, 'src')); walk(join(root, 'tools')); walk(join(root, 'test'));
const bad = [];
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { bad.push(`${f}: 문법 오류\n${e.stderr}`); }
  const s = readFileSync(f, 'utf8');
  if (!/티쳐무/.test(s.slice(0, 400))) bad.push(`${f}: 머리 주석에 저작권 표시가 없습니다`);
  if (/\b(alert|confirm|prompt)\(/.test(s.replace(/\/\/.*$/gm, ''))) bad.push(`${f}: 브라우저 기본 대화상자를 씁니다 — lib/ui.js 의 modal( ) 을 쓰세요`);
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`✅ 소스 ${files.length}개 — 문법·저작권 머리 주석·기본 대화상자 점검 통과`);
