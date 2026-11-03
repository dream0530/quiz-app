import { createHash } from "node:crypto";
import type { PublicQuestion, Question } from "./types";

// 문제지 저장·비교에 쓰는 도구. 서버에서만 쓴다.

// 저장할 때는 문항마다 필요한 4가지만, 앞뒤 공백을 지워 남긴다.
export function cleanQuestions(questions: Question[]): Question[] {
  return questions.map((q) => ({
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()) as Question["options"],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation.trim(),
  }));
}

// 풀이 중 학생에게 보낼 때는 정답과 해설을 뺀다.
export function toPublicQuestions(questions: Question[]): PublicQuestion[] {
  return questions.map((q) => ({ question: q.question, options: q.options }));
}

// 문항 내용이 같으면 같은 값이 나온다(제목은 보지 않음). 중복 등록을 막는 데 쓴다.
export function paperFingerprint(questions: Question[]): string {
  return createHash("sha256").update(JSON.stringify(cleanQuestions(questions))).digest("hex");
}

// 학생 이름: 앞뒤 공백을 지우고 사이 공백은 하나로 줄인다.
export function normalizeStudentName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// 같은 문제지 + 같은 이름이면 같은 값. 결과를 "최신 1건"으로 덮어쓰는 데 쓴다(영문 대소문자 무시).
export function resultKey(paperId: string, studentName: string): string {
  const name = normalizeStudentName(studentName).toLowerCase();
  return createHash("sha256").update(`${paperId}\n${name}`).digest("hex");
}

// 평균 점수: 소수 첫째 자리까지 반올림. 결과가 없으면 null.
export function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
