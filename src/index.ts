// @thewinnerscircle/plugin-read-lite
// ======================================
// Low-cost page reading for ElizaOS characters.
// One action: READ_URL_LITE — $0.005/call via x402, no API key.
//
// Add to a character file:
//   "plugins": ["@thewinnerscircle/plugin-read-lite"]
// and set EVM_PRIVATE_KEY in the character settings / .env
// (a wallet holding a small USDC float on Base).

import type { Plugin } from "@elizaos/core";
import { readUrlLiteAction } from "./actions/readUrlLite.js";

export const readLitePlugin: Plugin = {
  name: "plugin-read-lite",
  description:
    "Read Lite — fetch any web page as clean Markdown for ElizaOS agents ($0.005/call via x402). " +
    "Returns url, title, excerpt, markdown and wordCount. The low-cost read tier for high-volume agent loops.",
  actions: [readUrlLiteAction],
  evaluators: [],
  providers: [],
} as Plugin;

export default readLitePlugin;
export { readUrlLiteAction } from "./actions/readUrlLite.js";
export {
  fetchPageMarkdown,
  parseReadMessage,
  READ_LITE_URL,
  type ReadLiteResult,
} from "./actions/readUrlLite.js";
