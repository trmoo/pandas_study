// © 2026 티쳐무 · 모든 권리 보유
// Ⅱ. 들여다보기 — 표의 생김새 · 기술 통계 · 범주 세기
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.

const LOAD = "import pandas as pd\ndf = pd.read_csv('menu.csv')";

export const T2 = {
  id: 'look', num: 'Ⅱ', icon: '🔍', title: '들여다보기', desc: '표의 생김새 · 기술 통계 · 범주 세기',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'first', title: '표와 첫인사 — 생김새 확인하기', short: '첫인사',
      goal: ['CSV 를 불러와 앞·뒤 몇 줄을 본다', '행·열 수와 열 이름, 자료형을 확인한다', 'info( ) 로 빈칸 수까지 한 번에 본다'],
      cells: [
        { kind: 'section', title: '데이터를 받으면 제일 먼저', text: '데이터 분석은 「이 표가 어떻게 생겼나」부터 확인하는 일(탐색적 데이터 분석, EDA)로 시작합니다. 몇 줄인지, 무슨 열이 있는지, 숫자인지 글자인지, 빈칸은 없는지.' },
        {
          id: 'first-load', kind: 'code', title: '불러와서 앞부분 보기',
          what: '별빛 분식 메뉴판을 df 라는 이름으로 불러오고, 앞의 5줄을 봅니다.',
          code: "import pandas as pd\ndf = pd.read_csv('menu.csv')\ndf.【0】()",
          blanks: [{ answers: ['head'], hint: '「머리」 — 앞부분을 보여 줍니다.' }],
          read: '괄호를 비우면 5줄이 나옵니다. head(3) 처럼 수를 넣으면 그만큼 나옵니다.',
        },
        {
          id: 'first-tail', kind: 'code', title: '뒷부분 보기',
          what: '맨 끝의 3줄을 봅니다.',
          code: 'df.【0】(3)',
          blanks: [{ answers: ['tail'], hint: '「꼬리」 — 뒷부분을 보여 줍니다.' }],
          read: '줄 이름표 9, 10, 11 이 보입니다. 이름표가 0 부터 시작하므로 12줄짜리 표의 마지막 이름표는 11 입니다.',
        },
        { kind: 'tip', tone: 'key', title: 'head · tail · sample', text: '앞에서부터 n개 `head(n)`, 뒤에서부터 `tail(n)`, 아무 데서나 `sample(n)`. 셋 다 괄호를 비우면 head·tail 은 5줄, sample 은 1줄입니다. sample 은 무작위라서 실행할 때마다 결과가 달라지므로 이 실습실에서는 쓰지 않습니다(코랩에서 해 보세요).' },
        {
          id: 'first-shape', kind: 'code', title: '행과 열의 수',
          what: '(행 수, 열 수) 를 확인합니다.',
          code: 'df.【0】',
          blanks: [{ answers: ['shape'], strict: true, hint: '「모양」. 괄호 없이 씁니다.' }],
          read: '(12, 6) — 메뉴 12가지, 열 6개입니다.',
        },
        {
          id: 'first-cols', kind: 'example', title: '열 이름과 자료형',
          code: 'print(df.columns)\nprint(df.dtypes)',
          read: "object 는 글자, int64 는 정수입니다. 소수가 있는 열이면 float64 가 됩니다. dtype 이 엉뚱하면(숫자인데 object) 계산이 안 되니 꼭 확인하세요.",
        },
        {
          id: 'first-info', kind: 'code', title: '표의 설명서 — info( )',
          what: '줄 수, 열마다 비어 있지 않은 값의 수, 자료형을 한 번에 보여 줍니다.',
          code: 'df.【0】()',
          blanks: [{ answers: ['info'], hint: '「정보(information)」의 앞 네 글자.' }],
          read: 'RangeIndex: 12 entries → 12줄. Non-Null Count 가 모두 12 non-null 이라 빈칸이 없습니다. 맨 아래 dtypes 줄은 자료형별 열 개수입니다.',
        },
        {
          id: 'first-predict', kind: 'predict', title: '실행 결과 예측하기',
          code: "df[['메뉴', '가격']].shape",
          question: '결과는?',
          choices: ['(12, 6)', '(12, 2)', '(2, 12)', '12'],
          answer: 1,
          why: '열을 둘만 골랐으니 12행 2열입니다. shape 는 언제나 (행, 열) 차례입니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df.head(8) · df.tail() · df.columns[0] · len(df) · pd.read_csv('bike.csv').info()" },
      ],
      quiz: [
        { q: 'info( ) 결과의 「11 non-null」, 전체 12줄이라면 그 열의 빈칸은 몇 개?', choices: ['0개', '1개', '11개', '12개'], answer: 1, why: 'non-null 은 「비어 있지 않은」 값의 수입니다. 12 − 11 = 1칸이 비어 있습니다.' },
        { q: '숫자 열인데 dtype 이 object 로 나왔다면?', choices: ['정상이다', '글자가 섞여 있어 계산이 안 될 수 있다', '빈칸이 하나도 없다', '실수라는 뜻이다'], answer: 1, why: "object 는 글자 열입니다. '모름' 같은 글자가 한 칸이라도 섞이면 열 전체가 object 가 됩니다. Ⅳ단원에서 고치는 법을 배웁니다." },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'stats', title: '기술 통계 — 숫자로 요약하기', short: '기술 통계',
      goal: ['describe( ) 로 숫자 열을 한꺼번에 요약한다', '평균·중앙값·표준편차·사분위수를 꺼내 쓴다', 'corr( ) 의 numeric_only 를 이해한다'],
      cells: [
        { kind: 'example', id: 'stats-load', title: '데이터 불러오기', code: LOAD + '\ndf.head(3)' },
        {
          id: 'stats-describe', kind: 'code', title: '숫자 열 한꺼번에 요약',
          what: '개수·평균·표준편차·최솟값·사분위수·최댓값을 열마다 계산합니다.',
          code: 'df.【0】()',
          blanks: [{ answers: ['describe'], hint: '「묘사하다」 — d 로 시작합니다.' }],
          read: '글자 열(메뉴·분류)은 빠지고 숫자 열 4개만 나옵니다. 가격의 mean 은 4500, 50%(중앙값)는 4250 — 평균이 중앙값보다 조금 큰 것은 8500·8000 원짜리 비싼 메뉴가 평균을 끌어올렸기 때문입니다.',
          readFree: true,
        },
        {
          kind: 'tip', tone: 'compare', title: 'describe( ) 줄마다 뜻',
          table: { head: ['줄', '뜻', '따로 구하는 명령'], rows: [['count', '빈칸이 아닌 값의 수', 'count()'], ['mean', '평균', 'mean()'], ['std', '표준편차 (흩어진 정도)', 'std()'], ['min · max', '최솟값 · 최댓값', 'min() · max()'], ['25% · 50% · 75%', '사분위수 (50% = 중앙값)', 'quantile(.25) · median()']] },
        },
        {
          id: 'stats-object', kind: 'code', title: '글자 열 요약',
          what: "include='object' 를 주면 글자 열을 요약합니다. 'O'(대문자 오) 로 줄여 써도 됩니다.",
          code: "df.describe(include=【0】)",
          blanks: [{ answers: ["'object'", "'O'", '"object"', '"O"'], hint: "글자 열의 dtype 이름 — 'object' 또는 줄여서 'O'" }],
          read: 'unique 는 종류 수, top 은 가장 많이 나온 값, freq 는 그 횟수입니다. 분류는 4종류이고 분식이 6번으로 가장 많습니다.',
        },
        {
          id: 'stats-one', kind: 'code', title: '열 하나의 통계 꺼내기',
          what: '열을 고른 뒤 명령을 붙입니다. print 로 여러 값을 한꺼번에 찍어 봅니다.',
          code: "print('평균  :', df['가격'].mean())\nprint('중앙값:', df['가격'].【0】())\nprint('최댓값:', df['가격'].max())\nprint('합계  :', df['판매량'].【1】())",
          blanks: [
            { answers: ['median'], hint: '가운데 값 — 「중앙의」라는 뜻의 영어 낱말.' },
            { answers: ['sum'], hint: '모두 더하기 — 세 글자.' },
          ],
          read: '평균 4500.0, 중앙값 4250.0, 최댓값 8500, 판매량 합계 1000. 평균·중앙값처럼 나눗셈이 들어가면 실수(소수점), 최댓값·합계는 정수로 나옵니다.',
        },
        {
          id: 'stats-quantile', kind: 'code', title: '사분위수',
          what: 'quantile(0.25) 는 하위 25% 지점의 값입니다. .25 처럼 앞의 0 을 빼고 써도 됩니다.',
          code: "q1 = df['가격'].quantile(【0】)\nq3 = df['가격'].quantile(0.75)\nprint(q1, q3)",
          blanks: [{ answers: ['0.25', '.25'], hint: '하위 25% — 0 과 1 사이의 수로 적습니다.' }],
          read: '3125.0 과 5625.0. 가격을 줄 세웠을 때 4분의 1 지점과 4분의 3 지점입니다. 두 값의 차이(IQR)는 이상치를 찾을 때 씁니다(Ⅶ 미션).',
        },
        { kind: 'tip', tone: 'key', title: '표준편차는 n−1 로 나눈다', text: '판다스의 std( )·var( ) 는 기본으로 (개수−1) 로 나눕니다(표본 표준편차). 넘파이의 np.std( ) 는 개수로 나누므로 값이 조금 다릅니다. 시험 문제에 「모집단」이라고 되어 있으면 std(ddof=0) 을 씁니다.' },
        {
          id: 'stats-std', kind: 'example', title: '흩어진 정도',
          code: "print(df['가격'].std())\nprint(df['가격'].std(ddof=0))",
          read: '2225.88… 과 2131.12… — 같은 자료라도 나누는 수에 따라 값이 다릅니다.',
          readFree: true,
        },
        {
          id: 'stats-corr', kind: 'code', title: '상관관계',
          what: "두 숫자 열이 함께 커지거나 작아지는 정도(−1 ~ 1)를 모든 숫자 열 짝마다 계산합니다.",
          code: 'df.corr(【0】)',
          blanks: [{ answers: ['numeric_only=True', 'numeric_only = True'], hint: '숫자(numeric) 열만(only) 쓰기 — 이름=True 꼴.' }],
          read: '가격과 칼로리의 상관계수가 0.98 로 1 에 아주 가깝습니다 — 비싼 메뉴일수록 칼로리가 높습니다. 판매량은 가격과 거의 관계가 없습니다(−0.07).',
        },
        { kind: 'tip', tone: 'warn', title: '★ corr( ) 에는 numeric_only=True', text: "표에 글자 열(object)이 섞여 있으면 df.corr( ) 는 ValueError 가 납니다. numeric_only=True 를 붙이면 숫자 열만 계산합니다. 처음부터 숫자 열만 있는 표라면 붙이지 않아도 됩니다. mean( )·sum( ) 을 표 전체에 쓸 때도 같습니다." },
        {
          id: 'stats-corr-err', kind: 'predict', title: '실행 결과 예측하기',
          code: 'df.corr()',
          question: 'numeric_only 없이 실행하면?',
          choices: ['숫자 열만 계산된다', '글자 열은 0 으로 계산된다', 'ValueError 가 난다', '빈 표가 나온다'],
          answer: 2,
          why: "글자 '떡볶이' 를 수로 바꿀 수 없다는 ValueError 입니다. 실행해서 오류 문구를 확인해 보세요.",
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) df['칼로리'].min() · df['판매량'].std() · df[['가격', '칼로리']].corr() · df.mean(numeric_only=True)" },
      ],
      quiz: [
        { q: 'describe( ) 의 50% 줄과 같은 값을 주는 명령은?', choices: ['mean()', 'median()', 'mode()', 'std()'], answer: 1, why: '50% 지점(가운데 값)은 중앙값입니다.' },
        { q: '글자 열이 섞인 표에서 숫자 열끼리의 상관계수를 구하려면?', choices: ['df.corr()', 'df.corr(numeric_only=True)', 'df.corr(object=False)', 'df.describe()'], answer: 1, why: 'numeric_only=True 를 붙여 숫자 열만 계산합니다.' },
        { q: "df['가격'].quantile(0.75) 의 뜻은?", choices: ['가격의 75%', '상위 75% 지점의 값', '하위 75% 지점의 값', '가격이 75 이상인 메뉴 수'], answer: 2, why: '작은 값부터 줄 세웠을 때 75% 지점, 곧 3사분위수입니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'counts', title: '범주 세기 — 어떤 값이 몇 번?', short: '범주 세기',
      goal: ['value_counts( ) 로 값마다 개수를 센다', 'unique( )·nunique( ) 로 종류를 확인한다', 'mode( )[0] 으로 최빈값 하나를 꺼낸다'],
      cells: [
        { kind: 'example', id: 'counts-load', title: '데이터 불러오기', code: LOAD },
        {
          id: 'counts-vc', kind: 'code', title: '값마다 개수 세기',
          what: '분류 열에 어떤 값이 몇 번 나오는지 셉니다. 많은 것부터 늘어놓습니다.',
          code: "df['분류'].【0】()",
          blanks: [{ answers: ['value_counts'], hint: '값(value)을 센다(counts) — 끝에 s 가 붙습니다!' }],
          read: '분식 6, 식사 3, 음료 2, 디저트 1. 결과는 시리즈이고 이름표가 분류 값, 값이 개수입니다(Name: count).',
        },
        { kind: 'tip', tone: 'key', title: '★ value_counts( ) — 끝에 s', text: '판다스에서 가장 많이 쓰는 명령 가운데 하나입니다. value_count 처럼 s 를 빠뜨리면 AttributeError 가 납니다. sort_values · isnull 처럼 철자를 정확히 외워 두세요.' },
        {
          id: 'counts-norm', kind: 'code', title: '비율로 보기',
          what: 'normalize=True 를 주면 개수 대신 비율(합이 1)을 줍니다.',
          code: "df['분류'].value_counts(【0】)",
          blanks: [{ answers: ['normalize=True', 'normalize = True'], hint: '정규화(normalize) 하기 — 이름=True 꼴.' }],
          read: '분식이 0.5 — 메뉴의 절반이 분식입니다. 100 을 곱하면 퍼센트가 됩니다.',
        },
        {
          id: 'counts-sortidx', kind: 'example', title: '이름표 차례로 늘어놓기',
          what: '매운맛(0~3)처럼 차례가 있는 값은 sort_index( ) 로 이름표 순서로 늘어놓으면 보기 좋습니다.',
          code: "df['매운맛'].value_counts().sort_index()",
          read: '매운맛 0단계가 7개로 가장 많고, 3단계는 1개뿐입니다.',
        },
        { kind: 'tip', tone: 'warn', title: '개수가 같은 값의 차례', text: 'value_counts( ) 는 많은 것부터 늘어놓지만, 개수가 똑같은 값끼리의 차례는 정해져 있지 않습니다. 코랩·시험장 컴퓨터마다 다를 수 있습니다(이 실습실은 먼저 나온 값이 앞). 그래서 「가장 많은 값」을 꺼낼 때 공동 1등이 있는지 꼭 확인하세요.' },
        {
          id: 'counts-unique', kind: 'code', title: '어떤 값들이 있나',
          what: 'unique( ) 는 중복을 뺀 값 목록, nunique( ) 는 그 개수입니다.',
          code: "print(df['분류'].【0】())\nprint(df['분류'].【1】())",
          blanks: [
            { answers: ['unique'], hint: '「하나뿐인·고유한」.' },
            { answers: ['nunique'], hint: '고유한 값의 개수(number) — 앞에 n 을 붙입니다.' },
          ],
          read: "['분식' '식사' '음료' '디저트'] 와 4. unique 는 처음 나온 차례 그대로, 넘파이 배열로 줍니다(쉼표 없이 찍힙니다).",
        },
        {
          id: 'counts-nunique-all', kind: 'example', title: '모든 열의 종류 수',
          code: 'df.nunique()',
          read: '메뉴는 12가지가 모두 달라서 12, 분류는 4, 매운맛은 4(0~3)입니다. 종류 수가 적은 열이 「범주형」 열입니다.',
        },
        {
          id: 'counts-mode', kind: 'code', title: '가장 많이 나온 값 — 최빈값',
          what: 'mode( ) 는 최빈값을 시리즈로 줍니다. 공동 1등이 있을 수 있기 때문입니다. 그래서 하나만 꺼낼 때는 [0] 을 붙입니다.',
          code: "df['분류'].mode()【0】",
          blanks: [{ answers: ['[0]'], hint: '시리즈의 첫 번째 값 — 대괄호와 0.' }],
          read: "'분식' — 최빈값입니다. 결측치를 최빈값으로 채울 때 fillna(df['열'].mode()[0]) 처럼 씁니다(Ⅳ단원).",
        },
        { kind: 'tip', tone: 'key', title: '★ mode( )[0] 외워 두기', text: 'mode( ) 만 쓰면 값이 아니라 시리즈(0 번 이름표에 값)가 나옵니다. 값 하나가 필요하면 mode()[0]. 가격처럼 공동 1등이 여럿이면 mode( ) 에 여러 줄이 나오고, [0] 은 그중 가장 작은 값입니다.' },
        {
          id: 'counts-mode-many', kind: 'predict', title: '실행 결과 예측하기',
          code: "df['가격'].mode()",
          question: '가격 2000·4000·4500 이 각각 2번씩, 나머지는 1번씩 나옵니다. 결과는 몇 줄일까요?',
          choices: ['1줄 (2000)', '1줄 (4500)', '3줄 (2000, 4000, 4500)', '오류'],
          answer: 2,
          why: '공동 1등이 셋이라 세 값이 모두 나옵니다. 작은 값부터 늘어놓으므로 mode()[0] 은 2000 입니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) pd.read_csv('orders.csv')['결제'].value_counts() · df['분류'].value_counts().index[0] · df['매운맛'].unique()" },
      ],
      quiz: [
        { q: '열마다 값의 개수를 세는 명령의 철자로 옳은 것은?', choices: ['value_count()', 'values_count()', 'value_counts()', 'count_values()'], answer: 2, why: 'value_counts( ) — value 는 단수, counts 는 끝에 s 가 붙습니다.' },
        { q: "df['분류'].mode() 와 df['분류'].mode()[0] 의 차이는?", choices: ['같다', '앞은 시리즈, 뒤는 값 하나', '앞은 값, 뒤는 리스트', '뒤는 오류'], answer: 1, why: 'mode( ) 는 최빈값이 여럿일 수 있어 시리즈로 줍니다. [0] 으로 첫 번째 값을 꺼냅니다.' },
        { q: "df['분류'].nunique() 의 결과는?", choices: ['12', '6', '4', "['분식', '식사', '음료', '디저트']"], answer: 2, why: '분류는 분식·식사·음료·디저트 4종류입니다. 목록이 필요하면 unique( ).' },
      ],
    },
  ],
};
