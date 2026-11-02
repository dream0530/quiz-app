import { describe, expect, it, vi } from "vitest";
import { buildPaper, loadQuestionPapers, papersFromFiles } from "./papers";

const validQuestion = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};

describe("buildPaper", () => {
  it("uses the file's title", () => {
    const paper = buildPaper("a.json", JSON.stringify({ title: "중간고사", questions: [validQuestion] }));
    expect(paper).toEqual({ id: "a", title: "중간고사", questions: [validQuestion] });
  });

  it("falls back to the file name when title is missing or blank", () => {
    expect(buildPaper("my-paper.json", JSON.stringify({ questions: [validQuestion] }))?.title).toBe("my-paper");
    expect(buildPaper("my-paper.json", JSON.stringify({ title: " ", questions: [validQuestion] }))?.title).toBe("my-paper");
  });

  it("returns null for a broken file", () => {
    expect(buildPaper("bad.json", JSON.stringify({ title: "x", questions: [] }))).toBeNull();
    expect(buildPaper("bad.json", "not json")).toBeNull();
  });
});

describe("papersFromFiles", () => {
  it("lists valid .json files in file-name order and skips the rest", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const papers = papersFromFiles([
      { name: "b.json", text: JSON.stringify({ title: "B", questions: [validQuestion] }) },
      { name: "a.json", text: JSON.stringify({ questions: [validQuestion] }) },
      { name: "broken.json", text: "{" },
      { name: "notes.txt", text: "hello" },
    ]);
    expect(papers.map((p) => p.title)).toEqual(["a", "B"]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("loadQuestionPapers", () => {
  it("reads the real question-papers folder", () => {
    const highSchool = loadQuestionPapers().find((p) => p.id === "high-school-questions");
    expect(highSchool?.title).toBe("고등학교 정보과목");
    expect(highSchool?.questions).toHaveLength(10);
  });
});
