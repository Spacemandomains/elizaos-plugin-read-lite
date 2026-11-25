// READ_URL_LITE — ElizaOS action for Read Lite (WebReader Lite)
// ===============================================================
// The low-cost read tier for agent loops: POST a URL to Read Lite
// ($0.005/call, USDC on Base via x402) and get back the page as
// clean Markdown — url, title, excerpt, markdown, wordCount.
// Nothing else: no search, no synthesis. Built for high-volume
// loops that read many pages and only need the text.
//
// Payment is handled inside the handler with @x402/fetch. The agent's
// EVM key comes from the character settings (EVM_PRIVATE_KEY) or the
// environment. Keep only a small USDC float in that wallet: each
// read costs exactly $0.005, and a failed read (HTTP 502 — the page
// could not be extracted) is never settled / never charged.

import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
} from "@elizaos/core";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";

export const READ_LITE_URL = "https://x402-web-reader.vercel.app/api/read-lite";

export interface ReadLiteResult {
  url: string;
  title: string;
  excerpt: string | null;
  markdown: string;
  wordCount: number;
}

/**
 * Convenience helper: pay $0.005 via x402 and fetch one page as
 * clean Markdown. Throws on HTTP errors (a 502 means the read
 * failed and was never charged).
 */
export async function fetchPageMarkdown(
  url: string,
  privateKey: string,
): Promise<ReadLiteResult> {
  const signer = privateKeyToAccount(privateKey as `0x${string}`);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const res = await fetchWithPayment(READ_LITE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Read Lite HTTP ${res.status}`);
  return res.json() as Promise<ReadLiteResult>;
}

const URL_RE = /https?:\/\/[^\s)"'\]]+/i;

/**
 * Parse a chat message into a read input: the first http(s) URL in
 * the text, with trailing sentence punctuation stripped.
 */
export function parseReadMessage(text: string): { url?: string } {
  const raw = text.match(URL_RE)?.[0];
  if (!raw) return {};
  return { url: raw.replace(/[.,;:!?]+$/, "") };
}

export const readUrlLiteAction: Action = {
  name: "READ_URL_LITE",
  similes: ["READ_LITE", "FETCH_PAGE", "READ_URL", "SCRAPE_PAGE"],
  description:
    "Fetch a web page and return it as clean Markdown. Costs $0.005 " +
    "via x402. Send a URL; returns the final url, title, excerpt, " +
    "markdown and wordCount. Use whenever the agent needs the text " +
    "of a page — articles, docs, listings — especially in " +
    "high-volume reading loops where cost per read matters.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = (message.content?.text ?? "").toLowerCase();
    return /https?:\/\/\S+/.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ) => {
    const text = message.content?.text ?? "";
    const { url } = parseReadMessage(text);
    if (!url) {
      await callback?.({
        text: "Give me a page URL (e.g. \"read https://example.com/article\") and I'll fetch it as clean Markdown for $0.005.",
      });
      return { success: false, error: "no_url" } as any;
    }

    const privateKey =
      (runtime.getSetting?.("EVM_PRIVATE_KEY") as string) || process.env.EVM_PRIVATE_KEY;
    if (!privateKey) {
      await callback?.({
        text: "Read Lite is not configured: set EVM_PRIVATE_KEY (a wallet with a small USDC float on Base) in the character settings.",
      });
      return { success: false, error: "no_key" } as any;
    }

    try {
      const page = await fetchPageMarkdown(url, privateKey);
      const reply =
        `Read ${page.url} — "${page.title}" (${page.wordCount} words)\n\n` +
        page.markdown;
      await callback?.({ text: reply, actions: ["READ_URL_LITE"] });
      return { success: true, data: page } as any;
    } catch (err) {
      await callback?.({
        text: "I couldn't read that page — the read failed and a failed read is never charged. Try again shortly, or check the URL.",
      });
      return { success: false, error: String(err) } as any;
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Read https://example.com/article and summarize it" },
      },
      {
        name: "agent",
        content: {
          text: "Fetching that page as Markdown now.",
          actions: ["READ_URL_LITE"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "What's on https://blog.example.org/release-notes ?" },
      },
      {
        name: "agent",
        content: {
          text: "Reading that page for you — one moment.",
          actions: ["READ_URL_LITE"],
        },
      },
    ],
  ] as any,
};
