"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import { grade } from "@/lib/quiz/score";
import type { GradeResult, Question } from "@/lib/quiz/types";

type Stage =
  | { name: "upload" }
  | { name: "quiz"; questions: Question[]; attempt: number }
  | { name: "result"; questions: Question[]; graded: GradeResult; attempt: number };

export default function Home() {
  const [stage, setStage] = useState<Stage>({ name: "upload" });

  if (stage.name === "upload") {
    return (
      <UploadScreen onStart={(questions) => setStage({ name: "quiz", questions, attempt: 0 })} />
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
      questions={stage.questions}
      graded={stage.graded}
      onRetry={() =>
        setStage({ name: "quiz", questions: stage.questions, attempt: stage.attempt + 1 })
      }
      onNewFile={() => setStage({ name: "upload" })}
    />
  );
}
