import { z } from "zod";

export const SOURCES = ["practice-1", "practice-2", "practice-3", "final-pool"] as const;

export const QuestionSchema = z.object({
  id: z.string().regex(/^(d[1-5]-p[1-3]-q\d{2}|final-q\d{3})$/),
  domain: z.number().int().min(1).max(5),
  sources: z.array(z.enum(SOURCES)).min(1),
  stem: z.string().min(20),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(20),
  tags: z.array(z.string()).default([]),
});

export const QuestionFileSchema = z.array(QuestionSchema);

export type Question = z.infer<typeof QuestionSchema>;
