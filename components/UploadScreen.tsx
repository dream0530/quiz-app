"use client";

import { useState } from "react";
import { parseQuestionFile } from "@/lib/quiz/parse";
import type { Question } from "@/lib/quiz/types";

const MAX_ERRORS_SHOWN = 10;

type Props = {
  onStart: (questions: Question[]) => void;
};

type Loaded =
  | { status: "empty" }
  | { status: "ready"; fileName: string; questions: Question[] }
  | { status: "error"; fileName: string; errors: string[] };

export default function UploadScreen({ onStart }: Props) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "empty" });

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 고친 뒤 다시 골라도 반응하도록 선택 칸을 비운다.
    event.target.value = "";
    if (!file) return;

    // 파일은 이 브라우저 안에서만 읽고 어디로도 보내지 않는다.
    const result = parseQuestionFile(await file.text());
    setLoaded(
      result.ok
        ? { status: "ready", fileName: file.name, questions: result.questions }
        : { status: "error", fileName: file.name, errors: result.errors },
    );
  }

  return (
    <section className="card">
      <h1>문제풀이</h1>
      <p>선생님께 받은 문제 파일(.json)을 올려 주세요. 파일을 올리면 문제를 풀 수 있습니다.</p>

      <label className="button primary file-button">
        문제 파일 선택
        <input type="file" accept=".json,application/json" onChange={handleFile} />
      </label>

      {loaded.status === "ready" && (
        <div className="notice ok" role="status">
          <p>
            <strong>{loaded.fileName}</strong> 파일을 불러왔습니다.
          </p>
          <p>총 {loaded.questions.length}문항</p>
          <button className="button primary" onClick={() => onStart(loaded.questions)}>
            풀이 시작
          </button>
        </div>
      )}

      {loaded.status === "error" && (
        <div className="notice error" role="alert">
          <p>
            <strong>{loaded.fileName}</strong> 파일을 사용할 수 없습니다. 아래 내용을 고친 뒤 다시
            올려 주세요.
          </p>
          <ul>
            {loaded.errors.slice(0, MAX_ERRORS_SHOWN).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          {loaded.errors.length > MAX_ERRORS_SHOWN && (
            <p>그 밖에 고칠 곳이 {loaded.errors.length - MAX_ERRORS_SHOWN}개 더 있습니다.</p>
          )}
        </div>
      )}
    </section>
  );
}
