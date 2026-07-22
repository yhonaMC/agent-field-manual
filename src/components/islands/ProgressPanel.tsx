import { useRef } from "react";
import { useStore } from "@nanostores/react";
import { $progress, exportProgress, importProgress, resetProgress } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";
import ProgressRing from "./ProgressRing";

interface Props {
  lessonMeta: { id: string; domain: number; title: string; section: string }[];
  questionMeta: { id: string; domain: number }[];
}

export default function ProgressPanel({ lessonMeta, questionMeta }: Props) {
  const progress = useStore($progress);
  const lang = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const due = dueQuestionIds(progress, new Date()).length;

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agentprep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importProgress(await file.text());
      alert(t(lang, "progress.imported"));
    } catch {
      alert(t(lang, "progress.badFile"));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
        {[1, 2, 3, 4, 5].map((d) => {
          const qs = questionMeta.filter((q) => q.domain === d);
          const mastered = qs.filter((q) => progress.answers[q.id]?.lastCorrect).length;
          return <ProgressRing key={d} value={qs.length ? (mastered / qs.length) * 100 : 0} label={`${t(lang, "common.domain")} ${d}`} />;
        })}
      </div>

      <p>{due} {t(lang, "progress.due")} <a href="/review">{t(lang, "progress.reviewDeck")}</a>.</p>

      <h2>{t(lang, "progress.lessonsLogged")}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {[...lessonMeta].sort((a, b) => a.section.localeCompare(b.section)).map((l) => (
          <li key={l.id} className="rule-row" style={{ fontSize: ".92rem" }}>
            {progress.lessonsRead.includes(l.id) ? "✓" : "○"} {l.title}
          </li>
        ))}
      </ul>

      <h2>{t(lang, "progress.examHistory")}</h2>
      {progress.examHistory.length === 0 ? (
        <p>{t(lang, "progress.noExams")} <a href="/exam">{t(lang, "progress.takeSim")}</a></p>
      ) : (
        <table style={{ borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>{t(lang, "progress.date")}</th><th>{t(lang, "progress.score")}</th></tr></thead>
          <tbody>
            {progress.examHistory.map((e, i) => (
              <tr key={i}><td style={{ paddingRight: "2rem" }}>{e.date}</td><td>{e.score}/{e.total}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{t(lang, "progress.data")}</h2>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={download}>{t(lang, "progress.export")}</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t(lang, "progress.import")}</button>
        <button className="btn ghost" onClick={() => { if (confirm(t(lang, "progress.confirmReset"))) resetProgress(); }}>{t(lang, "progress.reset")}</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p style={{ fontSize: ".92rem", maxWidth: "var(--measure)", color: "var(--ink-2)" }}>
        {t(lang, "progress.localNote")}
      </p>
    </div>
  );
}
