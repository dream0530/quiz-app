import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// 서버에서만 쓰는 Firebase 연결. 서버용 키는 코드에 넣지 않고 아래 둘 중 하나로 받는다.
// - 내 컴퓨터: .env.local의 GOOGLE_APPLICATION_CREDENTIALS = 키 파일 위치(프로젝트 폴더 밖)
// - 배포 서버: 배포 설정 화면에 FIREBASE_SERVICE_ACCOUNT_KEY = 키 파일 내용 전체
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Firestore 저장소를 쓸 수 있는 설정이 있는지(로그인 확인에는 키가 필요 없다).
export function isStoreConfigured(): boolean {
  return Boolean(
    projectId &&
      (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS),
  );
}

function adminApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return initializeApp({
    projectId,
    credential: key ? cert(JSON.parse(key)) : applicationDefault(),
  });
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}
