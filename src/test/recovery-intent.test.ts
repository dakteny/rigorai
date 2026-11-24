import { describe, it, expect } from "vitest";
import { isRecoveryHash } from "@/lib/recovery-intent";

describe("Password recovery intent", () => {
  it("recognizes an actual recovery-shaped callback before Auth consumes it", () => {
    expect(isRecoveryHash("#type=recovery&access_token=test-token")).toBe(true);
  });
  it("does not treat ordinary login callbacks or a bare flag as recovery", () => {
    expect(isRecoveryHash("#type=signup&access_token=test-token")).toBe(false);
    expect(isRecoveryHash("#type=recovery")).toBe(false);
  });
});
