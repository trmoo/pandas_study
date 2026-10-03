// © 2026 티쳐무 · 모든 권리 보유
// 빌드 결과 점검 — 한 파일인가, 크기가 알맞은가, 저작권 표시가 남았는가, 바깥 자원을 부르지 않는가
import { readFileSync, existsSync } from 'fs';
const p = new URL('../dist/index.html', import.meta.url);
const html = readFileSync(p, 'utf8');
const bad = [];
const size = Buffer.byteLength(html);
if (size < 200000) bad.push(`dist/index.html 이 너무 작습니다(${size}바이트) — 개발용 껍데기가 아닌지 확인`);
const marks = (html.match(/티쳐무/g) ?? []).length;
if (marks < 3) bad.push(`저작권 표시(티쳐무)가 ${marks}번뿐입니다 — 3번 이상(HTML 주석·배너·푸터)이어야 합니다`);
if (/<script[^>]+src=|<link[^>]+href="https?:/.test(html)) bad.push('바깥 자원(script src · link href)을 부릅니다');
if (!existsSync(new URL('../dist/cheatsheet.html', import.meta.url))) bad.push('dist/cheatsheet.html 이 없습니다');
if (bad.length) { console.error('❌ 빌드 점검 실패\n' + bad.join('\n')); process.exit(1); }
console.log(`✅ 빌드 점검 — dist/index.html ${(size / 1024).toFixed(0)}KB · 티쳐무 ${marks}번 · 바깥 자원 0개 · cheatsheet.html 있음`);
