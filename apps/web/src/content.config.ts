import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    module: z.enum(['logic', 'probability', 'finance', 'linear', 'applications']),
    order: z.number().int().nonnegative(),
    source: z.string(),
    status: z.enum(['implemented', 'engine-ready', 'planned', 'supplemental'])
  })
});

export const collections = { lessons };
