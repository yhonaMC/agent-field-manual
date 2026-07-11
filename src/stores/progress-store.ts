import { persistentAtom } from "@nanostores/persistent";
import {
  ProgressSchema, emptyProgress, recordAnswer, markLessonRead, appendExam,
  parseImported, recordDrill, type ProgressState, type ExamRecord,
} from "../lib/progress";

export const $progress = persistentAtom<ProgressState>("afm:v1", emptyProgress(), {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return ProgressSchema.parse(JSON.parse(raw));
    } catch {
      return emptyProgress(); // corrupted storage never crashes the app
    }
  },
});

export const answer = (questionId: string, correct: boolean) =>
  $progress.set(recordAnswer($progress.get(), questionId, correct, new Date()));

export const readLesson = (lessonId: string) =>
  $progress.set(markLessonRead($progress.get(), lessonId));

export const saveExam = (record: ExamRecord) =>
  $progress.set(appendExam($progress.get(), record));

export const saveDrill = (domain: number, correct: number, total: number) =>
  $progress.set(recordDrill($progress.get(), domain, correct, total));

export const exportProgress = (): string => JSON.stringify($progress.get(), null, 2);

/** Throws with a Zod error message if the file is invalid. */
export const importProgress = (json: string) => $progress.set(parseImported(json));

export const resetProgress = () => $progress.set(emptyProgress());
