// 교사 허용 여부 판단. 화면과 서버가 같은 규칙을 쓰도록 한곳에 둔다.

export const TEACHER_COOKIE = "teacher_token";

export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "not-configured" | "not-signed-in" | "not-allowed" };

// Google이 확인한 이메일이 지정한 교사 이메일 1개와 같을 때만 허용한다(대소문자 무시).
export function isAllowedTeacher(
  email: string | undefined,
  emailVerified: boolean | undefined,
  allowedEmail: string | undefined,
): boolean {
  if (!email || !emailVerified || !allowedEmail?.trim()) return false;
  return email.trim().toLowerCase() === allowedEmail.trim().toLowerCase();
}
