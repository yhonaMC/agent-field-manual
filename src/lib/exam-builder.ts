import type { Question } from "./question-schema";
import { shuffle } from "./rng";

/** Largest-remainder proportional allocation, capped at each domain's pool count. */
export function allocateByDomain(counts: Record<number, number>, size: number): Record<number, number> {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const entries = Object.entries(counts).map(([d, n]) => {
    const exact = (n / total) * size;
    return { domain: Number(d), n, floor: Math.floor(exact), rem: exact - Math.floor(exact) };
  });
  const alloc: Record<number, number> = {};
  let used = 0;
  for (const e of entries) {
    alloc[e.domain] = Math.min(e.floor, e.n);
    used += alloc[e.domain];
  }
  // Distribute the remainder to the largest fractional parts (with capacity left).
  const byRem = [...entries].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (used < size && byRem.some((e) => alloc[e.domain]! < e.n)) {
    const e = byRem[i % byRem.length]!;
    if (alloc[e.domain]! < e.n) { alloc[e.domain] = alloc[e.domain]! + 1; used++; }
    i++;
  }
  return alloc;
}

export function buildExam(pool: Question[], size: number, rnd: () => number): Question[] {
  const byDomain = new Map<number, Question[]>();
  for (const q of pool) {
    byDomain.set(q.domain, [...(byDomain.get(q.domain) ?? []), q]);
  }
  const counts = Object.fromEntries([...byDomain].map(([d, qs]) => [d, qs.length]));
  const alloc = allocateByDomain(counts, size);
  const picked: Question[] = [];
  for (const [domain, qs] of byDomain) {
    picked.push(...shuffle(qs, rnd).slice(0, alloc[domain] ?? 0));
  }
  return shuffle(picked, rnd);
}
