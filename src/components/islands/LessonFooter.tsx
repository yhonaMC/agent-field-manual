import { useStore } from "@nanostores/react";
import { $progress, readLesson } from "../../stores/progress-store";

export default function LessonFooter({ lessonId, domain }: { lessonId: string; domain: number }) {
  const progress = useStore($progress);
  const read = progress.lessonsRead.includes(lessonId);
  return (
    <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      {read ? (
        <span style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Lección registrada</span>
      ) : (
        <button className="btn" onClick={() => readLesson(lessonId)}>Marcar lección como leída</button>
      )}
      <a href={`/manual/${domain}`}>← Volver al dominio {domain}</a>
    </div>
  );
}
