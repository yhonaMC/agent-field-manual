import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import { domainUnlocked, DRILL_PASS_THRESHOLD } from "../../lib/progress";
import type { Question } from "../../lib/question-schema";
import QuizEngine from "./QuizEngine";

export default function DrillGate({ domain, questions }: { domain: number; questions: Question[] }) {
  const progress = useStore($progress);
  if (!domainUnlocked(progress, domain)) {
    return (
      <div style={{ border: "1px dashed var(--ink-soft)", borderRadius: "var(--radius)", padding: "1.2rem", maxWidth: "var(--measure)" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>■ Drill bloqueado</p>
        <p style={{ marginBottom: 0, color: "var(--ink-2)" }}>
          Aprueba el drill del dominio {domain - 1} ({Math.round(DRILL_PASS_THRESHOLD * 100)}% o más en una ronda completa) para desbloquear este.{" "}
          <a href={`/manual/${domain - 1}`}>Ir al dominio {domain - 1}</a>
        </p>
      </div>
    );
  }
  return <QuizEngine questions={questions} domain={domain} />;
}
