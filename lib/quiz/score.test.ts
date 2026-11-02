import { describe, expect, it } from "vitest";
import { grade } from "./score";
import type { Answer, Question } from "./types";

function questionsWithAnswers(correct: Answer[]): Question[] {
  return correct.map((c) => ({
    question: "문제",
    options: ["가", "나", "다", "라"],
    correctAnswer: c as 1 | 2 | 3 | 4,
    explanation: "해설",
  }));
}

describe("grade", () => {
  it("marks each question against the file's correctAnswer", () => {
    const questions = questionsWithAnswers([1, 2, 3, 4]);
    const graded = grade(questions, [1, 3, 3, null]);
    expect(graded.results).toEqual([
      { chosen: 1, isCorrect: true },
      { chosen: 3, isCorrect: false },
      { chosen: 3, isCorrect: true },
      { chosen: null, isCorrect: false },
    ]);
    expect(graded.correctCount).toBe(2);
    expect(graded.total).toBe(4);
    expect(graded.score).toBe(50);
  });

  it("scores 7 of 10 as 70", () => {
    const questions = questionsWithAnswers([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    expect(grade(questions, [1, 1, 1, 1, 1, 1, 1, 2, 2, 2]).score).toBe(70);
  });

  it("rounds to the nearest whole number", () => {
    const questions = questionsWithAnswers([1, 1, 1]);
    expect(grade(questions, [1, 2, 2]).score).toBe(33);
    expect(grade(questions, [1, 1, 2]).score).toBe(67);
  });

  it("gives 100 and 0 at the ends", () => {
    const questions = questionsWithAnswers([2, 4]);
    expect(grade(questions, [2, 4]).score).toBe(100);
    expect(grade(questions, [1, 1]).score).toBe(0);
  });
});
