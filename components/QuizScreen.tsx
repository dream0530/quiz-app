"use client";

import { useEffect, useState } from "react";
import type { Answer, PublicQuestion } from "@/lib/quiz/types";

type Props = {
  questions: PublicQuestion[];
  onFinish: (answers: Answer[]) => void;
};

// 한 화면에 한 문항만 보여준다. 풀이 중에는 정답·점수·해설을 보여주지 않는다.
export default function QuizScreen({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [index]);

  const question = questions[index];
  const chosen = answers[index];
  const isLast = index === questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  function choose(option: Answer) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? option : a)));
  }

  return (
    <section className="card">
      <p className="progress">
        {index + 1} / {questions.length}
      </p>
      <h2 className="question">{question.question}</h2>

      <div className="options" role="radiogroup" aria-label="보기">
        {question.options.map((text, i) => {
          const number = (i + 1) as Answer;
          const selected = chosen === number;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`option${selected ? " selected" : ""}`}
              onClick={() => choose(number)}
            >
              <span className="option-number">{i + 1}</span>
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {chosen === null && <p className="hint">보기 중 하나를 골라 주세요.</p>}

      <div className="actions">
        <button
          className="button"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
        >
          이전
        </button>
        {isLast ? (
          <button
            className="button primary"
            onClick={() => onFinish(answers)}
            disabled={!allAnswered}
          >
            채점하기
          </button>
        ) : (
          <button
            className="button primary"
            onClick={() => setIndex(index + 1)}
            disabled={chosen === null}
          >
            다음
          </button>
        )}
      </div>
    </section>
  );
}
