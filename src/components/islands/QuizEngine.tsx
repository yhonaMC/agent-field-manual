import type { Question } from "../../lib/question-schema";
export default function QuizEngine({ questions }: { questions: Question[] }) {
  return <p className="mono">Quiz loading… ({questions.length} questions)</p>;
}
