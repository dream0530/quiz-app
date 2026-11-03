import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase 로그인 증명(ID 토큰)을 Google 공개 키로 직접 검사한다(Firebase 문서의 방식).
// firebase-admin/auth를 쓰지 않는 이유: Vercel 서버에서 그 모듈을 불러오지 못하는 문제가 있었다.
const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type VerifiedToken = { email?: string; emailVerified?: boolean; exp: number };

// 서명·발급처·대상 프로젝트·만료를 확인한다. 틀리면 예외를 던진다.
export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<VerifiedToken> {
  const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || typeof payload.auth_time !== "number" || payload.auth_time > now || !payload.exp) {
    throw new Error("invalid token");
  }
  return {
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
    exp: payload.exp,
  };
}
