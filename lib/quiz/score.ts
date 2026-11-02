import type { Answer, GradeResult, Question } from "./types";

// 모든 문항을 파일에 적힌 정답으로 한 번에 채점한다.
// 점수 = 정답 수 ÷ 전체 문항 수 × 100, 반올림한 정수.
export function grade(questions: Question[], answers: Answer[]): GradeResult {
  const results = questions.map((q, i) => {
    const chosen = answers[i] ?? null;
    return { chosen, isCorrect: chosen === q.correctAnswer };
  });
  const correctCount = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  return { results, correctCount, total, score };
}
