import StudentApp from "@/components/StudentApp";
import { loadQuestionPapers } from "@/lib/quiz/papers";

// question-papers 폴더의 문제지는 서버에서 읽어 학생 화면으로 넘긴다.
export default function StudentPage() {
  return <StudentApp papers={loadQuestionPapers()} />;
}
