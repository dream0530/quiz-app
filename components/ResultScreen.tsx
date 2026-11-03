"use client";

import { useEffect } from "react";
import type { GradeResult, Question } from "@/lib/quiz/types";

type Props = {
  studentName: string;
  questions: Question[];
  graded: GradeResult;
  onRetry: () => void;
  onHome: () => void;
};

export default function ResultScreen({ studentName, questions, graded, onRetry, onHome }: Props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="card">
      <h1>{studentName} 학생의 채점 결과</h1>
      <p className="score">
        <strong>{graded.score}</strong>점 <span>/ 100점</span>
      </p>
      <p>
        {graded.total}문항 중 {graded.correctCount}문항을 맞혔습니다.
      </p>

      <ol className="results">
        {questions.map((q, i) => {
          const { chosen, isCorrect } = graded.results[i];
          return (
            <li key={i} className={`result ${isCorrect ? "correct" : "wrong"}`}>
              <p className="result-head">
                <span className="mark" aria-hidden="true">
                  {isCorrect ? "○" : "×"}
                </span>
                {i + 1}번 · {isCorrect ? "정답" : "오답"}
              </p>
              <p className="question">{q.question}</p>
              <p>
                내가 고른 답:{" "}
                {chosen === null ? "고르지 않음" : `${chosen}. ${q.options[chosen - 1]}`}
              </p>
              <p>
                정답: {q.correctAnswer}. {q.options[q.correctAnswer - 1]}
              </p>
              <p className="explanation">해설: {q.explanation}</p>
            </li>
          );
        })}
      </ol>

      <div className="actions">
        <button className="button" onClick={onHome}>
          처음으로
        </button>
        <button className="button primary" onClick={onRetry}>
          같은 문제 다시 풀기
        </button>
      </div>
    </section>
  );
}
