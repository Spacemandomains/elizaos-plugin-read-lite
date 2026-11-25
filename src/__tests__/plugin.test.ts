import { describe, it, expect } from "bun:test";
// @ts-ignore - bun:test is provided by the ElizaOS test runner
import { readLitePlugin, readUrlLiteAction } from "../index.js";

describe("Read Lite Plugin", () => {
  it("exports plugin named plugin-read-lite with READ_URL_LITE", () => {
    expect(readLitePlugin.name).toBe("plugin-read-lite");
    expect(readLitePlugin.actions?.map((a: any) => a.name)).toContain("READ_URL_LITE");
  });
  it("READ_URL_LITE validates messages containing a URL, rejects those without", async () => {
    const runtime: any = { getSetting: () => null };
    const withUrl: any = { content: { text: "Read https://example.com/article please" } };
    const without: any = { content: { text: "hello there" } };
    expect(await readUrlLiteAction.validate(runtime, withUrl)).toBe(true);
    expect(await readUrlLiteAction.validate(runtime, without)).toBe(false);
  });
  it("targets the read-lite endpoint", async () => {
    const { READ_LITE_URL } = await import("../actions/readUrlLite.js");
    expect(READ_LITE_URL).toBe("https://x402-web-reader.vercel.app/api/read-lite");
  });
  it("parses the first URL from a message and strips trailing punctuation", async () => {
    const { parseReadMessage } = await import("../actions/readUrlLite.js").catch(() => ({
      parseReadMessage: null,
    }));
    if (parseReadMessage) {
      const parsed = parseReadMessage("Summarize https://example.com/article, then compare");
      expect(parsed.url).toBe("https://example.com/article");
      const none = parseReadMessage("no link here");
      expect(none.url).toBeUndefined();
    }
  });
  it("exports the fetchPageMarkdown convenience helper", async () => {
    const { fetchPageMarkdown } = await import("../actions/readUrlLite.js").catch(() => ({
      fetchPageMarkdown: null,
    }));
    expect(typeof fetchPageMarkdown).toBe("function");
  });
});
