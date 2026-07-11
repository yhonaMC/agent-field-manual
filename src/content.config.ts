import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().min(1).max(5),
    chapter: z.number().int().min(1).max(18),
    section: z.string(),           // mil-spec number, e.g. "1.3"
    summary: z.string().min(20),   // used for meta description + TOC
  }),
});

const domains = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/domains" }),
  schema: z.object({
    title: z.string(),
    domain: z.number().int().min(1).max(5),
    summary: z.string().min(20),
    objectives: z.array(z.string()).min(1),
  }),
});

const scenarios = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/scenarios" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().min(1),
    summary: z.string().min(20),
  }),
});

export const collections = { lessons, domains, scenarios };
