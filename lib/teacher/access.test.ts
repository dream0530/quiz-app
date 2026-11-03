import { describe, expect, it } from "vitest";
import { isAllowedTeacher } from "./access";

describe("isAllowedTeacher", () => {
  it("allows only the configured email", () => {
    expect(isAllowedTeacher("teacher@example.com", true, "teacher@example.com")).toBe(true);
    expect(isAllowedTeacher("other@example.com", true, "teacher@example.com")).toBe(false);
  });

  it("ignores letter case and surrounding spaces", () => {
    expect(isAllowedTeacher("Teacher@Example.com", true, " teacher@example.com ")).toBe(true);
  });

  it("rejects an email Google has not verified", () => {
    expect(isAllowedTeacher("teacher@example.com", false, "teacher@example.com")).toBe(false);
    expect(isAllowedTeacher("teacher@example.com", undefined, "teacher@example.com")).toBe(false);
  });

  it("rejects everyone when no teacher email is configured", () => {
    expect(isAllowedTeacher("teacher@example.com", true, undefined)).toBe(false);
    expect(isAllowedTeacher("teacher@example.com", true, "  ")).toBe(false);
  });

  it("rejects a missing email", () => {
    expect(isAllowedTeacher(undefined, true, "teacher@example.com")).toBe(false);
  });
});
