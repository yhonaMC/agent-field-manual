import { persistentAtom } from "@nanostores/persistent";
import { z } from "zod";

const ExamSessionSchema = z.object({
  questionIds: z.array(z.string()),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
  /** Epoch ms when the exam ends — survives reloads so the timer resumes. */
  deadline: z.number(),
  seed: z.number(),
});

export type ExamSession = z.infer<typeof ExamSessionSchema>;

export const $examSession = persistentAtom<ExamSession | null>("afm:exam:v1", null, {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const val = JSON.parse(raw);
      return val === null ? null : ExamSessionSchema.parse(val);
    } catch {
      return null;
    }
  },
});
