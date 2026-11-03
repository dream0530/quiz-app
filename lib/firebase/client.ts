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
