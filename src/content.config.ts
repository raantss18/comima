import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Actualités & événements : fichiers MDX dans src/content/actualites/<lang>/<slug>.mdx
// Le même slug dans fr/ et en/ relie les deux traductions d'un même contenu.
const actualites = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/actualites' }),
  schema: z.object({
    titre: z.string(),
    type: z.enum(['article', 'evenement']),
    date: z.coerce.date(),
    dateFin: z.coerce.date().optional(),
    lang: z.enum(['fr', 'en']).default('fr'),
    resume: z.string(),
    image: z.string().optional(),
    lieu: z.string().optional(),
    delegation: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { actualites };
