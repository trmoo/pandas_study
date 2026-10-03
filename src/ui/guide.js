// © 2026 티쳐무 · 모든 권리 보유
// 📖 안내 탭과 📝 치트시트 탭
import { h, rich, modal, clearStore, toast } from '../lib/ui.js';
import { TABS, LESSONS } from '../lessons/data.js';
import { SHEET_TITLE, sheetHTML } from '../cheatsheet/sheet.js';
import { SHEET_CSS } from '../cheatsheet/style.js';

export function buildCheat() {
  const style = h('style', {}, SHEET_CSS);
  const sheet = h('div', { class: 'cs-grid', html: sheetHTML() }); // 우리 자료(정적)만 들어간다
  return h('div', { class: 'cheat' }, style,
    h('section', { class: 'hero no-print' },
      h('h2', {}, `📝 ${SHEET_TITLE}`),
      h('ul', { class: 'goals' },
        h('li', {}, '빅데이터분석기사 실기 작업형1(데이터 처리)과 작업형2 전처리에 쓰는 판다스 명령을 한눈에 모았습니다.'),
        h('li', {}, '★ 는 꼭 외울 것, ⚠ 는 자주 틀리는 함정입니다. 예시의 df·o·raw 는 이 실습실의 데이터입니다.'),
        h('li', {}, '모든 코드는 진짜 pandas 2.2 로 실행해 오류·경고가 없는 것을 확인했습니다. 시험장에는 가지고 들어갈 수 없으니 외워 두세요.')),
      h('div', { class: 'toolbar flat' },
        h('button', { class: 'btn primary', onClick: () => { document.body.classList.add('print-cheat'); window.print(); setTimeout(() => document.body.classList.remove('print-cheat'), 500); } }, '🖨 인쇄 · PDF로 저장'),
        h('a', { class: 'btn', href: 'cheatsheet.html', target: '_blank', rel: 'noopener' }, '📄 인쇄용 한 장짜리 열기'))),
    h('div', { class: 'cheat-sheet' }, sheet,
      h('p', { class: 'cs-foot' }, '© 2026 티쳐무 · 모든 권리 보유. 학교 수업과 개인 공부 목적으로 자유롭게 인쇄해 쓰세요. 시험 형식·배점은 회차마다 바뀔 수 있으니 한국데이터산업진흥원 데이터자격검정(dataq.or.kr) 공고를 확인하세요.')));
}

const DATA_FILES = [
  ['menu.csv', '별빛 분식 메뉴판 — 12줄', '메뉴 · 분류(분식·식사·음료·디저트) · 가격 · 칼로리 · 매운맛(0~3) · 판매량(지난주)', 'Ⅱ~Ⅵ'],
  ['menu_raw.csv', '정리 안 된 메뉴판 — 14줄', '빈칸 6칸 · 똑같은 줄 1개 · 글자로 적힌 맵기(안매움·보통·매움) · 원산지', 'Ⅳ'],
  ['orders.csv', '별빛 분식 일주일 주문 기록 — 76건', '주문번호 · 날짜(2025-03-03 월 ~ 03-09 일) · 시각 · 메뉴 · 수량 · 결제(카드·현금·간편결제)', 'Ⅴ · Ⅵ'],
  ['weather.csv', '바람섬 2024년 날씨 — 366일', '날짜 · 평균·최고·최저기온 · 강수량 · 평균풍속(빈칸 5일)', 'Ⅴ'],
  ['bike.csv', '한빛시 공유자전거 대여 기록 — 303건', '대여일시 · 대여소 · 구 · 회원 · 나이대 · 이용시간 · 이동거리 · 기온 (빈칸·중복·튀는 값 포함)', 'Ⅶ'],
];

export function buildGuide(onClear) {
  const warns = LESSONS.flatMap((l) => l.cells.filter((c) => c.kind === 'tip' && (c.tone === 'warn')).map((c) => ({ l, c })));
  const tabOf = (l) => TABS.find((t) => t.id === l.tab);
  return h('div', { class: 'notebook guide' },
    h('section', { class: 'hero' },
      h('h2', {}, '📖 판다스 실습실 안내'),
      h('p', {}, '파이썬을 설치하지 않고, 인터넷이 없어도, 브라우저에서 판다스(pandas) 명령을 직접 실행하며 배우는 실습실입니다. 빈칸을 채워 실행하면 결과를 진짜 판다스(코랩과 같은 2.2 판)와 똑같이 보여 주고, 정답인지 바로 알려 줍니다.')),
    h('section', { class: 'cell' },
      h('h3', {}, '쓰는 법'),
      h('ol', { class: 'guide-list' },
        h('li', {}, rich('위쪽 단원(Ⅰ~Ⅶ)을 고르고, 그 아래 알약 단추로 레슨을 고릅니다. 레슨은 **위에서부터 차례로** 실행합니다.')),
        h('li', {}, rich('**빈칸 셀**: 빈칸을 채우고 ▶ 실행(또는 빈칸에서 Enter). 틀리면 빨간 칸과 도움말이 나오고, 💡 힌트는 세 번까지 점점 자세해집니다.')),
        h('li', {}, rich('**예제 셀**은 실행만, **🤔 결과 예측**은 답을 고른 뒤 실행해서 확인합니다. 맨 아래 **🧪 자유 실험**에서는 무엇이든 쳐 볼 수 있습니다.')),
        h('li', {}, rich('정답과 다르게 써도 **결과가 똑같으면 정답**으로 인정합니다. 📋 단추로 코드를 복사해 코랩에서도 돌려 보세요.')))),
    h('section', { class: 'cell' },
      h('h3', {}, '단원 지도'),
      h('div', { class: 'map' }, TABS.map((t) => h('div', { class: 'map-tab' },
        h('div', { class: 'map-title' }, `${t.num}. ${t.icon} ${t.title}`),
        h('ul', {}, t.lessons.map((l) => h('li', {}, h('a', { href: `#${t.id}/${l.id}` }, l.short)))))))),
    h('section', { class: 'cell' },
      h('h3', {}, '데이터 파일 — 모두 지어낸 자료'),
      h('div', { class: 'tip-table-wrap' }, h('table', { class: 'tip-table' },
        h('thead', {}, h('tr', {}, ['파일', '무엇', '열', '쓰는 단원'].map((x) => h('th', {}, x)))),
        h('tbody', {}, DATA_FILES.map((r) => h('tr', {}, h('th', {}, h('code', {}, r[0])), h('td', {}, r[1]), h('td', {}, r[2]), h('td', {}, r[3])))))),
      h('p', { class: 'tiny' }, '가게·섬·도시 이름과 모든 수치는 이 실습실을 위해 새로 만든 것입니다(tools/make_data.py). 자유 실험에서 pd.read_csv(\'파일이름\') 으로 언제든 불러올 수 있습니다.')),
    h('section', { class: 'cell' },
      h('h3', {}, `⚠️ 함정 모음 — ${warns.length}가지`),
      h('ul', { class: 'trap-list' }, warns.map(({ l, c }) => h('li', {},
        h('a', { href: `#${tabOf(l).id}/${l.id}` }, `${tabOf(l).num} ${l.short}`), ' ', h('strong', {}, c.title.replace(/^★\s*/, '')), ' — ', rich(c.text ?? ''))))),
    h('section', { class: 'cell' },
      h('h3', {}, '이 실습실의 파이썬'),
      h('p', {}, rich('파이썬과 판다스를 브라우저 안에서 흉내 내는 **자체 엔진**으로 돌아갑니다. 그래서 설치도, 인터넷도, 기다림도 없습니다. 대신 판다스의 모든 명령을 할 수는 없어서, 아직 안 되는 명령은 🚧 로 정직하게 알려 줍니다.')),
      h('p', {}, rich('레슨과 미션의 모든 코드는 **진짜 pandas 2.2 로 실행한 결과와 글자 하나까지 같은지** 시험(npm test)으로 확인했습니다. 학생이 쳐 볼 만한 다른 코드 수백 개도 함께 대조합니다.')),
      h('ul', { class: 'guide-list' },
        h('li', {}, rich('**같은 값끼리의 정렬 차례** — 진짜 판다스는 컴퓨터(CPU)에 따라 동점끼리의 차례가 달라질 수 있습니다. 이 실습실은 늘 원래 차례를 지킵니다.')),
        h('li', {}, rich('**sample( )** 같은 무작위 명령, **query( )**, 두 줄 머리글이 생기는 계산(agg 를 표 전체에 여러 개) 등은 🚧 입니다. 코랩에서 해 보세요.')),
        h('li', {}, rich('경고(FutureWarning)는 코랩처럼 만들되 접어서 보여 줍니다. 오류가 아니라 「다음 판에서 바뀐다」는 알림입니다.')))),
    h('section', { class: 'cell' },
      h('h3', {}, '기록과 개인정보'),
      h('p', {}, '이름·학번을 받지 않습니다. 빈칸에 쓴 답·통과 기록·문제 답만 이 브라우저(localStorage)에 남습니다. 공용 컴퓨터라면 수업이 끝난 뒤 지우세요.'),
      h('button', { class: 'btn danger', onClick: async () => {
        const ok = await modal('내 기록을 모두 지울까요?', '빈칸 답, 통과 기록, 문제 답, 자유 실험 코드가 모두 지워집니다.', { ok: '모두 지우기', cancel: '취소' });
        if (!ok) return;
        clearStore(); toast('기록을 모두 지웠어요.'); onClear?.();
      } }, '🧹 내 기록 지우기')),
    h('section', { class: 'cell' },
      h('h3', {}, '저작권'),
      h('p', {}, '© 2026 티쳐무 · 모든 권리 보유. 학교 수업 목적으로만 이용해 주세요. 수업에서 학생에게 주소를 알려 주거나 파일(index.html)을 나눠 주는 것은 자유롭게 하셔도 됩니다. 재배포·2차 저작물·수업 외 목적은 먼저 문의해 주세요.'),
      h('p', { class: 'tiny' }, '설명·예제·데이터·문제·해설은 모두 이 실습실을 위해 새로 썼습니다. 판다스(pandas)·넘파이(NumPy)는 각 프로젝트의 이름이며 이 실습실은 그 프로젝트와 관계가 없습니다. 빅데이터분석기사는 한국데이터산업진흥원이 시행하는 국가기술자격입니다.')));
}
