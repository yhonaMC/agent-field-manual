import { QuestionFileSchema, type Question } from "./question-schema";

const files = import.meta.glob("../data/questions/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

export const allQuestions: Question[] = Object.values(files)
  .flatMap((m) => QuestionFileSchema.parse(m.default))
  .sort((a, b) => a.id.localeCompare(b.id));

export const questionById = new Map(allQuestions.map((q) => [q.id, q]));

export function practiceQuestions(domain: number): Question[] {
  return allQuestions.filter((q) => q.domain === domain && q.sources.some((s) => s.startsWith("practice")));
}

export function finalPool(): Question[] {
  return allQuestions.filter((q) => q.sources.includes("final-pool"));
}
