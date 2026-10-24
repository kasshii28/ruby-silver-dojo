// @ts-check
import { defineConfig } from 'astro/config';

// The CSP in vercel.json allows only same-origin files, so nothing may be inlined into the HTML.
export default defineConfig({
  site: 'https://ruby-silver-dojo.vercel.app',
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
