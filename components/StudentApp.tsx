"use client";

import { useState } from "react";
import Link from "next/link";
import QuizApp from "@/components/QuizApp";
import type { QuestionPaper } from "@/lib/quiz/types";

// 학생 화면: 이름을 먼저 받고, 그다음 기존 문제풀이(QuizApp)로 넘어간다.
// 이름은 지금 이 화면에서만 쓰고 어디에도 저장하지 않는다.
export default function StudentApp({ papers }: { papers: QuestionPaper[] }) {
  const [name, setName] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (name !== null) {
    return <QuizApp papers={papers} studentName={name} />;
  }

  function enter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed === "") {
      setError(true);
      return;
    }
    setName(trimmed);
  }

  return (
    <section className="card">
      <h1>학생으로 시작하기</h1>
      <form onSubmit={enter} noValidate>
        <label className="field">
          <span>이름</span>
          <input
            type="text"
            value={input}
            maxLength={20}
            autoComplete="off"
            placeholder="예: 홍길동"
            aria-invalid={error}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
          />
        </label>
        {error && <p className="error">이름을 입력해 주세요.</p>}

        <div className="actions">
          <Link className="button" href="/">
            첫 화면으로
          </Link>
          <button type="submit" className="button primary">
            들어가기
          </button>
        </div>
      </form>
    </section>
  );
}
