import { useMemo, useState } from "react";
import type { Question } from "../../lib/question-schema";
import { mulberry32, shuffle, shuffleOptions } from "../../lib/rng";
import { answer, saveDrill } from "../../stores/progress-store";
import { DRILL_PASS_THRESHOLD } from "../../lib/progress";

interface Props { questions: Question[]; domain: number }

export default function QuizEngine({ questions, domain }: Props) {
  const [runIds, setRunIds] = useState<string[] | null>(null); // null = not started
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFullRun, setIsFullRun] = useState(false);

  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const run = runIds?.map((id) => byId.get(id)!).filter(Boolean) ?? [];
  const q = run[index];
  const shuffled = useMemo(
    () => (q ? shuffleOptions(q, mulberry32(seed * 1000 + index)) : null),
    [q, seed, index],
  );

  function start(ids: string[]) {
    setRunIds(shuffle(ids, mulberry32(seed)));
    setIndex(0); setSelected(null); setMissed([]); setCorrectCount(0);
    setIsFullRun(ids.length === questions.length);
  }

  function choose(pos: number) {
    if (selected !== null || !q || !shuffled) return;
    setSelected(pos);
    const correct = pos === shuffled.correctPosition;
    answer(q.id, correct);
    if (correct) setCorrectCount((c) => c + 1);
    else setMissed((m) => [...m, q.id]);
  }

  if (!runIds) {
    return <button className="btn" onClick={() => start(questions.map((x) => x.id))}>
      Start drill · {questions.length} questions
    </button>;
  }

  if (!q) {
    // finished
    return (
      <div className="rule-row">
        <p className="mono" style={{ fontSize: "1.4rem" }}>
          {correctCount}/{run.length || runIds.length} correct
        </p>
        {isFullRun && (
          (correctCount / (run.length || runIds.length)) >= DRILL_PASS_THRESHOLD ? (
            <p className="mono" style={{ color: "var(--ok)", fontWeight: 600 }}>DRILL PASSED — the next domain is now unlocked.</p>
          ) : (
            <p className="mono" style={{ color: "var(--stamp-red)" }}>Below {Math.round(DRILL_PASS_THRESHOLD * 100)}% — retake the full drill to unlock the next domain.</p>
          )
        )}
        {missed.length > 0 && (
          <button className="btn" onClick={() => { setSeed((s) => s + 1); start(missed); }}>
            Retry the {missed.length} missed
          </button>
        )}{" "}
        <button className="btn ghost" onClick={() => { setSeed((s) => s + 1); start(questions.map((x) => x.id)); }}>
          Restart full drill
        </button>
      </div>
    );
  }

  const revealed = selected !== null;
  return (
    <div>
      <p className="mono" style={{ fontSize: ".72rem", letterSpacing: ".1em" }}>
        ITEM {index + 1} / {run.length} · § {q.domain}.0
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {shuffled!.options.map((opt, pos) => {
          const isCorrect = revealed && pos === shuffled!.correctPosition;
          const isWrongPick = revealed && pos === selected && !isCorrect;
          return (
            <li key={pos} style={{ margin: ".45rem 0" }}>
              <button
                onClick={() => choose(pos)}
                disabled={revealed}
                style={{
                  font: "inherit", textAlign: "left", cursor: revealed ? "default" : "pointer",
                  background: isCorrect ? "var(--accent-soft)" : "transparent",
                  border: "none", padding: ".15rem .3rem", width: "100%",
                  color: isWrongPick ? "var(--stamp-red)" : "inherit",
                  textDecoration: isWrongPick ? "line-through" : "none",
                }}
              >
                {opt} {isCorrect ? "✓" : isWrongPick ? "✗" : ""}
              </button>
            </li>
          );
        })}
      </ol>
      {revealed && (
        <div style={{ borderLeft: "3px solid var(--accent)", padding: ".3rem 1rem", maxWidth: "var(--measure)" }}>
          <p style={{ margin: 0 }}>{q.explanation}</p>
          <button className="btn" style={{ marginTop: ".8rem" }}
            onClick={() => {
              if (index + 1 >= run.length && isFullRun) saveDrill(domain, correctCount, run.length);
              setIndex((i) => i + 1); setSelected(null);
            }}>
            {index + 1 < run.length ? "Next item" : "Finish drill"}
          </button>
        </div>
      )}
    </div>
  );
}
