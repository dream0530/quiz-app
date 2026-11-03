"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renewTeacherSession } from "@/lib/firebase/client";

// 문제지 공개·비공개 바꾸기 버튼. 서버가 교사인지 다시 확인한다.
export default function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await renewTeacherSession();
      const res = await fetch(`/api/teacher/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? "바꾸지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("바꾸지 못했습니다. 다시 시도해 주세요.");
    }
    setBusy(false);
  }

  return (
    <span className="toggle">
      <button className={`button small${published ? "" : " primary"}`} onClick={toggle} disabled={busy}>
        {published ? "비공개로 바꾸기" : "공개하기"}
      </button>
      {error && <span className="error">{error}</span>}
    </span>
  );
}
