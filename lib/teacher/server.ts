import { cookies } from "next/headers";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { TEACHER_COOKIE, isAllowedTeacher, type TeacherCheck } from "./access";

// 서버에서만 쓰는 교사 확인. Google 로그인 증명(ID 토큰)을 Firebase 공개 키로 검사하므로
// 비밀키가 필요 없다. 필요한 값은 .env.local(또는 나중의 배포 설정)에서 읽는다.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const allowedEmail = process.env.TEACHER_EMAIL;

export function isTeacherLoginConfigured(): boolean {
  return Boolean(
    projectId && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && allowedEmail?.trim(),
  );
}

function adminAuth() {
  const app = getApps()[0] ?? initializeApp({ projectId });
  return getAuth(app);
}

// ID 토큰을 검사해 교사인지 판단한다. 토큰이 틀렸거나 만료되면 not-signed-in.
export async function checkTeacherToken(
  idToken: string | undefined,
): Promise<TeacherCheck & { expiresAt?: number }> {
  if (!isTeacherLoginConfigured()) return { ok: false, reason: "not-configured" };
  if (!idToken) return { ok: false, reason: "not-signed-in" };

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    return { ok: false, reason: "not-signed-in" };
  }

  if (!isAllowedTeacher(decoded.email, decoded.email_verified, allowedEmail)) {
    return { ok: false, reason: "not-allowed" };
  }
  return { ok: true, email: decoded.email!, expiresAt: decoded.exp * 1000 };
}

// 교사 화면·교사 기능에서 부르는 확인. 브라우저 쿠키에 담긴 토큰을 매번 다시 검사한다.
export async function getSignedInTeacher(): Promise<TeacherCheck> {
  const store = await cookies();
  return checkTeacherToken(store.get(TEACHER_COOKIE)?.value);
}
