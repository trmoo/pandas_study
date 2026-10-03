// © 2026 티쳐무 · 모든 권리 보유
// Ⅲ. 골라내기 — 열과 행 · loc / iloc · 조건으로 고르기 · 정렬
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.

const LOAD = "import pandas as pd\ndf = pd.read_csv('menu.csv')";

export const T3 = {
  id: 'select', num: 'Ⅲ', icon: '🎯', title: '골라내기', desc: 'loc·iloc · 조건 · 정렬',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'locs', title: 'loc 과 iloc — 이름표로, 위치로', short: 'loc·iloc',
      goal: ['loc[이름표, 열이름] 과 iloc[위치, 열위치] 를 구별해 쓴다', 'loc 은 끝을 포함하고 iloc 은 끝을 뺀다는 것을 안다', 'set_index 로 이름표를 바꿔 쓴다'],
      cells: [
        { kind: 'example', id: 'locs-load', title: '데이터 불러오기', code: LOAD + '\ndf.head()' },
        {
          kind: 'tip', tone: 'compare', title: '★ loc 과 iloc',
          table: { head: ['', 'df.loc[ ]', 'df.iloc[ ]'], rows: [['무엇으로', '이름표(인덱스 명) · 열 이름', '위치 번호 · 열 번호 (0 부터)'], ['꼴', 'df.loc[줄이름, 열이름]', 'df.iloc[줄번호, 열번호]'], ['범위 끝', '포함한다  1:3 → 1, 2, 3', '빼다  1:3 → 1, 2'], ['예', "df.loc[1:3, '메뉴':'가격']", 'df.iloc[1:3, 0:2]']] },
        },
        {
          id: 'locs-row', kind: 'code', title: '줄 하나 — 이름표로',
          what: 'loc[이름표] 는 그 줄 전체를 시리즈로 줍니다. 지금 이름표는 0 부터 붙은 번호입니다.',
          code: 'df.【0】[3]',
          blanks: [{ answers: ['loc'], hint: '이름표(location 의 앞 세 글자)로 고르는 인덱서.' }],
          read: '3번 줄 김밥의 모든 열이 세로로 나왔습니다. 글자와 숫자가 섞여 dtype 이 object 입니다.',
        },
        {
          id: 'locs-cell', kind: 'code', title: '칸 하나 — 줄과 열을 함께',
          what: '쉼표 앞은 줄, 뒤는 열입니다.',
          code: "df.loc[3, 【0】]",
          blanks: [{ answers: ["'가격'", '"가격"'], hint: '김밥의 가격 — 열 이름을 따옴표로.' }],
          read: 'np.int64(3500). 줄 하나·열 하나를 고르면 값 하나가 나옵니다.',
        },
        {
          id: 'locs-range', kind: 'code', title: '범위로 고르기 — loc',
          what: '1번부터 3번 줄, 메뉴부터 가격까지. 쌍점(:)이 범위입니다.',
          code: "df.loc[【0】, '메뉴':'가격']",
          blanks: [{ answers: ['1:3'], hint: '1번부터 3번까지 — 시작:끝' }],
          read: '1, 2, 3 세 줄과 메뉴·분류·가격 세 열이 나왔습니다. loc 은 끝(3, 가격)까지 포함합니다.',
        },
        {
          id: 'locs-irange', kind: 'code', title: '범위로 고르기 — iloc',
          what: '같은 모양을 위치 번호로 골라 봅니다.',
          code: 'df.【0】[1:3, 0:2]',
          blanks: [{ answers: ['iloc'], hint: '정수(integer) 위치로 고르는 인덱서 — loc 앞에 i.' }],
          read: '이번에는 1, 2 두 줄과 0, 1번 열(메뉴·분류)만 나옵니다. iloc 은 파이썬 리스트 자르기처럼 끝(3, 2)을 빼고 셉니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ 슬라이싱의 끝 — loc 은 포함, iloc 은 미포함', text: "df.loc[1:3] 은 3줄, df.iloc[1:3] 은 2줄입니다. 시험에 자주 나오는 함정입니다. loc 은 「이름표 1번부터 3번까지」, iloc 은 「1번 자리부터 3번 자리 앞까지」라고 읽으면 헷갈리지 않습니다." },
        {
          id: 'locs-col', kind: 'code', title: '열 하나 전체',
          what: '줄 자리에 쌍점(:) 만 쓰면 「모든 줄」입니다. 가격 열 전체를 iloc 으로 꺼냅니다.',
          code: 'df.iloc[:, 【0】]',
          blanks: [{ answers: ['2'], hint: '메뉴 0, 분류 1, 가격은 몇 번 열일까요?' }],
          read: "df.loc[:, '가격'] · df['가격'] 과 같은 시리즈입니다.",
        },
        {
          id: 'locs-list', kind: 'example', title: '띄엄띄엄 고르기',
          what: '범위 대신 리스트를 쓰면 원하는 것만 골라 옵니다.',
          code: "df.loc[[0, 4, 8], ['메뉴', '칼로리']]",
          read: '0·4·8번 줄의 메뉴와 칼로리입니다.',
        },
        { kind: 'section', title: '이름표가 바뀌면 loc 과 iloc 이 달라진다', text: '지금까지는 이름표가 0, 1, 2 … 라서 loc 과 iloc 이 비슷해 보였습니다. 줄을 지우거나 이름표를 글자로 바꾸면 차이가 드러납니다.' },
        {
          id: 'locs-drop', kind: 'code', title: '0번 줄을 지운 표에서',
          what: '0번 줄(떡볶이)을 지운 표를 만들고, 이름표 1번과 위치 0번을 각각 꺼내 봅니다.',
          code: "df2 = df.drop(0)\nprint(df2.loc[1, '메뉴'])\nprint(df2.【0】[0, 0])",
          blanks: [{ answers: ['iloc'], hint: '위치로 고르는 인덱서.' }],
          read: '둘 다 치즈떡볶이입니다. 이름표 1번 줄이 이제 맨 앞(위치 0)에 있기 때문입니다. df2.loc[0] 은 이름표 0 이 없어져서 KeyError 가 납니다.',
        },
        {
          id: 'locs-setindex', kind: 'code', title: '메뉴 이름을 이름표로',
          what: 'set_index(열) 은 그 열을 이름표로 올립니다. 그러면 loc 에 메뉴 이름을 쓸 수 있습니다.',
          code: "m = df.【0】('메뉴')\nm.loc['김밥':'순대', '가격':'칼로리']",
          blanks: [{ answers: ['set_index'], hint: '인덱스(index)를 정하다(set) — 밑줄로 잇습니다.' }],
          read: '김밥부터 순대까지(끝 포함), 가격과 칼로리입니다. 이름표 열 위에 「메뉴」라는 이름이 따로 한 줄 보입니다.',
        },
        {
          id: 'locs-idx-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "m.iloc[0, '가격']",
          question: '이름표가 메뉴 이름인 m 에서 이 코드를 실행하면?',
          choices: ['4500 (떡볶이 가격)', '3500 (김밥 가격)', '오류가 난다', '가격 열 전체'],
          answer: 2,
          why: "iloc 에는 열도 위치 번호로 적어야 합니다. 열 이름을 쓰면 ValueError 가 납니다. 「i 번째 줄의 메뉴」가 필요하면 m.iloc[0, 1] 처럼 번호로 쓰거나, loc 으로 df.loc[이름표, '메뉴'] 처럼 씁니다.",
        },
        { kind: 'tip', tone: 'warn', title: '★ iloc 에 열 이름을 쓰면 오류', text: "자주 하는 실수: idx = df['판매량'].idxmax() 로 이름표를 구한 뒤 df.iloc[idx, '메뉴'] 라고 쓰기. iloc 은 숫자만 받습니다. 이름표와 열 이름을 함께 쓰려면 df.loc[idx, '메뉴'] 입니다." },
        { kind: 'panel', panel: 'locs' },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df.iloc[-1] · df.loc[[1, 3], '메뉴'] · m.loc['라면'] · df.iloc[::2, :2]" },
      ],
      quiz: [
        { q: 'df.loc[2:4] 는 몇 줄인가요? (이름표 0~11)', choices: ['2줄', '3줄', '4줄', '5줄'], answer: 1, why: 'loc 은 끝을 포함합니다. 2, 3, 4 — 3줄입니다.' },
        { q: 'df.iloc[2:4] 는 몇 줄인가요?', choices: ['2줄', '3줄', '4줄', '5줄'], answer: 0, why: 'iloc 은 끝을 뺍니다. 2, 3 — 2줄입니다.' },
        { q: "idx = df['가격'].idxmax() 일 때 가장 비싼 메뉴의 이름을 꺼내는 코드는?", choices: ["df.iloc[idx, '메뉴']", "df.loc[idx, '메뉴']", "df[idx, '메뉴']", "df.loc['메뉴', idx]"], answer: 1, why: 'idxmax( ) 는 이름표를 돌려주므로 loc 으로 씁니다. iloc 에 열 이름을 쓰면 오류입니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'filter', title: '조건으로 고르기 — 필터링', short: '조건 필터',
      goal: ['조건을 변수에 담아 df[조건] 으로 고른다', '& · | · ~ 로 조건을 잇는다', 'isin · between 을 쓰고, 조건에 맞는 개수를 센다'],
      cells: [
        { kind: 'section', title: '데이터 분석에서 가장 많이 쓰는 기술', text: '「가격이 5000원 넘는 메뉴만」, 「음료이면서 칼로리가 낮은 것만」 — 조건에 맞는 줄만 남기는 것을 필터링이라고 합니다. 원리는 Ⅰ단원에서 본 그대로입니다. 줄마다 참·거짓을 구하고, 참인 줄만 남깁니다.' },
        { kind: 'example', id: 'filter-load', title: '데이터 불러오기', code: LOAD },
        {
          id: 'filter-bool', kind: 'example', title: '조건의 정체 — 참·거짓 시리즈',
          code: "df['칼로리'] < 300",
          read: '줄마다 True / False 가 나옵니다. 칼로리가 300 보다 작은 쿨피스·식혜·붕어빵(9, 10, 11번)만 True 입니다.',
        },
        {
          id: 'filter-one', kind: 'code', title: '조건 하나로 고르기',
          what: '조건을 cond 라는 변수에 담고, df[cond] 로 참인 줄만 남깁니다.',
          code: "cond = df['칼로리'] < 300\ndf[【0】]",
          blanks: [{ answers: ['cond'], hint: '조건을 담아 둔 변수 이름.' }],
          read: '칼로리가 300 미만인 세 줄만 남았습니다. 이름표(9, 10, 11)는 원래 번호 그대로입니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ 조건은 변수에 담아 쓰자', text: "df[df['칼로리'] < 300] 처럼 한 줄로 써도 되지만, 대괄호가 겹쳐서 읽기 어렵고 조건이 많아지면 틀리기 쉽습니다. cond1 = …, cond2 = … 처럼 변수에 담아 두면 고치기도, 확인하기도 쉽습니다." },
        {
          id: 'filter-not', kind: 'code', title: '반대로 — 물결(~)',
          what: '조건 앞에 ~ 를 붙이면 참과 거짓이 뒤집힙니다.',
          code: "df[【0】cond]",
          blanks: [{ answers: ['~'], hint: '키보드 왼쪽 위 물결표.' }],
          read: '칼로리가 300 이상인 9줄이 남았습니다. df[df[\'칼로리\'] >= 300] 과 같습니다.',
        },
        {
          id: 'filter-and', kind: 'code', title: '두 조건 모두 — &',
          what: '가격이 5000원 이상이면서 매운맛이 1단계 이상인 메뉴.',
          code: "cond1 = df['가격'] >= 5000\ncond2 = df['매운맛'] >= 1\ndf[cond1 【0】 cond2]",
          blanks: [{ answers: ['&'], hint: '「그리고」를 뜻하는 기호 — 숫자 7 위에 있습니다.' }],
          read: '치즈떡볶이·라볶이·제육덮밥 세 줄입니다. 돈가스는 비싸지만 맵지 않아서 빠졌습니다.',
        },
        {
          id: 'filter-or', kind: 'code', title: '둘 중 하나라도 — |',
          what: '음료이거나 디저트인 메뉴.',
          code: "c1 = df['분류'] == '음료'\nc2 = df['분류'] == '디저트'\ndf[c1 【0】 c2]",
          blanks: [{ answers: ['|'], hint: '「또는」을 뜻하는 세로 막대 — 엔터 키 위, 역슬래시(\\)와 같은 자리입니다.' }],
          read: '쿨피스·식혜·붕어빵 세 줄입니다. 같은지 비교할 때는 = 가 아니라 == 두 개를 씁니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ 판다스에서는 and · or 대신 & · |', text: "파이썬의 and·or 는 값 하나끼리만 견줍니다. 시리즈(여러 칸)를 이으면 「The truth value of a Series is ambiguous」 오류가 납니다. 그리고 조건을 한 줄에 바로 쓸 때는 (df['가격'] >= 5000) & (df['매운맛'] >= 1) 처럼 조건마다 괄호가 꼭 필요합니다 — & 를 >= 보다 먼저 계산하기 때문입니다." },
        {
          id: 'filter-and-err', kind: 'predict', title: '실행 결과 예측하기',
          code: "df[(df['가격'] >= 5000) and (df['매운맛'] >= 1)]",
          question: '& 대신 and 를 쓰면?',
          choices: ['& 와 같은 결과', '빈 표', 'ValueError 오류', '가격 조건만 적용된다'],
          answer: 2,
          why: 'and 는 양쪽을 참 하나·거짓 하나로 판단하려고 하는데, 시리즈는 참·거짓이 여러 개라서 판단할 수 없다는 ValueError 입니다.',
        },
        {
          id: 'filter-isin', kind: 'code', title: '목록 안에 있나 — isin',
          what: '여러 값 가운데 하나와 같은 줄을 고를 때는 == 를 여러 번 잇는 대신 isin([목록]) 을 씁니다.',
          code: "box = ['떡볶이', '김밥', '라면']\ndf[df['메뉴'].【0】(box)]",
          blanks: [{ answers: ['isin'], hint: '「~안에 있나(is in)」 — 붙여 씁니다.' }],
          read: '목록에 있는 세 메뉴만 남았습니다. isin 안에는 꼭 리스트를 넣습니다. 하나만 찾아도 isin([\'김밥\']) 처럼 대괄호로.',
        },
        {
          id: 'filter-between', kind: 'example', title: '범위 안에 있나 — between',
          code: "df[df['가격'].between(4000, 5000)]",
          read: '4000 이상 5000 이하(양쪽 끝 포함)인 메뉴입니다. (df[\'가격\'] >= 4000) & (df[\'가격\'] <= 5000) 과 같습니다.',
        },
        {
          id: 'filter-count', kind: 'code', title: '조건에 맞는 개수 세기',
          what: '참은 1, 거짓은 0 으로 셀 수 있으므로 조건을 sum( ) 하면 개수가 됩니다. 세 가지 방법을 비교합니다.',
          code: "cond = df['가격'] > 5000\nprint(cond.【0】())\nprint(len(df[cond]))\nprint(df[cond].shape[0])",
          blanks: [{ answers: ['sum'], hint: '참(1)을 모두 더하기.' }],
          read: '세 줄 모두 4 — 치즈떡볶이·라볶이·돈가스·제육덮밥. 「조건에 맞는 것은 몇 개?」는 빅데이터분석기사 작업형1의 단골 문제입니다.',
        },
        { kind: 'tip', tone: 'exam', title: '★ 조건 개수 세기 — 작업형1 단골', text: "sum(cond) · cond.sum() · len(df[cond]) · df[cond].shape[0] 모두 같은 값입니다. 손에 익은 것 하나를 정해 두세요. 답은 print( ) 로 찍어야 채점됩니다." },
        {
          id: 'filter-col', kind: 'example', title: '고른 뒤 열까지 고르기',
          code: "df.loc[df['분류'] == '분식', '메뉴'].tolist()",
          read: "loc[조건, 열] 로 조건에 맞는 줄의 메뉴만 꺼내 리스트로 바꿨습니다.",
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df[df['메뉴'].str.contains('김밥')] · (df['판매량'] >= 100).sum() · df[~df['분류'].isin(['분식'])]" },
      ],
      quiz: [
        { q: "가격이 3000 이상 5000 이하인 줄을 고르는 코드로 옳은 것은?", choices: ["df[df['가격'] >= 3000 and df['가격'] <= 5000]", "df[(df['가격'] >= 3000) & (df['가격'] <= 5000)]", "df[df['가격'] >= 3000 & df['가격'] <= 5000]", "df[3000 <= df['가격'] <= 5000]"], answer: 1, why: '판다스는 & 를 쓰고, 조건마다 괄호로 감쌉니다. between(3000, 5000) 도 됩니다.' },
        { q: "cond 가 참·거짓 시리즈일 때, 거짓인 줄만 고르는 코드는?", choices: ['df[!cond]', 'df[not cond]', 'df[~cond]', 'df[-cond]'], answer: 2, why: '물결(~)이 참·거짓을 뒤집습니다.' },
        { q: "df['메뉴'].isin('김밥') 처럼 글자를 바로 넣으면?", choices: ['김밥만 참', 'TypeError 오류', '모두 거짓', '김밥이 들어간 메뉴 모두 참'], answer: 1, why: 'isin 에는 리스트를 넣어야 합니다 — isin([\'김밥\']). 글자 하나를 넣으면 TypeError 가 납니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'sort', title: '정렬과 순위', short: '정렬',
      goal: ['sort_values 로 값 차례대로 늘어놓는다', '여러 열로 정렬하고 결과를 변수에 저장한다', 'reset_index · nlargest · idxmax 를 쓴다'],
      cells: [
        { kind: 'example', id: 'sort-load', title: '데이터 불러오기', code: LOAD },
        {
          id: 'sort-values', kind: 'code', title: '값으로 정렬',
          what: '판매량이 많은 차례로 늘어놓습니다. ascending 은 「오름차순」 — False 면 내림차순입니다.',
          code: "df.【0】('판매량', ascending=【1】)",
          blanks: [
            { answers: ['sort_values'], hint: '값(values)으로 정렬(sort) — 끝에 s 가 붙습니다!' },
            { answers: ['False'], hint: '큰 것부터(내림차순) — 오름차순이 「아니다」.' },
          ],
          read: '김밥(150)이 맨 위, 식혜(38)가 맨 아래입니다. 이름표는 원래 번호를 그대로 달고 따라갑니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ sort_values( ) 와 ascending', text: 'sort_values — values 에 s 가 붙습니다. ascending=True(기본값)는 작은 것부터, False 는 큰 것부터입니다. 괄호 안 첫 자리는 정렬할 열 이름(by=) 입니다.' },
        {
          id: 'sort-multi', kind: 'code', title: '여러 열로 정렬하고 저장하기',
          what: '분류는 가나다순, 같은 분류 안에서는 가격이 비싼 차례로. 열 이름과 ascending 을 리스트로 짝지어 줍니다. 정렬한 결과는 대입해야 남습니다.',
          code: "df_sorted = df.sort_values(【0】, ascending=[True, False])\ndf_sorted",
          blanks: [{ answers: ["['분류', '가격']", '["분류", "가격"]'], hint: "정렬할 열 두 개를 리스트로 — ['분류', '가격']" }],
          read: '디저트 → 분식 → 식사 → 음료 차례이고, 분식 안에서는 라볶이(6000)부터 김밥(3500)까지 비싼 차례입니다. 떡볶이와 참치김밥은 가격이 4500 으로 같아서 원래 차례대로 놓였습니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ 정렬은 대입해야 남는다', text: "df.sort_values(…) 만 실행하면 정렬된 「새 표」를 보여 줄 뿐 df 는 그대로입니다. 계속 쓰려면 df = df.sort_values(…) 처럼 대입하세요. replace · drop · fillna · reset_index 도 모두 같습니다." },
        {
          id: 'sort-reset', kind: 'code', title: '이름표 새로 매기기',
          what: '정렬하면 이름표가 뒤섞입니다. reset_index(drop=True) 로 0 부터 다시 매깁니다.',
          code: "df_sorted = df_sorted.reset_index(【0】)\ndf_sorted.head(3)",
          blanks: [{ answers: ['drop=True', 'drop = True'], hint: '옛 이름표를 버리기(drop) — 이름=True 꼴.' }],
          read: '이름표가 0, 1, 2 로 다시 붙었습니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ drop=True 를 빼면', text: '옛 이름표가 index 라는 새 열로 표 안에 남습니다. 필요 없으면 drop=True 를 붙이세요. 그리고 reset_index 도 대입해야 남습니다.' },
        {
          id: 'sort-reset-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "df.sort_values('칼로리').reset_index().columns",
          question: 'drop=True 없이 reset_index( ) 하면 열 이름 목록의 맨 앞은?',
          choices: ["'메뉴'", "'index'", "'Unnamed: 0'", "'level_0'"], answer: 1,
          why: '옛 이름표가 index 라는 열로 맨 앞에 들어옵니다.',
        },
        {
          id: 'sort-nlargest', kind: 'code', title: '가장 큰 것 몇 개 — nlargest',
          what: '정렬한 뒤 head 를 쓰는 대신, nlargest(개수, 열) 로 한 번에 구할 수 있습니다.',
          code: "df.【0】(3, '칼로리')",
          blanks: [{ answers: ['nlargest'], hint: 'n 개의 가장 큰(largest) 것.' }],
          read: '돈가스(890)·제육덮밥(780)·라볶이(650). 가장 작은 것은 nsmallest 입니다.',
        },
        {
          id: 'sort-idxmax', kind: 'code', title: '가장 큰 값이 있는 줄의 이름표',
          what: 'idxmax( ) 는 최댓값이 있는 줄의 이름표를 돌려줍니다. 그 이름표로 loc 을 쓰면 그 줄의 다른 열을 꺼낼 수 있습니다.',
          code: "i = df['판매량'].【0】()\nprint(i)\ndf.loc[i, '메뉴']",
          blanks: [{ answers: ['idxmax'], hint: '최댓값(max)의 인덱스(idx).' }],
          read: "3 과 '김밥' — 판매량이 가장 많은 메뉴는 3번 줄 김밥입니다. 최솟값의 이름표는 idxmin( ).",
        },
        {
          id: 'sort-index', kind: 'example', title: '이름표 차례로 되돌리기',
          code: "df.sort_values('칼로리').sort_index().head(3)",
          read: 'sort_index( ) 는 이름표 차례로 정렬합니다. 칼로리로 섞었던 표가 원래 차례로 돌아왔습니다.',
        },
        { kind: 'tip', tone: 'warn', title: '같은 값끼리의 차례', text: '가격처럼 같은 값이 있는 열 하나로만 정렬하면, 같은 값끼리의 차례가 코랩과 이 실습실에서 다를 수 있습니다(판다스가 쓰는 정렬 방식 때문). 차례가 중요하면 열을 둘 이상 주어 확실히 정하세요.' },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df.sort_values('메뉴') · df.nsmallest(2, '가격') · df['칼로리'].idxmin() · df.sort_values('판매량').tail(1)" },
      ],
      quiz: [
        { q: '가격이 비싼 차례로 정렬하는 코드는?', choices: ["df.sort_value('가격')", "df.sort_values('가격', ascending=False)", "df.sort_values('가격', descending=True)", "df.sort('가격')"], answer: 1, why: 'sort_values — s 가 붙고, 내림차순은 ascending=False 입니다.' },
        { q: "df.sort_values('가격') 만 실행한 뒤 df 를 보면?", choices: ['가격 차례로 바뀌어 있다', '원래 차례 그대로다', '가격 열이 사라진다', '오류'], answer: 1, why: '정렬된 새 표를 보여 줄 뿐입니다. df = df.sort_values(…) 로 대입해야 바뀝니다.' },
        { q: 'reset_index( ) 에 drop=True 를 붙이는 까닭은?', choices: ['표를 지우려고', '옛 이름표가 열로 남지 않게 하려고', '빈칸을 지우려고', '정렬을 되돌리려고'], answer: 1, why: 'drop=True 가 없으면 옛 이름표가 index 열로 남습니다.' },
      ],
    },
  ],
};
