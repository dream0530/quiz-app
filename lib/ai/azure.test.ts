import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiError, aiErrorMessage, generateQuizFromText, statusToKind } from "./azure";

// 실제 Azure는 부르지 않는다. fetch를 가짜로 바꿔 응답별 처리만 확인한다.
const ENV = {
  AZURE_API_STYLE: "openai-v1",
  AZURE_ENDPOINT: "https://example.openai.azure.com/",
  AZURE_DEPLOYMENT: "test-deployment",
  AZURE_API_KEY: "test-key",
};

function reply(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

async function kindOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "ok";
  } catch (error) {
    return (error as AiError).kind;
  }
}

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generateQuizFromText", () => {
  it("calls the v1 chat completions address once with the deployment name and returns the JSON", async () => {
    const fetchMock = reply(200, {
      choices: [{ finish_reason: "stop", message: { content: '{"title":"t","questions":[]}' } }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateQuizFromText("본문", ["기존"])).resolves.toEqual({ title: "t", questions: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.openai.azure.com/openai/v1/chat/completions");
    expect(init.headers["api-key"]).toBe("test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("test-deployment");
    expect(body.messages[1].content).toContain("<학습자료>\n본문\n</학습자료>");
    expect(body.messages[1].content).toContain("- 기존");
  });

  it("does not call anything when settings are missing or the style is different", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("AZURE_API_STYLE", "other");
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("not-configured");
    vi.stubEnv("AZURE_API_STYLE", "openai-v1");
    vi.stubEnv("AZURE_API_KEY", "");
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("not-configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tells 401, 403 and 429 apart and does not retry", async () => {
    for (const [status, kind] of [
      [401, "auth"],
      [403, "forbidden"],
      [429, "rate-limit"],
    ] as const) {
      const fetchMock = reply(status, { error: {} });
      vi.stubGlobal("fetch", fetchMock);
      expect(await kindOf(generateQuizFromText("본문", []))).toBe(kind);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("reports a timeout", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("timeout");
  });

  it("treats cut-off, refused or non-JSON answers as format errors", async () => {
    vi.stubGlobal("fetch", reply(200, { choices: [{ finish_reason: "length", message: { content: "{" } }] }));
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("format");
    vi.stubGlobal("fetch", reply(200, { choices: [{ finish_reason: "stop", message: { content: "문제입니다" } }] }));
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("format");
    vi.stubGlobal("fetch", reply(200, { choices: [{ finish_reason: "content_filter", message: { content: null } }] }));
    expect(await kindOf(generateQuizFromText("본문", []))).toBe("rejected");
  });
});

describe("error messages", () => {
  it("maps statuses and gives a plain message for each", () => {
    expect(statusToKind(401)).toBe("auth");
    expect(statusToKind(404)).toBe("rejected");
    expect(statusToKind(500)).toBe("unavailable");
    expect(aiErrorMessage("rate-limit")).toContain("429");
    expect(aiErrorMessage("auth")).toContain("401");
    expect(aiErrorMessage("forbidden")).toContain("403");
  });
});
