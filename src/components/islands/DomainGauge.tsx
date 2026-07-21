import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import ProgressRing from "./ProgressRing";

export default function DomainGauge({ domain, questionIds }: { domain: number; questionIds: string[] }) {
  const progress = useStore($progress);
  const mastered = questionIds.filter((id) => progress.answers[id]?.lastCorrect).length;
  const pct = questionIds.length === 0 ? 0 : (mastered / questionIds.length) * 100;
  return <ProgressRing value={pct} label={`Dominio ${domain}`} />;
}
