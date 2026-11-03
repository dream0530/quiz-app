import { describe, expect, it } from "vitest";
import { sameTitle, validateGeneratedPaper } from "./validate";

const question = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

function paper(overrides: Record<string, unknown> = {}, count = 10) {
  return { title: "정보 보호 기초", questions: Array.from({ length: count }, () => question), ...overrides };
}

describe("validateGeneratedPaper", () => {
  it("accepts a title with exactly 10 valid questions", () => {
    const result = validateGeneratedPaper(paper(), ["다른 문제지"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.paper.title).toBe("정보 보호 기초");
      expect(result.paper.questions).toHaveLength(10);
    }
  });

  it("rejects 9 or 11 questions", () => {
    expect(validateGeneratedPaper(paper({}, 9), []).ok).toBe(false);
    expect(validateGeneratedPaper(paper({}, 11), []).ok).toBe(false);
  });

  it("rejects broken questions", () => {
    const broken = (q: Record<string, unknown>) =>
      paper({ questions: [...Array.from({ length: 9 }, () => question), { ...question, ...q }] });
    expect(validateGeneratedPaper(broken({ options: ["가", "나", "다"] }), []).ok).toBe(false);
    expect(validateGeneratedPaper(broken({ correctAnswer: 0 }), []).ok).toBe(false);
    expect(validateGeneratedPaper(broken({ correctAnswer: 5 }), []).ok).toBe(false);
    expect(validateGeneratedPaper(broken({ explanation: "" }), []).ok).toBe(false);
  });

  it("rejects a missing, empty or too long title", () => {
    expect(validateGeneratedPaper(paper({ title: undefined }), []).ok).toBe(false);
    expect(validateGeneratedPaper(paper({ title: "  " }), []).ok).toBe(false);
    expect(validateGeneratedPaper(paper({ title: "가".repeat(101) }), []).ok).toBe(false);
  });

  it("rejects a title that already exists, without changing it", () => {
    const result = validateGeneratedPaper(paper(), [" 정보  보호 기초 "]);
    expect(result).toEqual({
      ok: false,
      reason: "duplicate-title",
      message: expect.stringContaining("정보 보호 기초"),
    });
  });

  it("rejects something that is not an object", () => {
    expect(validateGeneratedPaper("문제", []).ok).toBe(false);
    expect(validateGeneratedPaper(null, []).ok).toBe(false);
  });
});

describe("sameTitle", () => {
  it("ignores spaces and letter case", () => {
    expect(sameTitle("Web 보안", " web  보안")).toBe(true);
    expect(sameTitle("웹 보안 1", "웹 보안 2")).toBe(false);
  });
});
