import type { APIRoute } from 'astro';

// Généré au build pour suivre la base du site (sous-chemin github.io ou domaine).
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, site);
  return new Response(
    `User-agent: *\nDisallow: ${base}/admin/\n\nSitemap: ${sitemap}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
