"use client";

import { useState } from "react";
import HomeScreen from "@/components/HomeScreen";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import type { Answer, GradeResult, Question, StudentPaper } from "@/lib/quiz/types";

type Stage =
  | { name: "home" }
  | { name: "quiz"; paper: StudentPaper; attempt: number }
  | { name: "submit"; paper: StudentPaper; answers: Answer[]; attempt: number; error: string | null }
  | { name: "result"; paper: StudentPaper; questions: Question[]; graded: GradeResult; attempt: number };

type Props = {
  papers: StudentPaper[];
  studentName: string;
};

type SubmitResponse =
  | { ok: true; questions: Question[]; graded: GradeResult }
  | { ok: false; message?: string };

// 한 페이지 안에서 문제지 목록 → 풀이 → 제출(서버 채점·저장) → 결과를 바꿔 보여준다.
// 정답과 해설은 제출이 저장된 뒤 서버에서 받아온다.
export default function QuizApp({ papers, studentName }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "home" });

  async function submit(paper: StudentPaper, answers: Answer[], attempt: number) {
    setStage({ name: "submit", paper, answers, attempt, error: null });
    let data: SubmitResponse;
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id, studentName, answers }),
      });
      data = (await res.json()) as SubmitResponse;
    } catch {
      data = { ok: false };
    }
    if (data.ok) {
      setStage({ name: "result", paper, questions: data.questions, graded: data.graded, attempt });
    } else {
      setStage({
        name: "submit",
        paper,
        answers,
        attempt,
        error: data.message ?? "결과를 저장하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
      });
    }
  }

  if (stage.name === "home") {
    return (
      <HomeScreen
        papers={papers}
        studentName={studentName}
        onStart={(paper) => setStage({ name: "quiz", paper, attempt: 0 })}
      />
    );
  }

  if (stage.name === "quiz") {
    return (
      <QuizScreen
        key={stage.attempt}
        questions={stage.paper.questions}
        onFinish={(answers) => submit(stage.paper, answers, stage.attempt)}
      />
    );
  }

  if (stage.name === "submit") {
    return (
      <section className="card">
        <h1>채점하기</h1>
        {stage.error === null ? (
          <p>결과를 저장하고 채점하는 중입니다…</p>
        ) : (
          <>
            <p className="error">{stage.error}</p>
            <p className="hint">고른 답은 그대로 남아 있습니다.</p>
            <div className="actions">
              <button className="button" onClick={() => setStage({ name: "home" })}>
                처음으로
              </button>
              <button
                className="button primary"
                onClick={() => submit(stage.paper, stage.answers, stage.attempt)}
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <ResultScreen
      studentName={studentName}
      questions={stage.questions}
      graded={stage.graded}
      onRetry={() => setStage({ name: "quiz", paper: stage.paper, attempt: stage.attempt + 1 })}
      onHome={() => setStage({ name: "home" })}
    />
  );
}
