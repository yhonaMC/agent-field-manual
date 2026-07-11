import { useRef } from "react";
import { useStore } from "@nanostores/react";
import { $progress, exportProgress, importProgress, resetProgress } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import Gauge from "./Gauge";

interface Props {
  lessonMeta: { id: string; domain: number; title: string; section: string }[];
  questionMeta: { id: string; domain: number }[];
}

export default function ProgressPanel({ lessonMeta, questionMeta }: Props) {
  const progress = useStore($progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const due = dueQuestionIds(progress, new Date()).length;

  function download() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afm-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importProgress(await file.text());
      alert("Progress imported.");
    } catch {
      alert("That file is not a valid AFM progress export.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
        {[1, 2, 3, 4, 5].map((d) => {
          const qs = questionMeta.filter((q) => q.domain === d);
          const mastered = qs.filter((q) => progress.answers[q.id]?.lastCorrect).length;
          return <Gauge key={d} value={qs.length ? (mastered / qs.length) * 100 : 0} label={`§ ${d}.0`} />;
        })}
      </div>

      <p className="mono">{due} card(s) due in the <a href="/review">review deck</a>.</p>

      <h2>Chapters logged</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {[...lessonMeta].sort((a, b) => a.section.localeCompare(b.section)).map((l) => (
          <li key={l.id} className="rule-row mono" style={{ fontSize: ".8rem" }}>
            {progress.lessonsRead.includes(l.id) ? "■" : "□"} § {l.section} {l.title}
          </li>
        ))}
      </ul>

      <h2>Exam history</h2>
      {progress.examHistory.length === 0 ? (
        <p>No exams yet. <a href="/exam">Take the simulator.</a></p>
      ) : (
        <table className="mono" style={{ borderCollapse: "collapse", fontSize: ".85rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>DATE</th><th>SCORE</th></tr></thead>
          <tbody>
            {progress.examHistory.map((e, i) => (
              <tr key={i}><td style={{ paddingRight: "2rem" }}>{e.date}</td><td>{e.score}/{e.total}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Data</h2>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={download}>Export progress</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Import progress</button>
        <button className="btn ghost" onClick={() => { if (confirm("Erase all local progress?")) resetProgress(); }}>Reset</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p style={{ fontSize: ".85rem", maxWidth: "var(--measure)" }}>
        Progress lives only in this browser. Export before switching devices.
      </p>
    </div>
  );
}
