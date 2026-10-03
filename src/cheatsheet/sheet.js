// © 2026 티쳐무 · 모든 권리 보유
// 판다스 치트시트 — 빅데이터분석기사 실기(작업형1·2 전처리) 대비 요약
// 앱의 「치트시트」 탭과 인쇄용 파일(public/cheatsheet.html, tools/make-cheatsheet.mjs)이 같은 자료를 쓴다.
// ⚠ 모든 코드 조각은 tools/verify_cheatsheet.py 가 진짜 pandas 2.2 로 실행해 본다.
//    예시 표: df = menu.csv (메뉴·분류·가격·칼로리·매운맛·판매량) · o = orders.csv (주문번호·날짜·시각·메뉴·수량·결제)
//            raw = menu_raw.csv (빈칸·중복·글자 맵기가 섞인 메뉴판)
//    조각마다 새로 불러온 표에서 실행한다(앞 조각의 변경이 이어지지 않는다). run: false 는 실행하지 않는 설명용.
// 문법: { c: '코드', d: '설명', star: true(꼭 외우기), warn: true(함정) }

export const SHEET_TITLE = '판다스 치트시트 — 빅데이터분석기사 실기 대비';

export const SHEET = [
  {
    t: '0. 시작 · 파일', items: [
      { c: 'import pandas as pd\nimport numpy as np', d: '첫 두 줄. 이후 pd. · np. 으로 부른다', star: true },
      { c: "df = pd.read_csv('menu.csv')", d: 'CSV 읽기 — 시험에서는 문제가 준 경로 그대로' },
      { c: "pd.read_csv('menu.csv', index_col=0)", d: '첫 열을 이름표로 (Unnamed: 0 막기)' },
      { c: "pd.read_csv('orders.csv', parse_dates=['날짜'])", d: '읽으면서 날짜 자료형으로' },
      { c: "df.to_csv('result.csv', index=False)", d: '저장 — 작업형2 제출은 index=False', star: true },
      { c: "pd.DataFrame({'메뉴': ['김밥', '라면'], '가격': [3500, 4000]})", d: '표 만들기 {열이름: [값들]}' },
      { c: "pd.Series([3500, 4000], index=['김밥', '라면'])", d: '시리즈 만들기 (이름표 붙이기)' },
    ],
  },
  {
    t: '1. 첫 확인 (EDA)', items: [
      { c: 'df.head()  ·  df.tail(3)', d: '앞 5줄 · 뒤 3줄', run: false },
      { c: 'df.shape', d: '(행, 열) — 괄호 없음! shape[0] 이 행 수', star: true },
      { c: 'df.info()', d: '줄 수 · 열마다 non-null 개수 · dtype' },
      { c: 'df.describe()', d: '숫자 열 요약 (count·mean·std·min·25%·50%·75%·max)' },
      { c: "df.describe(include='object')", d: "글자 열 요약 (unique·top·freq). 'O' 도 됨" },
      { c: 'df.dtypes  ·  df.columns', d: '열마다 자료형 · 열 이름 목록', run: false },
      { c: "df['분류'].value_counts()", d: '값마다 개수 — counts 의 s!', star: true },
      { c: "df['분류'].value_counts(normalize=True)", d: '비율로' },
      { c: "df['분류'].unique()  ·  df['분류'].nunique()", d: '종류 목록 · 종류 수', run: false },
      { c: 'df.corr(numeric_only=True)', d: '상관계수 — 글자 열이 있으면 numeric_only=True', warn: true },
    ],
  },
  {
    t: '2. 고르기', items: [
      { c: "df['가격']  ·  df[['메뉴', '가격']]", d: '한 겹 = 시리즈 · 두 겹 = 표', star: true, run: false },
      { c: "df.loc[1:3, '메뉴':'가격']", d: 'loc = 이름표·열 이름, 끝 포함 (1·2·3)', star: true },
      { c: 'df.iloc[1:3, 0:2]', d: 'iloc = 위치 번호, 끝 미포함 (1·2)', star: true },
      { c: "df.loc[df['가격'] > 5000, '메뉴']", d: '조건에 맞는 줄의 열' },
      { c: "cond = (df['가격'] >= 4000) & (df['매운맛'] > 0)\ndf[cond]", d: '& 그리고 · | 또는 · ~ 아님 — 조건마다 괄호', star: true },
      { c: "df[df['분류'].isin(['음료', '디저트'])]", d: '목록 안에 있나 — 리스트로' },
      { c: "df[df['가격'].between(3000, 5000)]", d: '범위 (양 끝 포함)' },
      { c: "df[df['메뉴'].str.contains('김밥', na=False)]", d: '글자가 들어 있나 (빈칸은 False 로)' },
      { c: "i = df['판매량'].idxmax()\ndf.loc[i, '메뉴']", d: '최댓값 줄의 다른 열 — iloc 에 열 이름 X', warn: true },
    ],
  },
  {
    t: '3. 통계 · 개수', items: [
      { c: "df['가격'].mean()  # median std var sum min max count", d: 'std·var 는 n−1 로 나눈다 (ddof=0 이면 n)' },
      { c: "df['가격'].quantile(0.25)", d: '1사분위수 · 0.75 는 3사분위수' },
      { c: "df['분류'].mode()[0]", d: '최빈값 하나 — mode() 는 시리즈라 [0]', star: true },
      { c: "(df['가격'] > 5000).sum()", d: '조건에 맞는 개수 (True=1). len(df[cond]) 도 같음', star: true },
      { c: "(df['가격'] > 5000).mean()", d: '조건에 맞는 비율' },
      { c: "df.nlargest(3, '판매량')", d: '가장 큰 3줄 (작은 것은 nsmallest)' },
      { c: 'df.sum(numeric_only=True)', d: 'axis=0(기본) 열마다 · axis=1 줄마다' },
      { c: "df['가격'].cumsum()", d: '누적 합' },
    ],
  },
  {
    t: '4. 정렬', items: [
      { c: "df.sort_values('판매량', ascending=False)", d: '값 정렬 — values 의 s! 큰 것부터는 False', star: true },
      { c: "df.sort_values(['분류', '가격'], ascending=[True, False])", d: '여러 열은 리스트로 짝지어' },
      { c: "df = df.sort_values('칼로리').reset_index(drop=True)", d: '대입해야 남는다 · drop=True 로 옛 이름표 버림', warn: true },
      { c: 'df.sort_index()', d: '이름표 차례로' },
    ],
  },
  {
    t: '5. 바꾸기 · 만들기', items: [
      { c: "df['매출'] = df['가격'] * df['판매량']", d: '새 열 = 계산' },
      { c: "df.drop(columns=['칼로리'])  ·  df.drop('칼로리', axis=1)", d: '열 지우기 (행은 drop(이름표))', run: false },
      { c: "df.rename(columns={'가격': '판매가'})", d: '열 이름 바꾸기' },
      { c: "df['가격'].astype(float)", d: '자료형 바꾸기 (int · float · str)' },
      { c: "df['분류'].replace('식사', '밥')", d: '칸 전체가 같을 때 바꾸기 (일부는 str.replace)' },
      { c: "df['분류'].map({'분식': 1, '식사': 2, '음료': 3, '디저트': 4})", d: '짝 사전으로 — 사전에 없으면 NaN' },
      { c: "df['칼로리'].apply(lambda x: '높음' if x >= 500 else '낮음')", d: '칸마다 함수 (def 함수도 됨)' },
      { c: "np.where(df['칼로리'] >= 500, '높음', '낮음')", d: '조건 참·거짓으로 두 값 중 하나' },
      { c: "df.loc[df['분류'] == '음료', '가격'] = 1800", d: '조건에 맞는 칸만 값 바꾸기' },
      { c: "pd.cut(df['가격'], bins=[0, 3000, 6000, 9000], labels=['싸다', '보통', '비싸다'])", d: '구간 나누기 (오른쪽 끝 포함)' },
    ],
  },
  {
    t: '6. 결측치 · 중복', items: [
      { c: 'raw.isnull().sum()', d: '열마다 빈칸 수 (isna 와 같다). .sum().sum() 은 전체', star: true },
      { c: "raw.dropna(subset=['가격'])", d: '빈칸 있는 줄 지우기 (subset 없으면 아무 열이나)' },
      { c: "raw['칼로리'].fillna(raw['칼로리'].median())", d: '중앙값으로 채우기 (평균은 mean)' },
      { c: "raw['원산지'].fillna(raw['원산지'].mode()[0])", d: '글자 열은 최빈값으로' },
      { c: "raw['칼로리'].fillna(raw.groupby('분류')['칼로리'].transform('mean'))", d: '무리마다 평균으로 채우기', star: true },
      { c: "raw['칼로리'].ffill()", d: '앞 값으로 (뒤 값은 bfill)' },
      { c: 'raw.duplicated().sum()  ·  raw.drop_duplicates()', d: '중복 줄 수 · 지우기', run: false },
      { c: "pd.to_numeric(raw['맵기'], errors='coerce')", d: '숫자로 — 못 바꾸는 값은 NaN' },
    ],
  },
  {
    t: '7. 문자열 (.str)', items: [
      { c: "df['메뉴'].str.replace('떡볶이', '떡')", d: '칸 안의 일부 글자 바꾸기', star: true },
      { c: "df['메뉴'].str.contains('김밥')", d: '들어 있나 (여러 개는 \'김밥|라면\')' },
      { c: "o['시각'].str.split(':').str[0]", d: '나눠서 칸마다 첫 조각 (마지막은 str[-1])' },
      { c: "df['메뉴'].str[0:2]", d: '칸마다 글자 자르기 — str 빼면 줄 고르기!', warn: true },
      { c: "df['메뉴'].str.len()", d: '글자 수' },
      { c: "df['메뉴'].str.strip().str.lower()", d: '앞뒤 빈칸 지우기 · 소문자 (upper 대문자)' },
      { c: "df['메뉴'].str.startswith('치즈')", d: '~로 시작하나 (endswith)' },
    ],
  },
  {
    t: '8. 날짜 · 시계열 (.dt)', items: [
      { c: "o['날짜'] = pd.to_datetime(o['날짜'])", d: '글자 → 날짜 자료형', star: true },
      { c: "pd.to_datetime(o['날짜']).dt.month", d: 'dt.year · month · day · hour · quarter' },
      { c: "pd.to_datetime(o['날짜']).dt.dayofweek", d: '요일 번호 — 월 0 ~ 일 6 (주말: >= 5)', warn: true },
      { c: "pd.to_datetime(o['날짜']).dt.day_name()", d: '요일 이름 (Monday …)' },
      { c: "o[pd.to_datetime(o['날짜']) >= '2025-03-07']", d: '날짜는 글자와 바로 비교' },
      { c: "pd.to_datetime('2025년03월07일', format='%Y년%m월%d일')", d: '낯선 모양은 format — %Y 4자리·%y 2자리·%m 월·%d 일·%H 시·%M 분·%S 초·%b Mar·%p AM/PM', star: true },
      { c: "pd.to_datetime('2025-03-07') + pd.Timedelta(days=99)", d: '100일째 = +99일 · 이름은 weeks·days·hours·minutes·seconds (s!)', warn: true },
      { c: "t = pd.to_datetime(o['날짜'] + ' ' + o['시각'])\n(t - t.min()).dt.days", d: '날짜 − 날짜 = 기간(timedelta) · 일 수는 dt.days' },
      { c: "t = pd.to_datetime(o['날짜'] + ' ' + o['시각'])\n(t - t.min()).dt.total_seconds() / 60", d: '기간 → 분은 total_seconds()/60 — dt.seconds 는 하루 뺀 나머지 초', warn: true },
      { c: "pd.to_datetime(o['날짜']).dt.to_period('M')", d: "월·분기로 묶기 'Y'·'Q'·'M'·'D'·'h' (옛 'A'·'H' 는 경고)" },
      { c: 'print(round(2.5), round(3.5))', d: '파이썬 round 는 딱 .5 이면 짝수 쪽 → 2 4', warn: true },
    ],
  },
  {
    t: '9. 묶기 · 피벗', items: [
      { c: "df.groupby('분류')['가격'].mean()", d: "groupby('무리')['열'].계산() — 함수 ( ) · 열 [ ]", star: true },
      { c: "df.groupby('분류').size()", d: '무리마다 줄 수' },
      { c: "df.groupby('분류')['가격'].agg(['mean', 'max'])", d: '여러 계산 한 번에' },
      { c: "df.groupby('분류').agg({'가격': 'mean', '판매량': 'sum'})", d: '열마다 다른 계산' },
      { c: "df.groupby(['분류', '매운맛'])['판매량'].sum().reset_index()", d: '두 열로 묶고 평평한 표로 (as_index=False 도 됨)' },
      { c: "df.groupby('분류')['가격'].mean().idxmax()", d: '평균이 가장 큰 무리의 이름' },
      { c: "o.pivot_table(index='날짜', columns='결제', values='수량', aggfunc='sum', fill_value=0)", d: '줄·열·값·계산 — aggfunc 기본은 mean', star: true },
      { c: "o.groupby(['날짜', '결제'])['수량'].sum().unstack()", d: '안쪽 단계를 열로 (level=0 이면 바깥)' },
      { c: "pd.melt(df, id_vars=['메뉴'], value_vars=['가격', '칼로리'], var_name='항목', value_name='값')", d: '넓은 표 → 긴 표' },
      { c: "pd.crosstab(o['날짜'], o['결제'])", d: '두 열의 빈도표' },
    ],
  },
  {
    t: '10. 합치기', items: [
      { c: 'pd.concat([df.head(2), df.tail(2)], ignore_index=True)', d: '위아래로 잇기 · 이름표 새로', star: true },
      { c: "pd.concat([df[['메뉴']], df[['가격']]], axis=1)", d: '좌우로 (이름표끼리 짝)' },
      { c: "pd.merge(o, df[['메뉴', '가격']], on='메뉴', how='left')", d: "열쇠로 짝짓기 — how='inner'(기본)·left·right·outer", star: true },
    ],
  },
  {
    t: '11. 작업형1 단골 꼴', items: [
      { c: "s = df['판매량'].sort_values(ascending=False)\ndf.loc[s.index[:3], '판매량'] = s.iloc[2]\nprint(df['판매량'].mean())", d: '상위 n개를 n번째 값으로 바꾸기' },
      { c: "q1, q3 = df['가격'].quantile([0.25, 0.75])\niqr = q3 - q1\nprint(((df['가격'] < q1 - 1.5 * iqr) | (df['가격'] > q3 + 1.5 * iqr)).sum())", d: 'IQR 이상치 개수' },
      { c: "x = df['가격']\nprint(((x - x.min()) / (x.max() - x.min()) > 0.5).sum())", d: '최소-최대 정규화 (0~1)' },
      { c: "x = df['가격']\nprint(((x - x.mean()) / x.std()).max())", d: '표준화 (z 점수)' },
      { c: "b = raw['칼로리'].std()\na = raw['칼로리'].fillna(raw['칼로리'].median()).std()\nprint(round(b - a, 2))", d: '채우기 전후 표준편차 차이' },
      { c: "print(int(df['가격'].mean()))  # 버림\nprint(round(df['가격'].mean(), 2))  # 반올림", d: '정수 부분만 · 소수 둘째 자리 반올림', warn: true },
    ],
  },
  {
    t: '12. 시험장에서', items: [
      { c: "print(답)", d: '작업형1 은 출력한 값으로 채점 — 마지막 줄만 쓰면 안 나온다', star: true, run: false },
      { c: 'help(pd.DataFrame.fillna)  ·  dir(pd)', d: '인자 이름이 생각 안 나면 도움말·목록 보기', run: false },
      { c: "df = df.dropna()", d: 'dropna·fillna·sort_values·replace 는 대입해야 남는다', warn: true, run: false },
      { c: "and / or → & / |  ·  shape() → shape  ·  value_count → value_counts", d: '자주 틀리는 철자·문법', warn: true, run: false },
      { c: '같은 값끼리의 정렬 순서', d: '정렬·value_counts 의 동점 순서는 컴퓨터마다 다를 수 있다 — 동점이 있는지 확인', warn: true, run: false },
      { c: '시험 형식 · 배점', d: '회차마다 바뀔 수 있다 — 한국데이터산업진흥원 데이터자격검정(dataq.or.kr) 공고 확인', run: false },
    ],
  },
];

// 인쇄용 HTML 조각 (문자열) — 앱과 node 도구가 함께 쓴다. 자료가 모두 우리 것이라 그대로 넣는다(사용자 입력 없음).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function sheetHTML() {
  return SHEET.map((sec) => `<section class="cs-sec"><h3>${esc(sec.t)}</h3>${sec.items.map((it) =>
    `<div class="cs-item${it.star ? ' star' : ''}${it.warn ? ' warn' : ''}"><pre>${esc(it.c)}</pre><p>${it.star ? '★ ' : it.warn ? '⚠ ' : ''}${esc(it.d)}</p></div>`).join('')}</section>`).join('');
}
