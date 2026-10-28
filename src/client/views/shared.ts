// Pieces shared by the quiz and the review.
import type { Question } from '../../lib/types';
import { keyOf } from '../data';
import { esc } from '../dom';
import { codeBlock, inline, md } from '../text';

export function fmtDate(t: number): string {
  const d = new Date(t), z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

export function questionHead(q: Question, label: string): string {
  const multi = q.answer.length > 1;
  return `<div class="qhead"><span class="qno">${label}</span><span class="tag id">No.${q.id}</span>${q.official ? `<span class="tag official">公式 Q${q.official}</span>` : ''}<span class="tag">${esc(q.cat)}</span><span class="tag">${esc(q.topic)}</span>${multi ? `<span class="tag multi">${q.answer.length}つ選択</span>` : ''}</div>
    <p class="qtext">${inline(q.q)}</p>${q.code ? codeBlock(q.code) : ''}${q.result != null ? `<div class="result-box"><span class="label">〔実行結果〕</span><pre>${esc(q.result)}</pre></div>` : ''}`;
}

export function choiceBody(q: Question, text: string): string {
  const prose = !q.cm || text.startsWith('!');
  return prose ? `<div class="prose">${inline(text.replace(/^!/, ''))}</div>` : `<pre>${esc(text)}</pre>`;
}

/** The choice list of an answered question (in the quiz after answering, and in the review). */
export function markedChoices(q: Question, order: number[], sel: number[] | null): string {
  return `<ol class="choices">` + order.map((orig, pos) => {
    const isAns = q.answer.includes(orig), isSel = sel ? sel.includes(orig) : false;
    const cls = isAns ? 'right' : isSel ? 'wrong' : 'dim';
    const mark = isAns ? (isSel ? '○ 正解' : '正解') : isSel ? '× あなたの解答' : '';
    return `<li><div class="choice ${cls}"><span class="key">${keyOf(pos)}</span><span class="body">${choiceBody(q, q.choices[orig] ?? '')}</span><span class="mark">${mark}</span></div></li>`;
  }).join('') + `</ol>`;
}

export const explanation = (q: Question) => `<section class="exp"><h3>解説</h3>${md(q.exp)}</section>`;
