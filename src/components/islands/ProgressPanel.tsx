import { useRef } from "react";
import { useStore } from "@nanostores/react";
import { $progress, exportProgress, importProgress, resetProgress } from "../../stores/progress-store";
import { dueQuestionIds } from "../../lib/progress";
import ProgressRing from "./ProgressRing";

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
    a.download = `agentprep-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function upload(file: File) {
    try {
      importProgress(await file.text());
      alert("Progreso importado.");
    } catch {
      alert("Ese archivo no es una exportación válida de AgentPrep.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
        {[1, 2, 3, 4, 5].map((d) => {
          const qs = questionMeta.filter((q) => q.domain === d);
          const mastered = qs.filter((q) => progress.answers[q.id]?.lastCorrect).length;
          return <ProgressRing key={d} value={qs.length ? (mastered / qs.length) * 100 : 0} label={`Dominio ${d}`} />;
        })}
      </div>

      <p>{due} tarjeta(s) pendiente(s) en el <a href="/review">mazo de repaso</a>.</p>

      <h2>Lecciones registradas</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {[...lessonMeta].sort((a, b) => a.section.localeCompare(b.section)).map((l) => (
          <li key={l.id} className="rule-row" style={{ fontSize: ".92rem" }}>
            {progress.lessonsRead.includes(l.id) ? "✓" : "○"} {l.title}
          </li>
        ))}
      </ul>

      <h2>Historial de exámenes</h2>
      {progress.examHistory.length === 0 ? (
        <p>Aún no has hecho exámenes. <a href="/exam">Prueba el simulador.</a></p>
      ) : (
        <table style={{ borderCollapse: "collapse", fontSize: ".92rem" }}>
          <thead><tr><th style={{ textAlign: "left", paddingRight: "2rem" }}>FECHA</th><th>PUNTAJE</th></tr></thead>
          <tbody>
            {progress.examHistory.map((e, i) => (
              <tr key={i}><td style={{ paddingRight: "2rem" }}>{e.date}</td><td>{e.score}/{e.total}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Datos</h2>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <button className="btn" onClick={download}>Exportar progreso</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Importar progreso</button>
        <button className="btn ghost" onClick={() => { if (confirm("¿Borrar todo el progreso local?")) resetProgress(); }}>Reiniciar</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      <p style={{ fontSize: ".92rem", maxWidth: "var(--measure)", color: "var(--ink-2)" }}>
        Tu progreso vive solo en este navegador. Expórtalo antes de cambiar de dispositivo.
      </p>
    </div>
  );
}
