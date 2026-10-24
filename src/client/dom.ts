// DOM helpers. Under the site's CSP, style="" attributes are blocked, so widths go in data-w and are set here.

export const $ = <T extends HTMLElement = HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);

export function must<T extends HTMLElement = HTMLElement>(sel: string): T {
  const el = $<T>(sel);
  if (!el) throw new Error(`missing element ${sel}`);
  return el;
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);

/** Replaces the content of #main and applies data-w="<percent>" widths. */
export function mount(html: string): HTMLElement {
  const main = must('#main');
  main.innerHTML = html;
  main.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => {
    el.style.width = `${Number(el.dataset.w)}%`;
  });
  return main;
}

/** A button that needs a second press within 4 seconds. */
export function armButton(b: HTMLElement, armedText: string, action: () => void): void {
  const label = b.textContent;
  let t: ReturnType<typeof setTimeout> | undefined;
  b.addEventListener('click', () => {
    if (!b.classList.contains('armed')) {
      b.classList.add('armed');
      b.textContent = armedText;
      t = setTimeout(() => {
        b.classList.remove('armed');
        b.textContent = label;
      }, 4000);
      return;
    }
    clearTimeout(t);
    action();
  });
}
