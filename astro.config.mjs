// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Site GitHub Pages : https://<user>.github.io/<repo>/
// Surchargez via les variables d'environnement SITE_URL / BASE_PATH si le site
// est déplacé (domaine personnalisé → BASE_PATH="/").
const SITE_URL = process.env.SITE_URL ?? 'https://raantss18.github.io';
const BASE_PATH = process.env.BASE_PATH ?? '/comima';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
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
