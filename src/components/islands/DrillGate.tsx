import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import { domainUnlocked, DRILL_PASS_THRESHOLD } from "../../lib/progress";
import type { Question } from "../../lib/question-schema";
import QuizEngine from "./QuizEngine";

export default function DrillGate({ domain, questions }: { domain: number; questions: Question[] }) {
  const progress = useStore($progress);
  if (!domainUnlocked(progress, domain)) {
    return (
      <div className="mono" style={{ border: "2px dashed var(--ink-soft)", padding: "1.2rem", maxWidth: "var(--measure)" }}>
        <p style={{ margin: 0, letterSpacing: ".12em", fontWeight: 600 }}>■ DRILL LOCKED</p>
        <p style={{ marginBottom: 0 }}>
          Pass the § {domain - 1}.0 drill ({Math.round(DRILL_PASS_THRESHOLD * 100)}% or higher on a full run) to unlock this one.{" "}
          <a href={`/manual/${domain - 1}`}>Go to § {domain - 1}.0</a>
        </p>
      </div>
    );
  }
  return <QuizEngine questions={questions} domain={domain} />;
}
