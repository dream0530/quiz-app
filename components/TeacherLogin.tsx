"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

const NOT_ALLOWED =
  "허용되지 않은 계정입니다. 교사로 등록된 Google 계정으로 다시 로그인해 주세요.";

// 교사 로그인 화면. Google로 로그인한 뒤 서버에 확인을 맡기고,
// 서버가 허용한 경우에만 교사 화면을 다시 불러온다.
export default function TeacherLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const triedSaved = useRef(false);

  async function sendToServer(user: User) {
    const idToken = await user.getIdToken(true);
    const res = await fetch("/api/teacher/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (res.ok) {
      router.refresh();
      return;
    }
    await signOut(firebaseAuth());
    setMessage(res.status === 403 ? NOT_ALLOWED : "로그인을 확인하지 못했습니다. 다시 시도해 주세요.");
    setBusy(false);
  }

  // 이 브라우저에 이미 로그인 기록이 있으면(예: 로그인 표시 시간이 지난 경우) 자동으로 다시 확인한다.
  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), (user) => {
      if (user && !triedSaved.current) {
        triedSaved.current = true;
        sendToServer(user).catch(() => setBusy(false));
      } else {
        setBusy(false);
      }
    });
  }, []);

  async function login() {
    setBusy(true);
    setMessage("");
    triedSaved.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const { user } = await signInWithPopup(firebaseAuth(), provider);
      await sendToServer(user);
    } catch {
      setMessage("로그인 창이 닫혔거나 로그인하지 못했습니다. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h1>교사 로그인</h1>
      <p>교사 화면은 교사로 등록된 Google 계정으로만 들어갈 수 있습니다.</p>
      {message && <p className="error">{message}</p>}

      <div className="actions">
        <Link className="button" href="/">
          첫 화면으로
        </Link>
        <button className="button primary" onClick={login} disabled={busy}>
          {busy ? "확인하는 중…" : "Google로 로그인"}
        </button>
      </div>
    </section>
  );
}
