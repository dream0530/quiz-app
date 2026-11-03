import { NextResponse } from "next/server";
import { isStoreConfigured } from "@/lib/firebase/admin";
import { normalizeStudentName } from "@/lib/quiz/paper-tools";
import type { Answer } from "@/lib/quiz/types";
import { getPublishedPaper } from "@/lib/store/papers";
import { saveResult } from "@/lib/store/results";

const MAX_NAME_LENGTH = 20;

// 학생의 최종 제출: 공개된 문제지에 모든 답을 고른 경우만 받는다.
// 서버가 채점하고 결과를 저장한 뒤에야 정답과 해설을 돌려준다. 다른 학생의 결과는 돌려주지 않는다.
export async function POST(request: Request) {
  if (!isStoreConfigured()) {
    return NextResponse.json(
      { ok: false, message: "저장소 연결이 아직 준비되지 않았습니다. 선생님께 알려 주세요." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    paperId?: unknown;
    studentName?: unknown;
    answers?: unknown;
  } | null;
  const paperId = typeof body?.paperId === "string" ? body.paperId : "";
  const studentName = typeof body?.studentName === "string" ? normalizeStudentName(body.studentName) : "";
  const answers = Array.isArray(body?.answers) ? body.answers : [];

  if (studentName === "" || studentName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ ok: false, message: "이름을 다시 확인해 주세요." }, { status: 400 });
  }

  let paper;
  try {
    paper = paperId ? await getPublishedPaper(paperId) : null;
  } catch (error) {
    console.error("문제지 읽기 실패", error);
    return NextResponse.json(
      { ok: false, message: "결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
  if (!paper) {
    return NextResponse.json(
      { ok: false, message: "이 문제지는 지금 풀 수 없습니다. 처음으로 돌아가 다시 골라 주세요." },
      { status: 404 },
    );
  }

  const valid =
    answers.length === paper.questions.length &&
    answers.every((a) => a === 1 || a === 2 || a === 3 || a === 4);
  if (!valid) {
    return NextResponse.json({ ok: false, message: "모든 문제의 답을 골라 주세요." }, { status: 400 });
  }

  try {
    const graded = await saveResult(paper, studentName, answers as Answer[]);
    return NextResponse.json({ ok: true, questions: paper.questions, graded });
  } catch (error) {
    console.error("풀이 결과 저장 실패", error);
    return NextResponse.json(
      { ok: false, message: "결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
