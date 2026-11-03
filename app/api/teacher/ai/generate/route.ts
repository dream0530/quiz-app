import { NextResponse } from "next/server";
import { AiError, aiErrorMessage, generateQuizFromText, isAiConfigured } from "@/lib/ai/azure";
import { checkPdfBytes, extractPdfText } from "@/lib/ai/pdf";
import { validateGeneratedPaper } from "@/lib/ai/validate";
import { isStoreConfigured } from "@/lib/firebase/admin";
import { listPaperTitles } from "@/lib/store/papers";
import { requireTeacher } from "@/lib/teacher/server";

// AI 응답을 기다리는 시간(최대 100초)보다 넉넉하게 둔다.
export const maxDuration = 120;

// 파일(512KiB)과 업로드 포장 정보를 합한 요청 크기의 상한. 넘으면 본문을 읽지 않고 거절한다.
const MAX_REQUEST_BYTES = 600_000;

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

// PDF 학습자료로 AI 문제지를 만든다(저장하지 않음). 허용된 교사만.
// 파일·본문 검사를 모두 통과해야 Azure를 한 번 부른다. 자동 재시도는 없다.
export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher.ok) return teacher.response;

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_REQUEST_BYTES) {
    return fail("PDF 파일이 너무 큽니다. 512KB 이하 파일만 올릴 수 있습니다.", 413);
  }

  let file: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    const keys = [...form.keys()];
    if (keys.length !== 1 || keys[0] !== "file") return fail("PDF 파일 하나만 보내 주세요.", 400);
    file = form.get("file");
  } catch {
    return fail("파일을 받지 못했습니다. 다시 시도해 주세요.", 400);
  }
  if (!(file instanceof File)) return fail("PDF 파일을 골라 주세요.", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileCheck = checkPdfBytes(bytes);
  if (!fileCheck.ok) return fail(fileCheck.message, 400);

  // PDF 읽기 도구가 읽은 뒤 데이터를 가져가므로 크기는 먼저 기록해 둔다.
  const size = bytes.length;
  const extracted = await extractPdfText(bytes);
  if (!extracted.ok) return fail(extracted.message, 400);
  console.log(`AI 출제 요청: PDF ${size}바이트, 본문 ${extracted.chars}자`);

  if (!isAiConfigured()) return fail(aiErrorMessage("not-configured"), 500);
  if (!isStoreConfigured()) return fail("저장소(Firestore) 연결 설정이 아직 끝나지 않았습니다.", 500);

  let titles: string[];
  try {
    titles = await listPaperTitles();
  } catch (error) {
    console.error("기존 제목 읽기 실패", error);
    return fail("저장소에서 기존 문제지 목록을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.", 503);
  }

  let raw: unknown;
  try {
    raw = await generateQuizFromText(extracted.text, titles);
  } catch (error) {
    const kind = error instanceof AiError ? error.kind : "unavailable";
    if (!(error instanceof AiError)) console.error("AI 출제 중 오류", error);
    const status = kind === "rate-limit" ? 429 : kind === "timeout" ? 504 : 502;
    return NextResponse.json({ ok: false, kind, message: aiErrorMessage(kind) }, { status });
  }

  const checked = validateGeneratedPaper(raw, titles);
  if (!checked.ok) {
    console.error(`AI 응답 검사 실패: ${checked.message}`);
    return NextResponse.json({ ok: false, kind: checked.reason, message: checked.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true, paper: checked.paper });
}
