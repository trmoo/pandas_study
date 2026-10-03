// © 2026 티쳐무 · 모든 권리 보유
// Ⅴ. 요약하기 — groupby · transform · pivot_table · unstack · melt · 날짜
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.

const LOAD = "import pandas as pd\ndf = pd.read_csv('menu.csv')";

export const T5 = {
  id: 'summary', num: 'Ⅴ', icon: '📊', title: '요약하기', desc: 'groupby · pivot_table · melt · 날짜',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'groupby', title: '묶어서 계산하기 — groupby', short: 'groupby',
      goal: ['groupby 로 무리마다 평균·합계·개수를 구한다', 'agg 로 여러 계산을 한 번에 한다', '여러 열로 묶고 reset_index 로 펼친다'],
      cells: [
        { kind: 'section', title: '쪼개고 → 계산하고 → 합친다', text: '「분류마다 평균 가격은?」 처럼 무리마다 계산하는 것이 groupby 입니다. 판다스는 표를 무리별로 쪼개고(split), 무리마다 계산한 뒤(apply), 결과를 한 표로 합칩니다(combine). 반복문을 쓸 필요가 없습니다.' },
        { kind: 'example', id: 'groupby-load', title: '데이터 불러오기', code: LOAD },
        { kind: 'panel', panel: 'groupby' },
        {
          id: 'groupby-mean', kind: 'code', title: '분류마다 평균 가격',
          what: "groupby('묶을 열') → ['계산할 열'] → 계산 명령( ). 세 덩어리로 읽습니다.",
          code: "df.【0】('분류')['가격'].mean()",
          blanks: [{ answers: ['groupby'], hint: '무리(group)로 묶기(by) — 붙여 씁니다.' }],
          read: '디저트 2000, 분식 4666.67, 식사 6833.33, 음료 1750. 무리 이름은 가나다순으로 늘어놓고, 그 위에 묶은 열 이름(분류)이 한 줄 보입니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ 함수는 소괄호, 열 선택은 대괄호', text: "df.groupby('분류')['가격'].mean() — groupby( ) 와 mean( ) 은 명령이라 소괄호, ['가격'] 은 열을 고르는 것이라 대괄호입니다. 계산할 열을 고르지 않고 df.groupby('분류').mean() 을 하면 글자 열(메뉴)까지 평균을 내려다 오류가 납니다 — 그때는 mean(numeric_only=True)." },
        {
          id: 'groupby-size', kind: 'code', title: '무리마다 개수',
          what: 'size( ) 는 무리마다 줄 수를 셉니다.',
          code: "df.groupby('분류').【0】()",
          blanks: [{ answers: ['size'], hint: '「크기」 — 줄 수.' }],
          read: "분식 6, 식사 3, 음료 2, 디저트 1 — df['분류'].value_counts() 와 같은 숫자인데, 이쪽은 가나다순입니다.",
        },
        {
          id: 'groupby-sum', kind: 'code', title: '여러 열을 한꺼번에',
          what: '계산할 열을 리스트로 고르면 결과가 표로 나옵니다.',
          code: "df.groupby('분류')[【0】].sum()",
          blanks: [{ answers: ["['판매량', '칼로리']", '["판매량", "칼로리"]'], hint: "두 열을 리스트로 — ['판매량', '칼로리']" }],
          read: '분류마다 판매량과 칼로리의 합계입니다. 분식 판매량이 602로 가장 많습니다.',
        },
        {
          id: 'groupby-agg', kind: 'code', title: '여러 계산을 한 번에 — agg',
          what: "agg( ) 에 계산 이름을 리스트로 주면 계산마다 열이 하나씩 생깁니다.",
          code: "df.groupby('분류')['가격'].【0】(['mean', 'max', 'min'])",
          blanks: [{ answers: ['agg', 'aggregate'], hint: '「모으다(aggregate)」 의 줄임 — 세 글자.' }],
          read: '분류마다 평균·최댓값·최솟값이 나란히 나왔습니다.',
        },
        {
          id: 'groupby-aggdict', kind: 'example', title: '열마다 다른 계산 — agg(딕셔너리)',
          code: "df.groupby('분류').agg({'가격': 'mean', '판매량': 'sum'})",
          read: '가격은 평균, 판매량은 합계 — {열: 계산} 짝으로 적습니다. 이름을 새로 붙이고 싶으면 agg(평균가격=(\'가격\', \'mean\')) 처럼 씁니다.',
        },
        {
          id: 'groupby-multi', kind: 'code', title: '두 열로 묶기',
          what: '분류와 매운맛 두 단계로 묶어 판매량을 더합니다. 묶을 열을 리스트로 줍니다.',
          code: "g = df.groupby(【0】)['판매량'].sum()\ng",
          blanks: [{ answers: ["['분류', '매운맛']", '["분류", "매운맛"]'], hint: "두 열을 리스트로 — ['분류', '매운맛']" }],
          read: '이름표가 두 단계(분류 → 매운맛)입니다. 같은 분류가 이어질 때는 바깥 이름을 한 번만 적어 보기 쉽게 비워 둡니다.',
        },
        {
          id: 'groupby-reset', kind: 'code', title: '평평한 표로 펼치기 — reset_index',
          what: '두 단계 이름표는 고르기 불편합니다. reset_index( ) 로 이름표를 열로 꺼내면 보통 표가 됩니다.',
          code: 'g.【0】()',
          blanks: [{ answers: ['reset_index'], hint: '이름표(index)를 다시 놓기(reset).' }],
          read: '분류·매운맛·판매량 세 열의 평범한 표가 되었습니다. groupby 에 as_index=False 를 주어도 같은 표를 바로 얻습니다.',
        },
        { kind: 'tip', tone: 'key', title: 'groupby 결과에서 1등 찾기', text: "df.groupby('분류')['가격'].mean().idxmax() — 평균 가격이 가장 높은 분류의 이름(식사)입니다. sort_values(ascending=False).head(1) 로도 볼 수 있습니다. 작업형1에 자주 나오는 꼴입니다." },
        {
          id: 'groupby-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "df.groupby('분류')['판매량'].sum().idxmax()",
          question: '결과는?',
          choices: ["'분식'", "'식사'", '602', "'김밥'"],
          answer: 0,
          why: "분류마다 판매량을 더하면 분식이 602 로 가장 큽니다. idxmax( ) 는 값(602)이 아니라 이름표('분식')를 돌려줍니다.",
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df.groupby('매운맛')['메뉴'].count() · df.groupby('분류', as_index=False)['가격'].mean() · df.groupby('분류')['칼로리'].agg(['min', 'max'])" },
      ],
      quiz: [
        { q: "분류마다 칼로리의 최댓값을 구하는 코드는?", choices: ["df.groupby('칼로리')['분류'].max()", "df.groupby('분류')['칼로리'].max()", "df['분류'].groupby().max()", "df.max('분류')"], answer: 1, why: "groupby('묶을 열')['계산할 열'].계산( ) 차례입니다." },
        { q: "groupby 결과의 두 단계 이름표를 열로 꺼내는 명령은?", choices: ['unstack()', 'reset_index()', 'set_index()', 'sort_index()'], answer: 1, why: 'reset_index( ) 가 이름표를 열로 꺼내 평평한 표로 만듭니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'transform', title: '무리 평균으로 빈칸 채우기 — transform', short: 'transform',
      goal: ['transform 이 원래 줄 수 그대로 무리 계산값을 펼친다는 것을 안다', '무리마다 다른 값으로 결측치를 채운다'],
      cells: [
        { kind: 'section', title: '빈칸을 「그 무리의」 평균으로', text: '분식의 빈 가격은 분식의 평균으로, 음료의 빈 가격은 음료의 평균으로 채우는 것이 전체 평균으로 채우는 것보다 자연스럽습니다. 이때 쓰는 것이 transform 입니다.' },
        {
          id: 'transform-data', kind: 'example', title: '빈칸이 섞인 작은 표',
          code: "import pandas as pd\nimport numpy as np\ng = pd.DataFrame({\n    '분류': ['분식', '음료', '분식', '음료', '분식', '음료', '분식', '음료'],\n    '크기': ['소', '소', '대', '대', '대', '대', '소', '소'],\n    '가격': [3000, np.nan, 4500, np.nan, 5000, 2500, np.nan, 1800]\n})\ng",
          read: '1, 3, 6번 줄의 가격이 비어 있습니다.',
        },
        {
          id: 'transform-compare', kind: 'example', title: '보통 groupby 와 견주기',
          code: "g.groupby('분류')['가격'].mean()",
          read: '분식 4166.67, 음료 2150 — 무리 하나에 값 하나, 두 줄짜리 결과입니다. 이것으로는 8줄짜리 표의 빈칸에 바로 넣을 수 없습니다.',
        },
        {
          id: 'transform-make', kind: 'code', title: 'transform — 원래 줄 수 그대로',
          what: "transform('mean') 은 무리 평균을 그 무리에 속한 모든 줄에 펼쳐 줍니다.",
          code: "price = g.groupby('분류')['가격'].【0】('mean')\nprice",
          blanks: [{ answers: ['transform'], hint: '「변형하다」 — t 로 시작합니다.' }],
          read: '8줄 그대로입니다. 분식 줄(0, 2, 4, 6)에는 4166.67, 음료 줄에는 2150 이 들어 있습니다.',
        },
        {
          id: 'transform-fill', kind: 'code', title: '그 값으로 빈칸 채우기',
          what: 'fillna 에 시리즈를 주면 「같은 이름표끼리」 짝지어 빈칸만 채웁니다.',
          code: "g['가격'] = g['가격'].fillna(【0】)\ng",
          blanks: [{ answers: ['price'], hint: '무리 평균을 펼쳐 담아 둔 변수.' }],
          read: '1·3번(음료) 빈칸은 2150, 6번(분식) 빈칸은 4166.67 로 채워졌습니다. 이미 값이 있던 칸은 그대로입니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ transform 으로 무리별 결측치 채우기', text: "df['열'] = df['열'].fillna(df.groupby('무리')['열'].transform('mean')) — 한 줄로 외워 두세요. 무리를 두 단계로 나누려면 groupby(['분류', '크기']) 처럼 리스트로 줍니다. mean 대신 median 도 됩니다." },
        {
          id: 'transform-two', kind: 'example', title: '두 단계 무리로 채우기',
          code: "h = pd.DataFrame({\n    '분류': ['분식', '음료', '분식', '음료', '분식', '음료', '분식', '음료'],\n    '크기': ['소', '소', '대', '대', '대', '대', '소', '소'],\n    '가격': [3000, np.nan, 4500, np.nan, 5000, 2500, np.nan, 1800]\n})\nh['가격'] = h['가격'].fillna(h.groupby(['분류', '크기'])['가격'].transform('mean'))\nh",
          read: '음료·소 빈칸은 음료·소의 평균(1800), 음료·대 빈칸은 2500, 분식·소 빈칸은 3000 으로 채워졌습니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) g.groupby('분류')['가격'].transform('max') · g.groupby('크기')['가격'].transform('count')" },
      ],
      quiz: [
        { q: "8줄짜리 표에서 df.groupby('분류')['가격'].transform('mean') 의 결과는 몇 줄?", choices: ['분류의 수만큼', '8줄', '1줄', '2줄'], answer: 1, why: 'transform 은 무리 계산값을 원래의 모든 줄에 펼치므로 원래 줄 수 그대로입니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'reshape', title: '표 모양 바꾸기 — pivot_table · unstack · melt', short: '피벗·melt',
      goal: ['끝 그림을 먼저 정하고 pivot_table 의 네 인자를 채운다', 'unstack 으로 두 단계 이름표를 열로 펼친다', 'melt 로 넓은 표를 긴 표로 바꾼다'],
      cells: [
        { kind: 'section', title: '엑셀의 피벗 테이블', text: '주문 기록처럼 한 줄에 한 건씩 쌓인 표를 「날짜 × 결제수단」 처럼 가로·세로로 정리하고 싶을 때 pivot_table 을 씁니다.' },
        {
          kind: 'tip', tone: 'key', title: '★ 끝 그림을 먼저 생각하자 — 네 가지 질문',
          table: { head: ['질문', '인자', '예: 날짜별·결제수단별 판매 수량 합계'], rows: [['줄(왼쪽)에 무엇을?', 'index=', "'날짜'"], ['열(위쪽)에 무엇을?', 'columns=', "'결제'"], ['칸 안에 어떤 값을?', 'values=', "'수량'"], ['그 값을 어떻게 모으나?', 'aggfunc=', "'sum' (기본값은 'mean')"]] },
        },
        { kind: 'example', id: 'reshape-load', title: '주문 기록 불러오기', code: "import pandas as pd\no = pd.read_csv('orders.csv')\no.head()" },
        {
          id: 'reshape-pivot1', kind: 'code', title: '줄 기준만 정한 피벗',
          what: '결제수단마다 판매 수량의 합계.',
          code: "o.【0】(index='결제', values='수량', aggfunc='sum')",
          blanks: [{ answers: ['pivot_table'], hint: '피벗(pivot) + 표(table) — 밑줄로 잇습니다.' }],
          read: '간편결제 34, 카드 65, 현금 18 — 카드로 가장 많이 팔렸습니다.',
        },
        {
          id: 'reshape-pivot2', kind: 'code', title: '가로·세로 모두 정한 피벗',
          what: '날짜를 줄로, 결제수단을 열로.',
          code: "o.pivot_table(index='날짜', 【0】='결제', values='수량', aggfunc='sum')",
          blanks: [{ answers: ['columns'], hint: '열(column)들 — s 로 끝납니다.' }],
          read: '3월 4일 현금 칸이 NaN 입니다 — 그날은 현금 주문이 하나도 없었기 때문입니다. NaN 이 섞여 수가 실수(5.0 …)로 나옵니다.',
        },
        {
          id: 'reshape-fill', kind: 'code', title: '빈칸을 0 으로 — fill_value',
          what: '주문이 없던 칸은 0 으로 채웁니다.',
          code: "o.pivot_table(index='날짜', columns='결제', values='수량', aggfunc='sum', 【0】=0)",
          blanks: [{ answers: ['fill_value'], hint: '채울(fill) 값(value).' }],
          read: '빈칸이 0 이 되었고, 수도 정수로 돌아왔습니다. 금요일(3월 7일) 카드 18 이 가장 큽니다.',
        },
        {
          id: 'reshape-aggdict', kind: 'example', title: '열마다 다른 계산',
          code: "o.pivot_table(index='결제', values=['수량', '주문번호'], aggfunc={'수량': 'sum', '주문번호': 'count'})",
          read: '결제수단마다 판매 수량의 합계와 주문 건수(주문번호 개수)입니다. 결과의 열은 가나다순으로 늘어놓습니다.',
        },
        { kind: 'section', title: 'unstack — 두 단계 이름표의 안쪽을 열로', text: 'groupby 를 두 열로 하면 이름표가 두 단계가 됩니다. unstack( ) 은 안쪽(마지막) 단계를 열로 올려 pivot_table 과 같은 모양을 만듭니다.' },
        {
          id: 'reshape-unstack', kind: 'code', title: 'unstack 으로 펼치기',
          what: '날짜·결제로 묶어 수량을 더한 뒤 결제를 열로 올립니다.',
          code: "s = o.groupby(['날짜', '결제'])['수량'].sum()\ns.【0】()",
          blanks: [{ answers: ['unstack'], hint: '쌓인 것(stack)을 푼다(un).' }],
          read: 'pivot_table(index=\'날짜\', columns=\'결제\', values=\'수량\', aggfunc=\'sum\') 과 같은 표입니다.',
        },
        {
          id: 'reshape-unstack0', kind: 'example', title: '바깥 단계를 열로 — level=0',
          code: "s.unstack(level=0).head(3)",
          read: '이번에는 바깥 단계(날짜)가 열로 올라가고 결제가 줄이 되었습니다. 기본값 level=-1 은 마지막 단계입니다.',
        },
        { kind: 'section', title: 'melt — 넓은 표를 긴 표로', text: '「1학기·2학기」처럼 같은 종류의 값이 여러 열에 흩어진 넓은 표를, 「학기」 열 하나와 「값」 열 하나의 긴 표로 녹여 냅니다(melt). 조건으로 고르거나 groupby 하기 쉬워집니다.' },
        {
          id: 'reshape-wide', kind: 'example', title: '넓은 표',
          code: "club = pd.DataFrame({\n    '동아리': ['코딩', '로봇', '방송'],\n    '1학기': [12, 8, 10],\n    '2학기': [15, 9, 7]\n})\nclub",
        },
        {
          id: 'reshape-melt', kind: 'code', title: '녹이기 — melt',
          what: 'id_vars 는 그대로 둘 열입니다. 나머지 열 이름은 variable 열로, 값은 value 열로 들어갑니다.',
          code: "pd.【0】(club, id_vars=['동아리'])",
          blanks: [{ answers: ['melt'], hint: '「녹이다」 — 네 글자.' }],
          read: '3 동아리 × 2 학기 = 6줄. 열 이름이었던 1학기·2학기가 variable 열의 값이 되었습니다.',
        },
        {
          id: 'reshape-melt-name', kind: 'code', title: '새 열에 이름 붙이기',
          what: 'var_name 과 value_name 으로 variable·value 대신 알맞은 이름을 붙입니다.',
          code: "long = pd.melt(club, id_vars=['동아리'], var_name='학기', 【0】='인원')\nlong",
          blanks: [{ answers: ['value_name'], hint: '값(value) 열의 이름(name).' }],
          read: '학기·인원 열이 생겼습니다. 이제 long[long[\'학기\'] == \'2학기\'] 처럼 고르기 쉽습니다. value_vars=[\'2학기\'] 를 주면 그 열만 녹입니다.',
        },
        {
          id: 'reshape-melt-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "long.groupby('학기')['인원'].sum()",
          question: '2학기의 인원 합계는?',
          choices: ['30', '31', '61', '15'],
          answer: 1,
          why: '15 + 9 + 7 = 31. 넓은 표였다면 club[\'2학기\'].sum() 이지만, 긴 표로 바꾸면 groupby 하나로 학기마다 한꺼번에 구할 수 있습니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) o.pivot_table(index='메뉴', values='수량', aggfunc='sum').sort_values('수량') · pd.crosstab(o['날짜'], o['결제']) · long.pivot_table(index='동아리', columns='학기', values='인원')" },
      ],
      quiz: [
        { q: 'pivot_table 의 aggfunc 를 적지 않으면 어떤 계산을 하나요?', choices: ['합계', '평균', '개수', '최댓값'], answer: 1, why: "기본값은 'mean'(평균)입니다. 합계가 필요하면 aggfunc='sum' 을 꼭 적습니다." },
        { q: 'melt 의 id_vars 는?', choices: ['녹여서 없앨 열', '그대로 남겨 둘 열', '새로 만들 열 이름', '값이 들어갈 열'], answer: 1, why: 'id_vars 에 적은 열은 그대로 두고, 나머지 열을 variable·value 두 열로 녹입니다.' },
        { q: 'groupby([A, B]).sum() 결과에 unstack() 을 하면 열이 되는 것은?', choices: ['A', 'B', '합계', '아무것도'], answer: 1, why: '기본은 마지막 단계(B)가 열로 올라갑니다. A 를 열로 올리려면 unstack(level=0).' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'dates', title: '날짜 다루기 — to_datetime · dt', short: '날짜',
      goal: ['글자로 된 날짜를 날짜 자료형으로 바꾼다', 'dt 로 연·월·요일·시를 꺼낸다', '월마다 묶어 계산한다'],
      cells: [
        { kind: 'section', title: '글자처럼 보이는 날짜', text: "CSV 에서 읽은 '2024-03-15' 는 아직 글자(object)입니다. 날짜 자료형으로 바꿔야 월·요일을 꺼내고, 날짜끼리 비교할 수 있습니다." },
        { kind: 'example', id: 'dates-load', title: '바람섬 2024년 날씨', code: "import pandas as pd\nw = pd.read_csv('weather.csv')\nprint(w.dtypes)\nw.head(3)" },
        {
          id: 'dates-convert', kind: 'code', title: '날짜 자료형으로 바꾸기',
          what: 'pd.to_datetime( ) 으로 바꾸고 대입합니다.',
          code: "w['날짜'] = pd.【0】(w['날짜'])\nw['날짜'].dtype",
          blanks: [{ answers: ['to_datetime'], hint: '날짜·시각(datetime)으로(to) — 밑줄로 잇습니다.' }],
          read: "dtype('<M8[ns]') 는 datetime64[ns], 곧 날짜·시각 자료형이라는 뜻입니다. read_csv('weather.csv', parse_dates=['날짜']) 처럼 불러올 때 바로 바꿀 수도 있습니다.",
        },
        {
          id: 'dates-month', kind: 'code', title: '월 꺼내기',
          what: '날짜 열에 dt 를 거치면 연(year)·월(month)·일(day)·요일(dayofweek)을 꺼낼 수 있습니다.',
          code: "w['월'] = w['날짜'].【0】.month\nw[['날짜', '월']].head(3)",
          blanks: [{ answers: ['dt'], hint: '날짜·시각(datetime)의 줄임 — 두 글자.' }],
          read: '월 열이 생겼습니다. 글자 열의 str 처럼, 날짜 열에는 dt 를 거칩니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: 'dt 로 꺼내는 것들',
          table: { head: ['코드', '결과', '예 (2024-03-15 금)'], rows: [['dt.year', '연', '2024'], ['dt.month', '월', '3'], ['dt.day', '일', '15'], ['dt.dayofweek', '요일 번호 (월 0 ~ 일 6)', '4'], ['dt.day_name()', '요일 영어 이름', 'Friday'], ['dt.hour', '시', '0'], ['dt.quarter', '분기', '1']] },
        },
        {
          id: 'dates-group', kind: 'code', title: '월마다 평균 풍속',
          what: '바람섬은 언제 바람이 셀까요? 월로 묶어 평균 풍속을 구합니다.',
          code: "wind = w.groupby('월')['평균풍속'].【0】()\nwind.round(1)",
          blanks: [{ answers: ['mean'], hint: '평균.' }],
          read: '1월 5.1, 2월 4.9, 11월 4.5, 12월 4.7 — 겨울에 바람이 셉니다. 풍속 빈칸(5일)은 평균에서 빠졌습니다.',
        },
        {
          id: 'dates-max', kind: 'example', title: '바람이 가장 센 달',
          code: 'wind.idxmax()',
          read: '1월 — 앞 단원의 idxmax 가 여기서도 쓰입니다.',
          readFree: true,
        },
        {
          id: 'dates-filter', kind: 'code', title: '날짜로 고르기',
          what: "날짜 열은 '2024-08-01' 같은 글자와 바로 비교할 수 있습니다. 8월 1일부터 3일까지의 날씨.",
          code: "w[(w['날짜'] >= '2024-08-01') 【0】 (w['날짜'] <= '2024-08-03')]",
          blanks: [{ answers: ['&'], hint: '두 조건 모두 — 그리고.' }],
          read: '8월 1~3일 세 줄입니다. 날짜 표기는 날짜만 있으면 2024-08-01 처럼 시각이 빠집니다.',
        },
        {
          id: 'dates-weekday', kind: 'example', title: '요일 이름',
          code: "o = pd.read_csv('orders.csv')\no['날짜'] = pd.to_datetime(o['날짜'])\no['요일'] = o['날짜'].dt.day_name()\no.groupby('요일')['수량'].sum()",
          read: '별빛 분식의 요일별 판매 수량입니다. 요일 이름이 알파벳 차례로 놓였습니다. 금요일(Friday)이 22개로 가장 많습니다. 요일 차례대로 보려면 dt.dayofweek(월 0 ~ 일 6)로 묶으세요.',
        },
        {
          id: 'dates-hour', kind: 'code', title: '날짜와 시각을 합쳐 시 꺼내기',
          what: '날짜와 시각이 다른 열에 있으면 글자로 이어 붙인 뒤 to_datetime 합니다. 날짜 열을 astype(str) 로 글자로 되돌려 이어 붙입니다.',
          code: "o['일시'] = pd.to_datetime(o['날짜'].astype(str) + ' ' + o['시각'])\no.groupby(o['일시'].dt.【0】)['수량'].sum()",
          blanks: [{ answers: ['hour'], hint: '「시」 — 영어로 한 시간.' }],
          read: '11시부터 19시까지 시마다 판매 수량입니다. 13시와 14시가 17개로 가장 바쁩니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) w['날짜'].dt.dayofweek.head() · w.groupby('월')['강수량'].sum() · w.loc[w['평균기온'].idxmax(), '날짜'] · w['날짜'].max()" },
      ],
      quiz: [
        { q: "날짜 열에서 월을 꺼내는 코드는?", choices: ["df['날짜'].month", "df['날짜'].dt.month", "df['날짜'].str.month", "df.month('날짜')"], answer: 1, why: '날짜 열에는 dt 접근자를 거칩니다 — 글자 열의 str 처럼.' },
        { q: "dt.dayofweek 의 값 0 은 무슨 요일?", choices: ['일요일', '월요일', '토요일', '1일'], answer: 1, why: '판다스는 월요일 0, 화요일 1, …, 일요일 6 입니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    // 시계열 — 날짜 모양(format) 읽기 · 기간(Timedelta) 계산
    // 2026-10-03 사용자 요청으로 더함. 다룰 주제(format 기호·Timedelta·total_seconds·to_period)만 참고했고
    // 예제·데이터(별빛 분식 배달 기록)·설명은 새로 만들었다.
    {
      id: 'timeseries', title: '시계열 — 날짜 모양 읽기와 시간 계산', short: '시계열',
      goal: ['모양이 제각각인 날짜를 format 으로 읽는다', '요일·주말을 가리고 원하는 기간만 고른다', 'Timedelta 로 며칠 뒤를 구하고, 걸린 시간을 분으로 바꾼다'],
      cells: [
        { kind: 'section', title: '같은 날, 다른 모양', text: '별빛 분식에는 주문이 여러 길로 들어옵니다. 배달 앱, 전화 장부, 카드 단말기, 키오스크, 오래된 계산대, 배달 기사 앱 — 그런데 기록마다 날짜를 적는 모양이 다릅니다. 모두 **2025년 3월 7일**인데 말이죠. 판다스가 알아서 읽는 모양도 있고, 서식(format)을 알려 줘야 읽는 모양도 있습니다.' },
        {
          id: 'ts-load', kind: 'example', title: '주문 길마다 다른 날짜',
          code: "import pandas as pd\nch = pd.DataFrame({\n    '주문길': ['배달앱', '전화장부', '카드단말기', '키오스크', '옛 계산대', '기사앱'],\n    '기록': ['2025-03-07 18:05:20', '2025년03월07일', '03/07/2025 06:05:20 PM', '25/03/07', '2025:03:07', '7 Mar 2025 18:41:05']\n})\nch",
          read: '여섯 줄 모두 같은 날의 기록입니다. 지금은 모두 글자(object)라서 날짜로 계산할 수 없습니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ datetime — datatime 아님', text: '날짜·시각 자료형의 이름은 date + time 을 붙인 **datetime** 입니다. 명령은 `pd.to_datetime( )`. 「datatime」 처럼 data 로 쓰면 AttributeError 가 납니다.' },
        {
          id: 'ts-us', kind: 'code', title: '알아서 읽는 모양',
          what: "'03/07/2025' 처럼 연도가 네 자리면 판다스가 알아서 읽습니다. 이 모양은 「월/일/년」 차례(미국식)입니다.",
          code: "pd.【0】('03/07/2025')",
          blanks: [{ answers: ['to_datetime'], hint: '날짜·시각(datetime)으로(to).' }],
          read: "Timestamp('2025-03-07 00:00:00') — 3월 7일로 읽었습니다. 시각이 없으면 0시 0분 0초가 붙습니다.",
        },
        {
          id: 'ts-colon', kind: 'predict', title: '실행 결과 예측하기',
          code: "pd.to_datetime('2025:03:07')",
          question: '옛 계산대의 「2025:03:07」 을 서식 없이 읽으면?',
          choices: ['2025-03-07', '2025-07-03', '오류가 난다', '20:25:03 이라는 시각'],
          answer: 2,
          why: '쌍점(:)으로 이은 숫자는 시각(시:분:초)처럼 보여서 「시는 0~23 이어야 한다」는 오류가 납니다. 낯선 모양은 format 으로 알려 줘야 합니다.',
        },
        {
          id: 'ts-format', kind: 'code', title: '서식 알려 주기 — format',
          what: "글자의 모양을 % 기호로 그대로 따라 적습니다. 연 네 자리는 %Y, 월은 %m, 일은 %d, 사이의 쌍점은 그대로.",
          code: "pd.to_datetime('2025:03:07', format=【0】)",
          blanks: [{ answers: ["'%Y:%m:%d'", '"%Y:%m:%d"'], hint: "연:월:일 — '%Y:%m:%d'" }],
          read: '이제 2025년 3월 7일로 읽었습니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ format 기호',
          table: { head: ['기호', '뜻', '예'], rows: [['%Y · %y', '연 — 네 자리는 대문자, 두 자리는 소문자', '2025 · 25'], ['%m · %d', '월 · 일 (소문자)', '03 · 07'], ['%H · %M · %S', '시(0~23) · 분 · 초 — 시각은 모두 대문자', '18 · 05 · 20'], ['%I · %p', '시(1~12) · 오전/오후', '06 · PM'], ['%b', '월 이름 줄임', 'Mar']] },
          text: '**%m(월)과 %M(분)을 헷갈리지 마세요.** 날짜는 소문자 m, 시각은 대문자 M 입니다.',
        },
        {
          id: 'ts-kor', kind: 'code', title: '한글이 섞인 날짜',
          what: '전화 장부의 「2025년03월07일」. 한글은 판다스가 알아서 읽지 못하므로, format 에 한글을 그대로 적습니다.',
          code: "pd.to_datetime('2025년03월07일', format=【0】)",
          blanks: [{ answers: ["'%Y년%m월%d일'", '"%Y년%m월%d일"'], hint: "기호 사이에 년·월·일을 그대로 — '%Y년%m월%d일'" }],
          read: "Timestamp('2025-03-07 00:00:00'). 글자와 서식이 한 글자라도 다르면 「doesn't match format」 오류가 납니다.",
        },
        {
          id: 'ts-y2', kind: 'code', title: '연도가 두 자리',
          what: "키오스크의 「25/03/07」 — 연도가 두 자리라 소문자 %y 를 씁니다.",
          code: "pd.to_datetime('25/03/07', format=【0】)",
          blanks: [{ answers: ["'%y/%m/%d'", '"%y/%m/%d"'], hint: "두 자리 연도는 소문자 — '%y/%m/%d'" }],
          read: '25 를 2025년으로 읽었습니다. 두 자리 연도는 00~68 은 2000년대, 69~99 는 1900년대로 읽습니다.',
          readFree: true,
        },
        {
          id: 'ts-ampm', kind: 'example', title: '오전·오후 표기와 월 이름',
          code: "print(pd.to_datetime('03/07/2025 06:05:20 PM'))\nprint(pd.to_datetime('7 Mar 2025 18:41:05'))",
          read: '오후 6시 5분 20초가 18:05:20 으로, 「7 Mar 2025」 도 2025-03-07 로 읽혔습니다. 판다스는 언제나 24시 표기로 바꿔 둡니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ 바꾸고 나서 확인하는 습관', text: '날짜를 바꾼 뒤에는 꼭 print( ) 나 dtypes 로 확인하세요. dtype 이 datetime64[ns] 가 되었는지, 월과 일이 뒤바뀌지 않았는지(03/07 은 3월 7일), 연도가 맞는지. 잘못 읽은 날짜는 오류 없이 엉뚱한 답을 만듭니다.' },

        { kind: 'section', title: '날짜에서 꺼내고, 기간으로 고르기', text: '날짜 자료형이 되면 dt 로 연·월·일·시·분·초와 요일을 꺼낼 수 있습니다. 「2024년 8월 자료만」 처럼 기간을 고르는 문제가 자주 나옵니다.' },
        {
          id: 'ts-delivery', kind: 'example', title: '배달 기록',
          code: "d = pd.DataFrame({\n    '주문': ['2025-03-07 18:05:20', '2025-03-08 12:30:10', '2025-03-09 19:10:00', '2025-03-10 11:45:30'],\n    '도착': ['2025-03-07 18:41:05', '2025-03-08 13:01:40', '2025-03-09 19:52:30', '2025-03-10 12:20:59']\n})\nd['주문'] = pd.to_datetime(d['주문'])\nd['도착'] = pd.to_datetime(d['도착'])\nd.dtypes",
          read: '두 열 모두 datetime64[ns] 가 되었습니다.',
        },
        {
          id: 'ts-weekend', kind: 'code', title: '요일과 주말',
          what: '요일 번호는 월요일 0 부터 일요일 6 까지입니다. 토·일은 5·6 이므로 「5 이상」이 주말입니다.',
          code: "d['요일'] = d['주문'].dt.dayofweek\nd['주말'] = d['요일'] >= 【0】\nd[['주문', '요일', '주말']]",
          blanks: [{ answers: ['5'], hint: '토요일의 번호.' }],
          read: '3월 7일은 금요일(4), 8일 토요일(5), 9일 일요일(6), 10일 월요일(0) — 8·9일만 주말입니다.',
        },
        {
          id: 'ts-parts', kind: 'example', title: '시 · 분 · 초',
          code: "print(d['주문'].dt.hour.tolist())\nprint(d['주문'].dt.minute.tolist())\nprint(d['주문'].dt.second.tolist())",
          read: '시는 dt.hour, 분은 dt.minute, 초는 dt.second.',
        },
        {
          id: 'ts-read', kind: 'code', title: '불러올 때 바로 날짜로',
          what: 'usecols 로 필요한 열만, parse_dates 로 날짜 열을 바로 날짜 자료형으로 불러옵니다. 그리고 8월 자료만 골라 강수량을 더합니다.',
          code: "w = pd.read_csv('weather.csv', usecols=['날짜', '강수량'], 【0】=['날짜'])\nprint(w.dtypes)\naug = w[w['날짜'].dt.month == 8]\nprint(len(aug), aug['강수량'].sum())",
          blanks: [{ answers: ['parse_dates'], hint: '날짜로(dates) 읽기(parse) — 밑줄로 잇습니다.' }],
          read: '날짜 열이 처음부터 datetime64[ns] 입니다. 8월은 31일이고, 그달 강수량을 모두 더했습니다.',
          readFree: true,
        },
        {
          id: 'ts-period', kind: 'example', title: '[참고] 분기·월로 뭉치기 — to_period',
          code: "w.groupby(w['날짜'].dt.to_period('Q'))['강수량'].sum()",
          read: "to_period('Q') 는 날짜를 「2024Q3」 같은 분기로 바꿉니다. 'Y'(연) · 'Q'(분기) · 'M'(월) · 'D'(일) · 'h'(시). 옛 코드에 보이는 'A'·'H' 는 판다스 2.2 에서 「곧 없어진다」는 경고가 납니다. 여름(3분기)에 비가 가장 많습니다.",
          readFree: true,
        },

        { kind: 'section', title: '기간 — Timedelta', text: '「3월 7일에서 100일째 되는 날」, 「주문하고 도착까지 몇 분?」 처럼 날짜에 기간을 더하거나, 두 날짜의 차이를 구할 때는 기간(Timedelta)을 씁니다.' },
        {
          id: 'ts-100', kind: 'code', title: '100일째 되는 날',
          what: '별빛 분식은 2025년 3월 7일에 문을 열었습니다. 여는 날이 1일째이므로 100일째는 99일 뒤입니다.',
          code: "open_day = pd.to_datetime('2025-03-07')\nopen_day + pd.Timedelta(【0】=99)",
          blanks: [{ answers: ['days'], hint: '「날들」 — 끝에 s 가 붙습니다.' }],
          read: "Timestamp('2025-06-14 00:00:00') — 6월 14일이 100일 기념일입니다. 「100일 뒤」와 「100일째」는 하루 차이가 납니다.",
        },
        { kind: 'tip', tone: 'warn', title: '★ Timedelta 의 이름은 모두 s 로 끝난다', text: '`pd.Timedelta(weeks=…, days=…, hours=…, minutes=…, seconds=…)` — day=, hour= 처럼 단수로 쓰면 오류가 납니다. 여러 개를 한꺼번에 넣으면 모두 더한 기간이 됩니다.' },
        {
          id: 'ts-mix', kind: 'example', title: '여러 단위를 한꺼번에',
          code: "print(pd.Timedelta(hours=100))\nprint(pd.Timedelta(weeks=1, days=2, hours=3, minutes=4, seconds=5))\nprint(open_day - pd.Timedelta(weeks=1))",
          read: '100시간은 4일 4시간입니다. 날짜에서 기간을 빼면 그만큼 앞의 날짜가 됩니다.',
        },
        {
          id: 'ts-diff', kind: 'code', title: '두 날짜의 차이',
          what: '도착 시각에서 주문 시각을 빼면 「걸린 시간」 열이 생깁니다. 날짜끼리의 계산 결과는 기간(timedelta64) 자료형입니다.',
          code: "d['걸린시간'] = d['도착'] 【0】 d['주문']\nd[['주문', '도착', '걸린시간']]",
          blanks: [{ answers: ['-'], hint: '빼기.' }],
          read: '0 days 00:35:45 — 0일 35분 45초. 일·시·분·초가 한 칸에 들어 있습니다.',
        },
        {
          id: 'ts-minutes', kind: 'code', title: '분으로 바꾸기',
          what: '기간을 분으로 바로 바꾸는 명령은 없습니다. dt.total_seconds( ) 로 전체를 초로 바꾼 뒤 60 으로 나눕니다.',
          code: "d['걸린분'] = d['걸린시간'].dt.【0】() / 60\nd[['걸린시간', '걸린분']]",
          blanks: [{ answers: ['total_seconds'], hint: '전체(total) 초(seconds) — 밑줄로 잇고, 괄호를 붙이는 명령입니다.' }],
          read: '35.75분, 31.5분 … 시간으로는 / 3600, 일로는 / 86400 입니다. total_seconds( ) 는 기간(timedelta) 열에만 있는 명령입니다.',
          readFree: true,
        },
        {
          id: 'ts-seconds', kind: 'predict', title: '실행 결과 예측하기',
          code: "long = pd.to_datetime('2025-03-09 20:00:00') - pd.to_datetime('2025-03-07 18:00:00')\nprint(long)\nprint(long.seconds, long.total_seconds())",
          question: '2일 2시간짜리 기간입니다. long.seconds 는?',
          choices: ['180000 (전체 초)', '7200 (하루를 뺀 나머지 2시간의 초)', '2', '오류'],
          answer: 1,
          why: 'seconds 는 「며칠」을 뺀 나머지 부분의 초(2시간 = 7200초)뿐입니다. 전체를 초로 바꾼 값은 total_seconds( ) — 180000.0 초입니다. 걸린 시간을 셀 때는 꼭 total_seconds( ) 를 쓰세요.',
        },
        { kind: 'tip', tone: 'warn', title: '★ dt.seconds 와 dt.total_seconds( )', text: 'dt.seconds 는 하루가 넘는 부분을 버린 「나머지」 초입니다. 하루가 넘는 기간에 쓰면 엉뚱한 값이 됩니다. 일 수는 dt.days, 전체 길이는 dt.total_seconds( ).' },
        {
          id: 'ts-round', kind: 'example', title: '분 단위로 반올림하기',
          what: "문제에 「분 단위로 반올림」 이 나오면, 남은 초가 30초 이상이면 올리고 미만이면 버린다는 뜻입니다.",
          code: "print(round(35.75), round(31.5), round(32.5))\nprint(0.75 * 60, 0.5 * 60)",
          read: '35.75분은 0.75분 = 45초라서 36분으로 올립니다. 그런데 31.5 와 32.5 가 둘 다 32 가 되었습니다 — 파이썬의 round( ) 는 딱 .5 일 때 짝수 쪽으로 보냅니다. 시험 문제의 「반올림」이 정확히 .5 에 걸리면 이 점을 꼭 확인하세요.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) d['걸린시간'].mean() · d['걸린분'].round() · pd.to_datetime('2025-12-25') - open_day · d['도착'].dt.to_period('D')" },
      ],
      quiz: [
        { q: "'2025.03.07 18시' 처럼 낯선 모양의 날짜를 읽을 때 쓰는 것은?", choices: ['astype(datetime)', "to_datetime(…, format='…')", 'dt.date', 'parse_dates'], answer: 1, why: "format 에 글자의 모양을 % 기호로 그대로 따라 적습니다 — '%Y.%m.%d %H시'." },
        { q: "format 에서 「분」을 뜻하는 기호는?", choices: ['%m', '%M', '%n', '%S'], answer: 1, why: '소문자 %m 은 월, 대문자 %M 은 분입니다. 시각(H·M·S)은 모두 대문자.' },
        { q: "걸린 시간(기간) 열을 분으로 바꾸는 코드는?", choices: ['s.dt.minutes', 's.dt.seconds / 60', 's.dt.total_seconds() / 60', 's / 60'], answer: 2, why: '분으로 바꾸는 명령은 없어서 전체 초 total_seconds( ) 를 60 으로 나눕니다. dt.seconds 는 하루를 뺀 나머지라서 틀릴 수 있습니다.' },
      ],
    },
  ],
};
