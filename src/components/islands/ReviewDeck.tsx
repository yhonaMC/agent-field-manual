import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { $progress, answer } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import { questionById } from "../../lib/question-bank";
import { mulberry32, shuffleOptions } from "../../lib/rng";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";

export default function ReviewDeck() {
  const progress = useStore($progress);
  const lang = useLang();
  const [sessionDone, setSessionDone] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const due = useMemo(
    () => dueQuestionIds(progress, new Date()).filter((id) => !sessionDone.includes(id) && questionById.has(id)),
    [progress, sessionDone],
  );

  const q = due.length > 0 ? questionById.get(due[0])! : null;
  const shuffled = useMemo(
    () => (q ? shuffleOptions(q, mulberry32(q.id.length * 7919 + sessionDone.length)) : null),
    [q, sessionDone.length],
  );

  if (!q || !shuffled) {
    return <p style={{ fontSize: "1.1rem" }}>
      {sessionDone.length > 0 ? `${t(lang, "review.cleared")} ${sessionDone.length} ${t(lang, "review.reviewed")} ` : ""}
      {t(lang, "review.nothing")}
    </p>;
  }

  const revealed = selected !== null;
  function choose(pos: number) {
    if (revealed) return;
    setSelected(pos);
    answer(q!.id, pos === shuffled!.correctPosition);
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: ".75rem", letterSpacing: ".08em", color: "var(--ink-3)" }}>
        {due.length} {t(lang, "review.due")} · {t(lang, "common.domain")} {q.domain}
      </p>
      <p style={{ fontSize: "1.1rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {shuffled.options.map((opt, pos) => {
          const isCorrect = revealed && pos === shuffled.correctPosition;
          const isWrongPick = revealed && pos === selected && !isCorrect;
          return (
            <li key={pos} style={{ margin: ".45rem 0" }}>
              <button onClick={() => choose(pos)} disabled={revealed}
                style={{ font: "inherit", textAlign: "left", width: "100%", border: "none", padding: ".15rem .3rem",
                  cursor: revealed ? "default" : "pointer",
                  background: isCorrect ? "var(--ok-soft)" : "transparent",
                  color: isWrongPick ? "var(--stamp-red)" : "inherit" }}>
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
            onClick={() => { setSessionDone((d) => [...d, q.id]); setSelected(null); }}>
            {t(lang, "review.nextCard")}
          </button>
        </div>
      )}
    </div>
  );
}
