import { describe, expect, it } from "vitest";
import { readLimitedText } from "@/pages/api/csp-report";

describe("CSP report body limits", () => {
  it("reads a small body exactly", async () => {
    const request = new Request("https://leomath.cn/api/csp-report", { method: "POST", body: '{"csp-report":{}}' });
    expect(await readLimitedText(request, 1024)).toBe('{"csp-report":{}}');
  });

  it("rejects a large streamed body instead of buffering it", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new Uint8Array(4096);
        for (let i = 0; i < 4; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    const request = new Request("https://leomath.cn/api/csp-report", { method: "POST", body: stream, duplex: "half" } as RequestInit & { duplex: "half" });
    await expect(readLimitedText(request, 1024)).rejects.toThrow("request body too large");
  });
});
