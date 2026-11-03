import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 브라우저에서 쓰는 Firebase 연결. 이 값들은 공개되어도 되는 웹 앱 설정값이며 .env.local에 둔다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseAuth() {
  const app = getApps()[0] ?? initializeApp(config);
  return getAuth(app);
}

// 교사 화면을 오래 열어 두면 서버의 로그인 표시(약 1시간)가 끝난다.
// 교사 기능을 쓰기 직전에 이 브라우저의 Google 로그인으로 로그인 표시를 새로 받는다.
// 실패해도 그대로 진행하며, 그때는 서버가 "다시 로그인" 안내를 돌려준다.
export async function renewTeacherSession(): Promise<void> {
  try {
    const auth = firebaseAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken(true);
    await fetch("/api/teacher/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    // 아래 실제 요청에서 로그인 여부를 다시 확인한다.
  }
}
