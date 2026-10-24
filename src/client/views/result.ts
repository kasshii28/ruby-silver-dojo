import type { ExamRecord } from '../../lib/types';
import { CATS, PASS, question } from '../data';
import { $, esc, must, mount } from '../dom';
import { navigate } from '../router';
import { lettersOf, orderOf, startExam, stats } from '../session';
import { explanation, fmtDate, markedChoices, questionHead } from './shared';

export function renderResult(r: ExamRecord, filter: 'all' | 'ng' = 'all'): void {
  const s = stats(r);
  const wrong = r.ids.filter((id) => !r.ans[id]?.ok);
  const pass = s.pct >= PASS;
  const cats = CATS.map((c) => {
    const ids = r.ids.filter((id) => question(id).cat === c);
    return ids.length ? `<span>${c} <b>${ids.filter((id) => r.ans[id]?.ok).length}/${ids.length}</b></span>` : '';
  }).join('');
  let html = `<div class="quizbar"><button class="btn ghost" type="button" id="to-home">← ホーム</button></div>
    <section class="sheet summary"><h2>${esc(r.title)}の結果</h2><p class="when">${fmtDate(r.finishedAt)}</p>
    <div class="score"><span class="big">${s.pct}%</span><span class="of">${s.total} 問中 ${s.ok} 問正解${s.answered < s.total ? `（未回答 ${s.total - s.answered} 問）` : ''}・${pass ? '合格ライン（75%）に届いています' : `合格ライン（75%）まであと ${Math.max(0, Math.ceil((s.total * PASS) / 100) - s.ok)} 問`}</span></div>
    <div><div class="gauge"><i class="${pass ? 'pass' : ''}" data-w="${s.pct}"></i><span class="line"></span></div><div class="gauge-labels"><span>合格ライン 75%</span></div></div>
    <div class="bycat">${cats}</div>
    <div class="actions">${wrong.length ? `<button class="btn primary" type="button" id="retry-ng">まちがえた ${wrong.length} 問を解き直す</button>` : ''}
      <button class="btn ${wrong.length ? '' : 'primary'}" type="button" id="again">同じ問題を順番を変えてもう一度</button></div></section>
    <section class="panel" aria-labelledby="h-review"><div class="panel-head"><h2 id="h-review">解答の振り返り</h2>
      <div class="seg" role="group" aria-label="表示する問題"><button type="button" data-f="all" aria-pressed="${filter === 'all'}">すべて ${s.total}</button><button type="button" data-f="ng" aria-pressed="${filter === 'ng'}">まちがえた問題 ${wrong.length}</button></div></div>
      <ol class="rows review-list">`;
  r.ids.forEach((id, idx) => {
    const a = r.ans[id];
    if (filter === 'ng' && a?.ok) return;
    const q = question(id), order = orderOf(q, r.perm);
    const mk = !a ? `<span class="mk none">−</span>` : a.ok ? `<span class="mk ok">○</span>` : `<span class="mk ng">×</span>`;
    html += `<li><details data-id="${id}"><summary>${mk}<span class="n">${idx + 1}</span><span class="topic">${esc(q.topic)} <small>${esc(q.cat)}・No.${q.id}</small></span><span class="ans">あなた ${a ? lettersOf(a.sel, order) : '−'} ／ 正解 ${lettersOf(q.answer, order)}</span></summary><div class="review-body" data-idx="${idx}"></div></details></li>`;
  });
  html += `</ol>${filter === 'ng' && !wrong.length ? `<p class="empty">まちがえた問題はありません。</p>` : ''}</section>`;
  const main = mount(html);
  must('#to-home').addEventListener('click', () => navigate('home'));
  $('#retry-ng')?.addEventListener('click', () => startExam({ kind: 'ids', ids: wrong, title: `解き直し：${r.title}` }));
  must('#again').addEventListener('click', () => startExam({ kind: 'ids', ids: r.ids, title: r.title }));
  main.querySelectorAll<HTMLElement>('[data-f]').forEach((b) => b.addEventListener('click', () => renderResult(r, b.dataset.f === 'ng' ? 'ng' : 'all')));
  // fill each review body when it is opened
  main.querySelectorAll<HTMLDetailsElement>('details[data-id]').forEach((d) => d.addEventListener('toggle', () => {
    const body = d.querySelector<HTMLElement>('.review-body');
    if (!d.open || !body || body.childElementCount) return;
    const q = question(Number(d.dataset.id)), a = r.ans[q.id];
    const order = orderOf(q, r.perm);
    body.innerHTML = questionHead(q, `問 ${Number(body.dataset.idx) + 1}`) + markedChoices(q, order, a ? a.sel : null) +
      (a ? '' : `<div class="verdict none"><strong>未回答</strong><span>正解は ${lettersOf(q.answer, order)}</span></div>`) +
      explanation(q);
  }));
}
