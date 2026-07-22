import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import { domainUnlocked, DRILL_PASS_THRESHOLD } from "../../lib/progress";
import type { Question } from "../../lib/question-schema";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";
import QuizEngine from "./QuizEngine";

export default function DrillGate({ domain, questions }: { domain: number; questions: Question[] }) {
  const progress = useStore($progress);
  const lang = useLang();
  if (!domainUnlocked(progress, domain)) {
    return (
      <div style={{ border: "1px dashed var(--ink-soft)", padding: "1.2rem", maxWidth: "var(--measure)" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>■ {t(lang, "drill.lockedTitle")}</p>
        <p style={{ marginBottom: 0, color: "var(--ink-2)" }}>
          {t(lang, "drill.lockedA")} {domain - 1} ({Math.round(DRILL_PASS_THRESHOLD * 100)}%) {t(lang, "drill.lockedB")}{" "}
          <a href={`/manual/${domain - 1}`}>{t(lang, "drill.goTo")} {domain - 1}</a>
        </p>
      </div>
    );
  }
  return <QuizEngine questions={questions} domain={domain} />;
}
