# -*- coding: utf-8 -*-
"""
치트시트 점검 — src/cheatsheet/sheet.js 의 코드 조각을 진짜 pandas 2.2 로 하나씩 실행해 본다.
조각마다 새로 불러온 표(df·o·raw)에서 돈다. 오류·경고가 하나라도 나면 실패.

© 2026 티쳐무 · 모든 권리 보유

    node tools/make-cheatsheet.mjs          # 조각 목록 → test/cheatsheet.json
    <pandas 2.2 파이썬> tools/verify_cheatsheet.py
"""
import contextlib, io, json, os, sys, warnings
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'src', 'data')
assert pd.__version__.startswith('2.2'), pd.__version__
items = json.load(open(os.path.join(ROOT, 'test', 'cheatsheet.json'), encoding='utf-8'))
bad = 0
for it in items:
    ns = {'pd': pd, 'np': np,
          'df': pd.read_csv(os.path.join(DATA, 'menu.csv')),
          'o': pd.read_csv(os.path.join(DATA, 'orders.csv')),
          'raw': pd.read_csv(os.path.join(DATA, 'menu_raw.csv'))}
    code = it['c'].replace("'menu.csv'", repr(os.path.join(DATA, 'menu.csv'))).replace("'orders.csv'", repr(os.path.join(DATA, 'orders.csv')))
    code = code.replace("'result.csv'", repr(os.path.join(os.environ.get('TEMP', '/tmp'), 'pdlab-result.csv')))
    out = io.StringIO()
    with warnings.catch_warnings(record=True) as w, contextlib.redirect_stdout(out):
        warnings.simplefilter('always')
        try:
            exec(code, ns)
            err = None
        except Exception as e:
            err = f'{type(e).__name__}: {e}'
    ws = [f'{x.category.__name__}: {x.message}' for x in w if not issubclass(x.category, (DeprecationWarning, PendingDeprecationWarning))]
    if err or ws:
        bad += 1
        print(f'✗ [{it["sec"]}] {it["c"]}\n   {err or ws[0]}')
print(f'치트시트 조각 {len(items)}개 중 {len(items) - bad}개 통과')
sys.exit(1 if bad else 0)
