/** JSON that is safe inside <script>: no "</script>", and no raw U+2028 / U+2029. */
export const embedJson = (v: unknown): string =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(new RegExp('\\u2028', 'g'), '\\u2028')
    .replace(new RegExp('\\u2029', 'g'), '\\u2029');
