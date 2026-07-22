import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

let cachedSystemTemplate: string | null = null;

async function loadSystemPromptTemplate(): Promise<string> {
  if (cachedSystemTemplate) return cachedSystemTemplate;
  const filePath = path.join(process.cwd(), "AGENT_SYSTEM_PROMPT.md");
  cachedSystemTemplate = await readFile(filePath, "utf8");
  return cachedSystemTemplate;
}

function buildSystemPrompt(template: string, agentMdRaw: string): string {
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${template}\n\n<context>\nToday's date is ${today} (America/Chicago).\n</context>\n\n<agent_data>\n${agentMdRaw}\n</agent_data>\n`;
}

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  agentMdRaw: string;
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.messages?.length || typeof body.agentMdRaw !== "string") {
    return new Response("Missing messages or agentMdRaw", { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Server missing ANTHROPIC_API_KEY", { status: 500 });
  }

  const template = await loadSystemPromptTemplate();
  const system = buildSystemPrompt(template, body.agentMdRaw);

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: body.messages,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n\n[stream error: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
