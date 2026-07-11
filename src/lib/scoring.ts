import type { Question } from "./question-schema";
import type { ExamRecord } from "./progress";

export interface ExamResult extends ExamRecord {
  perQuestion: Record<string, boolean>;
}

export function scoreExam(
  questions: Question[],
  answers: Record<string, number>,
  date: string,
): ExamResult {
  const byDomain: ExamRecord["byDomain"] = {};
  const perQuestion: Record<string, boolean> = {};
  let score = 0;
  for (const q of questions) {
    const key = String(q.domain);
    byDomain[key] ??= { correct: 0, total: 0 };
    byDomain[key].total++;
    const correct = answers[q.id] === q.correctIndex;
    perQuestion[q.id] = correct;
    if (correct) { score++; byDomain[key].correct++; }
  }
  return { date, score, total: questions.length, byDomain, perQuestion };
}
