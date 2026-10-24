// Turns question text, code and explanations into HTML. Every string is escaped; code comes from highlight.js.
import hljs from 'highlight.js/lib/core';
import ruby from 'highlight.js/lib/languages/ruby';
import { esc } from './dom';

hljs.registerLanguage('ruby', ruby);

export const BLANK = '__(1)__';
const BLANK_HTML = '<span class="blank">(1)</span>';

/** `code`, **bold** and the blank marker. */
export function inline(s: string): string {
  let out = '';
  for (const p of String(s).split(/(`[^`]+`)/)) {
    if (p.startsWith('`') && p.endsWith('`') && p.length > 1) out += '<code>' + esc(p.slice(1, -1)) + '</code>';
    else out += esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').split(esc(BLANK)).join(BLANK_HTML);
  }
  return out;
}

export function highlight(code: string): string {
  const marker = 'zzblankzz';
  const src = code.split(BLANK).join(marker);
  let html: string;
  try {
    html = hljs.highlight(src, { language: 'ruby', ignoreIllegals: true }).value;
  } catch {
    html = esc(src);
  }
  return html.split(marker).join(BLANK_HTML);
}

export function codeBlock(code: string): string {
  const text = code.replace(/\n$/, '');
  const nums = Array.from({ length: text.split('\n').length }, (_, i) => i + 1).join('\n');
  return `<div class="code"><pre class="ln" aria-hidden="true">${nums}</pre><pre class="src"><code>${highlight(text)}</code></pre></div>`;
}

/** Mini Markdown: paragraphs, "- " lists, "1. " lists and ``` code blocks. */
export function md(text: string): string {
  const lines = String(text).replace(/\n+$/, '').split('\n');
  const at = (i: number) => lines[i] ?? '';
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const l = at(i);
    if (l.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !at(i).startsWith('```')) buf.push(at(i++));
      i++;
      html += `<pre><code>${highlight(buf.join('\n'))}</code></pre>`;
    } else if (/^- /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(at(i))) items.push(at(i++).slice(2));
      html += '<ul>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>';
    } else if (/^\d+\. /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(at(i))) items.push(at(i++).replace(/^\d+\. /, ''));
      html += '<ol>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ol>';
    } else if (l.trim() === '') {
      i++;
    } else {
      const buf: string[] = [];
      while (i < lines.length && at(i).trim() !== '' && !/^(- |\d+\. |```)/.test(at(i))) buf.push(at(i++));
      html += `<p>${inline(buf.join(''))}</p>`;
    }
  }
  return html;
}
