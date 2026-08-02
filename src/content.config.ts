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
    // Content Alchemy 擴充欄位
    category: z.string().optional(),
    relatedServices: z.array(z.number()).default([]),
    // GEO/AEO：常見問題（答案必須來自內文，不可瞎編）
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
