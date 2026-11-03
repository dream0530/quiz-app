import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, MAX_TEXT_CHARS, MIN_TEXT_CHARS, checkPdfBytes, checkTextLength, extractPdfText } from "./pdf";

function pdfBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size).fill(32);
  bytes.set(new TextEncoder().encode("%PDF-1.7"));
  return bytes;
}

describe("checkPdfBytes", () => {
  it("accepts a PDF of exactly 512KiB and rejects one byte more", () => {
    expect(MAX_PDF_BYTES).toBe(524_288);
    expect(checkPdfBytes(pdfBytes(524_288))).toEqual({ ok: true });
    const tooBig = checkPdfBytes(pdfBytes(524_289));
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) expect(tooBig.message).toContain("512KB");
  });

  it("rejects an empty file and a non-PDF file", () => {
    expect(checkPdfBytes(new Uint8Array()).ok).toBe(false);
    expect(checkPdfBytes(new TextEncoder().encode("hello world")).ok).toBe(false);
  });
});

describe("checkTextLength", () => {
  it("accepts 12,000 characters and rejects 12,001 without cutting", () => {
    expect(MAX_TEXT_CHARS).toBe(12_000);
    const ok = checkTextLength("가".repeat(12_000));
    expect(ok).toEqual({ ok: true, text: "가".repeat(12_000), chars: 12_000 });
    const tooLong = checkTextLength("가".repeat(12_001));
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.message).toContain("12,001자");
  });

  it("counts characters after tidying spaces", () => {
    const result = checkTextLength(`  ${"가 ".repeat(150)}\n\n${"나".repeat(100)}  `);
    expect(result.ok && result.chars).toBe(400);
  });

  it("treats almost no text as a scanned PDF", () => {
    const result = checkTextLength("가".repeat(MIN_TEXT_CHARS - 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("글자를 선택·복사할 수 있는 PDF");
  });
});

describe("extractPdfText", () => {
  it("reports a broken PDF instead of succeeding", async () => {
    const result = await extractPdfText(pdfBytes(2_000));
    expect(result.ok).toBe(false);
  });
});
