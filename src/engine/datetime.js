// © 2026 티쳐무 · 모든 권리 보유
// 날짜·시각 — pd.to_datetime · Timestamp · Timedelta · 시리즈.dt.month · to_period 같은 것.
// 날짜는 1970-01-01 00:00 부터 흐른 밀리초(UTC 기준 수)로 담는다. 빈 날짜(NaT)는 NaN. 기간(Timedelta)도 밀리초.
// 표기는 pandas 2.2 와 같게 — 열 안의 모든 값이 자정이면 '2025-03-03', 하나라도 시각이 있으면 '2025-03-03 12:26:00'.
import { PyError, PyFunc, pyInt, Num, parseArgs, str as pyStr } from './pyvalues.js';

export const DT = 'datetime64[ns]';
export const TD = 'timedelta64[ns]';
export const DAY = 86400000;
const pad = (n, w = 2) => String(n).padStart(w, '0');

export function isMidnight(ms) { return ((ms % DAY) + DAY) % DAY === 0; }
export function fmtDate(ms) { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
export function fmtFull(ms) {
  const d = new Date(ms);
  return `${fmtDate(ms)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
// 열 하나를 글자로 — 모두 자정이면 날짜만
export function formatDates(values) {
  const real = values.filter((x) => !Number.isNaN(x));
  const dateOnly = real.every(isMidnight);
  return values.map((x) => (Number.isNaN(x) ? 'NaT' : dateOnly ? fmtDate(x) : fmtFull(x)));
}

// ── 기간(Timedelta) 표기 ──
function tdParts(ms) {
  const days = Math.floor(ms / DAY);
  let rest = Math.round(ms - days * DAY) / 1000;
  const h = Math.floor(rest / 3600); rest -= h * 3600;
  const m = Math.floor(rest / 60); rest -= m * 60;
  return { days, h, m, s: rest };
}
export function fmtTd(ms, daysOnly = false) {
  if (Number.isNaN(ms)) return 'NaT';
  const { days, h, m, s } = tdParts(ms);
  const sec = Number.isInteger(s) ? pad(s) : s.toFixed(6).padStart(9, '0').replace(/0+$/, '');
  const dayTxt = `${days} days`;
  if (daysOnly) return dayTxt;
  return `${dayTxt}${days < 0 ? ' +' : ' '}${pad(h)}:${pad(m)}:${sec}`;
}
// 열 하나 — 모두 하루 단위로 딱 떨어지면 '2 days', 아니면 '0 days 00:35:45'
export function formatTds(values) {
  const real = values.filter((x) => !Number.isNaN(x));
  const daysOnly = real.length > 0 && real.every((x) => x % DAY === 0);
  return values.map((x) => fmtTd(x, daysOnly));
}

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monOf = (w) => { const i = MON.indexOf(w.slice(0, 3).toLowerCase()); return i < 0 ? null : i + 1; };
function make(y, mo, d, hh = 0, mi = 0, ss = 0) {
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && hh >= 0 && hh <= 23 && mi >= 0 && mi <= 59 && ss >= 0 && ss <= 59)) return null;
  const ms = Date.UTC(y, mo - 1, d, hh, mi, ss);
  if (new Date(ms).getUTCDate() !== d) return null; // 2월 30일 같은 날
  return ms;
}
const ampm = (h, p) => { if (!p) return h; const pm = /p/i.test(p); if (h === 12) return pm ? 12 : 0; return pm ? h + 12 : h; };

// 글자 → 밀리초. 못 읽으면 null. 판다스가 서식 없이 알아보는 흔한 모양들:
//   2025-03-07 · 2025/03/07 · 2025.03.07 · 20250307 · 2025-03-07 18:05 · 2025-03-07 18:05:20 · 2025-03-07T18:05
//   03/07/2025 (월/일/년) · 03/07/2025 06:05:20 PM · 7-Mar-2025 · 7 Mar 2025 18:05:20 · Mar 7, 2025
export function parseDate(s) {
  const t = String(s).trim();
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
  if (m) return make(+m[1], +m[2], +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(t);
  if (m) return make(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AaPp][Mm]))?)?$/.exec(t);
  if (m) return make(+m[3], +m[1], +m[2], ampm(+(m[4] ?? 0), m[7]), +(m[5] ?? 0), +(m[6] ?? 0));
  m = /^(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
  if (m && monOf(m[2])) return make(+m[3], monOf(m[2]), +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  m = /^([A-Za-z]{3,9}) (\d{1,2}),? (\d{4})$/.exec(t);
  if (m && monOf(m[1])) return make(+m[3], monOf(m[1]), +m[2]);
  return null;
}
// 서식 없이 읽을 때 판다스가 「서식을 짐작하지 못했다」고 경고하는 모양 (오전·오후 표기)
export function needsDateutil(s) { return /\s[AaPp][Mm]$/.test(String(s).trim()); }

// strftime 의 흔한 서식만 — %Y %y %m %d %H %M %S %B %b
export function strftime(ms, fmt) {
  const d = new Date(ms);
  return fmt.replace(/%([YymdHMSBb])/g, (_, c) => ({
    Y: String(d.getUTCFullYear()), y: pad(d.getUTCFullYear() % 100), m: pad(d.getUTCMonth() + 1), d: pad(d.getUTCDate()),
    H: pad(d.getUTCHours()), M: pad(d.getUTCMinutes()), S: pad(d.getUTCSeconds()), B: MONTHS[d.getUTCMonth()], b: MONTHS[d.getUTCMonth()].slice(0, 3),
  }[c]));
}
// format='%Y년%m월%d일' 처럼 서식을 준 to_datetime — %Y %y %m %d %H %I %M %S %p %b %B, 나머지 글자는 그대로 맞춘다
export function parseWithFormat(s, fmt) {
  const order = [];
  const re = '^' + fmt.replace(/%([YymdHIMSpbB%])|([.*+?^${}()|[\]\\])|(.)/gs, (all, code, special, ch) => {
    if (code === '%') return '%';
    if (code) {
      order.push(code);
      return { Y: '(\\d{4})', y: '(\\d{2})', p: '([AaPp][Mm])', b: '([A-Za-z]{3})', B: '([A-Za-z]{3,9})' }[code] ?? '(\\d{1,2})';
    }
    return special ? '\\' + special : ch;
  }) + '$';
  const m = new RegExp(re).exec(String(s).trim());
  if (!m) return null;
  const v = { Y: 1900, m: 1, d: 1, H: 0, M: 0, S: 0, p: null };
  order.forEach((c, i) => {
    const x = m[i + 1];
    if (c === 'y') v.Y = (+x < 69 ? 2000 : 1900) + +x;
    else if (c === 'b' || c === 'B') v.m = monOf(x) ?? -1;
    else if (c === 'p') v.p = x;
    else if (c === 'I') v.H = +x;
    else v[c] = +x;
  });
  return make(v.Y, v.m, v.d, ampm(v.H, v.p), v.M, v.S);
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// 날짜 하나에서 꺼내는 값
export function field(ms, name) {
  const d = new Date(ms);
  switch (name) {
    case 'year': return d.getUTCFullYear();
    case 'month': return d.getUTCMonth() + 1;
    case 'day': return d.getUTCDate();
    case 'hour': return d.getUTCHours();
    case 'minute': return d.getUTCMinutes();
    case 'second': return d.getUTCSeconds();
    case 'dayofweek': case 'weekday': case 'day_of_week': return (d.getUTCDay() + 6) % 7;
    case 'quarter': return Math.floor(d.getUTCMonth() / 3) + 1;
    case 'dayofyear': case 'day_of_year': return Math.floor((ms - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY) + 1;
  }
  return undefined;
}
export const DT_FIELDS = ['year', 'month', 'day', 'hour', 'minute', 'second', 'dayofweek', 'weekday', 'day_of_week', 'quarter', 'dayofyear', 'day_of_year'];

// 기간(Period) — to_period('M') 의 한 칸. 글자 표기와 dtype 이름
export const PERIODS = {
  Y: { dtype: 'period[Y-DEC]', f: (ms) => String(field(ms, 'year')) },
  Q: { dtype: 'period[Q-DEC]', f: (ms) => `${field(ms, 'year')}Q${field(ms, 'quarter')}` },
  M: { dtype: 'period[M]', f: (ms) => fmtDate(ms).slice(0, 7) },
  D: { dtype: 'period[D]', f: (ms) => fmtDate(ms) },
  h: { dtype: 'period[h]', f: (ms) => fmtFull(ms).slice(0, 13) + ':00' },
};
export const PERIOD_OLD = { A: 'Y', H: 'h' };

// Timestamp — 날짜 하나 (o['날짜'].iloc[0], o['날짜'].min())
export class Timestamp {
  constructor(ms) { this.ms = ms; }
  get pyType() { return 'Timestamp'; }
  repr() { return `Timestamp('${fmtFull(this.ms)}')`; }
  str() { return fmtFull(this.ms); }
  equals(o) { return o instanceof Timestamp && o.ms === this.ms; }
  getattr(name) {
    if (DT_FIELDS.includes(name)) return pyInt(field(this.ms, name));
    if (name === 'day_name') return new PyFunc('day_name', () => DAYS[field(this.ms, 'dayofweek')], { owner: 'Timestamp', self: this });
    if (name === 'month_name') return new PyFunc('month_name', () => MONTHS[field(this.ms, 'month') - 1], { owner: 'Timestamp', self: this });
    if (name === 'strftime') return new PyFunc('strftime', (a, k) => { const { format } = parseArgs('strftime', a, k, [['format', '']]); return strftime(this.ms, pyStr(format)); }, { owner: 'Timestamp', self: this });
    if (name === 'date') return new PyFunc('date', () => new DateOnly(this.ms), { owner: 'Timestamp', self: this });
    return undefined;
  }
}
// Timedelta — 기간 하나 (pd.Timedelta(days=99), 날짜 − 날짜)
export class Timedelta {
  constructor(ms) { this.ms = ms; }
  get pyType() { return 'Timedelta'; }
  repr() { return `Timedelta('${fmtTd(this.ms)}')`; }
  str() { return fmtTd(this.ms); }
  equals(o) { return o instanceof Timedelta && o.ms === this.ms; }
  getattr(name) {
    const { days, h, m, s } = tdParts(this.ms);
    if (name === 'days') return pyInt(days);
    if (name === 'seconds') return pyInt(Math.floor(h * 3600 + m * 60 + s));
    if (name === 'total_seconds') return new PyFunc('total_seconds', () => new Num(this.ms / 1000, 'float'), { owner: 'Timedelta', self: this });
    return undefined;
  }
}
export class DateOnly {
  constructor(ms) { this.ms = ms; }
  get pyType() { return 'date'; }
  repr() { const d = new Date(this.ms); return `datetime.date(${d.getUTCFullYear()}, ${d.getUTCMonth() + 1}, ${d.getUTCDate()})`; }
  str() { return fmtDate(this.ms); }
  equals(o) { return o instanceof DateOnly && o.ms === this.ms; }
}
export const NaT = { pyType: 'NaTType', repr: () => 'NaT', str: () => 'NaT', equals: (o) => o === NaT };

export function boxDate(ms) { return Number.isNaN(ms) ? NaT : new Timestamp(ms); }
export function boxTd(ms) { return Number.isNaN(ms) ? NaT : new Timedelta(ms); }

// 계산·비교에 쓰도록 날짜 쪽 값을 밀리초로 — 글자('2025-03-08')도 날짜로 읽어 준다
export function dateOperand(v) {
  if (v instanceof Timestamp) return v.ms;
  if (v === NaT) return NaN;
  if (typeof v === 'string') {
    const ms = parseDate(v);
    if (ms === null) throw new PyError('ValueError', `could not convert string to Timestamp`, `'${v}' 를 날짜로 읽을 수 없습니다. '2025-03-08' 처럼 적으세요.`);
    return ms;
  }
  if (v instanceof Num) throw new PyError('TypeError', `Invalid comparison between dtype=datetime64[ns] and ${v.k === 'float' || v.k === 'f64' ? 'float' : 'int'}`, '날짜 열은 날짜(글자 \'2025-03-08\')와 견줍니다.');
  return null;
}
