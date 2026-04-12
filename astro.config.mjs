// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://app.winds.tw',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/auth/') && !page.includes('/history'),
      customPages: [
        'https://app.winds.tw/',
        'https://app.winds.tw/delivery',
        'https://app.winds.tw/share',
        'https://app.winds.tw/spirit',
      ],
    }),
  ],
});