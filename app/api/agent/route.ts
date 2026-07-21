import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

// The DVSH catalog is embedded in this repo rather than fetched from a live
// storefront — read agent.md from the project root and serve it verbatim.
let cached: string | null = null;

async function loadAgentMd(): Promise<string> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "agent.md");
  cached = await readFile(filePath, "utf8");
  return cached;
}

export async function GET() {
  try {
    const text = await loadAgentMd();
    return new Response(text, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return new Response(message, { status: 500 });
  }
}
