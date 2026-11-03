import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { cleanQuestions, paperFingerprint, toPublicQuestions } from "@/lib/quiz/paper-tools";
import type { Question, StudentPaper } from "@/lib/quiz/types";

// Firestore의 문제지 저장. 서버에서만 쓴다(Firestore 규칙은 앱 밖에서의 직접 접근을 모두 막아 둠).
// papers/{문항 내용 지문}: 같은 내용은 같은 문서 이름이 되어 중복 등록이 막힌다.

const papers = () => adminDb().collection("papers");

type PaperDoc = {
  title: string;
  questions: Question[];
  published: boolean;
  source?: "json" | "ai";
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TeacherPaper = {
  id: string;
  title: string;
  questionCount: number;
  published: boolean;
  createdAt: Date;
};

export type CreatePaperResult =
  | { ok: true; id: string }
  | { ok: false; duplicateOf: string };

// JSON 파일 등록은 비공개로, AI 생성 저장은 바로 공개로 저장한다.
// 같은 문항 내용이 이미 있으면 그 제목을 알려준다.
export async function createPaper(
  title: string,
  questions: Question[],
  teacherEmail: string,
  options: { published: boolean; source: "json" | "ai" } = { published: false, source: "json" },
): Promise<CreatePaperResult> {
  const id = paperFingerprint(questions);
  const ref = papers().doc(id);
  try {
    await ref.create({
      title,
      questions: cleanQuestions(questions),
      published: options.published,
      source: options.source,
      createdBy: teacherEmail,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, id };
  } catch (error) {
    // 6 = 이미 있음(ALREADY_EXISTS)
    if ((error as { code?: number }).code === 6) {
      const existing = await ref.get();
      return { ok: false, duplicateOf: (existing.get("title") as string) ?? "" };
    }
    throw error;
  }
}

export async function setPublished(id: string, published: boolean): Promise<boolean> {
  const ref = papers().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.update({ published, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

// 등록된 모든 문제지 제목(공개·비공개 모두). AI 제목 중복 확인에 쓴다.
export async function listPaperTitles(): Promise<string[]> {
  const snap = await papers().select("title").get();
  return snap.docs.map((doc) => doc.get("title") as string);
}

// 교사 화면: 등록한 모든 문제지(최근 것부터).
export async function listTeacherPapers(): Promise<TeacherPaper[]> {
  const snap = await papers().orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => {
    const data = doc.data() as PaperDoc;
    return {
      id: doc.id,
      title: data.title,
      questionCount: data.questions.length,
      published: data.published,
      createdAt: data.createdAt.toDate(),
    };
  });
}

// 학생 화면: 공개된 문제지만, 정답과 해설을 뺀 채로.
export async function listStudentPapers(): Promise<StudentPaper[]> {
  const snap = await papers().where("published", "==", true).get();
  return snap.docs
    .map((doc) => ({ doc, data: doc.data() as PaperDoc }))
    .sort((a, b) => b.data.createdAt.toMillis() - a.data.createdAt.toMillis())
    .map(({ doc, data }) => ({
      id: doc.id,
      title: data.title,
      questions: toPublicQuestions(data.questions),
    }));
}

// 채점용: 공개된 문제지의 전체 내용(정답 포함). 없거나 비공개면 null.
export async function getPublishedPaper(
  id: string,
): Promise<{ id: string; title: string; questions: Question[] } | null> {
  const snap = await papers().doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as PaperDoc;
  if (!data.published) return null;
  return { id: snap.id, title: data.title, questions: data.questions };
}
