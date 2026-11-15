/**
 * Offline replay of recorded live MCP sessions (lib/gis/fixtures/live/*.json, made by scripts/record.mjs).
 * Lets tests run liveLookup() against real server responses with no network and no key:
 *   import rec from "@/lib/gis/fixtures/live/613-e-broadway.json";
 *   const lookup = await liveLookup(replayCaller(rec), rec.address);
 */
import type { ToolCaller } from "./client";
import { toolPayload } from "./parse";

export interface RecordedCall {
  tool: string;
  args: Record<string, unknown>;
  ms?: number;
  result?: unknown;
  error?: string;
}
export interface Recording {
  recordedAt?: string;
  address: string;
  calls: RecordedCall[];
}

export function replayCaller(rec: Recording): ToolCaller {
  return {
    async call(name: string) {
      const c = rec.calls.find((x) => x.tool === name);
      if (!c) throw new Error(`no recorded call for ${name}`);
      if (c.error) throw new Error(c.error);
      return toolPayload(c.result);
    },
    async close() {},
  };
}
