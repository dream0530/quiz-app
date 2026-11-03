import { extractText, getDocumentProxy } from "unpdf";

// PDF 학습자료 검사와 본문 추출. 서버에서만 쓴다.
// 이번 교안의 교육용 입력 기준(플랫폼 공식 한도 아님): 파일 512KiB, 추출 본문 12,000자.
export const MAX_PDF_BYTES = 524_288;
export const MAX_TEXT_CHARS = 12_000;
// 이보다 글자가 적으면 글자를 선택할 수 없는(스캔·사진) PDF로 본다.
export const MIN_TEXT_CHARS = 200;

export type PdfCheck = { ok: true; text: string; chars: number } | { ok: false; message: string };

// 파일 자체 검사(크기·형식). 통과해야 본문을 읽는다.
export function checkPdfBytes(bytes: Uint8Array): { ok: true } | { ok: false; message: string } {
  if (bytes.length === 0) return { ok: false, message: "빈 파일입니다. 다른 PDF를 골라 주세요." };
  if (bytes.length > MAX_PDF_BYTES) {
    return {
      ok: false,
      message: `PDF 파일이 너무 큽니다. 512KB 이하 파일만 올릴 수 있습니다. (지금 파일: ${Math.ceil(bytes.length / 1024)}KB)`,
    };
  }
  const head = new TextDecoder().decode(bytes.subarray(0, 5));
  if (head !== "%PDF-") return { ok: false, message: "PDF 파일이 아닙니다. .pdf 파일을 골라 주세요." };
  return { ok: true };
}

// 공백을 정리한 본문 글자 수 검사. 넘치면 자르지 않고 거절한다.
export function checkTextLength(text: string): PdfCheck {
  const compact = text.replace(/\s+/g, " ").trim();
  const chars = [...compact].length;
  if (chars < MIN_TEXT_CHARS) {
    return {
      ok: false,
      message:
        "PDF에서 글자를 거의 읽지 못했습니다. 글자를 선택·복사할 수 있는 PDF만 지원합니다. (스캔하거나 사진으로 만든 PDF는 안 됩니다)",
    };
  }
  if (chars > MAX_TEXT_CHARS) {
    return {
      ok: false,
      message: `PDF 본문이 너무 깁니다. 12,000자 이하만 처리할 수 있습니다. (지금 본문: ${chars.toLocaleString("ko-KR")}자) 내용을 나눠서 올려 주세요.`,
    };
  }
  return { ok: true, text: compact, chars };
}

export async function extractPdfText(bytes: Uint8Array): Promise<PdfCheck> {
  let text: string;
  try {
    const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 });
    if (pdf.numPages > 100) {
      return { ok: false, message: "쪽수가 너무 많은 PDF입니다. 내용을 나눠서 올려 주세요." };
    }
    text = (await extractText(pdf, { mergePages: true })).text;
  } catch (error) {
    if ((error as { name?: string }).name === "PasswordException") {
      return { ok: false, message: "암호가 걸린 PDF는 읽을 수 없습니다. 암호를 푼 PDF를 올려 주세요." };
    }
    return { ok: false, message: "PDF를 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해 주세요." };
  }
  return checkTextLength(text);
}
