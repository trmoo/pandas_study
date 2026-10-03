// © 2026 티쳐무 · 학교 수업 목적으로만 사용
// IPython 의 pretty 출력 흉내 — 코랩은 셀 마지막 줄의 값을 IPython.lib.pretty 로 찍는다.
// 리스트·튜플·딕셔너리가 79칸을 넘으면 바깥 묶음부터 차례로 줄을 바꾼다.
// (원본 PrettyPrinter 의 알고리즘과 버릇을 그대로 옮겼다 — GroupQueue.deq 의 거꾸로 센 번호로 지우는 것까지)
import { Tuple, Dict, PyFunc, repr } from './pyvalues.js';

const MAX_WIDTH = 79, MAX_SEQ = 1000;

class Group { constructor(depth) { this.depth = depth; this.breakables = []; this.wantBreak = false; } }

class TextChunk {
  constructor() { this.objs = []; this.width = 0; }
  output(out, w) { for (const o of this.objs) out.push(o); return w + this.width; }
  add(o, w) { this.objs.push(o); this.width += w; }
}

class Breakable {
  constructor(sep, width, p) {
    this.obj = sep; this.width = width; this.p = p; this.indentation = p.indentation;
    this.group = p.groupStack[p.groupStack.length - 1];
    this.group.breakables.push(this);
  }
  output(out, w) {
    this.group.breakables.shift();
    if (this.group.wantBreak) { out.push('\n', ' '.repeat(this.indentation)); return this.indentation; }
    if (!this.group.breakables.length) this.p.queue.remove(this.group);
    out.push(this.obj);
    return w + this.width;
  }
}

class GroupQueue {
  constructor(...groups) { this.queue = []; groups.forEach((g) => this.enq(g)); }
  enq(g) { while (g.depth > this.queue.length - 1) this.queue.push([]); this.queue[g.depth].push(g); }
  deq() {
    for (const stack of this.queue) {
      const rev = [...stack].reverse();
      for (let idx = 0; idx < rev.length; idx++) {
        const g = rev[idx];
        if (g.breakables.length) { stack.splice(idx, 1); g.wantBreak = true; return g; }
      }
      for (const g of stack) g.wantBreak = true;
      stack.length = 0;
    }
    return null;
  }
  remove(g) { const s = this.queue[g.depth]; if (!s) return; const i = s.indexOf(g); if (i >= 0) s.splice(i, 1); }
}

class Printer {
  constructor() {
    this.out = []; this.outputWidth = 0; this.bufferWidth = 0; this.buffer = [];
    const root = new Group(0);
    this.groupStack = [root]; this.queue = new GroupQueue(root); this.indentation = 0;
  }
  breakOneGroup(g) {
    while (g.breakables.length) { const x = this.buffer.shift(); this.outputWidth = x.output(this.out, this.outputWidth); this.bufferWidth -= x.width; }
    while (this.buffer.length && this.buffer[0] instanceof TextChunk) {
      const x = this.buffer.shift(); this.outputWidth = x.output(this.out, this.outputWidth); this.bufferWidth -= x.width;
    }
  }
  breakOuterGroups() {
    while (MAX_WIDTH < this.outputWidth + this.bufferWidth) {
      const g = this.queue.deq();
      if (!g) return;
      this.breakOneGroup(g);
    }
  }
  text(s) {
    const w = s.length;
    if (this.buffer.length) {
      let t = this.buffer[this.buffer.length - 1];
      if (!(t instanceof TextChunk)) { t = new TextChunk(); this.buffer.push(t); }
      t.add(s, w); this.bufferWidth += w; this.breakOuterGroups();
    } else { this.out.push(s); this.outputWidth += w; }
  }
  breakable(sep = ' ') {
    const g = this.groupStack[this.groupStack.length - 1];
    if (g.wantBreak) {
      this.flush(); this.out.push('\n', ' '.repeat(this.indentation));
      this.outputWidth = this.indentation; this.bufferWidth = 0;
    } else {
      this.buffer.push(new Breakable(sep, sep.length, this)); this.bufferWidth += sep.length; this.breakOuterGroups();
    }
  }
  forceBreak() {
    const g = this.queue.deq();
    if (g) this.breakOneGroup(g);
    this.flush(); this.out.push('\n', ' '.repeat(this.indentation));
    this.outputWidth = this.indentation; this.bufferWidth = 0;
  }
  beginGroup(indent = 0, open = '') {
    if (open) this.text(open);
    const g = new Group(this.groupStack[this.groupStack.length - 1].depth + 1);
    this.groupStack.push(g); this.queue.enq(g); this.indentation += indent;
  }
  endGroup(dedent = 0, close = '') {
    this.indentation -= dedent;
    const g = this.groupStack.pop();
    if (!g.breakables.length) this.queue.remove(g);
    if (close) this.text(close);
  }
  flush() {
    for (const d of this.buffer) this.outputWidth += d.output(this.out, this.outputWidth);
    this.buffer = []; this.bufferWidth = 0;
  }

  pretty(v) {
    // type(df) — IPython 은 클래스를 <class '…'> 가 아니라 이름만 찍는다 (pandas.core.frame.DataFrame · int)
    if (v instanceof PyFunc && v.kind === 'class' && typeof v.owner === 'string') return this.text(v.owner);
    if (Array.isArray(v)) return this.seq(v, '[', ']', false);
    if (v instanceof Tuple) return this.seq(v.items, '(', ')', true);
    if (v instanceof Dict) {
      this.beginGroup(1, '{');
      let i = 0;
      for (const [k, x] of v.map) {
        if (i >= MAX_SEQ) { this.text(','); this.breakable(); this.text('...'); break; }
        if (i) { this.text(','); this.breakable(); }
        this.pretty(k); this.text(': '); this.pretty(x); i++;
      }
      this.endGroup(1, '}');
      return;
    }
    // 그 밖의 값은 repr 을 줄마다 끊어 넣는다 (IPython 의 _repr_pprint)
    const lines = repr(v).split('\n');
    this.beginGroup(0);
    lines.forEach((ln, i) => { if (i) this.forceBreak(); this.text(ln); });
    this.endGroup(0);
  }
  seq(items, open, close, isTuple) {
    this.beginGroup(open.length, open);
    for (let i = 0; i < items.length; i++) {
      if (i >= MAX_SEQ) { this.text(','); this.breakable(); this.text('...'); break; }
      if (i) { this.text(','); this.breakable(); }
      this.pretty(items[i]);
    }
    if (isTuple && items.length === 1) this.text(',');
    this.endGroup(open.length, close);
  }
}

export function pretty(v) {
  const p = new Printer();
  p.pretty(v);
  p.flush();
  return p.out.join('');
}
