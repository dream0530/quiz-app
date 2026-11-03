"use client";

import { useState } from "react";
import HomeScreen from "@/components/HomeScreen";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import { grade } from "@/lib/quiz/score";
import type { GradeResult, Question, QuestionPaper } from "@/lib/quiz/types";

type Stage =
  | { name: "home" }
  | { name: "quiz"; questions: Question[]; attempt: number }
  | { name: "result"; questions: Question[]; graded: GradeResult; attempt: number };

type Props = {
  papers: QuestionPaper[];
  studentName: string;
};

// 한 페이지 안에서 문제지 목록 → 풀이 → 결과 3단계를 바꿔 보여준다.
export default function QuizApp({ papers, studentName }: Props) {
  const [stage, setStage] = useState<Stage>({ name: "home" });

  if (stage.name === "home") {
    return (
      <HomeScreen
        papers={papers}
        studentName={studentName}
        onStart={(questions) => setStage({ name: "quiz", questions, attempt: 0 })}
      />
    );
  }

  if (stage.name === "quiz") {
    return (
      <QuizScreen
        key={stage.attempt}
        questions={stage.questions}
        onFinish={(answers) =>
          setStage({
            name: "result",
            questions: stage.questions,
            graded: grade(stage.questions, answers),
            attempt: stage.attempt,
          })
        }
      />
    );
  }

  return (
    <ResultScreen
      studentName={studentName}
      questions={stage.questions}
      graded={stage.graded}
      onRetry={() =>
        setStage({ name: "quiz", questions: stage.questions, attempt: stage.attempt + 1 })
      }
      onHome={() => setStage({ name: "home" })}
    />
  );
}
