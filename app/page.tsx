import QuizApp from "@/components/QuizApp";
import { loadQuestionPapers } from "@/lib/quiz/papers";

// question-papers 폴더의 문제지는 서버에서 읽어 첫 화면 목록으로 넘긴다.
export default function Home() {
  return <QuizApp papers={loadQuestionPapers()} />;
}
