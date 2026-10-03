# -*- coding: utf-8 -*-
"""
기준 출력 만들기 — 레슨의 정답 코드와 시험용 코드(test/scenarios.json)를
진짜 pandas 2.2 · IPython 으로 실행해 test/golden.json 을 만든다.
자체 엔진(src/engine)의 출력이 이것과 글자 하나까지 같아야 한다(test/golden.test.mjs).

© 2026 티쳐무 · 모든 권리 보유

    cd D:\\project_AI\\pandas_study\\pandas-lab
    npm run scenarios                     # 레슨·시험 코드 → test/scenarios.json
    <pandas 2.2 가 깔린 파이썬> tools/golden.py

⚠ 코랩과 같은 pandas 2.2 로 돌려야 한다(pandas 3 은 inplace·문자열 dtype 이 달라 출력이 바뀐다).
  이 PC 에서는 ..\\..\\ds_performance\\.venv\\Scripts\\python.exe (pandas 2.2.2) 를 빌려 쓴다.
⚠ 셀 마지막 줄의 값은 IPython 의 pretty 로 찍는다 — 코랩이 그렇게 찍기 때문이다.
⚠ 시나리오마다 데이터 파일을 새 임시 폴더에 복사해서 돌린다 — to_csv 로 쓴 파일이 다음 시나리오에 새지 않게.
"""
import ast, contextlib, io, json, os, re, shutil, sys, tempfile, warnings

import numpy as np
import pandas as pd
from IPython.lib.pretty import pretty

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, 'src', 'data')
assert pd.__version__.startswith('2.2'), 'pandas 2.2 로 실행해야 한다: ' + pd.__version__

ADDR = re.compile(r'\b0x[0-9a-fA-F]+')


def run_cell(code, ns):
    res = {'stdout': '', 'display': None, 'error': None, 'warnings': []}
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        res['error'] = ['SyntaxError', str(e.msg)]
        return res
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop().value)
    out = io.StringIO()
    with warnings.catch_warnings(record=True) as w, contextlib.redirect_stdout(out):
        warnings.simplefilter('always')
        try:
            exec(compile(tree, '<cell>', 'exec'), ns)
            if last is not None:
                v = eval(compile(last, '<cell>', 'eval'), ns)
                if v is not None:
                    res['display'] = ADDR.sub('0x…', pretty(v))
        except Exception as e:
            res['error'] = [type(e).__name__, str(e).split('\n')[0]]
    res['stdout'] = out.getvalue()
    res['warnings'] = [f'{x.category.__name__}: {str(x.message).splitlines()[0]}' for x in w
                       if not issubclass(x.category, (DeprecationWarning, PendingDeprecationWarning))]
    return res


def main():
    # 코랩(주피터 커널)의 판다스 설정 — 터미널이 아니므로 열을 ... 로 자르지 않고 80칸에 맞춰 덩어리로 나눈다
    pd.set_option('display.max_columns', 20)
    pd.set_option('display.width', 80)
    with open(os.path.join(ROOT, 'test', 'scenarios.json'), encoding='utf-8') as fp:
        sc = json.load(fp)
    only = sys.argv[1] if len(sys.argv) > 1 else None
    path = os.path.join(ROOT, 'test', 'golden.json')
    gold = {}
    if only and os.path.exists(path):
        with open(path, encoding='utf-8') as fp:
            gold = json.load(fp)
    home = os.getcwd()
    for s in sc:
        if only and only not in s['id']:
            continue
        tmp = tempfile.mkdtemp(prefix='pdlab-')
        for f in os.listdir(DATA):
            shutil.copy(os.path.join(DATA, f), tmp)
        os.chdir(tmp)
        ns = {}
        gold[s['id']] = [run_cell(c, ns) for c in s['cells']]
        os.chdir(home)
        shutil.rmtree(tmp, ignore_errors=True)
    # 시나리오 목록에 없는 옛 기준은 버린다
    ids = {s['id'] for s in sc}
    gold = {k: v for k, v in gold.items() if k in ids}
    with open(path, 'w', encoding='utf-8') as fp:
        json.dump(gold, fp, ensure_ascii=False, indent=1)
    n = sum(len(v) for v in gold.values())
    print(f'시나리오 {len(gold)}개 · 셀 {n}개 → test/golden.json')


if __name__ == '__main__':
    main()
