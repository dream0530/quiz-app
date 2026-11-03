import { NextResponse } from "next/server";
import { validateGeneratedPaper } from "@/lib/ai/validate";
import { isStoreConfigured } from "@/lib/firebase/admin";
import { createPaper, listPaperTitles } from "@/lib/store/papers";
import { requireTeacher } from "@/lib/teacher/server";

// AI가 만든 문제지 저장: 허용된 교사만. 받은 내용을 다시 검사하고(10문항·형식·제목 중복),
// 통과하면 저장과 동시에 학생 목록에 공개한다. 같은 제목이 있으면 이름을 바꾸거나 덮어쓰지 않고 거절한다.
export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher.ok) return teacher.response;
  if (!isStoreConfigured()) {
    return NextResponse.json(
      { ok: false, message: "저장소(Firestore) 연결 설정이 아직 끝나지 않았습니다." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  try {
    const checked = validateGeneratedPaper(body, await listPaperTitles());
    if (!checked.ok) {
      return NextResponse.json(
        { ok: false, message: checked.message },
        { status: checked.reason === "duplicate-title" ? 409 : 400 },
      );
    }

    const { title, questions } = checked.paper;
    const created = await createPaper(title, questions, teacher.email, { published: true, source: "ai" });
    if (!created.ok) {
      return NextResponse.json(
        { ok: false, message: `이미 등록된 문제지와 내용이 같습니다. (등록된 제목: ${created.duplicateOf})` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (error) {
    console.error("AI 문제지 저장 실패", error);
    return NextResponse.json(
      { ok: false, message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
