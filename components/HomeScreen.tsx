"use client";

import type { StudentPaper } from "@/lib/quiz/types";

type Props = {
  papers: StudentPaper[];
  studentName: string;
  onStart: (paper: StudentPaper) => void;
};

// 학생 문제지 목록: 교사가 공개한 문제지에서 골라 바로 풀이를 시작한다.
export default function HomeScreen({ papers, studentName, onStart }: Props) {
  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>{studentName} 학생, 풀고 싶은 문제지를 골라 주세요.</p>

      {papers.length > 0 ? (
        <ul className="papers">
          {papers.map((paper) => (
            <li key={paper.id}>
              <button className="paper" onClick={() => onStart(paper)}>
                <span className="paper-title">{paper.title}</span>
                <span className="paper-count">{paper.questions.length}문항</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">아직 공개된 문제지가 없습니다. 선생님께 문의해 주세요.</p>
      )}
    </section>
  );
}
