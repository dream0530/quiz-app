import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseQuestionFile } from "./parse";

const validQuestion = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

function fileWith(questions: unknown) {
  return JSON.stringify({ questions });
}

describe("parseQuestionFile", () => {
  it("accepts sample-questions.json unchanged", () => {
    const text = readFileSync(join(__dirname, "../../sample-questions.json"), "utf8");
    const result = parseQuestionFile(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toBeNull();
      expect(result.questions).toHaveLength(10);
      expect(result.questions).toEqual(JSON.parse(text).questions);
    }
  });

  it("accepts a file that starts with a UTF-8 BOM", () => {
    expect(parseQuestionFile("﻿" + fileWith([validQuestion])).ok).toBe(true);
  });

  it("rejects text that is not JSON", () => {
    const result = parseQuestionFile("not json");
    expect(result).toEqual({ ok: false, errors: [expect.stringContaining("읽을 수 없습니다")] });
  });

  it("rejects a file without a questions array", () => {
    expect(parseQuestionFile("{}").ok).toBe(false);
    expect(parseQuestionFile(JSON.stringify({ questions: "x" })).ok).toBe(false);
    expect(parseQuestionFile("[]").ok).toBe(false);
  });

  it("rejects an empty questions array", () => {
    const result = parseQuestionFile(fileWith([]));
    expect(result).toEqual({ ok: false, errors: [expect.stringContaining("하나도 없습니다")] });
  });

  it("rejects the whole file and names each broken question", () => {
    const result = parseQuestionFile(
      fileWith([
        validQuestion,
        { ...validQuestion, options: ["가", "나", "다"] },
        { ...validQuestion, correctAnswer: 5 },
        { ...validQuestion, correctAnswer: "2" },
        { ...validQuestion, question: " " },
        { ...validQuestion, explanation: undefined },
        { ...validQuestion, options: ["가", "", "다", "라"] },
        null,
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        expect.stringMatching(/^2번 문제: 보기/),
        expect.stringMatching(/^3번 문제: 정답 번호/),
        expect.stringMatching(/^4번 문제: 정답 번호/),
        expect.stringMatching(/^5번 문제: 문제 내용/),
        expect.stringMatching(/^6번 문제: 해설/),
        expect.stringMatching(/^7번 문제: 비어 있는 보기/),
        expect.stringMatching(/^8번 문제의 형식/),
      ]);
    }
  });
});
