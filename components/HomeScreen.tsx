"use client";

import type { Question, QuestionPaper } from "@/lib/quiz/types";

type Props = {
  papers: QuestionPaper[];
  onStart: (questions: Question[]) => void;
};

// 첫 화면: question-papers 폴더의 문제지 목록에서 골라 바로 풀이를 시작한다.
export default function HomeScreen({ papers, onStart }: Props) {
  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>풀고 싶은 문제지를 골라 주세요.</p>

      {papers.length > 0 ? (
        <ul className="papers">
          {papers.map((paper) => (
            <li key={paper.id}>
              <button className="paper" onClick={() => onStart(paper.questions)}>
                <span className="paper-title">{paper.title}</span>
                <span className="paper-count">{paper.questions.length}문항</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">아직 준비된 문제지가 없습니다. 선생님께 문의해 주세요.</p>
      )}
    </section>
  );
}
