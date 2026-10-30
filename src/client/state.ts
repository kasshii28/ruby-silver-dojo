// Study history in localStorage, kept per exam. Ruby Silver uses the original site's keys (rs-*) and shapes,
// so existing users keep their history. Anything malformed is dropped on load.
import type { Answer, ExamRecord, QuestionStat, Session } from '../lib/types';
import { EXAM, byId } from './data';

const KEY_HIST = `${EXAM.storage}-hist`;
const KEY_CURRENT = `${EXAM.storage}-current`;
const KEY_HISTORY = `${EXAM.storage}-history`;
export const MAX_RECORDS = 100;

function read(k: string): unknown {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : undefined;
  } catch {
    return undefined;
  }
}
function write(k: string, v: unknown): void {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function remove(k: string): void {
  try {
    localStorage.removeItem(k);
  } catch {}
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isIntArray = (v: unknown): v is number[] => Array.isArray(v) && v.every(isInt);

const validIds = (v: unknown): v is number[] => isIntArray(v) && v.length > 0 && v.every((id) => byId.has(id));
const choiceCount = (id: number) => byId.get(id)?.choices.length ?? 0;

function parseHist(v: unknown): Record<number, QuestionStat> {
  const out: Record<number, QuestionStat> = {};
  if (!isObj(v)) return out;
  for (const [k, s] of Object.entries(v)) {
    const id = Number(k);
    if (byId.has(id) && isObj(s) && typeof s.ok === 'boolean' && isInt(s.n) && isInt(s.c)) out[id] = { ok: s.ok, n: s.n, c: s.c };
  }
  return out;
}

/** perm[id] must be an ordering of that question's choices. */
function parsePerm(v: unknown, ids: number[]): Record<number, number[]> | null {
  if (!isObj(v)) return null;
  const out: Record<number, number[]> = {};
  for (const [k, p] of Object.entries(v)) {
    const id = Number(k), n = choiceCount(id);
    if (!ids.includes(id) || !isIntArray(p) || p.length !== n || new Set(p).size !== n || !p.every((x) => x >= 0 && x < n)) return null;
    out[id] = p.slice();
  }
  return out;
}

function parseAns(v: unknown, ids: number[]): Record<number, Answer> | null {
  if (!isObj(v)) return null;
  const out: Record<number, Answer> = {};
  for (const [k, a] of Object.entries(v)) {
    const id = Number(k), n = choiceCount(id);
    if (!ids.includes(id) || !isObj(a) || typeof a.ok !== 'boolean' || !isIntArray(a.sel) || !a.sel.every((x) => x >= 0 && x < n)) return null;
    out[id] = { sel: a.sel.slice(), ok: a.ok };
  }
  return out;
}

function parseSession(v: unknown): Session | null {
  if (!isObj(v) || typeof v.title !== 'string' || !validIds(v.ids)) return null;
  const { title, ids, i, startedAt } = v;
  const perm = parsePerm(v.perm, ids), ans = parseAns(v.ans, ids);
  if (!perm || !ans || !isInt(i) || i < 0 || i >= ids.length || !isTime(startedAt)) return null;
  return { title, ids: ids.slice(), perm, ans, i, startedAt };
}

function parseRecord(v: unknown): ExamRecord | null {
  if (!isObj(v) || !isTime(v.id) || typeof v.title !== 'string' || !validIds(v.ids)) return null;
  const { id, title, ids, startedAt, finishedAt, complete } = v;
  const perm = parsePerm(v.perm, ids), ans = parseAns(v.ans, ids);
  if (!perm || !ans || !isTime(startedAt) || !isTime(finishedAt) || typeof complete !== 'boolean') return null;
  return { id, title, ids: ids.slice(), perm, ans, startedAt, finishedAt, complete };
}

function parseRecords(v: unknown): ExamRecord[] {
  if (!Array.isArray(v)) return [];
  return v.map(parseRecord).filter((r): r is ExamRecord => r !== null);
}

export const state: {
  /** question id → latest result */
  hist: Record<number, QuestionStat>;
  /** the exam in progress */
  current: Session | null;
  /** finished exams, newest first */
  records: ExamRecord[];
} = {
  hist: parseHist(read(KEY_HIST)),
  current: parseSession(read(KEY_CURRENT)),
  records: parseRecords(read(KEY_HISTORY)),
};

export function save(): void {
  write(KEY_HIST, state.hist);
  write(KEY_HISTORY, state.records);
  if (state.current) write(KEY_CURRENT, state.current);
  else remove(KEY_CURRENT);
}
