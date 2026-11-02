import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseQuestionFile } from "./parse";
import type { QuestionPaper } from "./types";

// 파일 하나를 문제지로 만든다. 형식이 틀린 파일은 null(목록에서 뺀다).
export function buildPaper(fileName: string, text: string): QuestionPaper | null {
  const result = parseQuestionFile(text);
  if (!result.ok) return null;
  const id = fileName.replace(/\.json$/i, "");
  return { id, title: result.title ?? id, questions: result.questions };
}

// .json 파일만 파일 이름 순서로 문제지 목록을 만든다. 형식이 틀린 파일은 뺀다.
export function papersFromFiles(files: { name: string; text: string }[]): QuestionPaper[] {
  return files
    .filter((file) => file.name.toLowerCase().endsWith(".json"))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((file) => {
      const paper = buildPaper(file.name, file.text);
      if (!paper) {
        console.warn(`question-papers/${file.name}: 형식이 올바르지 않아 목록에서 뺐습니다.`);
        return [];
      }
      return [paper];
    });
}

// question-papers 폴더를 읽는다. 서버에서만 쓴다.
// 경로를 이 폴더로 고정해 두어야 완성본에 프로젝트 전체가 딸려 들어가지 않는다.
export function loadQuestionPapers(): QuestionPaper[] {
  let names: string[];
  try {
    names = readdirSync(join(process.cwd(), "question-papers"));
  } catch {
    return [];
  }
  return papersFromFiles(
    names
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .map((name) => ({
        name,
        text: readFileSync(join(process.cwd(), "question-papers", name), "utf8"),
      })),
  );
}
