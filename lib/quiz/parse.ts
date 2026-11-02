import type { Question } from "./types";

export type ParseResult =
  | { ok: true; questions: Question[] }
  | { ok: false; errors: string[] };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

// 업로드한 파일의 글자 내용을 검사한다. 하나라도 틀리면 파일 전체를 받지 않고,
// 이용자가 고칠 수 있도록 문제 번호와 함께 쉬운 말로 된 안내 목록을 돌려준다.
export function parseQuestionFile(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: ["파일 내용을 읽을 수 없습니다. 문제 파일(.json)이 맞는지 확인해 주세요."],
    };
  }

  const list =
    typeof data === "object" && data !== null
      ? (data as { questions?: unknown }).questions
      : undefined;

  if (!Array.isArray(list)) {
    return {
      ok: false,
      errors: ["파일 안에 문제 목록(questions)이 없습니다. 선생님께 받은 문제 파일이 맞는지 확인해 주세요."],
    };
  }
  if (list.length === 0) {
    return { ok: false, errors: ["파일 안에 문제가 하나도 없습니다."] };
  }

  const errors: string[] = [];
  list.forEach((item: unknown, index) => {
    const no = `${index + 1}번 문제`;
    if (typeof item !== "object" || item === null) {
      errors.push(`${no}의 형식이 올바르지 않습니다.`);
      return;
    }
    const q = item as Record<string, unknown>;

    if (!isNonEmptyString(q.question)) {
      errors.push(`${no}: 문제 내용(question)이 비어 있습니다.`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${no}: 보기(options)는 꼭 4개여야 합니다.`);
    } else if (!q.options.every(isNonEmptyString)) {
      errors.push(`${no}: 비어 있는 보기가 있습니다.`);
    }
    if (
      typeof q.correctAnswer !== "number" ||
      !Number.isInteger(q.correctAnswer) ||
      q.correctAnswer < 1 ||
      q.correctAnswer > 4
    ) {
      errors.push(`${no}: 정답 번호(correctAnswer)는 1, 2, 3, 4 중 하나여야 합니다.`);
    }
    if (!isNonEmptyString(q.explanation)) {
      errors.push(`${no}: 해설(explanation)이 비어 있습니다.`);
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, questions: list as Question[] };
}
