import { describe, expect, it } from "vitest";
import { formatN8nOutput, n8nFailureMessage } from "@/lib/n8n-result";

describe("n8n results", () => {
  it("preserves a plain-text workflow result", () => {
    expect(formatN8nOutput("Completed")).toBe("Completed");
  });

  it("formats a JSON workflow result for the execution history", () => {
    expect(formatN8nOutput('{"accepted":true}')).toBe('{\n  "accepted": true\n}');
  });

  it("explains when the n8n test listener is not active", () => {
    expect(n8nFailureMessage(404, true)).toContain("Listen for test event");
  });

  it("does not describe a production 404 as a test-listener problem", () => {
    expect(n8nFailureMessage(404, false)).toBe(
      "n8n returned HTTP 404. Check the webhook configuration and workflow response.",
    );
  });
});
