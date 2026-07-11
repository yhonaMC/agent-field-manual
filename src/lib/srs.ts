export const SRS_INTERVALS = [1, 3, 7, 16, 35] as const;

export interface SrsState {
  /** Index into SRS_INTERVALS. */
  box: number;
  /** ISO calendar date (UTC) when the card is next due. */
  due: string;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export function reviewOutcome(prev: SrsState | undefined, correct: boolean, today: Date): SrsState {
  const box = correct ? Math.min((prev?.box ?? -1) + 1, SRS_INTERVALS.length - 1) : 0;
  return { box, due: toIsoDate(addDays(today, SRS_INTERVALS[box]!)) };
}

export function isDue(state: SrsState, today: Date): boolean {
  return state.due <= toIsoDate(today);
}
