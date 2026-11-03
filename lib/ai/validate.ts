import { parseQuestionFile } from "../quiz/parse";
import type { Question } from "../quiz/types";

// AI가 만든 문제지(또는 저장 요청으로 다시 받은 문제지)를 검사한다.
// 하나라도 틀리면 저장하지 않는다.
export const AI_QUESTION_COUNT = 10;
export const MAX_TITLE_LENGTH = 100;

export type GeneratedPaper = { title: string; questions: Question[] };

export type ValidateResult =
  | { ok: true; paper: GeneratedPaper }
  | { ok: false; reason: "format" | "duplicate-title"; message: string };

// 제목 비교: 앞뒤·사이 공백과 영문 대소문자는 무시한다.
export function sameTitle(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return norm(a) === norm(b);
}

const FORMAT_MESSAGE = "AI가 만든 문제의 형식이 올바르지 않습니다. 다시 시도해 주세요.";

export function validateGeneratedPaper(raw: unknown, existingTitles: string[]): ValidateResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, reason: "format", message: FORMAT_MESSAGE };
  }
  const parsed = parseQuestionFile(JSON.stringify(raw));
  if (!parsed.ok) {
    return { ok: false, reason: "format", message: `${FORMAT_MESSAGE} (${parsed.errors[0]})` };
  }
  if (parsed.questions.length !== AI_QUESTION_COUNT) {
    return {
      ok: false,
      reason: "format",
      message: `${FORMAT_MESSAGE} (문항이 ${AI_QUESTION_COUNT}개가 아니라 ${parsed.questions.length}개입니다)`,
    };
  }
  const title = parsed.title ?? "";
  if (title === "" || title.length > MAX_TITLE_LENGTH) {
    return { ok: false, reason: "format", message: `${FORMAT_MESSAGE} (문제지 제목이 없거나 너무 깁니다)` };
  }
  if (existingTitles.some((t) => sameTitle(t, title))) {
    return {
      ok: false,
      reason: "duplicate-title",
      message: `같은 제목("${title}")의 문제지가 이미 있어 저장할 수 없습니다.`,
    };
  }
  return { ok: true, paper: { title, questions: parsed.questions } };
}
