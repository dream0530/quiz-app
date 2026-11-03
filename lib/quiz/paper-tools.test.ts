import { describe, expect, it } from "vitest";
import {
  averageScore,
  cleanQuestions,
  normalizeStudentName,
  paperFingerprint,
  resultKey,
  toPublicQuestions,
} from "./paper-tools";
import type { Question } from "./types";

const question: Question = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

describe("cleanQuestions", () => {
  it("keeps only the four fields and trims text", () => {
    const messy = { ...question, question: " 문제 ", options: [" 가", "나 ", "다", "라"], extra: 1 };
    expect(cleanQuestions([messy as unknown as Question])).toEqual([question]);
  });
});

describe("toPublicQuestions", () => {
  it("removes the answer and explanation", () => {
    expect(toPublicQuestions([question])).toEqual([{ question: "문제", options: ["가", "나", "다", "라"] }]);
  });
});

describe("paperFingerprint", () => {
  it("is the same for the same questions, ignoring spaces", () => {
    expect(paperFingerprint([question])).toBe(paperFingerprint([{ ...question, question: " 문제" }]));
  });

  it("changes when an answer changes", () => {
    expect(paperFingerprint([question])).not.toBe(paperFingerprint([{ ...question, correctAnswer: 3 }]));
  });
});

describe("student names", () => {
  it("normalizes spaces", () => {
    expect(normalizeStudentName("  홍  길동 ")).toBe("홍 길동");
  });

  it("gives the same result key for the same paper and name", () => {
    expect(resultKey("p1", "홍길동")).toBe(resultKey("p1", " 홍길동 "));
    expect(resultKey("p1", "Kim")).toBe(resultKey("p1", "kim"));
    expect(resultKey("p1", "홍길동")).not.toBe(resultKey("p2", "홍길동"));
    expect(resultKey("p1", "홍길동")).not.toBe(resultKey("p1", "김철수"));
  });
});

describe("averageScore", () => {
  it("averages to one decimal place", () => {
    expect(averageScore([100, 50, 70])).toBe(73.3);
    expect(averageScore([80])).toBe(80);
  });

  it("is null with no results", () => {
    expect(averageScore([])).toBeNull();
  });
});
