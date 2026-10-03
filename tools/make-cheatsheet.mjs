// © 2026 티쳐무 · 모든 권리 보유
// 치트시트 만들기
//   ① test/cheatsheet.json — 실행해 볼 코드 조각 목록 (tools/verify_cheatsheet.py 가 진짜 pandas 로 점검)
//   ② public/cheatsheet.html — 인쇄·배포용 한 장짜리 HTML (빌드하면 dist/cheatsheet.html 로 복사된다)
//   ③ (선택) --pdf : 이 PC 의 Edge·Chrome 헤드리스로 docs/판다스_치트시트.pdf
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { SHEET, SHEET_TITLE, sheetHTML } from '../src/cheatsheet/sheet.js';
import { SHEET_CSS } from '../src/cheatsheet/style.js';

const root = new URL('..', import.meta.url);
const items = SHEET.flatMap((s) => s.items.filter((it) => it.run !== false).map((it) => ({ sec: s.t, c: it.c })));
writeFileSync(new URL('test/cheatsheet.json', root), JSON.stringify(items, null, 1));

const html = `<!doctype html>
<!-- ${SHEET_TITLE} · © 2026 티쳐무 · 모든 권리 보유 · 학교 수업과 개인 공부 목적으로만 이용해 주세요 -->
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>판다스 치트시트</title>
<style>${SHEET_CSS}
body{margin:0;background:#fff;color:#0f172a;font-family:'Pretendard','Malgun Gothic','맑은 고딕',system-ui,sans-serif}
.page{max-width:1100px;margin:0 auto;padding:18px}
.cs-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-bottom:3px solid #0f766e;padding-bottom:6px;margin-bottom:10px}
.cs-top h1{font-size:20px;margin:0}.cs-top p{margin:0;font-size:11px;color:#475569}
@media print{.page{padding:0}@page{size:A4 portrait;margin:9mm}}
</style></head><body><div class="page">
<div class="cs-top"><div><h1>🐼 ${SHEET_TITLE}</h1><p>예시 표 — df: 별빛 분식 메뉴판(메뉴·분류·가격·칼로리·매운맛·판매량) · o: 주문 기록(날짜·시각·메뉴·수량·결제) · raw: 정리 안 된 메뉴판. ★ 꼭 외우기 · ⚠ 함정</p></div>
<p>판다스 실습실 · © 2026 티쳐무<br>코드는 pandas 2.2 로 모두 실행해 확인함</p></div>
<div class="cs-grid">${sheetHTML()}</div>
<p class="cs-foot">© 2026 티쳐무 · 모든 권리 보유. 학교 수업과 개인 공부 목적으로 자유롭게 인쇄해 쓰세요. 재배포·수정·상업적 이용은 먼저 문의해 주세요. 시험장에는 가지고 들어갈 수 없으니 외워 두세요.</p>
</div></body></html>`;
mkdirSync(new URL('public/', root), { recursive: true });
writeFileSync(new URL('public/cheatsheet.html', root), html);
console.log(`치트시트 — 조각 ${items.length}개 → test/cheatsheet.json, public/cheatsheet.html`);

if (process.argv.includes('--pdf')) {
  // 크롬을 먼저 — 엣지는 이미 열려 있으면 헤드리스 인쇄를 조용히 건너뛸 때가 있다. 프로필은 임시 폴더에 따로.
  const browsers = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'];
  const exe = browsers.find((b) => existsSync(b));
  if (!exe) { console.log('PDF: Edge·Chrome 을 찾지 못해 건너뜀'); process.exit(0); }
  mkdirSync(new URL('docs/', root), { recursive: true });
  const src = new URL('public/cheatsheet.html', root).href;
  const out = decodeURIComponent(new URL('docs/판다스_치트시트.pdf', root).pathname).replace(/^\/([A-Za-z]:)/, '$1');
  const prof = join(tmpdir(), 'pandas-lab-pdf');
  execFileSync(exe, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${prof}`, `--print-to-pdf=${out}`, src], { stdio: 'ignore' });
  console.log('PDF →', out);
}
