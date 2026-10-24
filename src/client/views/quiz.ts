import type { Answer, Question } from '../../lib/types';
import { keyOf, question } from '../data';
import { $, armButton, esc, must, mount } from '../dom';
import { navigate } from '../router';
import { finishCurrent, lettersOf, orderOf, sameSet, stats } from '../session';
import { save, state } from '../state';
import { choiceBody, explanation, markedChoices, questionHead } from './shared';

/** Original indexes picked for a multiple-choice question that is not submitted yet. */
let picked: number[] = [];

export function currentQuestion(): Question | null {
  const s = state.current;
  return s ? question(s.ids[s.i]) : null;
}

export function renderQuiz(): void {
  const s = state.current;
  if (!s) return;
  const total = s.ids.length;
  const q = question(s.ids[s.i]);
  const a = s.ans[q.id];
  const order = orderOf(q, s.perm);
  const st = stats(s);
  picked = [];
  let html = `<div class="quizbar"><button class="btn ghost" type="button" id="to-home">← ホーム</button><span class="qtitle">${esc(s.title)}</span><button class="btn ghost danger" type="button" id="end">終了して採点</button></div>
    <div class="progress"><div class="progress-row"><span>問 <b>${s.i + 1} / ${total}</b></span><span>正解 <b id="sc-ok">${st.ok}</b> ／ 回答 <b id="sc-done">${st.answered}</b></span></div>
    <div class="bar"><i data-w="${((s.i + 1) / total) * 100}"></i></div></div>
    <article class="sheet">${questionHead(q, `問 ${s.i + 1}`)}`;
  if (a) html += markedChoices(q, order, a.sel);
  else {
    html += `<ol class="choices" id="choices">` + order.map((orig, pos) => `<li><button type="button" class="choice" data-orig="${orig}" data-pos="${pos}"><span class="key">${keyOf(pos)}</span><span class="body">${choiceBody(q, q.choices[orig] ?? '')}</span><span class="mark"></span></button></li>`).join('') + `</ol>`;
    if (q.answer.length > 1) html += `<div class="submit-row" id="submit-row"><button class="btn primary" type="button" id="submit" disabled>解答する</button></div>`;
  }
  html += `<div id="feedback">${a ? feedback(q, a, order) : ''}</div></article>
    <nav class="qnav"><button class="btn" type="button" id="prev" ${s.i === 0 ? 'disabled' : ''}>← 前の問題</button>
    <button class="btn ${a ? 'primary' : ''}" type="button" id="next">${s.i === total - 1 ? '結果を見る' : '次の問題 →'}</button></nav>
    <p class="kbd-hint">キーボード：A〜${keyOf(q.choices.length - 1)} または 1〜${q.choices.length} で選択 ／ Enter で解答・次へ ／ ← → で移動</p>`;
  mount(html);
  must('#to-home').addEventListener('click', () => navigate('home'));
  armButton(must('#end'), 'もう一度押すと採点します', finishCurrent);
  must('#prev').addEventListener('click', () => step(-1));
  must('#next').addEventListener('click', () => step(1));
  $('#choices')?.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest<HTMLButtonElement>('.choice') : null;
    if (b && !b.disabled) choose(q, Number(b.dataset.orig));
  });
  $('#submit')?.addEventListener('click', () => submit(q));
}

function feedback(q: Question, a: Answer, order: number[]): string {
  const h = state.hist[q.id];
  const record = h && h.n > 1 ? `　これまで ${h.n} 回中 ${h.c} 回正解` : '';
  return `<div class="verdict ${a.ok ? 'ok' : 'ng'}" role="status"><strong>${a.ok ? '○ 正解' : '× 不正解'}</strong><span>正解は ${lettersOf(q.answer, order)}${record}</span></div>
    ${explanation(q)}`;
}

function paintPicked(q: Question): void {
  document.querySelectorAll<HTMLElement>('#choices .choice').forEach((b) => b.classList.toggle('picked', picked.includes(Number(b.dataset.orig))));
  const s = $<HTMLButtonElement>('#submit');
  if (!s) return;
  const need = q.answer.length;
  s.disabled = picked.length !== need;
  s.textContent = picked.length === need ? '解答する' : picked.length < need ? `解答する（あと${need - picked.length}つ選んでください）` : `${need}つまで選べます`;
}

export function choose(q: Question, orig: number): void {
  if (!state.current || state.current.ans[q.id]) return;
  if (q.answer.length === 1) {
    picked = [orig];
    submit(q);
    return;
  }
  picked = picked.includes(orig) ? picked.filter((x) => x !== orig) : picked.concat(orig);
  paintPicked(q);
}

export function submit(q: Question): void {
  const s = state.current;
  if (!s || s.ans[q.id] || picked.length !== q.answer.length) return;
  const ok = sameSet(picked, q.answer);
  s.ans[q.id] = { sel: picked.slice(), ok };
  const h = state.hist[q.id] ?? { n: 0, c: 0 };
  state.hist[q.id] = { ok, n: h.n + 1, c: h.c + (ok ? 1 : 0) };
  save();
  const y = window.scrollY;
  renderQuiz();
  window.scrollTo({ top: y });
  must('#feedback').scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

export function step(d: number): void {
  const s = state.current;
  if (!s) return;
  const ni = s.i + d;
  if (ni < 0) return;
  if (ni >= s.ids.length) {
    finishCurrent();
    return;
  }
  s.i = ni;
  save();
  renderQuiz();
  window.scrollTo({ top: 0 });
}
