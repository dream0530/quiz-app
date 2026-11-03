"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { renewTeacherSession } from "@/lib/firebase/client";
import type { Question } from "@/lib/quiz/types";

// 화면에서 먼저 하는 크기 검사(서버에서도 다시 검사한다). lib/ai/pdf.ts의 MAX_PDF_BYTES와 같은 값.
const MAX_PDF_BYTES = 524_288;

type Generated = { title: string; questions: Question[] };

// PDF 학습자료 → AI 문제지 만들기. 결과는 읽기만 하고 "저장"(바로 공개) 또는 "취소"만 고른다.
export default function TeacherAiGenerate() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Generated | null>(null);
  const [busy, setBusy] = useState<"generating" | "saving" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function backToUpload() {
    setResult(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function choose(picked: File | undefined) {
    setError("");
    setNotice("");
    setFile(null);
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF 파일(.pdf)만 올릴 수 있습니다.");
      return;
    }
    if (picked.size === 0) {
      setError("빈 파일입니다. 다른 PDF를 골라 주세요.");
      return;
    }
    if (picked.size > MAX_PDF_BYTES) {
      setError(
        `PDF 파일이 너무 큽니다. 512KB 이하 파일만 올릴 수 있습니다. (지금 파일: ${Math.ceil(picked.size / 1024)}KB)`,
      );
      return;
    }
    setFile(picked);
  }

  async function generate() {
    if (!file || busy) return;
    setBusy("generating");
    setError("");
    setNotice("");
    try {
      await renewTeacherSession();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/teacher/ai/generate", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; paper?: Generated; message?: string };
      if (res.ok && data.ok && data.paper) {
        setResult(data.paper);
      } else {
        setError(data.message ?? "문제를 만들지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("문제를 만들지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    }
    setBusy(null);
  }

  async function save() {
    if (!result || busy) return;
    setBusy("saving");
    setError("");
    try {
      await renewTeacherSession();
      const res = await fetch("/api/teacher/ai/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (res.ok) {
        setNotice(`"${result.title}" 문제지를 저장했고 학생 목록에 공개했습니다.`);
        backToUpload();
        router.refresh();
      } else {
        setError(data.message ?? "저장하지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("저장하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    }
    setBusy(null);
  }

  if (result) {
    return (
      <div className="preview">
        <p className="hint">
          AI가 만든 문제지입니다. 내용이 학습자료와 맞는지 꼭 확인한 뒤 저장해 주세요. 저장하면 바로 학생에게
          공개됩니다.
        </p>
        <h3>{result.title}</h3>
        <ol className="preview-list">
          {result.questions.map((q, i) => (
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
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="button" onClick={backToUpload} disabled={busy !== null}>
            취소
          </button>
          <button className="button primary" onClick={save} disabled={busy !== null}>
            {busy === "saving" ? "저장하는 중…" : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="hint">
        글자를 선택·복사할 수 있는 PDF(512KB 이하, 본문 12,000자 이하)만 됩니다. 스캔·사진 PDF는 안 됩니다.
      </p>
      <label className="field">
        <span>학습자료 PDF 고르기</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          disabled={busy !== null}
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      {busy === "generating" && (
        <p className="hint">PDF를 읽고 문제를 만드는 중입니다… 1~2분 걸릴 수 있으니 창을 닫지 말고 기다려 주세요.</p>
      )}
      <div className="actions">
        <button className="button primary" onClick={generate} disabled={!file || busy !== null}>
          {busy === "generating" ? "만드는 중…" : error && file ? "다시 시도" : "AI로 문제 만들기"}
        </button>
      </div>
    </div>
  );
}
