// Hash routes: #home, #quiz and #r<record id>. Views are passed in by main.ts so this module does not import them.
import type { ExamRecord } from '../lib/types';
import { state } from './state';

interface Views {
  home: () => void;
  quiz: () => void;
  result: (r: ExamRecord) => void;
}

let views: Views | null = null;

export function route(): void {
  if (!views) return;
  const h = location.hash.slice(1);
  const rec = /^r\d+$/.test(h) ? state.records.find((r) => r.id === +h.slice(1)) : undefined;
  if (h === 'quiz' && state.current) views.quiz();
  else if (rec) views.result(rec);
  else views.home();
  window.scrollTo({ top: 0 });
}

export function navigate(h: string): void {
  if (location.hash.slice(1) !== h) {
    try {
      history.pushState(null, '', '#' + h);
    } catch {
      location.hash = h;
      return;
    }
  }
  route();
}

export function startRouter(v: Views): void {
  views = v;
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  route();
}
