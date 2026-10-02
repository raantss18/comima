// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeBase from './src/plugins/rehype-base.mjs';

// Par défaut : site de projet GitHub Pages, https://<user>.github.io/<repo>/.
// Sur le domaine comima.mg, le workflow passe SITE_URL=https://comima.mg et
// BASE_PATH=/ (voir la variable de dépôt CUSTOM_DOMAIN dans deploy.yml).
const SITE_URL = process.env.SITE_URL ?? 'https://raantss18.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/comima';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  markdown: {
    rehypePlugins: [[rehypeBase, { base: BASE_PATH }]],
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      // Le panneau admin ne doit pas être indexé.
      filter: (page) => !page.includes('/admin'),
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-FR', en: 'en-US' },
      },
    }),
  ],
});
