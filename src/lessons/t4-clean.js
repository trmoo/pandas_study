// © 2026 티쳐무 · 모든 권리 보유
// Ⅳ. 고치기 — 열 추가·삭제 · 값 바꾸기 · 결측치 · 중복과 자료형 · 문자열
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.

const LOAD = "import pandas as pd\ndf = pd.read_csv('menu.csv')";
const RAW = "import pandas as pd\nimport numpy as np\nraw = pd.read_csv('menu_raw.csv')";

export const T4 = {
  id: 'clean', num: 'Ⅳ', icon: '🧹', title: '고치기', desc: '열·값 바꾸기 · 결측치 · 중복 · 문자열',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'columns', title: '열 만들기 · 지우기 · 이름 바꾸기', short: '열 다루기',
      goal: ['계산한 결과로 새 열을 만든다', 'drop 의 axis 로 행·열을 지운다', 'astype 과 rename 을 쓴다'],
      cells: [
        { kind: 'example', id: 'columns-load', title: '데이터 불러오기', code: LOAD + '\ndf.head(3)' },
        {
          id: 'columns-new', kind: 'code', title: '새 열 만들기',
          what: '없는 열 이름에 값을 넣으면 새 열이 생깁니다. 값 하나를 넣으면 모든 줄에 같은 값이 들어갑니다.',
          code: "df['행사'] = 【0】\ndf.head(3)",
          blanks: [{ answers: ['0'], hint: '모든 줄에 0 을 넣어 봅니다.' }],
          read: '맨 오른쪽에 행사 열이 생기고 모두 0 입니다.',
        },
        {
          id: 'columns-calc', kind: 'code', title: '계산한 열',
          what: '20% 할인한 가격과 지난주 매출(가격 × 판매량)을 새 열로 만듭니다. 열끼리의 계산은 줄마다 짝지어 됩니다.',
          code: "discount = 0.2\ndf['할인가'] = df['가격'] * (1 - discount)\ndf['매출'] = df['가격'] 【0】 df['판매량']\ndf[['메뉴', '할인가', '매출']].head(3)",
          blanks: [{ answers: ['*'], hint: '곱하기 기호.' }],
          read: '할인가는 0.8 을 곱해 3600.0 처럼 실수가 되었고, 매출은 4500 × 132 = 594000 처럼 정수입니다.',
          readFree: true,
        },
        {
          id: 'columns-astype', kind: 'code', title: '자료형 바꾸기 — astype',
          what: "할인가를 정수로 바꿉니다. astype('int') 또는 astype(int) 로 씁니다.",
          code: "df['할인가'] = df['할인가'].【0】(int)\ndf['할인가'].head(3)",
          blanks: [{ answers: ['astype'], hint: '「~로서의 자료형(as type)」 — 붙여 씁니다.' }],
          read: '3600, 4400, 4800 — 소수점이 사라지고 dtype 이 int64 가 되었습니다. 소수점 아래는 버립니다(반올림이 아님).',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ axis — 0 은 행 방향, 1 은 열 방향',
          table: { head: ['', 'axis=0', 'axis=1'], rows: [['drop( )', '행(줄)을 지운다 — 기본값', '열을 지운다'], ['sum( )·mean( )', '열마다 계산 (위아래로) — 기본값', '행마다 계산 (좌우로)']] },
          text: '「axis=0 은 위에서 아래로 훑는다, 1 은 왼쪽에서 오른쪽으로 훑는다」고 기억하세요. drop 은 훑는 방향에 있는 것을 지우고, sum 은 훑으며 더합니다.',
        },
        {
          id: 'columns-drop', kind: 'code', title: '열 지우기',
          what: '행사 열을 지웁니다. 열을 지울 때는 axis=1 이 필요합니다. 지운 결과를 df 에 다시 대입합니다.',
          code: "df = df.drop('행사', 【0】)\ndf.columns",
          blanks: [{ answers: ['axis=1', 'axis = 1'], hint: '열 방향 — axis 에 1.' }],
          read: "열 목록에서 행사가 사라졌습니다. df.drop(columns=['행사']) 처럼 써도 됩니다.",
        },
        {
          id: 'columns-droprow', kind: 'code', title: '행 지우기',
          what: '이름표 0 인 줄(떡볶이)을 지운 표를 봅니다. 행은 기본값(axis=0)이라 axis 를 빼도 됩니다.',
          code: 'df.drop(【0】).head(3)',
          blanks: [{ answers: ['0'], hint: '지울 줄의 이름표.' }],
          read: '이름표 1 부터 시작합니다. 대입하지 않았으니 df 에는 떡볶이가 그대로 있습니다.',
        },
        {
          id: 'columns-drop-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "df.drop('매출')",
          question: 'axis 없이 열 이름을 넣으면?',
          choices: ['매출 열이 지워진다', "KeyError — 「'매출' 이라는 줄이 없다」", '아무 일도 없다', '모든 열이 지워진다'],
          answer: 1,
          why: "axis 를 빼면 줄(axis=0)에서 이름표 '매출' 을 찾습니다. 그런 줄은 없으니 KeyError: \"['매출'] not found in axis\" 가 납니다.",
        },
        {
          id: 'columns-rename', kind: 'code', title: '열 이름 바꾸기',
          what: "rename(columns={'옛 이름': '새 이름'}) — 딕셔너리로 바꿀 짝을 적습니다.",
          code: "df = df.【0】(columns={'매출': '지난주매출'})\ndf.columns",
          blanks: [{ answers: ['rename'], hint: '이름(name)을 다시(re) 짓다.' }],
          read: '매출이 지난주매출로 바뀌었습니다.',
        },
        { kind: 'tip', tone: 'key', title: 'inplace=True 와 대입', text: 'df = df.drop(…) 대신 df.drop(…, inplace=True) 라고 써도 df 가 바뀝니다. 둘 다 같은 일을 하지만, 대입하는 쪽이 「무엇이 바뀌는지」 눈에 잘 보여서 요즘은 대입을 더 권합니다. inplace=True 를 쓰면 결과로 None 이 나오므로 df = df.drop(…, inplace=True) 처럼 섞어 쓰면 df 가 None 이 되어 버립니다.' },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df['칼로리밀도'] = df['칼로리'] / df['가격'] · df.drop(columns=['할인가']) · df.drop([0, 1]) · df.sum(axis=1, numeric_only=True)" },
      ],
      quiz: [
        { q: "'메모' 열을 지우는 코드는?", choices: ["df.drop('메모')", "df.drop('메모', axis=1)", "df.drop('메모', axis=0)", "df.remove('메모')"], answer: 1, why: '열을 지울 때는 axis=1 (또는 columns=[…]).' },
        { q: 'df.sum(axis=1, numeric_only=True) 의 뜻은?', choices: ['열마다 합계', '줄마다 합계', '전체 합계', '오류'], answer: 1, why: 'axis=1 은 좌우로 훑으며 더하므로 줄마다 합계입니다.' },
        { q: "df.drop('메모', axis=1) 을 실행했는데 df 에 메모 열이 그대로 있다. 왜?", choices: ['axis 가 틀려서', '대입하지 않아서', '열 이름이 틀려서', '판다스 버그'], answer: 1, why: 'drop 은 새 표를 돌려줄 뿐입니다. df = df.drop(…) 로 대입하세요.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'values', title: '값 넣기 · 바꾸기 — loc · replace · map', short: '값 바꾸기',
      goal: ['loc 로 칸 하나·여러 칸에 값을 넣는다', '새 줄을 리스트·딕셔너리로 넣는다', 'replace 와 map 으로 값을 바꾼다'],
      cells: [
        { kind: 'example', id: 'values-load', title: '작은 표 준비', code: "import pandas as pd\nimport numpy as np\ndf = pd.read_csv('menu.csv')[['메뉴', '가격', '매운맛']].head(4)\ndf" },
        {
          id: 'values-nan', kind: 'code', title: '빈 열 만들기',
          what: '원산지 열을 만들고 일단 모두 빈칸(NaN)으로 둡니다.',
          code: "df['원산지'] = np.【0】\ndf",
          blanks: [{ answers: ['nan'], hint: '넘파이의 빈칸 — Not a Number 의 줄임.' }],
          read: '원산지가 모두 NaN 입니다.',
        },
        {
          id: 'values-loc', kind: 'code', title: '칸 하나에 값 넣기',
          what: 'loc[줄, 열] = 값. 떡볶이(0번)의 원산지를 국내산으로.',
          code: "df.loc[【0】, '원산지'] = '국내산'\ndf",
          blanks: [{ answers: ['0'], hint: '떡볶이 줄의 이름표.' }],
          read: '떡볶이만 국내산이 되었습니다. 결과 위에 FutureWarning(경고)이 보이면 — 코랩에서도 똑같이 나옵니다. NaN 만 있던 실수 열에 글자를 넣어서 열의 자료형이 바뀐다는 알림일 뿐, 결과는 맞습니다.',
        },
        {
          id: 'values-range', kind: 'code', title: '여러 칸에 한꺼번에',
          what: '1번부터 3번 줄까지 수입산.',
          code: "df.loc[【0】, '원산지'] = '수입산'\ndf",
          blanks: [{ answers: ['1:3'], hint: '1번부터 3번까지 — loc 은 끝 포함.' }],
          read: '1, 2, 3번 세 줄이 바뀌었습니다.',
        },
        {
          id: 'values-addlist', kind: 'code', title: '새 줄 넣기 — 리스트',
          what: '없는 이름표에 값을 넣으면 맨 아래에 새 줄이 생깁니다. 리스트로 넣을 때는 모든 열의 값을 차례대로 적습니다.',
          code: "df.loc[4] = 【0】\ndf",
          blanks: [{ answers: ["['어묵', 1000, 0, '국내산']"], hint: "메뉴·가격·매운맛·원산지 차례로 — ['어묵', 1000, 0, '국내산']" }],
          read: '4번 줄에 어묵이 들어왔습니다. 값의 개수가 열의 개수와 다르면 ValueError 가 납니다.',
        },
        {
          id: 'values-adddict', kind: 'code', title: '새 줄 넣기 — 딕셔너리',
          what: '딕셔너리로 넣으면 일부 열만 적어도 됩니다. 적지 않은 열은 빈칸(NaN)이 됩니다.',
          code: "df.loc[5] = 【0】\ndf",
          blanks: [{ answers: ["{'메뉴': '튀김', '가격': 2000}"], hint: "{'메뉴': '튀김', '가격': 2000} — 매운맛·원산지는 적지 않습니다." }],
          read: '튀김 줄의 매운맛·원산지가 NaN 입니다. 그래서 정수였던 매운맛 열이 실수(0.0, 2.0 …)로 바뀌었습니다 — 빈칸은 실수로만 나타낼 수 있기 때문입니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ 새 줄: 리스트는 모든 열, 딕셔너리는 일부만', text: "df.loc[새이름표] = [값, 값, …] 은 열의 개수만큼 빠짐없이 적어야 합니다. df.loc[새이름표] = {'열': 값} 은 필요한 열만 적어도 되고 나머지는 NaN 이 됩니다. 이름표를 '시즌' 같은 글자로 주면 글자 이름표가 붙습니다." },
        {
          id: 'values-partcol', kind: 'example', title: '일부 줄에만 새 열',
          what: '없는 열을 loc 로 일부 줄에만 만들면, 나머지 줄은 NaN 이 됩니다.',
          code: "df.loc[0:1, '행사가'] = 3000\ndf",
          read: '0, 1번 줄만 3000.0 이고 나머지는 NaN 입니다. 빈칸이 있으니 실수 열입니다.',
        },
        {
          id: 'values-replace', kind: 'code', title: '값 바꾸기 — replace',
          what: '원산지의 수입산을 외국산으로 바꿉니다. replace 도 대입해야 남습니다.',
          code: "df['원산지'] = df['원산지'].【0】('수입산', '외국산')\ndf['원산지']",
          blanks: [{ answers: ['replace'], hint: '「바꾸어 놓다」 — r 로 시작합니다.' }],
          read: '수입산 세 칸이 외국산이 되었습니다. 빈칸(NaN)은 그대로입니다.',
        },
        {
          id: 'values-replace-dict', kind: 'example', title: '여러 값을 한꺼번에 — 딕셔너리',
          code: "change = {'국내산': '한국', '외국산': '외국'}\ndf['원산지'].replace(change)",
          read: '바꿀 짝을 딕셔너리로 만들어 두면 한 번에 바꿀 수 있습니다. 표 전체에 df.replace(change) 를 써도 됩니다.',
        },
        {
          id: 'values-map', kind: 'code', title: '사전으로 짝지어 바꾸기 — map',
          what: '만족도 같은 글자 등급을 숫자로 바꿀 때 실무에서 가장 많이 쓰는 방법입니다. 원래 열은 두고 새 열을 만듭니다.',
          code: "review = pd.DataFrame({'평가': ['좋음', '보통', '나쁨', '보통', '좋음']})\nscore = {'좋음': 3, '보통': 2, '나쁨': 1}\nreview['점수'] = review['평가'].【0】(score)\nreview",
          blanks: [{ answers: ['map'], hint: '짝지어 옮기기(mapping) — 세 글자.' }],
          read: '좋음 → 3, 보통 → 2, 나쁨 → 1. 평가 열은 그대로 두고 점수 열을 새로 만들었습니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ replace 와 map 의 차이',
          table: { head: ['', 'replace(사전)', 'map(사전)'], rows: [['사전에 없는 값', '그대로 둔다', 'NaN 이 된다'], ['쓰는 곳', '몇 가지 값만 고칠 때', '모든 값을 짝지어 바꿀 때 (등급 → 숫자)'], ['함수도 받나', '아니오', "예 — map(len) · map(함수)"]] },
        },
        {
          id: 'values-map-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "review['평가'].map({'좋음': 3, '보통': 2})",
          question: '사전에 「나쁨」이 없다면, 나쁨 칸은?',
          choices: ["'나쁨' 그대로", '0', 'NaN', '오류'],
          answer: 2,
          why: 'map 은 사전에 없는 값을 NaN 으로 만듭니다. 그래서 결과가 실수(3.0, 2.0, NaN …)로 나옵니다. replace 였다면 나쁨이 그대로 남습니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df.loc['시즌'] = ['컵떡볶이', 2500, 1, '한국'] · df.replace('한국', '대한민국') · review['평가'].replace({'좋음': 'GOOD'})" },
      ],
      quiz: [
        { q: "df.loc[10] = ['어묵', 1000] 인데 열이 3개라면?", choices: ['세 번째 열은 NaN', 'ValueError 오류', '새 줄이 두 개 생긴다', '0번 줄이 바뀐다'], answer: 1, why: '리스트로 새 줄을 넣을 때는 열의 개수만큼 값을 적어야 합니다. 일부만 넣으려면 딕셔너리로.' },
        { q: "s.map({'A': 1}) 에서 사전에 없는 'B' 는?", choices: ["'B'", '0', 'NaN', '오류'], answer: 2, why: 'map 은 짝이 없는 값을 NaN 으로 둡니다.' },
        { q: "df['열'].replace('가', '나') 만 실행하고 대입하지 않았다면 df 는?", choices: ['바뀐다', '바뀌지 않는다', '열이 사라진다', '오류'], answer: 1, why: 'replace 도 새 결과를 돌려줄 뿐입니다. df[\'열\'] = df[\'열\'].replace(…) 로 대입하세요.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'missing', title: '결측치 — 비어 있는 칸 다루기', short: '결측치',
      goal: ['열마다 빈칸 수를 센다', '빈칸이 있는 줄을 지우거나(dropna) 채운다(fillna)', '평균·중앙값·최빈값으로 채운다'],
      cells: [
        { kind: 'section', title: '정리 안 된 메뉴판', text: 'menu_raw.csv 는 손으로 옮겨 적다 생긴 문제가 섞인 메뉴판입니다 — 비어 있는 칸, 똑같이 두 번 적힌 줄, 글자로 적힌 맵기. 이번 레슨에서는 빈칸(결측치)을, 다음 레슨에서는 중복과 자료형을 고칩니다.' },
        { kind: 'example', id: 'missing-load', title: '불러오기', code: RAW + '\nraw' },
        {
          id: 'missing-isnull', kind: 'code', title: '빈칸 지도',
          what: '칸마다 비었으면 True, 아니면 False 인 표를 만듭니다.',
          code: 'raw.【0】().head(3)',
          blanks: [{ answers: ['isnull', 'isna'], hint: '「비어 있나(is null)?」 — 붙여 씁니다.' }],
          read: '1번 줄 칼로리, 2번 줄 원산지가 True — 비어 있는 칸입니다.',
        },
        {
          id: 'missing-sum', kind: 'code', title: '열마다 빈칸 수',
          what: 'True 는 1, False 는 0 으로 셀 수 있습니다. 그래서 isnull( ) 에 sum( ) 을 붙이면 열마다 빈칸 수가 됩니다.',
          code: 'raw.isnull().【0】()',
          blanks: [{ answers: ['sum'], hint: 'True(1)를 모두 더하기.' }],
          read: '가격 1, 칼로리 2, 원산지 3 — 빈칸이 모두 6칸입니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ isnull( ) 과 isna( ) 는 같다', text: '두 이름 모두 같은 명령입니다. 표 전체의 빈칸 수는 raw.isnull().sum().sum() — sum 을 한 번 더 붙여 열마다의 합을 다시 더합니다. 빈칸이 가장 많은 열은 raw.isnull().sum().idxmax().' },
        {
          id: 'missing-rows', kind: 'code', title: '빈칸이 있는 줄 보기',
          what: '원산지가 비어 있는 줄만 골라 봅니다. Ⅲ단원의 조건 고르기와 같은 방법입니다.',
          code: "raw[raw['원산지'].【0】()]",
          blanks: [{ answers: ['isnull', 'isna'], hint: '빈칸이면 True.' }],
          read: '원산지가 빈 줄은 라볶이·순대·쿨피스 3줄입니다. 이름표(2, 6, 10)를 보면 원래 몇 번째 줄이었는지 알 수 있습니다.',
        },
        {
          id: 'missing-dropna', kind: 'code', title: '빈칸이 있는 줄 지우기',
          what: 'dropna( ) 는 빈칸이 하나라도 있는 줄을 지웁니다. subset 으로 「이 열이 빈 줄만」 지울 수 있습니다.',
          code: "print(raw.dropna().shape)\nraw.【0】(subset=['가격']).shape",
          blanks: [{ answers: ['dropna'], hint: '빈칸(na)이 있는 줄을 떨어뜨리기(drop).' }],
          read: '(8, 6) 과 (13, 6). 아무 빈칸이나 지우면 14줄 가운데 6줄이 사라지지만, 가격이 빈 줄만 지우면 1줄만 사라집니다. 많이 지울수록 정보도 함께 사라집니다.',
        },
        {
          id: 'missing-fillna', kind: 'code', title: '정해진 값으로 채우기',
          what: '원산지 빈칸을 「모름」으로 채웁니다. 채운 결과를 대입합니다.',
          code: "raw['원산지'] = raw['원산지'].【0】('모름')\nraw['원산지'].value_counts()",
          blanks: [{ answers: ['fillna'], hint: '빈칸(na)을 채우다(fill).' }],
          read: '국내산 8, 모름 3, 수입산 2, 원양산 1 — 빈칸 3칸이 모름으로 채워져 개수에 들어왔습니다. value_counts( ) 는 원래 빈칸을 세지 않으므로, 채우기 전에는 모름 3 이 보이지 않았을 것입니다.',
        },
        {
          id: 'missing-mean', kind: 'code', title: '평균으로 채우기',
          what: '칼로리 빈칸을 칼로리 평균으로 채웁니다. 빈칸은 빼고 평균을 구합니다.',
          code: "m = raw['칼로리'].mean()\nprint(m)\nraw['칼로리'] = raw['칼로리'].fillna(【0】)\nraw['칼로리'].isnull().sum()",
          blanks: [{ answers: ['m'], hint: '평균을 담아 둔 변수.' }],
          read: '평균 390.8333… 은 빈칸 2칸을 뺀 12칸의 평균입니다. 채운 뒤 빈칸 수가 0 이 되었습니다.',
        },
        {
          id: 'missing-median', kind: 'example', title: '중앙값 · 최빈값으로 채우기',
          what: '튀는 값이 있는 열은 평균 대신 중앙값으로, 글자 열은 최빈값(mode()[0])으로 채우기도 합니다.',
          code: "print(raw['가격'].median())\nraw['가격'] = raw['가격'].fillna(raw['가격'].median())\nraw.isnull().sum()",
          read: '가격 빈칸이 중앙값 4000.0 으로 채워져 이제 빈칸이 하나도 없습니다.',
        },
        { kind: 'tip', tone: 'compare', title: '무엇으로 채울까?', table: { head: ['방법', '코드', '어울리는 때'], rows: [['평균', "fillna(df['열'].mean())", '고르게 퍼진 숫자 열'], ['중앙값', "fillna(df['열'].median())", '아주 크거나 작은 값이 섞인 숫자 열'], ['최빈값', "fillna(df['열'].mode()[0])", '글자(범주) 열'], ['앞 값', 'ffill()', '날짜 차례로 쌓인 기록'], ['지우기', 'dropna()', '빈칸이 아주 적을 때']] } },
        {
          id: 'missing-ffill', kind: 'example', title: '앞의 값으로 채우기',
          what: '날씨처럼 날짜 차례로 쌓인 자료는 바로 앞 칸의 값으로 채우는 것이 자연스럽습니다.',
          code: "temp = pd.Series([12.0, np.nan, 13.5, np.nan, np.nan, 11.0])\nprint(temp.ffill().tolist())\nprint(temp.bfill().tolist())",
          read: 'ffill 은 앞 값을, bfill 은 뒤 값을 끌어옵니다. 옛 코드의 fillna(method=\'ffill\') 과 같지만, 판다스 2.2 에서는 ffill( ) 을 쓰라는 경고가 나옵니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) raw.isnull().sum().sum() · raw.dropna(subset=['원산지']) · raw['원산지'].fillna(raw['원산지'].mode()[0])" },
      ],
      quiz: [
        { q: 'df.isnull().sum() 의 결과는?', choices: ['표 전체의 빈칸 수', '열마다 빈칸 수', '줄마다 빈칸 수', '빈칸이 있는 줄'], answer: 1, why: 'isnull( ) 의 True 를 열마다(axis=0) 더하므로 열마다 빈칸 수입니다.' },
        { q: "df['나이'].fillna(df['나이'].mean()) 를 대입하지 않았다면?", choices: ['df 의 빈칸이 채워진다', 'df 는 그대로다', '오류', '나이 열이 사라진다'], answer: 1, why: "fillna 도 새 시리즈를 돌려줄 뿐입니다. df['나이'] = … 로 대입하세요." },
        { q: '글자 열의 빈칸을 가장 많이 나온 값으로 채우는 코드는?', choices: ["fillna(df['열'].mode())", "fillna(df['열'].mode()[0])", "fillna(df['열'].max())", "fillna(df['열'].value_counts())"], answer: 1, why: 'mode( ) 는 시리즈라서 [0] 으로 값 하나를 꺼내 채웁니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'dup', title: '중복과 자료형 바로잡기', short: '중복·자료형',
      goal: ['똑같은 줄을 찾아 지운다', '글자로 적힌 등급을 숫자로 바꾼다', 'astype · to_numeric 으로 자료형을 고친다'],
      cells: [
        { kind: 'example', id: 'dup-load', title: '불러오기', code: RAW },
        {
          id: 'dup-find', kind: 'code', title: '중복된 줄 찾기',
          what: 'duplicated( ) 는 위에 똑같은 줄이 이미 있으면 True 입니다. sum( ) 으로 몇 줄인지 셉니다.',
          code: 'print(raw.【0】().sum())\nraw[raw.duplicated()]',
          blanks: [{ answers: ['duplicated'], hint: '「복제된」 — d 로 시작, ed 로 끝납니다.' }],
          read: '1줄 — 5번 줄 김밥이 3번 줄과 똑같습니다. 처음 나온 3번은 False, 두 번째인 5번만 True 입니다.',
        },
        {
          id: 'dup-drop', kind: 'code', title: '중복 지우기',
          what: '중복 줄을 지우고, 이름표를 다시 매깁니다.',
          code: 'raw = raw.【0】().reset_index(drop=True)\nraw.shape',
          blanks: [{ answers: ['drop_duplicates'], hint: '중복(duplicates)을 떨어뜨리기(drop) — 밑줄로 잇습니다.' }],
          read: '(13, 6) — 14줄에서 1줄이 빠졌습니다.',
        },
        {
          id: 'dup-subset', kind: 'example', title: '특정 열만 보고 중복 판단',
          code: "raw.drop_duplicates(subset=['분류'])",
          read: "subset=['분류'] 이면 분류만 같아도 중복으로 보고 첫 줄만 남깁니다 — 분류마다 대표 메뉴 하나씩. keep='last' 를 주면 마지막 줄을 남깁니다.",
        },
        {
          id: 'dup-object', kind: 'example', title: '맵기 열의 자료형',
          code: "print(raw['맵기'].dtype)\nraw['맵기'].unique()",
          read: "object — 안매움·보통·매움이 글자라서 평균을 낼 수도, 크기를 비교할 수도 없습니다.",
        },
        {
          id: 'dup-map', kind: 'code', title: '등급 글자 → 숫자',
          what: 'map 에 짝 사전을 주어 0·1·2 로 바꿉니다.',
          code: "level = {'안매움': 0, '보통': 1, '매움': 2}\nraw['맵기'] = raw['맵기'].map(【0】)\nraw['맵기'].mean()",
          blanks: [{ answers: ['level'], hint: '짝 사전을 담아 둔 변수.' }],
          read: '이제 숫자 열이라 평균을 구할 수 있습니다.',
          readFree: true,
        },
        {
          id: 'dup-astype-err', kind: 'predict', title: '실행 결과 예측하기',
          code: "pd.Series(['3', '7', '모름']).astype(int)",
          question: "글자 '3', '7' 은 정수로 바꿀 수 있습니다. '모름' 이 섞이면?",
          choices: ['[3, 7, 0]', '[3, 7, NaN]', 'ValueError 오류', "'모름' 만 그대로"],
          answer: 2,
          why: "astype(int) 는 하나라도 바꿀 수 없으면 ValueError: invalid literal for int() 가 납니다.",
        },
        {
          id: 'dup-tonumeric', kind: 'code', title: '바꿀 수 없는 값은 빈칸으로 — to_numeric',
          what: "pd.to_numeric( ) 에 errors='coerce' 를 주면, 숫자로 바꿀 수 없는 값을 오류 대신 NaN 으로 만듭니다.",
          code: "s = pd.Series(['3', '7', '모름'])\npd.【0】(s, errors='coerce')",
          blanks: [{ answers: ['to_numeric'], hint: '숫자(numeric)로(to) — 밑줄로 잇습니다.' }],
          read: '3.0, 7.0, NaN. NaN 이 생겨 실수 열이 되었습니다. 이 빈칸은 앞 레슨처럼 채우면 됩니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) raw.duplicated(subset=['메뉴']).sum() · raw['가격'].astype(str) · raw.dtypes" },
      ],
      quiz: [
        { q: 'df.duplicated() 에서 True 가 되는 줄은?', choices: ['같은 줄 모두', '처음 나온 줄', '두 번째부터 나온 줄', '빈칸이 있는 줄'], answer: 2, why: "기본(keep='first')은 처음 나온 줄을 남기고 그 뒤의 똑같은 줄만 True 입니다." },
        { q: "숫자로 못 바꾸는 글자를 NaN 으로 만들며 숫자 열로 바꾸는 코드는?", choices: ["s.astype(int)", "pd.to_numeric(s, errors='coerce')", "s.map(int)", "s.replace(int)"], answer: 1, why: "errors='coerce' 가 「억지로 바꾸되 안 되면 NaN」 입니다." },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'strings', title: '문자열 다루기 — str 접근자', short: '문자열',
      goal: ['replace 와 str.replace 의 차이를 안다', 'split · contains · len · lower · strip 을 쓴다', 'apply 에 함수를 넣어 새 열을 만든다'],
      cells: [
        { kind: 'example', id: 'strings-load', title: '작은 표 준비', code: "import pandas as pd\nt = pd.DataFrame({\n    '상품': ['떡볶이 세트', '튀김 모둠', '순대 한접시'],\n    '수량': [10, 20, 30],\n    '코드': ['ab cd', 'AB CD', 'ab cd ']\n})\nt" },
        {
          id: 'strings-replace-try', kind: 'predict', title: '실행 결과 예측하기',
          code: "t['상품'].replace('세트', '단품')",
          question: "replace 로 '세트' 를 '단품' 으로 바꾸면 첫 칸은?",
          choices: ["'떡볶이 단품'", "'떡볶이 세트' (그대로)", "'단품'", '오류'],
          answer: 1,
          why: "replace( ) 는 칸의 값 전체가 '세트' 와 똑같을 때만 바꿉니다. '떡볶이 세트' 는 '세트' 와 다르므로 그대로입니다. replace('떡볶이 세트', '단품') 처럼 통째로 적으면 바뀝니다.",
        },
        {
          id: 'strings-strreplace', kind: 'code', title: '글자 일부만 바꾸기 — str.replace',
          what: '칸 안의 글자 일부를 바꾸려면 str 접근자를 거칩니다.',
          code: "t['상품'] = t['상품'].【0】.replace('세트', '단품')\nt['상품']",
          blanks: [{ answers: ['str'], hint: '문자열(string)의 줄임 — 세 글자.' }],
          read: '떡볶이 단품 — 이번에는 일부만 바뀌었습니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ replace 와 str.replace',
          table: { head: ['', "s.replace('가', '나')", "s.str.replace('가', '나')"], rows: [['바꾸는 단위', '칸의 값 전체가 같을 때', '칸 안의 글자 일부'], ['숫자 열', '된다 — replace(10, 100)', '안 된다 — 오류'], ['예', "'떡볶이 세트' 는 안 바뀜", "'떡볶이 세트' → '떡볶이 단품'"]] },
        },
        {
          id: 'strings-num', kind: 'predict', title: '실행 결과 예측하기',
          code: "t['수량'].str.replace('10', '100')",
          question: '숫자 열에 str 을 쓰면?',
          choices: ['10 이 100 으로 바뀐다', '아무것도 안 바뀐다', 'AttributeError 오류', '글자 열로 바뀐다'],
          answer: 2,
          why: "Can only use .str accessor with string values! — str 은 글자 열에만 씁니다. 숫자는 t['수량'].replace(10, 100) 처럼 바꿉니다.",
        },
        {
          id: 'strings-split', kind: 'code', title: '나누기 — split',
          what: 'split( ) 은 띄어쓰기를 기준으로 글자를 나눠 리스트로 만듭니다. 이어서 str[0] 으로 칸마다 첫 조각을 꺼냅니다.',
          code: "print(t['상품'].str.split())\nt['종류'] = t['상품'].str.split().【0】\nt",
          blanks: [{ answers: ['str[0]'], hint: '칸마다 첫 번째 조각 — str 을 한 번 더 거쳐 [0].' }],
          read: "칸마다 ['떡볶이', '단품'] 같은 리스트가 되었고, str[0] 으로 첫 낱말만 꺼내 종류 열을 만들었습니다. 마지막 조각은 str[-1] 입니다.",
        },
        { kind: 'tip', tone: 'warn', title: "split( )[0] 과 split( ).str[0]", text: "t['상품'].str.split()[0] 은 「0번 줄의 리스트」 하나입니다(줄 고르기). 칸마다 첫 조각이 필요하면 .str[0] 처럼 str 을 한 번 더 거쳐야 합니다." },
        {
          id: 'strings-contains', kind: 'code', title: '글자가 들어 있나 — contains',
          what: "상품 이름에 '튀김' 이 들어 있으면 True.",
          code: "t['상품'].str.【0】('튀김')",
          blanks: [{ answers: ['contains'], hint: '「포함하다」 — c 로 시작합니다.' }],
          read: '튀김 모둠만 True. 조건으로 써서 df[df[\'상품\'].str.contains(\'튀김\')] 처럼 고를 수 있습니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ isin 과 str.contains',
          table: { head: ['', 'isin([…])', 'str.contains(…)'], rows: [['맞는 조건', '칸 전체가 목록의 값과 똑같을 때', '칸 안에 그 글자가 들어 있을 때'], ['여러 개 찾기', "isin(['가', '나']) — 한 번에", "contains('가|나') — | 로 잇기"], ['예', "'떡볶이 세트' 는 isin(['세트']) 에 거짓", "'떡볶이 세트' 는 contains('세트') 에 참"]] },
        },
        {
          id: 'strings-len', kind: 'example', title: '글자 수 · 대소문자',
          code: "print(t['상품'].str.len().tolist())\nprint(t['코드'].str.upper().tolist())\nprint('AB cd' == 'ab CD')",
          read: '글자 수는 빈칸도 셉니다. 파이썬은 대문자·소문자를 다른 글자로 봐서 마지막 줄이 False 입니다.',
        },
        {
          id: 'strings-clean', kind: 'code', title: '코드 열 한 가지 모양으로 맞추기',
          what: "'ab cd', 'AB CD', 'ab cd ' 는 사람 눈에는 같지만 컴퓨터에는 셋 다 다릅니다. 소문자로 바꾸고 빈칸을 모두 지웁니다.",
          code: "t['코드'] = t['코드'].str.lower()\nt['코드'] = t['코드'].str.replace(' ', '')\nt['코드'].【0】()",
          blanks: [{ answers: ['nunique'], hint: '종류 수 — 앞에 n.' }],
          read: '1 — 세 칸이 모두 abcd 로 같아졌습니다. 앞뒤 빈칸만 지울 때는 str.strip( ) 을 씁니다.',
        },
        {
          id: 'strings-slice', kind: 'predict', title: '실행 결과 예측하기',
          code: "print(t['상품'].str[0:2].tolist())\nprint(t['상품'][0:2].tolist())",
          question: '두 줄의 결과는 어떻게 다를까요?',
          choices: ['둘 다 칸마다 앞 두 글자', '첫 줄은 칸마다 앞 두 글자, 둘째 줄은 앞의 두 줄', '둘 다 앞의 두 줄', '둘째 줄은 오류'],
          answer: 1,
          why: "str[0:2] 는 칸 안의 글자를 자르고, [0:2] 는 줄을 자릅니다. ['떡볶', '튀김', '순대'] 와 ['떡볶이 단품', '튀김 모둠'].",
        },
        { kind: 'tip', tone: 'warn', title: '★ str 을 빼먹으면 줄을 고른다', text: "s.str[1:3] — 칸마다 글자 자르기. s[1:3] — 1, 2번 줄 고르기. 글자를 다루는 명령에는 늘 .str 을 붙입니다(str.replace · str.contains · str.split · str.len · str.lower …)." },
        {
          id: 'strings-apply', kind: 'code', title: '내가 만든 함수로 새 열 — apply',
          what: '수량이 15 이상이면 「많음」, 아니면 「적음」을 돌려주는 함수를 만들고, apply 로 칸마다 적용합니다.',
          code: "def size(x):\n    if x >= 15:\n        return '많음'\n    else:\n        return '적음'\n\nt['규모'] = t['수량'].【0】(size)\nt",
          blanks: [{ answers: ['apply'], hint: '「적용하다」 — a 로 시작합니다.' }],
          read: '10 → 적음, 20·30 → 많음. 함수 이름을 넣을 때는 괄호를 붙이지 않습니다(size 가 맞고 size( ) 는 틀림).',
        },
        {
          id: 'strings-lambda', kind: 'example', title: '한 줄 함수 — lambda',
          code: "t['수량'].apply(lambda x: '많음' if x >= 15 else '적음')",
          read: 'def 로 만든 함수와 같은 일을 한 줄로 씁니다. lambda 입력: 결과 — 「x 를 받아 … 를 돌려준다」.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) t['상품'].str.split().str[-1] · t['상품'].str.startswith('떡') · t['상품'].str.contains('떡|순') · t['수량'].apply(lambda x: x * 2)" },
      ],
      quiz: [
        { q: "s = pd.Series(['사과 주스']) 에서 '사과' 를 '포도' 로 바꾸는 코드는?", choices: ["s.replace('사과', '포도')", "s.str.replace('사과', '포도')", "s.replace(['사과'], '포도')", "s.map({'사과': '포도'})"], answer: 1, why: "글자 일부만 바꾸려면 str.replace 입니다. replace 는 칸 전체가 '사과' 일 때만 바꿉니다." },
        { q: "s.str.split().str[-1] 의 뜻은?", choices: ['마지막 줄', '칸마다 마지막 조각', '마지막 글자', '오류'], answer: 1, why: '띄어쓰기로 나눈 리스트에서 칸마다 마지막(-1) 조각을 꺼냅니다.' },
        { q: "df['메뉴'].apply(f) 에서 f 를 쓰는 법으로 옳은 것은?", choices: ['apply(f())', 'apply(f)', "apply('f')", 'apply[f]'], answer: 1, why: '함수 그 자체를 넘기므로 괄호 없이 이름만 씁니다.' },
      ],
    },
  ],
};
