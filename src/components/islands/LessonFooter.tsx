import { useStore } from "@nanostores/react";
import { $progress, readLesson } from "../../stores/progress-store";

export default function LessonFooter({ lessonId, domain }: { lessonId: string; domain: number }) {
  const progress = useStore($progress);
  const read = progress.lessonsRead.includes(lessonId);
  return (
    <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem" }}>
      {read ? (
        <span className="mono" style={{ color: "var(--stamp-red)", border: "2px solid var(--stamp-red)",
          padding: ".2rem .6rem", transform: "rotate(-4deg)", fontSize: ".7rem", letterSpacing: ".18em" }}>
          LOGGED
        </span>
      ) : (
        <button className="btn" onClick={() => readLesson(lessonId)}>Log this chapter as read</button>
      )}
      <a href={`/manual/${domain}`}>Back to § {domain}.0</a>
    </div>
  );
}
