// © 2026 티쳐무 · 모든 권리 보유
// Ⅵ. 합치기 — concat · merge
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.

export const T6 = {
  id: 'combine', num: 'Ⅵ', icon: '🧩', title: '합치기', desc: 'concat · merge',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'concat', title: '이어 붙이기 — concat', short: 'concat',
      goal: ['같은 모양의 표를 위아래로 잇는다', 'ignore_index 로 이름표를 다시 매긴다', '좌우로 붙이기와 join 을 이해한다'],
      cells: [
        { kind: 'section', title: '나뉘어 있는 표 잇기', text: '월별 파일, 반별 명단처럼 같은 열을 가진 표가 여러 개로 나뉘어 있을 때 pd.concat( ) 으로 이어 붙입니다. 합칠 표들을 리스트로 넣습니다.' },
        {
          id: 'concat-data', kind: 'example', title: '두 가게의 메뉴',
          code: "import pandas as pd\nsnack = pd.DataFrame({'메뉴': ['떡볶이', '김밥', '순대'], '가격': [4500, 3500, 4000]})\ndrink = pd.DataFrame({'메뉴': ['쿨피스', '식혜'], '가격': [1500, 2000]})\nprint(snack)\nprint(drink)",
        },
        {
          id: 'concat-basic', kind: 'code', title: '위아래로 잇기',
          what: '두 표를 리스트로 묶어 넣습니다.',
          code: 'pd.【0】([snack, drink])',
          blanks: [{ answers: ['concat'], hint: '「잇다(concatenate)」의 줄임 — 여섯 글자.' }],
          read: '5줄이 되었지만 이름표가 0 1 2 0 1 로 겹쳤습니다. 각 표의 원래 이름표를 그대로 가져왔기 때문입니다.',
        },
        {
          id: 'concat-ignore', kind: 'code', title: '이름표 새로 매기기',
          what: 'ignore_index=True 를 주면 원래 이름표를 버리고 0 부터 다시 매깁니다.',
          code: 'menu = pd.concat([snack, drink], 【0】)\nmenu',
          blanks: [{ answers: ['ignore_index=True', 'ignore_index = True'], hint: '이름표(index)를 무시(ignore) — 이름=True 꼴.' }],
          read: '0 부터 4 까지 깔끔하게 매겨졌습니다. 겹친 이름표는 loc 로 고를 때 두 줄이 함께 나와 헷갈리게 하니, 이어 붙일 때는 거의 늘 ignore_index=True 를 붙입니다.',
        },
        {
          id: 'concat-cols', kind: 'example', title: '열이 다른 표를 이으면',
          code: "extra = pd.DataFrame({'메뉴': ['붕어빵'], '칼로리': [230]})\npd.concat([snack, extra], ignore_index=True)",
          read: '없는 칸은 NaN 이 됩니다. 정수였던 가격도 빈칸이 생겨 실수(4500.0)가 되었습니다.',
        },
        {
          id: 'concat-inner', kind: 'code', title: '공통 열만 — join',
          what: "join='inner' 를 주면 양쪽에 모두 있는 열만 남깁니다(교집합). 기본은 'outer'(합집합).",
          code: "pd.concat([snack, extra], join=【0】, ignore_index=True)",
          blanks: [{ answers: ["'inner'", '"inner"'], hint: "안쪽(교집합) — 'inner'" }],
          read: '두 표에 모두 있는 메뉴 열만 남았습니다.',
        },
        {
          id: 'concat-side', kind: 'example', title: '좌우로 붙이기 — axis=1',
          code: "kcal = pd.DataFrame({'칼로리': [480, 320, 390], '맵기': ['매움', '안매움', '안매움']})\npd.concat([snack, kcal], axis=1)",
          read: '같은 이름표(0, 1, 2)끼리 나란히 붙었습니다. 좌우로 붙일 때는 이름표가 짝을 짓는 기준이 되므로, 줄의 차례가 같은지 꼭 확인하세요. 열 이름이 같은 표를 좌우로 붙이면 같은 이름의 열이 둘 생기니 피하는 것이 좋습니다.',
        },
        {
          id: 'concat-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: 'pd.concat([snack, drink, snack], ignore_index=True).shape',
          question: '결과는?',
          choices: ['(3, 2)', '(8, 2)', '(8, 6)', '(5, 2)'],
          answer: 1,
          why: '3 + 2 + 3 = 8줄, 열은 메뉴·가격 2개입니다. 같은 표를 두 번 넣어도 그대로 두 번 이어집니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) pd.concat([drink, snack]) · pd.concat([snack, extra]) · pd.concat([snack, kcal], axis=1).shape" },
      ],
      quiz: [
        { q: '세 표 a, b, c 를 위아래로 잇고 이름표를 새로 매기는 코드는?', choices: ['pd.concat(a, b, c)', 'pd.concat([a, b, c], ignore_index=True)', 'a.concat([b, c])', 'pd.merge([a, b, c])'], answer: 1, why: '합칠 표를 리스트로 묶어 넣고, ignore_index=True 로 이름표를 새로 매깁니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'merge', title: '열쇠로 짝짓기 — merge', short: 'merge',
      goal: ['공통 열(열쇠)을 기준으로 두 표를 합친다', "how='inner'·'left'·'right'·'outer' 의 차이를 안다", '주문 기록과 메뉴판을 합쳐 매출을 구한다'],
      cells: [
        { kind: 'section', title: '엑셀의 VLOOKUP', text: '주문 기록에는 메뉴 이름과 수량만 있고, 가격은 메뉴판에 있습니다. 두 표에 모두 있는 「메뉴」 열을 열쇠(key)로 삼아 줄을 짝지으면 주문마다 가격을 붙일 수 있습니다. 이것이 merge 입니다.' },
        {
          id: 'merge-data', kind: 'example', title: '두 표',
          code: "import pandas as pd\norder = pd.DataFrame({'메뉴': ['김밥', '라면', '순대', '떡볶이'], '수량': [3, 2, 1, 4]})\nprice = pd.DataFrame({'메뉴': ['김밥', '라면', '떡볶이', '식혜'], '가격': [3500, 4000, 4500, 2000]})\nprint(order)\nprint(price)",
          read: '순대는 주문은 있는데 가격표에 없고, 식혜는 가격표에는 있는데 주문이 없습니다.',
        },
        {
          id: 'merge-inner', kind: 'code', title: '양쪽에 다 있는 것만 — inner',
          what: "on='메뉴' 로 열쇠를 정합니다. how 를 적지 않으면 inner 입니다.",
          code: "pd.【0】(order, price, on='메뉴')",
          blanks: [{ answers: ['merge'], hint: '「합치다」 — m 으로 시작합니다.' }],
          read: '김밥·라면·떡볶이 세 줄 — 양쪽에 모두 있는 메뉴만 남았습니다. 순대와 식혜는 빠졌습니다.',
        },
        { kind: 'panel', panel: 'merge' },
        {
          id: 'merge-left', kind: 'code', title: '왼쪽은 모두 — left',
          what: "주문은 하나도 빠뜨리면 안 되니 how='left' 로 왼쪽(order) 줄을 모두 남깁니다.",
          code: "m = pd.merge(order, price, on='메뉴', how=【0】)\nm",
          blanks: [{ answers: ["'left'", '"left"'], hint: "왼쪽 표 기준 — 'left'" }],
          read: '순대 줄도 남았고, 가격을 찾지 못해 NaN 입니다. 그래서 가격 열이 실수(3500.0)가 되었습니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: "★ how 네 가지",
          table: { head: ['how', '남는 줄', '이번 예에서'], rows: [["'inner' (기본)", '양쪽에 모두 있는 열쇠', '김밥·라면·떡볶이'], ["'left'", '왼쪽 표의 열쇠 모두', '+ 순대 (가격 NaN)'], ["'right'", '오른쪽 표의 열쇠 모두', '+ 식혜 (수량 NaN)'], ["'outer'", '어느 한쪽에라도 있는 열쇠', '+ 순대 + 식혜']] },
        },
        {
          id: 'merge-outer', kind: 'example', title: '모두 — outer',
          code: "pd.merge(order, price, on='메뉴', how='outer')",
          read: '다섯 메뉴가 모두 나오고, 없는 쪽은 NaN 입니다. outer 는 열쇠를 가나다순으로 늘어놓습니다.',
        },
        {
          id: 'merge-sales', kind: 'code', title: '매출 계산하기',
          what: '짝지은 표에서 수량 × 가격.',
          code: "m['매출'] = m['수량'] * m【0】\nm",
          blanks: [{ answers: ["['가격']", '["가격"]'], hint: "가격 열 — ['가격']" }],
          read: '김밥 10500, 라면 8000, 떡볶이 18000. 순대는 가격이 NaN 이라 매출도 NaN 입니다. 빈칸이 하나라도 끼면 계산 결과도 빈칸입니다.',
        },
        {
          id: 'merge-suffix', kind: 'example', title: '열 이름이 겹치면 — _x, _y',
          code: "a = pd.DataFrame({'메뉴': ['김밥', '라면'], '가격': [3500, 4000]})\nb = pd.DataFrame({'메뉴': ['김밥', '라면'], '가격': [3800, 4300]})\nprint(pd.merge(a, b, on='메뉴'))\npd.merge(a, b, on='메뉴', suffixes=('_작년', '_올해'))",
          read: '열쇠가 아닌 열(가격)의 이름이 겹치면 왼쪽에 _x, 오른쪽에 _y 가 붙습니다. suffixes 로 알맞은 꼬리표를 붙일 수 있습니다.',
        },
        {
          id: 'merge-real', kind: 'code', title: '실전 — 일주일 매출',
          what: '별빛 분식의 주문 기록(orders.csv)과 메뉴판(menu.csv)을 합쳐 메뉴별 일주일 매출을 구합니다.',
          code: "orders = pd.read_csv('orders.csv')\nmenu = pd.read_csv('menu.csv')\nfull = pd.merge(orders, menu[['메뉴', '가격']], on=【0】)\nfull['매출'] = full['수량'] * full['가격']\nfull.groupby('메뉴')['매출'].sum().sort_values(ascending=False).head(3)",
          blanks: [{ answers: ["'메뉴'", '"메뉴"'], hint: "두 표에 모두 있는 열 — '메뉴'" }],
          read: '매출 1위는 제육덮밥(80000) — 개수로는 김밥이 17개로 가장 많이 팔렸지만, 8000원짜리 제육덮밥이 10개 팔려 매출이 가장 큽니다. merge → 계산 → groupby → 정렬, 이것이 실제 분석의 흐름입니다.',
        },
        {
          id: 'merge-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "pd.merge(order, price, on='메뉴', how='right').shape",
          question: '결과는?',
          choices: ['(3, 3)', '(4, 3)', '(5, 3)', '(4, 2)'],
          answer: 1,
          why: '오른쪽(price)의 메뉴 4개(김밥·라면·떡볶이·식혜)가 모두 남고, 열은 메뉴·수량·가격 3개입니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) pd.merge(order, price, on='메뉴', how='right') · order.merge(price, on='메뉴') · pd.merge(orders, menu, on='메뉴').shape" },
      ],
      quiz: [
        { q: "주문(왼쪽) 줄을 하나도 잃지 않고 가격(오른쪽)을 붙이려면?", choices: ["how='inner'", "how='left'", "how='right'", "how='cross'"], answer: 1, why: "how='left' 는 왼쪽 표의 줄을 모두 남깁니다. 짝이 없는 칸은 NaN 이 됩니다." },
        { q: 'concat 과 merge 의 차이로 옳은 것은?', choices: ['같은 명령이다', 'concat 은 이어 붙이기, merge 는 열쇠로 짝짓기', 'concat 은 열쇠로 짝짓기, merge 는 이어 붙이기', 'merge 는 위아래로만 붙인다'], answer: 1, why: 'concat 은 표를 그대로 위아래(또는 좌우)로 잇고, merge 는 공통 열의 값이 같은 줄끼리 짝지어 합칩니다.' },
      ],
    },
  ],
};
