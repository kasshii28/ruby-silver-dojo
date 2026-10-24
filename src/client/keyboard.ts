// Quiz shortcuts: A–F or 1–6 to choose, Enter to submit / go next, ← → to move.
import { KEYS } from './data';
import { state } from './state';
import { choose, currentQuestion, step, submit } from './views/quiz';

export function startKeyboard(): void {
  document.addEventListener('keydown', (e) => {
    const s = state.current;
    if (location.hash.slice(1) !== 'quiz' || !s || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('input, textarea, select')) return;
    const q = currentQuestion();
    if (!q) return;
    let pos = KEYS.findIndex((k) => k === e.key.toUpperCase());
    if (pos < 0 && /^[1-9]$/.test(e.key)) pos = Number(e.key) - 1;
    if (pos >= 0 && pos < q.choices.length) {
      const b = document.querySelector<HTMLElement>(`#choices .choice[data-pos="${pos}"]`);
      if (b) {
        e.preventDefault();
        choose(q, Number(b.dataset.orig));
      }
    } else if (e.key === 'Enter') {
      if (target?.closest('button, summary, a')) return;
      e.preventDefault();
      if (!s.ans[q.id] && q.answer.length > 1) submit(q);
      else if (s.ans[q.id]) step(1);
    } else if (e.key === 'ArrowRight') {
      if (s.i < s.ids.length - 1) step(1);
    } else if (e.key === 'ArrowLeft') step(-1);
  });
}
