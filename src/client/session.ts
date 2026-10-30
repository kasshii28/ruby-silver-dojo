// Starting, archiving and scoring exams.
import type { Category, ExamRecord, Question, Session } from '../lib/types';
import { EXAM, OFFICIAL, ORIGINAL, QUESTIONS, keyOf, question } from './data';
import { navigate } from './router';
import { MAX_RECORDS, save, state } from './state';

export type ExamSpec =
  | { kind: 'mock' | 'mini' | 'all' | 'wrong' | 'official' | 'official-random' }
  | { kind: 'cat'; cat: Category }
  | { kind: 'ids'; ids: number[]; title: string };

export function shuffle<T>(a: readonly T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

export const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));
export const wrongIds = () => QUESTIONS.filter((q) => state.hist[q.id] && !state.hist[q.id]?.ok).map((q) => q.id);
export const catCount = (c: Category) => ORIGINAL.filter((q) => q.cat === c).length;

/** Display order of a question's choices: display position → original index. */
export const orderOf = (q: Question, perm: Record<number, number[]>) => perm[q.id] ?? q.choices.map((_, k) => k);
export const lettersOf = (orig: number[], order: number[]) => orig.map((o) => keyOf(order.indexOf(o))).sort().join('・');

function makeSession(title: string, ids: number[], ordered = false): Session {
  const shuffled = ordered ? ids.slice() : shuffle(ids);
  const perm: Record<number, number[]> = {};
  shuffled.forEach((id) => {
    perm[id] = shuffle(question(id).choices.map((_, k) => k));
  });
  return { title, ids: shuffled, perm, ans: {}, i: 0, startedAt: Date.now() };
}

export function startExam(spec: ExamSpec): void {
  const all = ORIGINAL.map((q) => q.id);
  const official = OFFICIAL.map((q) => q.id);
  let title: string, ids: number[];
  switch (spec.kind) {
    case 'mock': ids = shuffle(all).slice(0, EXAM.size); title = '模擬試験'; break;
    case 'mini': ids = shuffle(all).slice(0, 10); title = 'ミニテスト'; break;
    case 'all': ids = all; title = '全問チャレンジ'; break;
    case 'cat': ids = ORIGINAL.filter((q) => q.cat === spec.cat).map((q) => q.id); title = `分野別：${spec.cat}`; break;
    case 'official': ids = official; title = '公式模擬問題'; break;
    case 'official-random': ids = official; title = '公式模擬問題（ランダム）'; break;
    case 'wrong': ids = wrongIds(); title = 'まちがえた問題'; break;
    case 'ids': ids = spec.ids; title = spec.title; break;
  }
  if (!ids.length) return;
  archiveCurrent();
  state.current = makeSession(title, ids, spec.kind === 'official');
  save();
  navigate('quiz');
}

function toRecord(s: Session): ExamRecord {
  return { id: Date.now(), title: s.title, ids: s.ids, perm: s.perm, ans: s.ans, startedAt: s.startedAt, finishedAt: Date.now(), complete: Object.keys(s.ans).length === s.ids.length };
}

function pushRecord(r: ExamRecord): void {
  state.records.unshift(r);
  state.records = state.records.slice(0, MAX_RECORDS);
}

/** Keeps the answered part of the exam in progress, then clears it. */
function archiveCurrent(): void {
  if (state.current && Object.keys(state.current.ans).length) pushRecord(toRecord(state.current));
  state.current = null;
}

export function finishCurrent(): void {
  if (!state.current) return;
  const rec = toRecord(state.current);
  pushRecord(rec);
  state.current = null;
  save();
  navigate('r' + rec.id);
}

export function stats(r: Session | ExamRecord) {
  const total = r.ids.length;
  const answered = r.ids.filter((id) => r.ans[id]).length;
  const ok = r.ids.filter((id) => r.ans[id]?.ok).length;
  return { total, answered, ok, pct: total ? Math.round((ok / total) * 100) : 0 };
}
