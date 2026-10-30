// The exam and its questions, embedded in the page as JSON (see src/pages/[exam].astro).
import type { ExamInfo } from '../lib/exams';
import type { Question } from '../lib/types';

function readJson(id: string): unknown {
  const text = document.getElementById(id)?.textContent;
  return text ? JSON.parse(text) : undefined;
}

export const EXAM = readJson('exam') as ExamInfo;
export const QUESTIONS = ((readJson('qdata') ?? []) as Question[]).slice().sort((a, b) => a.id - b.id);
/** This site's own questions. The random exams draw only from these. */
export const ORIGINAL = QUESTIONS.filter((q) => q.official === undefined);
/** The official prep test, in its own numbering. */
export const OFFICIAL = QUESTIONS.filter((q) => q.official !== undefined).sort((a, b) => (a.official ?? 0) - (b.official ?? 0));
export const OFFICIAL_SOURCE = EXAM.officialSource;
export const CATS = EXAM.cats;
export const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const PASS = EXAM.pass;

export const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function question(id: number | undefined): Question {
  const q = id === undefined ? undefined : byId.get(id);
  if (!q) throw new Error(`unknown question id ${id}`);
  return q;
}

export const keyOf = (pos: number): string => KEYS[pos] ?? '?';
