import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import { domainUnlocked } from "../../lib/progress";
import { t } from "../../lib/i18n";
import { useLang } from "./useLang";

export interface DomainRow {
  domain: number;
  title: string;
  summary: string;
  lessonCount: number;
  questionIds: string[];
}

export default function DomainIndex({ rows }: { rows: DomainRow[] }) {
  const progress = useStore($progress);
  const lang = useLang();

  return (
    <div className="idx">
      {rows.map((r) => {
        const unlocked = domainUnlocked(progress, r.domain);
        const total = r.questionIds.length;
        const mastered = r.questionIds.filter((id) => progress.answers[id]?.lastCorrect).length;
        const pct = total ? Math.round((mastered / total) * 100) : 0;
        const num = String(r.domain).padStart(2, "0");
        const prev = String(r.domain - 1).padStart(2, "0");

        return (
          <a key={r.domain} className={`row${unlocked ? "" : " locked"}`} href={unlocked ? `/manual/${r.domain}` : undefined}>
            <div className="rnum">{num}</div>
            <div className="rbody">
              <div className="rt">{r.title}</div>
              <div className="rd">{r.summary}</div>
            </div>
            <div className="rprog">
              {unlocked ? (
                <>
                  <div className="rmeta">{r.lessonCount} {t(lang, "idx.lessons")} · {pct}% {t(lang, "idx.mastered")}</div>
                  <div className="bar"><span style={{ width: `${pct}%`, background: pct > 0 && pct < 70 ? "var(--accent)" : "var(--ok)" }} /></div>
                </>
              ) : (
                <div className="rmeta">{r.lessonCount} {t(lang, "idx.lessons")}</div>
              )}
            </div>
            <div className="rstate">
              {unlocked ? <span className="go">{t(lang, "idx.open")}</span> : <span className="locktag">{t(lang, "idx.unlockA")} {prev}</span>}
            </div>
          </a>
        );
      })}
    </div>
  );
}
