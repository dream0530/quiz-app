import { NextResponse } from "next/server";
import { setPublished } from "@/lib/store/papers";
import { requireTeacher } from "@/lib/teacher/server";

// 공개·비공개 바꾸기: 허용된 교사만.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacher();
  if (!teacher.ok) return teacher.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { published?: unknown } | null;
  if (typeof body?.published !== "boolean") {
    return NextResponse.json({ ok: false, message: "요청 내용이 올바르지 않습니다." }, { status: 400 });
  }

  const found = await setPublished(id, body.published);
  if (!found) {
    return NextResponse.json({ ok: false, message: "문제지를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
