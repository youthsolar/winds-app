import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default('找風問幸福'),
    // SEO + AGO + GEO 三維
    seoTitle: z.string().optional(),
    ogImage: z.string().optional(),
    llmDescription: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
