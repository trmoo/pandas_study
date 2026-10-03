// © 2026 티쳐무 · 모든 권리 보유
// Ⅶ. 종합 미션 — 한빛시 공유자전거 기록(bike.csv, 지어낸 자료)으로 푸는 작업형1 꼴 문제 10개
//   + 실행 결과 예측 문제 (predict 레슨)
// ⚠ 여기서 화면 요소(DOM)를 만들지 말 것 — node 로 불러다 시험한다.
// 채점: 문제마다 새 커널에서 MISSION_SETUP 을 실행한 뒤 학생 코드를 돌려, print 로 찍은 글자를 정답 코드의 출력과 견준다.

export const MISSION_SETUP = "import pandas as pd\nimport numpy as np\nb = pd.read_csv('bike.csv')";

export const MISSIONS = [
  {
    id: 'm1', level: 1, title: '빈칸이 가장 많은 열',
    text: '결측치(빈칸)가 가장 많은 열의 이름을 출력하시오.',
    hints: ['열마다 빈칸 수를 세는 코드를 먼저 떠올리세요.', 'isnull().sum() 의 결과(시리즈)에서 가장 큰 값의 이름표를 꺼냅니다.', '…sum().idxmax()'],
    answer: 'print(b.isnull().sum().idxmax())',
  },
  {
    id: 'm2', level: 1, title: '중복 줄 지우기',
    text: '모든 열의 값이 똑같은 줄(중복)을 지운 뒤 남은 줄의 수를 출력하시오.',
    hints: ['중복 줄을 지우는 명령은 drop_duplicates( ) 입니다.', '줄 수는 len(표) 또는 표.shape[0].', 'print(len(b.drop_duplicates()))'],
    answer: 'print(len(b.drop_duplicates()))',
  },
  {
    id: 'm3', level: 1, title: '정기권 회원의 평균 이용시간',
    text: "회원이 '정기권' 인 대여의 평균 이용시간(분)을 반올림하여 소수 둘째 자리까지 출력하시오.",
    hints: ["조건 b['회원'] == '정기권' 으로 줄을 고릅니다.", "고른 표에서 ['이용시간'].mean( ) 을 구하고 round(값, 2).", "cond = b['회원'] == '정기권'\nprint(round(b[cond]['이용시간'].mean(), 2))"],
    answer: "cond = b['회원'] == '정기권'\nprint(round(b[cond]['이용시간'].mean(), 2))",
  },
  {
    id: 'm4', level: 2, title: '이동거리가 가장 긴 구',
    text: '구(區)마다 이동거리의 평균을 구했을 때, 평균이 가장 큰 구의 이름을 출력하시오. (빈칸은 평균에서 빼고 계산한다)',
    hints: ["groupby('구')['이동거리'].mean( ) 으로 구마다 평균을 구합니다.", '결과 시리즈에서 가장 큰 값의 이름표 — idxmax( ).', "print(b.groupby('구')['이동거리'].mean().idxmax())"],
    answer: "print(b.groupby('구')['이동거리'].mean().idxmax())",
  },
  {
    id: 'm5', level: 2, title: '출근 시간대 대여 건수',
    text: '대여일시에서 시(hour)를 꺼냈을 때, 7시 이상 9시 이하에 빌린 대여 건수를 출력하시오. (중복 줄도 그대로 센다)',
    hints: ["대여일시는 글자입니다. pd.to_datetime( ) 으로 날짜 자료형으로 바꾼 뒤 .dt.hour 로 시를 꺼냅니다.", '(시 >= 7) & (시 <= 9) 조건을 sum( ) 하면 개수입니다.', "h = pd.to_datetime(b['대여일시']).dt.hour\nprint(((h >= 7) & (h <= 9)).sum())"],
    answer: "h = pd.to_datetime(b['대여일시']).dt.hour\nprint(((h >= 7) & (h <= 9)).sum())",
  },
  {
    id: 'm6', level: 2, title: '중앙값으로 채우기 전과 후',
    text: '이동거리의 결측치를 이동거리의 중앙값으로 채우려 한다. 채우기 전 표준편차에서 채운 후 표준편차를 뺀 값을 반올림하여 소수 둘째 자리까지 출력하시오.',
    hints: ["채우기 전 표준편차를 먼저 변수에 담아 둡니다 — before = b['이동거리'].std()", "fillna(b['이동거리'].median( )) 로 채운 뒤 다시 std( ).", "before = b['이동거리'].std()\nafter = b['이동거리'].fillna(b['이동거리'].median()).std()\nprint(round(before - after, 2))"],
    answer: "before = b['이동거리'].std()\nafter = b['이동거리'].fillna(b['이동거리'].median()).std()\nprint(round(before - after, 2))",
  },
  {
    id: 'm7', level: 2, title: '이상치는 몇 개?',
    text: '이용시간의 1사분위수(Q1)·3사분위수(Q3)와 IQR(Q3 − Q1)을 구하고, Q1 − 1.5×IQR 보다 작거나 Q3 + 1.5×IQR 보다 큰 대여(이상치)의 개수를 출력하시오.',
    hints: ["q1 = b['이용시간'].quantile(0.25), q3 도 같은 방법으로.", '두 조건을 | (또는) 로 잇고 sum( ). 조건마다 괄호!', "q1 = b['이용시간'].quantile(0.25)\nq3 = b['이용시간'].quantile(0.75)\niqr = q3 - q1\ncond = (b['이용시간'] < q1 - 1.5 * iqr) | (b['이용시간'] > q3 + 1.5 * iqr)\nprint(cond.sum())"],
    answer: "q1 = b['이용시간'].quantile(0.25)\nq3 = b['이용시간'].quantile(0.75)\niqr = q3 - q1\ncond = (b['이용시간'] < q1 - 1.5 * iqr) | (b['이용시간'] > q3 + 1.5 * iqr)\nprint(cond.sum())",
  },
  {
    id: 'm8', level: 3, title: '튀는 값 눌러 담기',
    text: '이용시간을 큰 값부터 정렬했을 때 10번째 값을 구하고, 상위 10개의 이용시간을 모두 그 값으로 바꾼다. 바꾼 뒤 이용시간의 평균을 반올림하여 소수 둘째 자리까지 출력하시오.',
    hints: ["s = b['이용시간'].sort_values(ascending=False) — 10번째 값은 s.iloc[9] (0 부터 세므로).", "상위 10개 줄의 이름표는 s.index[:10]. b.loc[이름표들, '이용시간'] = 값.", "s = b['이용시간'].sort_values(ascending=False)\nv = s.iloc[9]\nb.loc[s.index[:10], '이용시간'] = v\nprint(round(b['이용시간'].mean(), 2))"],
    answer: "s = b['이용시간'].sort_values(ascending=False)\nv = s.iloc[9]\nb.loc[s.index[:10], '이용시간'] = v\nprint(round(b['이용시간'].mean(), 2))",
  },
  {
    id: 'm9', level: 3, title: '가장 바쁜 요일',
    text: '대여일시의 요일 이름(영어, 예: Monday)별 대여 건수를 셌을 때, 대여가 가장 많은 요일의 이름을 출력하시오.',
    hints: ["pd.to_datetime( ) → .dt.day_name( ) 으로 요일 이름을 꺼냅니다.", 'value_counts( ) 는 많은 것부터 늘어놓으므로 index[0] 이 1등입니다. idxmax( ) 도 됩니다.', "day = pd.to_datetime(b['대여일시']).dt.day_name()\nprint(day.value_counts().idxmax())"],
    answer: "day = pd.to_datetime(b['대여일시']).dt.day_name()\nprint(day.value_counts().idxmax())",
  },
  {
    id: 'm10', level: 3, title: '피벗 테이블의 한 칸',
    text: "나이대를 줄(index), 회원을 열(columns), 이용시간의 평균을 값으로 하는 피벗 테이블을 만들고, 20대·정기권 칸의 값을 반올림하여 소수 첫째 자리까지 출력하시오.",
    hints: ["pivot_table(index='나이대', columns='회원', values='이용시간', aggfunc='mean')", "표의 칸 하나는 loc['20대', '정기권'].", "p = b.pivot_table(index='나이대', columns='회원', values='이용시간', aggfunc='mean')\nprint(round(p.loc['20대', '정기권'], 1))"],
    answer: "p = b.pivot_table(index='나이대', columns='회원', values='이용시간', aggfunc='mean')\nprint(round(p.loc['20대', '정기권'], 1))",
  },
];

// 실행 결과 예측 — 코드를 보고 결과를 고른 뒤, 실행해서 확인한다
export const PREDICT_LESSON = {
  id: 'predict', title: '실행 결과 예측 — 손으로 먼저 풀어 보기', short: '결과 예측',
  goal: ['코드를 실행하기 전에 결과를 머릿속으로 그려 본다', '자주 틀리는 함정(끝 포함·대입·괄호·dtype)을 확인한다'],
  cells: [
    { kind: 'section', title: '시험장에는 실행 버튼이 있지만', text: '결과를 미리 그려 보는 연습을 한 사람이 오류를 빨리 찾습니다. 답을 고른 뒤 ▶ 실행으로 확인하세요.' },
    { kind: 'example', id: 'p-data', title: '작은 표', code: "import pandas as pd\nimport numpy as np\nt = pd.DataFrame({'이름': ['가', '나', '다', '라'], '점수': [80, 95, 70, 95], '반': ['A', 'B', 'A', 'B']})\nt" },
    { id: 'p1', kind: 'predict', title: '1', code: "t.loc[1:2, '점수'].tolist()", choices: ['[95]', '[95, 70]', '[80, 95, 70]', '[95, 70, 95]'], answer: 1, why: 'loc 은 이름표 1부터 2까지, 끝을 포함합니다.' },
    { id: 'p2', kind: 'predict', title: '2', code: "t.iloc[1:2, 1].tolist()", choices: ['[95]', '[95, 70]', "['나']", '[80, 95]'], answer: 0, why: 'iloc 은 끝(2)을 빼서 1번 줄 하나, 열 번호 1 은 점수입니다.' },
    { id: 'p3', kind: 'predict', title: '3', code: "t['점수'].mean()", choices: ['85', '85.0', '340', "'85.0'"], answer: 1, why: '(80+95+70+95)/4 = 85.0 — 평균은 실수로 나옵니다. 코랩에서는 np.float64(85.0) 으로 보입니다.' },
    { id: 'p4', kind: 'predict', title: '4', code: "t.groupby('반')['점수'].sum()['B']", choices: ['95', '190', '150', "'B'"], answer: 1, why: 'B반은 95 + 95 = 190 입니다.' },
    { id: 'p5', kind: 'predict', title: '5', code: "t.sort_values('점수')\nt['이름'].tolist()", choices: ["['다', '가', '나', '라']", "['가', '나', '다', '라']", "['나', '라', '가', '다']", '오류'], answer: 1, why: '정렬한 결과를 대입하지 않았으므로 t 는 원래 차례 그대로입니다.' },
    { id: 'p6', kind: 'predict', title: '6', code: "(t['점수'] >= 90).sum()", choices: ['2', '190', 'True', '1'], answer: 0, why: '참(1)이 두 개라서 2. 조건의 개수 세기입니다.' },
    { id: 'p7', kind: 'predict', title: '7', code: "t['반'].value_counts()['A']", choices: ['1', '2', "'A'", '오류'], answer: 1, why: 'A반은 가·다 두 명입니다.' },
    { id: 'p8', kind: 'predict', title: '8', code: "pd.Series([1, np.nan, 3]).sum()", choices: ['nan', '4.0', '4', '오류'], answer: 1, why: '판다스의 sum( ) 은 빈칸을 건너뛰고 더합니다. 빈칸이 섞여 실수 4.0 입니다.' },
    { id: 'p9', kind: 'predict', title: '9', code: "t['점수'].replace(95, 100).max()", choices: ['95', '100', '190', '오류'], answer: 1, why: '숫자 열은 replace(옛 값, 새 값) 으로 바꿀 수 있습니다. 95 두 칸이 100 이 되었습니다.' },
    { id: 'p10', kind: 'predict', title: '10', code: "t.drop('점수', axis=1).shape", choices: ['(4, 3)', '(3, 3)', '(4, 2)', '(3, 2)'], answer: 2, why: '열 하나를 지워 4행 2열입니다.' },
    { id: 'p11', kind: 'predict', title: '11', code: "len(t[t['반'] == 'C'])", choices: ['0', '오류', 'None', '4'], answer: 0, why: "C반은 없으니 빈 표이고, len 은 0 입니다. 조건에 맞는 줄이 없어도 오류가 아니라 빈 표가 나옵니다." },
    { id: 'p12', kind: 'predict', title: '12', code: "pd.Series([3, 1, 2]).sort_values().index.tolist()", choices: ['[0, 1, 2]', '[1, 2, 0]', '[2, 0, 1]', '[1, 2, 3]'], answer: 1, why: '값 1(이름표 1), 2(이름표 2), 3(이름표 0) 차례로 놓이므로 이름표는 [1, 2, 0] 입니다.' },
  ],
  quiz: [],
};
