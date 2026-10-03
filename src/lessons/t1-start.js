// © 2026 티쳐무 · 모든 권리 보유
// Ⅰ. 판다스 시작 — 시리즈 · 데이터프레임 · CSV 저장과 불러오기
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.
// 셀 종류와 빈칸 규칙은 src/lessons/data.js 머리 주석 참고.

export const T1 = {
  id: 'start', num: 'Ⅰ', icon: '🐼', title: '판다스 시작', desc: '시리즈와 데이터프레임, CSV 파일',
  lessons: [
    // ───────────────────────────────────────────────────────────
    {
      id: 'series', title: '시리즈 — 이름표가 붙은 값 한 줄', short: '시리즈',
      goal: ['판다스를 pd 라는 이름으로 불러온다', '시리즈를 만들고 인덱스(이름표)로 값을 꺼낸다', '빈칸(NaN)이 무엇인지 안다'],
      cells: [
        { kind: 'section', title: '판다스는 무엇인가요?', text: '판다스(pandas)는 엑셀처럼 행과 열이 있는 표를 파이썬 코드로 다루는 라이브러리입니다. 몇만 줄짜리 표도 한 줄 명령으로 고르고, 묶고, 합칩니다. 판다스에는 기본 구조가 둘 있습니다 — 값 한 줄인 **시리즈(Series)** 와 표 전체인 **데이터프레임(DataFrame)**.' },
        {
          id: 'series-import', kind: 'code', title: '판다스 불러오기',
          what: '판다스를 pd 라는 짧은 이름으로 가져옵니다. 이 줄이 판다스 코드의 첫 줄입니다.',
          code: 'import 【0】 as 【1】\npd.__version__',
          blanks: [
            { answers: ['pandas'], hint: '라이브러리 이름 그대로, 모두 소문자입니다.' },
            { answers: ['pd'], hint: '판다스의 짧은 이름 — 누구나 이 두 글자를 씁니다.' },
          ],
          read: "'2.2.2' 는 판다스의 버전입니다. 이 실습실은 코랩과 같은 2.2 판의 결과를 그대로 보여 줍니다.",
        },
        { kind: 'tip', tone: 'key', title: '★ import pandas as pd', text: '코랩·시험장 어디서나 첫 줄은 `import pandas as pd` 입니다. as pd 를 붙였기 때문에 그다음부터는 `pd.Series`, `pd.read_csv` 처럼 pd. 으로 판다스의 명령을 부릅니다.' },
        {
          id: 'series-make', kind: 'code', title: '시리즈 만들기',
          what: '리스트를 pd.Series( ) 에 넣으면 시리즈가 됩니다. 분식집 메뉴 세 가지의 가격입니다.',
          code: 's = pd.【0】([3500, 4000, 4500])\ns',
          blanks: [{ answers: ['Series'], hint: '「줄·연속」이라는 뜻의 영어 낱말. 첫 글자 S 는 대문자입니다.' }],
          read: '왼쪽의 0 1 2 는 인덱스(이름표), 오른쪽이 값입니다. 맨 아래 dtype: int64 는 「정수」라는 뜻입니다. 인덱스를 따로 정하지 않으면 0 부터 번호가 붙습니다.',
        },
        { kind: 'tip', tone: 'warn', title: '대문자 S', text: '`pd.series` 처럼 소문자로 쓰면 AttributeError 가 납니다. 판다스의 「만드는 명령」인 Series · DataFrame 은 첫 글자가 대문자입니다.' },
        {
          id: 'series-index', kind: 'code', title: '이름표(인덱스) 붙이기',
          what: '번호 대신 메뉴 이름을 이름표로 붙여 봅니다. index= 에 이름표 리스트를 넣습니다.',
          code: "price = pd.Series([3500, 4000, 4500], 【0】=['김밥', '라면', '떡볶이'])\nprice",
          blanks: [{ answers: ['index'], hint: '「목록·색인」이라는 뜻의 영어 낱말입니다.' }],
          read: '이제 왼쪽에 김밥·라면·떡볶이가 보입니다. 값의 개수와 이름표의 개수는 같아야 합니다.',
        },
        {
          id: 'series-get', kind: 'code', title: '이름표로 값 하나 꺼내기',
          what: '대괄호 안에 이름표를 넣으면 그 값 하나가 나옵니다. 이름표가 글자이므로 따옴표로 감쌉니다.',
          code: 'price[【0】]',
          blanks: [{ answers: ["'라면'", '"라면"'], hint: "라면의 가격을 꺼냅니다. 글자는 따옴표로 감쌉니다 — '라면'" }],
          read: 'np.int64(4000) 은 「넘파이의 정수 4000」이라는 뜻입니다. 판다스 안의 수는 넘파이 수로 나옵니다. print( ) 로 찍으면 4000 만 보입니다.',
        },
        {
          id: 'series-many', kind: 'code', title: '여러 개 꺼내기',
          what: '여러 이름표를 꺼낼 때는 이름표들을 리스트로 만들어 넣습니다. 그래서 대괄호가 두 겹이 됩니다.',
          code: 'price[【0】]',
          blanks: [{ answers: ["['김밥', '떡볶이']", '["김밥", "떡볶이"]'], hint: "김밥과 떡볶이 — ['김밥', '떡볶이'] 처럼 리스트로." }],
          read: '여러 개를 꺼내면 결과도 시리즈입니다. 하나를 꺼내면 값, 여럿을 꺼내면 시리즈 — 이 차이는 데이터프레임에서도 똑같이 나옵니다.',
        },
        {
          id: 'series-dict', kind: 'example', title: '딕셔너리로 시리즈 만들기',
          what: '딕셔너리의 열쇠(key)는 이름표가, 값(value)은 시리즈의 값이 됩니다.',
          code: "kcal = pd.Series({'김밥': 320, '라면': 500, '떡볶이': 480})\nkcal",
          read: '{열쇠: 값} 의 짝이 그대로 이름표와 값이 되었습니다.',
        },
        {
          id: 'series-cond', kind: 'predict', title: '실행 결과 예측하기',
          code: 'price[price >= 4000]',
          question: '이 코드의 결과로 남는 메뉴는?',
          choices: ['김밥', '라면, 떡볶이', '김밥, 라면, 떡볶이', '오류가 난다'],
          answer: 1,
          why: 'price >= 4000 은 칸마다 참·거짓을 구하고, price[참거짓] 은 참인 칸만 남깁니다. 4000 원인 라면과 4500 원인 떡볶이가 남습니다. 이것이 Ⅲ단원에서 배울 「조건으로 고르기」의 기본입니다.',
        },
        {
          id: 'series-calc', kind: 'code', title: '시리즈로 계산하기',
          what: '시리즈에 곱하기를 하면 모든 값에 한꺼번에 계산됩니다. 반복문이 필요 없습니다. 마지막 줄은 평균입니다.',
          code: 'print(price * 2)\nprice.【0】()',
          blanks: [{ answers: ['mean'], hint: '평균(average)을 뜻하는 다른 영어 낱말 — m 으로 시작합니다.' }],
          read: '모든 가격이 두 배가 되었고, 평균은 (3500 + 4000 + 4500) ÷ 3 = 4000.0 입니다. 나눗셈이 들어간 평균은 언제나 실수(float)로 나옵니다.',
        },
        {
          id: 'series-nan', kind: 'example', title: '빈칸(NaN) 넣어 보기',
          what: '넘파이의 np.nan 은 「값이 비어 있음」을 뜻합니다. 실제 데이터에는 빈칸이 자주 섞여 있습니다.',
          code: 'import numpy as np\ns = pd.Series([1, 3, np.nan, 6])\ns',
          read: '세 번째 칸이 NaN(Not a Number, 숫자 아님)으로 보입니다. 빈칸이 하나라도 있으면 정수도 실수로 바뀌어 1.0, 3.0 처럼 나오고 dtype 이 float64 가 됩니다. 빈칸을 다루는 법은 Ⅳ단원에서 배웁니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) price['김밥'] · price.max() · price.index · price.values · pd.Series(['봄', '여름'], index=['a', 'b'])" },
      ],
      quiz: [
        { q: 'pd.Series([10, 20, 30]) 에서 20 의 인덱스(이름표)는?', choices: ['0', '1', '2', '20'], answer: 1, why: '인덱스를 따로 정하지 않으면 0 부터 번호가 붙습니다. 10 → 0, 20 → 1, 30 → 2.' },
        { q: "price = pd.Series([3500, 4000], index=['김밥', '라면']) 일 때 price[['라면']] 의 결과는?", choices: ['4000', "'라면'", '라면 4000 한 줄짜리 시리즈', '오류'], answer: 2, why: '대괄호 두 겹(리스트)으로 꺼내면 하나만 꺼내도 시리즈로 나옵니다. 대괄호 한 겹 price[\'라면\'] 은 값 4000 하나입니다.' },
        { q: 'pd.Series([1, 2, np.nan]) 의 dtype 은?', choices: ['int64', 'float64', 'object', 'bool'], answer: 1, why: '빈칸(NaN)은 실수로만 나타낼 수 있어서, 빈칸이 섞인 수 시리즈는 float64 가 됩니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'frame', title: '데이터프레임 — 행과 열이 있는 표', short: '데이터프레임',
      goal: ['딕셔너리로 데이터프레임을 만든다', "df['열'] 과 df[['열']] 의 차이를 안다", 'shape·columns·index 로 표의 생김새를 확인한다'],
      cells: [
        { kind: 'section', title: '표 만들기', text: "데이터프레임은 시리즈 여러 개를 나란히 붙인 표입니다. 가장 흔한 방법은 `{'열 이름': [값들]}` 꼴의 딕셔너리를 pd.DataFrame( ) 에 넣는 것입니다." },
        {
          id: 'frame-make', kind: 'code', title: '딕셔너리로 표 만들기',
          what: '열 이름이 열쇠, 값 리스트가 그 열의 내용입니다. 열마다 값의 개수가 같아야 합니다.',
          code: "import pandas as pd\nsnack = pd.【0】({\n    '메뉴': ['김밥', '라면', '떡볶이'],\n    '가격': [3500, 4000, 4500],\n    '분류': ['분식', '식사', '분식']\n})\nsnack",
          blanks: [{ answers: ['DataFrame'], hint: '데이터(Data) + 틀(Frame). D 와 F 가 대문자입니다.' }],
          read: '맨 위 줄이 열 이름(columns), 왼쪽의 0 1 2 가 줄의 이름표(index)입니다. 코랩에서도 표는 이렇게 칸이 그려진 모양으로 나옵니다.',
        },
        { kind: 'tip', tone: 'key', title: '★ pd.DataFrame({"열이름": 데이터})', text: '이 꼴을 통째로 외워 두세요. 대문자 D·F, 중괄호 { } 안에 「열이름: [값들]」. 시험 문제의 작은 예시 표는 거의 이 모양으로 만듭니다.' },
        {
          id: 'frame-from-series', kind: 'example', title: '시리즈 두 개로 표 만들기',
          what: '이미 만들어 둔 시리즈를 열로 붙일 수도 있습니다.',
          code: "menu = pd.Series(['어묵', '튀김'])\ncost = pd.Series([1000, 2000])\npd.DataFrame({'메뉴': menu, '가격': cost})",
          read: '시리즈 두 줄이 표의 두 열이 되었습니다.',
        },
        {
          id: 'frame-col', kind: 'code', title: '열 하나 꺼내기 — 시리즈',
          what: '표 이름 뒤 대괄호에 열 이름을 넣으면 그 열이 시리즈로 나옵니다.',
          code: 'snack【0】',
          blanks: [{ answers: ["['메뉴']", '["메뉴"]'], hint: "메뉴 열을 대괄호 한 겹으로 — ['메뉴']" }],
          read: 'Name: 메뉴 · dtype: object 가 붙은 시리즈입니다. object 는 「글자」라는 뜻입니다.',
        },
        {
          id: 'frame-col2', kind: 'code', title: '열 하나 꺼내기 — 데이터프레임',
          what: '같은 열을 대괄호 두 겹으로 꺼내 봅니다.',
          code: 'snack【0】',
          blanks: [{ answers: ["[['메뉴']]", '[["메뉴"]]'], hint: "대괄호를 두 겹으로 — [['메뉴']]" }],
          read: '열은 하나인데 이번에는 표(데이터프레임) 모양입니다. 안쪽 대괄호가 「열 이름들의 리스트」이기 때문입니다.',
        },
        {
          kind: 'tip', tone: 'compare', title: '★ 시리즈 선택 vs 데이터프레임 선택',
          table: { head: ['', '시리즈 선택', '데이터프레임 선택'], rows: [['쓰는 법', "df['메뉴']", "df[['메뉴']] · df[['메뉴', '가격']]"], ['대괄호', '한 겹', '두 겹 (안쪽은 리스트)'], ['언제', '열 하나의 값을 계산할 때', '열을 하나 이상 골라 표로 볼 때'], ['결과', '값 한 줄', '표']] },
        },
        {
          id: 'frame-type', kind: 'example', title: 'type( ) 으로 확인하기',
          what: 'type( ) 은 값의 종류를 알려 줍니다. print 로 세 줄을 함께 찍어 비교합니다.',
          code: "print('snack          :', type(snack))\nprint(\"snack['가격']   :\", type(snack['가격']))\nprint(\"snack[['가격']] :\", type(snack[['가격']]))",
          read: '대괄호 한 겹은 Series, 두 겹은 DataFrame 입니다.',
        },
        {
          id: 'frame-cols', kind: 'code', title: '고를 열을 변수에 담아 쓰기',
          what: '고를 열이 많을 때는 열 이름 리스트를 변수에 담아 두면 편합니다.',
          code: "cols = ['메뉴', '가격']\nsnack[【0】]",
          blanks: [{ answers: ['cols'], hint: '열 이름 리스트를 담아 둔 변수 이름입니다.' }],
          read: "snack[['메뉴', '가격']] 과 똑같습니다. cols 자체가 리스트이므로 대괄호를 한 겹만 더 씌웁니다.",
        },
        {
          id: 'frame-shape', kind: 'code', title: '표의 크기',
          what: '(행 수, 열 수) 를 알려 주는 값입니다.',
          code: 'snack.【0】',
          blanks: [{ answers: ['shape'], strict: true, hint: '「모양」이라는 뜻의 영어 낱말. 괄호를 붙이지 않습니다.' }],
          read: '(3, 3) — 3행 3열입니다. 행 수만 필요하면 snack.shape[0], 열 수는 snack.shape[1] 입니다.',
        },
        { kind: 'tip', tone: 'warn', title: '★ shape 에는 괄호가 없다', text: 'shape 는 명령(함수)이 아니라 표가 들고 있는 값(속성)이라서 괄호를 붙이지 않습니다. columns · index · dtypes 도 마찬가지입니다. 반대로 head( ) · info( ) · describe( ) 는 명령이라 괄호가 있어야 합니다.' },
        {
          id: 'frame-shape-err', kind: 'predict', title: '실행 결과 예측하기',
          code: 'snack.shape()',
          question: '괄호를 붙이면 어떻게 될까요?',
          choices: ['(3, 3)', '9', '오류가 난다', '3'],
          answer: 2,
          why: "TypeError: 'tuple' object is not callable — shape 의 값 (3, 3) 은 튜플이라 괄호를 붙여 「부를」 수 없다는 뜻입니다. 실행해서 오류 문구를 직접 확인해 보세요.",
        },
        {
          id: 'frame-axes', kind: 'example', title: '열 이름과 줄 이름표',
          code: 'print(snack.columns)\nprint(snack.index)',
          read: "columns 는 열 이름 목록, index 는 줄 이름표입니다. RangeIndex(start=0, stop=3, step=1) 은 「0부터 3 직전까지 1씩」, 곧 0·1·2 라는 뜻입니다.",
        },
        {
          id: 'frame-list', kind: 'example', title: '리스트의 리스트로 만들기',
          what: '한 줄씩 적은 리스트를 모아서 만들 수도 있습니다. 이때는 columns= 로 열 이름을, index= 로 줄 이름표를 따로 적습니다.',
          code: "pd.DataFrame([[12, 15], [8, 9]], columns=['1학기', '2학기'], index=['코딩반', '로봇반'])",
          read: '줄 이름표가 0, 1 대신 코딩반·로봇반이 되었습니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) snack['가격'].mean() · snack[['분류', '메뉴']] · snack.shape[0] · snack.dtypes" },
      ],
      quiz: [
        { q: "df[['가격']] 의 결과는?", choices: ['값 하나', '시리즈', '데이터프레임(열 1개)', '오류'], answer: 2, why: '대괄호 두 겹은 「열 이름 리스트로 고르기」라서 열이 하나여도 표가 나옵니다.' },
        { q: '표의 행 수만 구하는 코드는?', choices: ['df.shape()', 'df.shape[0]', 'df.shape[1]', 'df.size()'], answer: 1, why: 'shape 는 (행 수, 열 수) 튜플입니다. [0] 이 행 수, [1] 이 열 수입니다. 괄호 없이 씁니다. len(df) 도 행 수입니다.' },
        { q: "pd.DataFrame({'a': [1, 2], 'b': [3]}) 을 실행하면?", choices: ['2행 2열 표', '빈칸이 NaN 으로 채워진 표', 'ValueError 오류', '1행 2열 표'], answer: 2, why: '리스트로 넣을 때는 열마다 값의 개수가 같아야 합니다. 다르면 All arrays must be of the same length 오류가 납니다.' },
      ],
    },

    // ───────────────────────────────────────────────────────────
    {
      id: 'csv', title: 'CSV 파일로 저장하고 불러오기', short: 'CSV 파일',
      goal: ['to_csv( ) 로 표를 파일로 저장한다', 'read_csv( ) 로 파일을 표로 불러온다', 'index=False 를 왜 붙이는지 안다'],
      cells: [
        { kind: 'section', title: 'CSV 는 쉼표로 나눈 글자 파일', text: 'CSV(Comma-Separated Values)는 한 줄에 한 행, 칸 사이는 쉼표(,)로 나눈 글자 파일입니다. 메모장으로도, 엑셀로도 열립니다. 공공데이터 대부분이 CSV 로 내려받아집니다.' },
        {
          id: 'csv-make', kind: 'example', title: '저장할 표 준비',
          code: "import pandas as pd\nsnack = pd.DataFrame({\n    '메뉴': ['어묵', '튀김', '순대'],\n    '가격': [1000, 2000, 4000]\n})\nprint(snack.to_csv())",
          read: 'to_csv( ) 에 파일 이름을 주지 않으면 CSV 글자를 그대로 돌려줍니다. 첫 줄 맨 앞이 쉼표로 시작하는 것을 보세요 — 줄 이름표(0, 1, 2) 열이 함께 저장되기 때문입니다.',
        },
        {
          id: 'csv-save', kind: 'code', title: '파일로 저장하고 다시 불러오기',
          what: '표를 snack.csv 로 저장한 뒤, read_csv 로 다시 불러옵니다.',
          code: "snack.【0】('snack.csv')\npd.【1】('snack.csv')",
          blanks: [
            { answers: ['to_csv'], hint: 'CSV 「로(to)」 바꾸기 — to_csv' },
            { answers: ['read_csv'], hint: 'CSV 를 「읽기(read)」 — read_csv' },
          ],
          read: "Unnamed: 0 이라는 이상한 열이 생겼습니다. 저장할 때 함께 들어간 줄 이름표(0, 1, 2)가 이름 없는 열로 다시 읽힌 것입니다.",
        },
        { kind: 'tip', tone: 'warn', title: '★ Unnamed: 0 열이 생기는 까닭', text: 'to_csv( ) 는 기본으로 줄 이름표(인덱스)까지 저장합니다. 그 열에는 이름이 없어서 다시 읽으면 Unnamed: 0 이 됩니다. 저장할 때 index=False 를 붙이면 생기지 않습니다.' },
        {
          id: 'csv-noindex', kind: 'code', title: 'index=False 로 저장하기',
          what: '인덱스를 빼고 저장하면 불러올 때 깔끔합니다.',
          code: "snack.to_csv('snack2.csv', 【0】)\npd.read_csv('snack2.csv')",
          blanks: [{ answers: ['index=False', 'index = False'], hint: '인덱스(index)를 저장하지 않음(False) — 이름=값 꼴로.' }],
          read: '이번에는 메뉴·가격 두 열만 그대로 돌아왔습니다.',
        },
        { kind: 'tip', tone: 'exam', title: '★ 빅데이터분석기사 작업형2', text: "작업형2는 예측 결과를 CSV 파일로 저장해 제출합니다. 문제에서 정한 파일 이름·열 이름을 그대로 지키고, 보통 `결과표.to_csv('파일이름.csv', index=False)` 처럼 index=False 를 붙입니다. 인덱스 열이 끼어 들어가면 채점이 어긋날 수 있습니다." },
        {
          id: 'csv-indexcol', kind: 'code', title: '이미 Unnamed 열이 있는 파일 읽기',
          what: '인덱스와 함께 저장된 파일은 index_col=0 으로 「첫 번째 열을 이름표로 써라」 하고 읽으면 됩니다.',
          code: "pd.read_csv('snack.csv', 【0】=0)",
          blanks: [{ answers: ['index_col'], hint: '인덱스(index)로 쓸 열(column) — 밑줄로 잇습니다.' }],
          read: 'Unnamed: 0 열이 사라지고 원래 모양으로 돌아왔습니다.',
        },
        {
          id: 'csv-menu', kind: 'example', title: '이 실습실의 데이터 파일 열어 보기',
          what: "이 실습실에는 지어낸 가게 「별빛 분식」의 메뉴판(menu.csv)과 주문 기록(orders.csv), 지어낸 섬 「바람섬」의 날씨(weather.csv), 지어낸 도시 「한빛시」의 공유자전거 기록(bike.csv), 정리 안 된 메뉴판(menu_raw.csv)이 들어 있습니다.",
          code: "menu = pd.read_csv('menu.csv')\nmenu",
          read: '열두 가지 메뉴의 분류·가격·칼로리·매운맛(0~3)·지난주 판매량입니다. 다음 단원부터 이 표로 연습합니다.',
        },
        { kind: 'free', title: '🧪 자유 실험', text: "예) pd.read_csv('orders.csv').head() · pd.read_csv('weather.csv').shape · menu.to_csv('내메뉴.csv', index=False)" },
      ],
      quiz: [
        { q: "df.to_csv('a.csv') 로 저장한 파일을 pd.read_csv('a.csv') 로 읽으면 생기는 열은?", choices: ['index', 'Unnamed: 0', 'level_0', '아무 열도 생기지 않는다'], answer: 1, why: '이름 없는 인덱스 열이 함께 저장되었다가 Unnamed: 0 이라는 이름으로 읽힙니다.' },
        { q: '인덱스 열 없이 저장하는 코드는?', choices: ["df.to_csv('a.csv', index=None)", "df.to_csv('a.csv', index=False)", "df.to_csv('a.csv', drop=True)", "df.save('a.csv')"], answer: 1, why: 'index=False 입니다. 작업형2 제출 파일에 꼭 붙이는 옵션입니다.' },
      ],
    },
  ],
};
