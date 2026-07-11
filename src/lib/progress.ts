import { z } from "zod";
import { reviewOutcome, isDue, type SrsState } from "./srs";

const SrsSchema = z.object({ box: z.number().int().min(0).max(4), due: z.string() });

const AnswerSchema = z.object({
  attempts: z.number().int().min(0),
  lastCorrect: z.boolean(),
  srs: SrsSchema.optional(),
});

const ExamRecordSchema = z.object({
  date: z.string(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  byDomain: z.record(z.string(), z.object({ correct: z.number().int(), total: z.number().int() })),
});

export const ProgressSchema = z.object({
  v: z.literal(1),
  answers: z.record(z.string(), AnswerSchema),
  lessonsRead: z.array(z.string()),
  examHistory: z.array(ExamRecordSchema),
});

export type ProgressState = z.infer<typeof ProgressSchema>;
export type ExamRecord = z.infer<typeof ExamRecordSchema>;
export type AnswerRecord = z.infer<typeof AnswerSchema>;

export function emptyProgress(): ProgressState {
  return { v: 1, answers: {}, lessonsRead: [], examHistory: [] };
}

export function recordAnswer(state: ProgressState, questionId: string, correct: boolean, today: Date): ProgressState {
  const prev = state.answers[questionId];
  let srs: SrsState | undefined = prev?.srs;
  if (!correct) {
    srs = reviewOutcome(prev?.srs, false, today);
  } else if (prev?.srs) {
    srs = reviewOutcome(prev.srs, true, today);
  }
  const next: AnswerRecord = {
    attempts: (prev?.attempts ?? 0) + 1,
    lastCorrect: correct,
    ...(srs ? { srs } : {}),
  };
  return { ...state, answers: { ...state.answers, [questionId]: next } };
}

export function markLessonRead(state: ProgressState, lessonId: string): ProgressState {
  if (state.lessonsRead.includes(lessonId)) return state;
  return { ...state, lessonsRead: [...state.lessonsRead, lessonId] };
}

export function appendExam(state: ProgressState, record: ExamRecord): ProgressState {
  return { ...state, examHistory: [...state.examHistory, record] };
}

export function dueQuestionIds(state: ProgressState, today: Date): string[] {
  return Object.entries(state.answers)
    .filter(([, a]) => a.srs && isDue(a.srs, today))
    .map(([id]) => id);
}

/** Validates an exported-progress JSON string. Throws on anything invalid. */
export function parseImported(json: string): ProgressState {
  return ProgressSchema.parse(JSON.parse(json));
}
