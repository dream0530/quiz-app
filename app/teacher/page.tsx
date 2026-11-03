import Link from "next/link";
import { loadQuestionPapers } from "@/lib/quiz/papers";

// 교사 화면의 기본 틀. 로그인·문제 등록·결과 저장은 다음 단계에서 연결한다.
// 문제지는 제목과 문항 수만 넘겨, 정답이 이 화면 데이터에 들어가지 않게 한다.
export default function TeacherPage() {
  const papers = loadQuestionPapers().map((paper) => ({
    id: paper.id,
    title: paper.title,
    count: paper.questions.length,
  }));

  return (
    <section className="card">
      <h1>교사 화면</h1>

      <div className="panel">
        <h2>문제 등록</h2>
        <p className="hint">문제를 등록하는 기능은 다음 단계에서 연결됩니다.</p>
        <p>지금 학생들이 풀 수 있는 문제지</p>
        {papers.length > 0 ? (
          <ul className="papers">
            {papers.map((paper) => (
              <li key={paper.id} className="paper static">
                <span className="paper-title">{paper.title}</span>
                <span className="paper-count">{paper.count}문항</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">아직 준비된 문제지가 없습니다.</p>
        )}
      </div>

      <div className="panel">
        <h2>학생 풀이 결과</h2>
        <p className="hint">
          학생들의 풀이 결과를 모아 보는 기능은 다음 단계에서 연결됩니다. 지금은 결과가 저장되지
          않습니다.
        </p>
      </div>

      <div className="actions">
        <Link className="button" href="/">
          첫 화면으로
        </Link>
      </div>
    </section>
  );
}
