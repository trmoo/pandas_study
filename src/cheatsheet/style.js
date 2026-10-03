// © 2026 티쳐무 · 모든 권리 보유
// 치트시트 모양 — 앱의 치트시트 탭과 인쇄용 public/cheatsheet.html 이 함께 쓴다. A4 세로 두 쪽에 들어가도록 작게.
export const SHEET_CSS = `
.cs-grid{column-count:3;column-gap:12px}
.cs-sec{break-inside:avoid-column;margin:0 0 10px;border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;background:#fff}
.cs-sec h3{margin:0 0 4px;font-size:13px;color:#0f766e;border-bottom:1px solid #e2e8f0;padding-bottom:2px}
.cs-item{margin:3px 0;break-inside:avoid}
.cs-item pre{margin:0;font-family:'D2Coding','Consolas',monospace;font-size:10.5px;background:#f1f5f9;border-radius:4px;padding:2px 5px;white-space:pre-wrap;word-break:break-all;color:#0f172a}
.cs-item p{margin:1px 0 0 2px;font-size:10.5px;color:#334155;line-height:1.35}
.cs-item.star pre{background:#fef3c7}
.cs-item.warn pre{background:#fee2e2}
.cs-foot{font-size:10px;color:#64748b;margin-top:6px}
@media (max-width:900px){.cs-grid{column-count:2}}
@media (max-width:560px){.cs-grid{column-count:1}}
@media print{.cs-grid{column-count:3}.cs-sec{border-color:#94a3b8}}
`;
