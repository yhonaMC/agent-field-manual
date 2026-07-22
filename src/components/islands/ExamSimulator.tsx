import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import type { Question } from "../../lib/question-schema";
import { buildExam } from "../../lib/exam-builder";
import { mulberry32 } from "../../lib/rng";
import { scoreExam, type ExamResult } from "../../lib/scoring";
import { $examSession } from "../../stores/exam-session";
import { $progress, answer as recordAnswer, saveExam } from "../../stores/progress-store";
import { allDomainsPassed, domainPassed } from "../../lib/progress";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";

const EXAM_SIZE = 60;
const EXAM_MINUTES = 90;

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ExamSimulator({ pool }: { pool: Question[] }) {
  const lang = useLang();
  const session = useStore($examSession);
  const progress = useStore($progress);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<ExamResult | null>(null);
  const [cursor, setCursor] = useState(0);

  const byId = useMemo(() => new Map(pool.map((q) => [q.id, q])), [pool]);
  const questions = useMemo(
    () => session?.questionIds.map((id) => byId.get(id)!).filter(Boolean) ?? [],
    [session, byId],
  );

  useEffect(() => {
    if (!session || result) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [session, result]);

  const remaining = session ? session.deadline - now : 0;

  useEffect(() => {
    if (session && !result && remaining <= 0) submit(); // time up → auto-submit
  }, [remaining, session, result]);

  if (!allDomainsPassed(progress) && !session && !result) {
    return (
      <div style={{ maxWidth: "var(--measure)" }}>
        <p style={{ fontWeight: 600 }}>■ {t(lang, "exam.lockedTitle")}</p>
        <p>{t(lang, "exam.lockedIntro")}</p>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[1, 2, 3, 4, 5].map((d) => (
            <li key={d} style={{ margin: ".3rem 0" }}>
              {domainPassed(progress, d) ? "✓" : "○"} <a href={`/manual/${d}`}>{t(lang, "exam.drillOf")} {d}</a>
              {domainPassed(progress, d) ? ` — ${t(lang, "exam.passed")}` : ` — ${t(lang, "exam.pending")}`}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function start() {
    const seed = (Date.now() % 2 ** 31) | 0;
    const exam = buildExam(pool, EXAM_SIZE, mulberry32(seed));
    $examSession.set({
      questionIds: exam.map((q) => q.id),
      answers: {},
      deadline: Date.now() + EXAM_MINUTES * 60_000,
      seed,
    });
    setResult(null); setCursor(0);
  }

  function pick(qid: string, idx: number) {
    if (!session) return;
    $examSession.set({ ...session, answers: { ...session.answers, [qid]: idx } });
  }

  function submit() {
    if (!session) return;
    const r = scoreExam(questions, session.answers, new Date().toISOString().slice(0, 10));
    for (const [qid, correct] of Object.entries(r.perQuestion)) recordAnswer(qid, correct);
    saveExam({ date: r.date, score: r.score, total: r.total, byDomain: r.byDomain });
    setResult(r);
    $examSession.set(null);
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div>
        <p style={{ fontFamily: "var(--font-prose)", fontSize: "2.2rem", fontWeight: 600 }}>{result.score}/{result.total} · {pct}%</p>
        <table style={{ borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>{t(lang, "exam.domain")}</th><th>{t(lang, "exam.score")}</th></tr></thead>
          <tbody>
            {Object.entries(result.byDomain).map(([d, s]) => (
              <tr key={d}>
                <td style={{ paddingRight: "2rem" }}><a href={`/manual/${d}`}>{t(lang, "common.domain")} {d}</a></td>
                <td>{s.correct}/{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>{t(lang, "exam.missedNote")} <a href="/review">{t(lang, "exam.reviewDeck")}</a>.</p>
        <button className="btn" onClick={start}>{t(lang, "exam.another")}</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <p style={{ maxWidth: "var(--measure)" }}>
          {EXAM_SIZE} {t(lang, "exam.intro")} {pool.length} {t(lang, "exam.introB")}
        </p>
        <button className="btn accent" onClick={start} disabled={pool.length < EXAM_SIZE}>{t(lang, "exam.begin")}</button>
      </div>
    );
  }

  const q = questions[cursor];
  if (!q) return null;
  const answered = Object.keys(session.answers).length;
  return (
    <div>
      <p style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".85rem" }}>
        <span>{t(lang, "exam.item")} {cursor + 1}/{questions.length} · {answered} {t(lang, "exam.answered")}</span>
        <span style={{ fontWeight: 600, color: remaining < 5 * 60_000 ? "var(--stamp-red)" : "var(--accent)" }}>
          T-{fmt(remaining)}
        </span>
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {q.options.map((opt, i) => (
          <li key={i} style={{ margin: ".45rem 0" }}>
            <label style={{ cursor: "pointer" }}>
              <input type="radio" name={q.id} checked={session.answers[q.id] === i}
                onChange={() => pick(q.id, i)} /> {opt}
            </label>
          </li>
        ))}
      </ol>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor((c) => c - 1)}>{t(lang, "exam.prev")}</button>
        <button className="btn ghost" disabled={cursor === questions.length - 1} onClick={() => setCursor((c) => c + 1)}>{t(lang, "exam.next")}</button>
        <button className="btn accent" onClick={() => { if (confirm(`${t(lang, "exam.confirmSubmit")} ${answered}/${questions.length} ${t(lang, "exam.confirmSubmitB")}`)) submit(); }}>
          {t(lang, "exam.submit")}
        </button>
      </div>
      <nav style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", gap: "4px", fontFamily: "var(--font-mono)" }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setCursor(i)} title={`${t(lang, "exam.item")} ${i + 1}`}
            style={{
              width: 28, height: 24, fontSize: ".65rem", cursor: "pointer",
              border: "1px solid var(--border)",
              background: i === cursor ? "var(--accent)" : session.answers[qq.id] !== undefined ? "var(--accent-soft)" : "var(--surface)",
              color: i === cursor ? "#fff" : "var(--ink)",
            }}>{i + 1}</button>
        ))}
      </nav>
    </div>
  );
}
