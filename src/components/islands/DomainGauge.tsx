import { useStore } from "@nanostores/react";
import { $progress } from "../../stores/progress-store";
import Gauge from "./Gauge";

export default function DomainGauge({ domain, questionIds }: { domain: number; questionIds: string[] }) {
  const progress = useStore($progress);
  const mastered = questionIds.filter((id) => progress.answers[id]?.lastCorrect).length;
  const pct = questionIds.length === 0 ? 0 : (mastered / questionIds.length) * 100;
  return <Gauge value={pct} label={`§ ${domain}.0 mastery`} />;
}
