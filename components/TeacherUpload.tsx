"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { renewTeacherSession } from "@/lib/firebase/client";
import { parseQuestionFile } from "@/lib/quiz/parse";
import type { Question } from "@/lib/quiz/types";

type Preview = { fileName: string; text: string; questions: Question[] };

// 문제지 등록: 파일을 고르면 내용을 먼저 보여주고, 제목을 확인한 뒤 "등록하기"로 저장한다.
// 등록한 문제지는 비공개로 저장되며 목록에서 "공개하기"를 눌러야 학생에게 보인다.
export default function TeacherUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setPreview(null);
    setTitle("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function chooseFile(file: File | undefined) {
    setErrors([]);
    setNotice("");
    setPreview(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrors(["문제 파일(.json)만 올릴 수 있습니다."]);
      return;
    }
    const text = await file.text();
    const parsed = parseQuestionFile(text);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setPreview({ fileName: file.name, text, questions: parsed.questions });
    setTitle(parsed.title ?? file.name.replace(/\.json$/i, ""));
  }

  async function register() {
    if (!preview) return;
    if (title.trim() === "") {
      setErrors(["문제지 제목을 입력해 주세요."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      await renewTeacherSession();
      const res = await fetch("/api/teacher/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), text: preview.text }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; errors?: string[] };
      if (res.ok) {
        setNotice(`"${title.trim()}" 문제지를 등록했습니다. 아래 목록에서 "공개하기"를 누르면 학생에게 보입니다.`);
        reset();
        router.refresh();
      } else {
        setErrors(data.errors ?? [data.message ?? "등록하지 못했습니다. 다시 시도해 주세요."]);
      }
    } catch {
      setErrors(["등록하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요."]);
    }
    setBusy(false);
  }

  return (
    <div>
      <label className="field">
        <span>문제 파일(.json) 고르기</span>
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => chooseFile(e.target.files?.[0])}
        />
      </label>

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}
      {notice && <p className="notice">{notice}</p>}

      {preview && (
        <div className="preview">
          <label className="field">
            <span>문제지 제목</span>
            <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <p className="hint">
            {preview.fileName} · {preview.questions.length}문항. 내용을 확인한 뒤 등록해 주세요.
          </p>
          <ol className="preview-list">
            {preview.questions.map((q, i) => (
              <li key={i}>
                <p className="question">{q.question}</p>
                <ol className="preview-options">
                  {q.options.map((o, j) => (
                    <li key={j} className={j + 1 === q.correctAnswer ? "answer" : undefined}>
                      {o}
                      {j + 1 === q.correctAnswer && " (정답)"}
                    </li>
                  ))}
                </ol>
                <p className="explanation">해설: {q.explanation}</p>
              </li>
            ))}
          </ol>
          <div className="actions">
            <button className="button" onClick={reset} disabled={busy}>
              취소
            </button>
            <button className="button primary" onClick={register} disabled={busy}>
              {busy ? "등록하는 중…" : "등록하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
