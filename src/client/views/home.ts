import { CATS, OFFICIAL, OFFICIAL_SOURCE, ORIGINAL, PASS, QUESTIONS } from '../data';
import { $, armButton, esc, mount } from '../dom';
import { navigate } from '../router';
import { catCount, startExam, stats, wrongIds, type ExamSpec } from '../session';
import { save, state } from '../state';
import { fmtDate } from './shared';

function specOf(b: HTMLElement): ExamSpec | null {
  const kind = b.dataset.start;
  if (kind === 'mock' || kind === 'mini' || kind === 'all' || kind === 'wrong' || kind === 'official' || kind === 'official-random') return { kind };
  const cat = CATS.find((c) => c === b.dataset.cat);
  return kind === 'cat' && cat ? { kind, cat } : null;
}

export function renderHome(): void {
  const { hist, current, records } = state;
  const wrong = wrongIds().length;
  const done = Object.keys(hist).length, okCnt = Object.values(hist).filter((h) => h.ok).length;
  let html = `<p class="intro">Ruby技術者認定試験 Silver（version 3）のオリジナル問題 ${ORIGINAL.length} 問と、公式模擬問題 ${OFFICIAL.length} 問。出題順と選択肢の並びは毎回ランダムで、1問ごとに正解と解説を確認できます。</p>`;
  if (current) {
    const s = stats(current);
    html += `<section class="resume" aria-label="解きかけの回">
      <div class="txt"><strong>${esc(current.title)}の途中です</strong><span>${s.total} 問中 ${s.answered} 問回答済み・正解 ${s.ok} 問　新しく始めると、この回は途中までの結果で履歴に残ります。</span></div>
      <div class="acts"><button class="btn primary" type="button" id="resume">続きから</button></div></section>`;
  }
  const exam = (title: string, count: string, desc: string, btn: string) => `<li class="exam"><div class="txt"><h3>${title}<span class="count">${count}</span></h3><p>${desc}</p></div>${btn}</li>`;
  html += `<section class="panel" aria-labelledby="h-exams"><div class="panel-head"><h2 id="h-exams">試験を選ぶ</h2></div><ul class="rows">
    ${exam('模擬試験', '50問', '本試験と同じ問題数。オリジナル問題の全範囲からランダムに出題します。', `<button class="btn primary" type="button" data-start="mock">スタート</button>`)}
    ${exam('ミニテスト', '10問', 'すき間時間向け。オリジナル問題からランダムに10問。', `<button class="btn" type="button" data-start="mini">スタート</button>`)}
    ${exam('全問チャレンジ', `${ORIGINAL.length}問`, 'オリジナル問題をすべてランダムな順番で解きます。', `<button class="btn" type="button" data-start="all">スタート</button>`)}
    ${exam('分野別', '', '選んだ分野の問題をすべてランダムな順番で解きます。', `<div class="chips">${CATS.map((c) => `<button class="btn" type="button" data-start="cat" data-cat="${esc(c)}">${esc(c)}<span>${catCount(c)}</span></button>`).join('')}</div>`)}
    ${exam('公式模擬問題', `${OFFICIAL.length}問`, `Ruby Association が公開している<a href="${OFFICIAL_SOURCE}" target="_blank" rel="noopener">サンプル問題</a>。誤記を直し、解説はこのサイトで書き下ろしています。`, `<div class="chips"><button class="btn" type="button" data-start="official">番号順</button><button class="btn" type="button" data-start="official-random">ランダム</button></div>`)}
    ${exam('まちがえた問題', `${wrong}問`, wrong ? '前回まちがえた問題だけを解き直します。正解すると対象から外れます。' : 'まちがえた問題はまだありません。', `<button class="btn" type="button" data-start="wrong" ${wrong ? '' : 'disabled'}>スタート</button>`)}
  </ul></section>`;
  html += `<section class="panel" aria-labelledby="h-hist"><div class="panel-head"><h2 id="h-hist">受験履歴</h2><span class="meta">回答した問題 <b>${done}</b> / ${QUESTIONS.length}・前回正解 <b>${okCnt}</b></span></div>`;
  if (records.length) {
    html += `<ul class="rows">` + records.map((r) => {
      const s = stats(r);
      const badge = !r.complete ? `<span class="badge part">途中終了</span>` : s.pct >= PASS ? `<span class="badge pass">合格ライン</span>` : `<span class="badge fail">75%未満</span>`;
      return `<li><button class="hist-row" type="button" data-rec="${r.id}"><span class="date">${fmtDate(r.finishedAt)}</span><span class="ttl">${esc(r.title)}<small>${s.total}問</small></span><span class="score">${s.ok}/${s.total}・${s.pct}%</span>${badge}</button></li>`;
    }).join('') + `</ul><div class="panel-foot"><button class="btn danger" type="button" id="reset">学習記録と履歴をすべて削除</button></div>`;
  } else {
    html += `<p class="empty">まだ履歴はありません。上の試験を解き終えると、その回の結果と解答がここに残り、あとから振り返れます。</p>`;
  }
  html += `</section>`;
  const main = mount(html);
  main.querySelectorAll<HTMLElement>('[data-start]').forEach((b) => b.addEventListener('click', () => {
    const spec = specOf(b);
    if (spec) startExam(spec);
  }));
  main.querySelectorAll<HTMLElement>('[data-rec]').forEach((b) => b.addEventListener('click', () => navigate('r' + b.dataset.rec)));
  $('#resume')?.addEventListener('click', () => navigate('quiz'));
  const reset = $('#reset');
  if (reset) armButton(reset, 'もう一度押すと削除します', () => {
    state.hist = {};
    state.records = [];
    state.current = null;
    save();
    renderHome();
  });
}
