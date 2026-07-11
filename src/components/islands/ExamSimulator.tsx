import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import type { Question } from "../../lib/question-schema";
import { buildExam } from "../../lib/exam-builder";
import { mulberry32 } from "../../lib/rng";
import { scoreExam, type ExamResult } from "../../lib/scoring";
import { $examSession } from "../../stores/exam-session";
import { answer as recordAnswer, saveExam } from "../../stores/progress-store";

const EXAM_SIZE = 60;
const EXAM_MINUTES = 90;

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ExamSimulator({ pool }: { pool: Question[] }) {
  const session = useStore($examSession);
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
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [session, result]);

  const remaining = session ? session.deadline - now : 0;

  useEffect(() => {
    if (session && !result && remaining <= 0) submit(); // time up → auto-submit
  }, [remaining, session, result]);

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
        <p className="mono" style={{ fontSize: "2rem" }}>{result.score}/{result.total} · {pct}%</p>
        <table className="mono" style={{ borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>DOMAIN</th><th>SCORE</th></tr></thead>
          <tbody>
            {Object.entries(result.byDomain).map(([d, s]) => (
              <tr key={d}>
                <td style={{ paddingRight: "2rem" }}><a href={`/manual/${d}`}>§ {d}.0</a></td>
                <td>{s.correct}/{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Missed questions were added to your <a href="/review">review deck</a>.</p>
        <button className="btn" onClick={start}>Take another exam</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <p style={{ maxWidth: "var(--measure)" }}>
          {EXAM_SIZE} questions sampled from a pool of {pool.length}, balanced across all five domains.
          {" "}{EXAM_MINUTES} minutes. No feedback until you submit — just like the real thing.
        </p>
        <button className="btn" onClick={start} disabled={pool.length < EXAM_SIZE}>Begin examination</button>
      </div>
    );
  }

  const q = questions[cursor];
  if (!q) return null;
  const answered = Object.keys(session.answers).length;
  return (
    <div>
      <p className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem" }}>
        <span>ITEM {cursor + 1}/{questions.length} · {answered} ANSWERED</span>
        <span style={{ color: remaining < 5 * 60_000 ? "var(--stamp-red)" : "var(--panel-glow)" }}>
          T-{fmt(remaining)}
        </span>
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
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
        <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor((c) => c - 1)}>Prev</button>
        <button className="btn ghost" disabled={cursor === questions.length - 1} onClick={() => setCursor((c) => c + 1)}>Next</button>
        <button className="btn" onClick={() => { if (confirm(`Submit with ${answered}/${questions.length} answered?`)) submit(); }}>
          Submit exam
        </button>
      </div>
      <nav className="mono" style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setCursor(i)} title={`Item ${i + 1}`}
            style={{
              width: 26, height: 22, fontSize: ".6rem", cursor: "pointer",
              border: "1px solid var(--panel-glow)",
              background: i === cursor ? "var(--panel-glow)" : session.answers[qq.id] !== undefined ? "#e8a13c55" : "transparent",
              color: i === cursor ? "var(--panel)" : "inherit",
            }}>{i + 1}</button>
        ))}
      </nav>
    </div>
  );
}
