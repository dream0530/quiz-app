import { NextResponse } from "next/server";
import { TEACHER_COOKIE } from "@/lib/teacher/access";
import { checkTeacherToken } from "@/lib/teacher/server";

// 교사 로그인: 화면에서 받은 Google 로그인 증명을 서버가 검사하고,
// 허용된 교사일 때만 브라우저에 로그인 표시(쿠키)를 남긴다.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = typeof body?.idToken === "string" ? body.idToken : undefined;

  const check = await checkTeacherToken(idToken);
  if (!check.ok) {
    const status = check.reason === "not-allowed" ? 403 : check.reason === "not-configured" ? 500 : 401;
    const response = NextResponse.json({ ok: false, reason: check.reason }, { status });
    response.cookies.delete(TEACHER_COOKIE);
    return response;
  }

  const response = NextResponse.json({ ok: true, email: check.email });
  response.cookies.set(TEACHER_COOKIE, idToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(check.expiresAt!),
  });
  return response;
}

// 교사 로그아웃: 로그인 표시(쿠키)를 지운다.
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TEACHER_COOKIE);
  return response;
}
