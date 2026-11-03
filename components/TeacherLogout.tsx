"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

// 교사 로그아웃: Google 로그인과 서버의 로그인 표시를 모두 지운다.
export default function TeacherLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await signOut(firebaseAuth()).catch(() => {});
    await fetch("/api/teacher/session", { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  return (
    <button className="button" onClick={logout} disabled={busy}>
      로그아웃
    </button>
  );
}
