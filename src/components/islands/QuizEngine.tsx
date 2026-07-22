import { useMemo, useState } from "react";
import type { Question } from "../../lib/question-schema";
import { mulberry32, shuffle, shuffleOptions } from "../../lib/rng";
import { answer, saveDrill } from "../../stores/progress-store";
import { DRILL_PASS_THRESHOLD } from "../../lib/progress";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";

interface Props { questions: Question[]; domain: number }

export default function QuizEngine({ questions, domain }: Props) {
  const lang = useLang();
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
    return <button className="btn accent" onClick={() => start(questions.map((x) => x.id))}>
      {t(lang, "drill.start")} · {questions.length} {t(lang, "drill.questions")}
    </button>;
  }

  if (!q) {
    // finished
    return (
      <div className="rule-row">
        <p style={{ fontFamily: "var(--font-prose)", fontSize: "1.8rem", fontWeight: 600 }}>
          {correctCount}/{run.length || runIds.length} {t(lang, "drill.correct")}
        </p>
        {isFullRun && (
          (correctCount / (run.length || runIds.length)) >= DRILL_PASS_THRESHOLD ? (
            <p style={{ color: "var(--ok)", fontWeight: 600 }}>{t(lang, "drill.passed")}</p>
          ) : (
            <p style={{ color: "var(--stamp-red)" }}>{t(lang, "drill.belowA")} {Math.round(DRILL_PASS_THRESHOLD * 100)}% {t(lang, "drill.belowB")}</p>
          )
        )}
        {missed.length > 0 && (
          <button className="btn" onClick={() => { setSeed((s) => s + 1); start(missed); }}>
            {t(lang, "drill.retryMissed")} {missed.length} {t(lang, "drill.missed")}
          </button>
        )}{" "}
        <button className="btn ghost" onClick={() => { setSeed((s) => s + 1); start(questions.map((x) => x.id)); }}>
          {t(lang, "drill.restart")}
        </button>
      </div>
    );
  }

  const revealed = selected !== null;
  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem", letterSpacing: ".08em", color: "var(--ink-3)" }}>
        {t(lang, "drill.item")} {index + 1} / {run.length} · {t(lang, "common.domain")} {q.domain}
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
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
                  background: isCorrect ? "var(--ok-soft)" : "transparent",
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
            {index + 1 < run.length ? t(lang, "drill.next") : t(lang, "drill.finish")}
          </button>
        </div>
      )}
    </div>
  );
}
