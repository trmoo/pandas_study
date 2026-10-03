# -*- coding: utf-8 -*-
"""
실습 데이터 만들기 — 이 앱의 CSV 는 모두 여기서 새로 만든 「지어낸」 자료다.
(어떤 교재·강의 자료의 데이터도 옮기지 않았다. 가게·도시 이름도 지어낸 것이다.)

© 2026 티쳐무 · 모든 권리 보유

    cd D:\\project_AI\\pandas_study\\pandas-lab
    python tools/make_data.py

같은 씨앗(seed)을 쓰므로 몇 번을 돌려도 같은 파일이 나온다.
⚠ 파일을 다시 만들면 레슨의 「결과 읽는 법」 숫자와 test/golden.json 도 다시 맞춰야 한다.
"""
import csv, math, os, random
from datetime import date, datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'src', 'data')
os.makedirs(OUT, exist_ok=True)


def write(name, header, rows):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, lineterminator='\n')
        w.writerow(header)
        for r in rows:
            w.writerow(['' if v is None else v for v in r])
    print(f'{name}: {len(rows)}줄')


# ── ① 별빛 분식 메뉴판 (깨끗한 표) ─────────────────────────────
MENU = [
    # 메뉴, 분류, 가격, 칼로리, 매운맛(0~3), 판매량(지난주)
    ('떡볶이', '분식', 4500, 480, 2, 132),
    ('치즈떡볶이', '분식', 5500, 610, 1, 88),
    ('라볶이', '분식', 6000, 650, 2, 64),
    ('김밥', '분식', 3500, 320, 0, 150),
    ('참치김밥', '분식', 4500, 410, 0, 97),
    ('순대', '분식', 4000, 390, 0, 71),
    ('라면', '식사', 4000, 500, 1, 120),
    ('돈가스', '식사', 8500, 890, 0, 55),
    ('제육덮밥', '식사', 8000, 780, 3, 60),
    ('쿨피스', '음료', 1500, 140, 0, 45),
    ('식혜', '음료', 2000, 150, 0, 38),
    ('붕어빵', '디저트', 2000, 230, 0, 80),
]
write('menu.csv', ['메뉴', '분류', '가격', '칼로리', '매운맛', '판매량'], MENU)

# ── ② 정리 안 된 메뉴판 (결측치·중복·글자로 적힌 맵기) ─────────────
MENU_RAW = [
    ('떡볶이', '분식', 4500, 480, '매움', '국내산'),
    ('치즈떡볶이', '분식', 5500, None, '보통', '국내산'),
    ('라볶이', '분식', 6000, 650, '매움', None),
    ('김밥', '분식', 3500, 320, '안매움', '국내산'),
    ('참치김밥', '분식', 4500, 410, '안매움', '원양산'),
    ('김밥', '분식', 3500, 320, '안매움', '국내산'),
    ('순대', '분식', 4000, 390, '안매움', None),
    ('라면', '식사', 4000, 500, '보통', '수입산'),
    ('돈가스', '식사', 8500, 890, '안매움', '국내산'),
    ('제육덮밥', '식사', 8000, None, '매움', '국내산'),
    ('쿨피스', '음료', 1500, 140, '안매움', None),
    ('식혜', '음료', 2000, 150, '안매움', '국내산'),
    ('붕어빵', '디저트', 2000, 230, '안매움', '국내산'),
    ('아이스크림', '디저트', None, 210, '안매움', '수입산'),
]
write('menu_raw.csv', ['메뉴', '분류', '가격', '칼로리', '맵기', '원산지'], MENU_RAW)

# ── ③ 별빛 분식 일주일 주문 기록 (2025-03-03 월 ~ 03-09 일) ───────────
rng = random.Random(20250303)
names = [m[0] for m in MENU]
weights = [m[5] for m in MENU]
pays = ['카드', '현금', '간편결제']
orders = []
no = 1
start = date(2025, 3, 3)
for d in range(7):
    day = start + timedelta(days=d)
    n = [10, 9, 11, 10, 14, 13, 9][d]          # 금요일이 가장 바쁘다
    times = sorted(rng.sample(range(11 * 60, 20 * 60), n))
    for t in times:
        menu = rng.choices(names, weights=weights)[0]
        qty = rng.choices([1, 2, 3, 4], weights=[55, 28, 12, 5])[0]
        pay = rng.choices(pays, weights=[55, 15, 30])[0]
        orders.append((no, day.isoformat(), f'{t // 60:02d}:{t % 60:02d}', menu, qty, pay))
        no += 1
write('orders.csv', ['주문번호', '날짜', '시각', '메뉴', '수량', '결제'], orders)

# ── ④ 바람섬 2024년 날씨 (지어낸 섬) ───────────────────────────
rng = random.Random(2024)
rows = []
d = date(2024, 1, 1)
missing_wind = {date(2024, 2, 14), date(2024, 5, 2), date(2024, 5, 3), date(2024, 8, 20), date(2024, 11, 7)}
while d.year == 2024:
    doy = d.timetuple().tm_yday
    base = 14.5 - 11.5 * math.cos(2 * math.pi * (doy - 20) / 366)      # 1월 하순이 가장 춥다
    avg = round(base + rng.gauss(0, 2.2), 1)
    hi = round(avg + 3 + abs(rng.gauss(2.5, 1.2)), 1)
    lo = round(avg - 3 - abs(rng.gauss(2.0, 1.0)), 1)
    wet = 0.22 + (0.25 if d.month in (6, 7, 8) else 0)                  # 여름에 비가 잦다
    rain = round(rng.expovariate(1 / (18 if d.month in (7, 8) else 7)), 1) if rng.random() < wet else 0.0
    windy = 1.6 if d.month in (11, 12, 1, 2) else 0.0                    # 겨울에 바람이 세다
    wind = None if d in missing_wind else round(max(0.4, 3.2 + windy + rng.gauss(0, 1.1)), 1)
    rows.append((d.isoformat(), avg, hi, lo, rain, wind))
    d += timedelta(days=1)
write('weather.csv', ['날짜', '평균기온', '최고기온', '최저기온', '강수량', '평균풍속'], rows)

# ── ⑤ 한빛시 공유자전거 대여 기록 (종합 미션용, 2025년 5월 첫 2주) ──────────
rng = random.Random(5050)
stations = [('강변공원', '물빛구'), ('시청앞', '중앙구'), ('한빛역', '중앙구'), ('대학로', '배움구'),
            ('도서관', '배움구'), ('호수공원', '물빛구'), ('시장입구', '중앙구'), ('체육관', '배움구')]
members = ['정기권', '일일권']
ages = ['10대', '20대', '30대', '40대', '50대', '60대']
age_w = [12, 30, 22, 16, 12, 8]
bike = []
start = datetime(2025, 5, 1)
for i in range(300):
    day = start + timedelta(days=rng.randrange(14))
    commute = rng.random() < 0.35
    hour = rng.choice([7, 8, 8, 9, 18, 18, 19]) if commute else rng.randrange(6, 23)
    when = day.replace(hour=hour, minute=rng.randrange(60))
    st, gu = rng.choice(stations)
    mem = rng.choices(members, weights=[62, 38])[0]
    age = rng.choices(ages, weights=age_w)[0]
    mins = max(3, int(rng.gauss(18 if mem == '정기권' else 34, 9)))
    dist = round(mins * rng.uniform(0.17, 0.26), 1)
    temp = round(17 + 4 * math.sin((when.hour - 9) / 24 * 2 * math.pi) + rng.gauss(0, 1.5), 1)
    bike.append([None, when.strftime('%Y-%m-%d %H:%M'), st, gu, mem, age, mins, dist, temp])
# 일부러 넣은 문제들 — 아주 긴 이용시간(반납 깜빡), 비어 있는 이동거리·나이대, 똑같이 두 번 적힌 줄
for i, m in [(17, 412), (88, 365), (151, 298), (240, 520)]:
    bike[i][6] = m
    bike[i][7] = round(m * 0.05, 1)
for i in [5, 23, 47, 60, 91, 120, 133, 167, 190, 214, 251, 277]:
    bike[i][7] = None
for i in [11, 74, 102, 188, 263]:
    bike[i][5] = None
bike.sort(key=lambda r: r[1])
for i in [40, 150, 222]:
    bike.insert(i + 1, list(bike[i]))
for n, r in enumerate(bike, start=1):
    r[0] = n
# 중복 줄은 대여번호까지 같아야 「완전히 같은 줄」이다 — 번호를 앞 줄과 맞춘다
for i in range(1, len(bike)):
    if bike[i][1:] == bike[i - 1][1:]:
        bike[i][0] = bike[i - 1][0]
write('bike.csv', ['대여번호', '대여일시', '대여소', '구', '회원', '나이대', '이용시간', '이동거리', '기온'], bike)
