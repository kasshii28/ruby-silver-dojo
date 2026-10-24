// The questions embedded in the page as JSON (see src/pages/index.astro).
import { CATEGORIES, type Question } from '../lib/types';

function load(): Question[] {
  const text = document.getElementById('qdata')?.textContent;
  const list = text ? (JSON.parse(text) as Question[]) : [];
  return list.slice().sort((a, b) => a.id - b.id);
}

export const QUESTIONS = load();
export const CATS = CATEGORIES;
export const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const PASS = 75;

export const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function question(id: number | undefined): Question {
  const q = id === undefined ? undefined : byId.get(id);
  if (!q) throw new Error(`unknown question id ${id}`);
  return q;
}

export const keyOf = (pos: number): string => KEYS[pos] ?? '?';
