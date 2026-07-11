import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { $progress, answer } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import { questionById } from "../../lib/question-bank";
import { mulberry32, shuffleOptions } from "../../lib/rng";

export default function ReviewDeck() {
  const progress = useStore($progress);
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
    return <p className="mono" style={{ fontSize: "1.1rem" }}>
      {sessionDone.length > 0 ? `Queue cleared — ${sessionDone.length} card(s) reviewed. ` : ""}
      Nothing due. Come back tomorrow.
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
      <p className="mono" style={{ fontSize: ".72rem", letterSpacing: ".1em" }}>
        {due.length} CARD(S) DUE · § {q.domain}.0
      </p>
      <p style={{ fontSize: "1.05rem", maxWidth: "var(--measure)" }}>{q.stem}</p>
      <ol style={{ listStyle: "lower-alpha", paddingLeft: "1.6rem", maxWidth: "var(--measure)" }}>
        {shuffled.options.map((opt, pos) => {
          const isCorrect = revealed && pos === shuffled.correctPosition;
          const isWrongPick = revealed && pos === selected && !isCorrect;
          return (
            <li key={pos} style={{ margin: ".45rem 0" }}>
              <button onClick={() => choose(pos)} disabled={revealed}
                style={{ font: "inherit", textAlign: "left", width: "100%", border: "none", padding: ".15rem .3rem",
                  cursor: revealed ? "default" : "pointer",
                  background: isCorrect ? "var(--accent-soft)" : "transparent",
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
            Next card
          </button>
        </div>
      )}
    </div>
  );
}
