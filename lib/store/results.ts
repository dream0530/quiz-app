import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { normalizeStudentName, resultKey } from "@/lib/quiz/paper-tools";
import { grade } from "@/lib/quiz/score";
import type { Answer, GradeResult, Question } from "@/lib/quiz/types";

// Firestore의 풀이 결과 저장. 서버에서만 쓴다.
// results/{문제지+이름}: 같은 문제지를 같은 이름으로 다시 풀면 최신 결과로 덮어쓴다.

const results = () => adminDb().collection("results");

type ResultDoc = {
  paperId: string;
  paperTitle: string;
  studentName: string;
  answers: Answer[];
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  submittedAt: Timestamp;
};

export type StudentResult = {
  studentName: string;
  score: number;
  wrongQuestions: number[];
  submittedAt: Date;
};

// 최종 제출 때 한 번만 부른다. 서버가 파일의 정답으로 채점하고 저장한다.
export async function saveResult(
  paper: { id: string; title: string; questions: Question[] },
  studentName: string,
  answers: Answer[],
): Promise<GradeResult> {
  const graded = grade(paper.questions, answers);
  const wrongQuestions = graded.results.flatMap((r, i) => (r.isCorrect ? [] : [i + 1]));
  await results()
    .doc(resultKey(paper.id, studentName))
    .set({
      paperId: paper.id,
      paperTitle: paper.title,
      studentName: normalizeStudentName(studentName),
      answers,
      score: graded.score,
      correctCount: graded.correctCount,
      total: graded.total,
      wrongQuestions,
      submittedAt: FieldValue.serverTimestamp(),
    });
  return graded;
}

// 교사 화면: 문제지별 학생 결과(이름별 최신 1건, 이름 순).
export async function listResultsByPaper(): Promise<Map<string, StudentResult[]>> {
  const snap = await results().get();
  const byPaper = new Map<string, StudentResult[]>();
  for (const doc of snap.docs) {
    const data = doc.data() as ResultDoc;
    const list = byPaper.get(data.paperId) ?? [];
    list.push({
      studentName: data.studentName,
      score: data.score,
      wrongQuestions: data.wrongQuestions,
      submittedAt: data.submittedAt?.toDate() ?? new Date(0),
    });
    byPaper.set(data.paperId, list);
  }
  for (const list of byPaper.values()) {
    list.sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
  }
  return byPaper;
}
