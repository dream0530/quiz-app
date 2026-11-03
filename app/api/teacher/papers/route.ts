import { NextResponse } from "next/server";
import { isStoreConfigured } from "@/lib/firebase/admin";
import { parseQuestionFile } from "@/lib/quiz/parse";
import { createPaper } from "@/lib/store/papers";
import { requireTeacher } from "@/lib/teacher/server";

const MAX_TEXT_LENGTH = 500_000;
const MAX_TITLE_LENGTH = 100;

// 문제지 등록: 허용된 교사만. 화면에서 검사했더라도 서버에서 파일을 다시 검사한 뒤 비공개로 저장한다.
export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher.ok) return teacher.response;
  if (!isStoreConfigured()) {
    return NextResponse.json(
      { ok: false, message: "저장소(Firestore) 연결 설정이 아직 끝나지 않았습니다." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { title?: unknown; text?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const text = typeof body?.text === "string" ? body.text : "";

  if (title === "") {
    return NextResponse.json({ ok: false, message: "문제지 제목을 입력해 주세요." }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { ok: false, message: `문제지 제목은 ${MAX_TITLE_LENGTH}자 이하로 입력해 주세요.` },
      { status: 400 },
    );
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ ok: false, message: "파일이 너무 큽니다." }, { status: 400 });
  }

  const parsed = parseQuestionFile(text);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 400 });
  }

  const created = await createPaper(title, parsed.questions, teacher.email);
  if (!created.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `이미 등록된 문제지와 내용이 같습니다. (등록된 제목: ${created.duplicateOf})`,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
