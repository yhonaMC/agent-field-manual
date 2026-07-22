import { useStore } from "@nanostores/react";
import { $progress, readLesson } from "../../stores/progress-store";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";

export default function LessonFooter({ lessonId, domain }: { lessonId: string; domain: number }) {
  const progress = useStore($progress);
  const lang = useLang();
  const read = progress.lessonsRead.includes(lessonId);
  return (
    <div style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      {read ? (
        <span style={{ color: "var(--ok)", fontWeight: 600 }}>{t(lang, "lesson.logged")}</span>
      ) : (
        <button className="btn" onClick={() => readLesson(lessonId)}>{t(lang, "lesson.markRead")}</button>
      )}
      <a href={`/manual/${domain}`}>{t(lang, "lesson.back")} {domain}</a>
    </div>
  );
}
