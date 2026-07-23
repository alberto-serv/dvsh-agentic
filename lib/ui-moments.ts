import type { CheckoutOrder, UIMoment } from "./types";

// Structured card interactions travel through the conversation as ordinary user
// messages prefixed with this marker: `[selection] <humanLabel>\n<json>`. The
// human label renders as a compact chip; the JSON is the customer's choice,
// already applied client-side to their order/customer state.
export const SELECTION_PREFIX = "[selection] ";

export function buildSelectionMessage(
  update: Partial<CheckoutOrder["services"]>,
  humanLabel: string,
): string {
  return `${SELECTION_PREFIX}${humanLabel}\n${JSON.stringify(update)}`;
}

export function parseSelectionMessage(
  content: string,
): { humanLabel: string; update: Record<string, unknown> } | null {
  if (!content.startsWith(SELECTION_PREFIX)) return null;
  const rest = content.slice(SELECTION_PREFIX.length);
  const nl = rest.indexOf("\n");
  const humanLabel = nl === -1 ? rest : rest.slice(0, nl);
  const jsonStr = nl === -1 ? "" : rest.slice(nl + 1);
  let update: Record<string, unknown> = {};
  try {
    if (jsonStr) update = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    update = {};
  }
  return { humanLabel, update };
}

const UI_MOMENT_REGEX_GLOBAL =
  /<<<UI_MOMENT>>>\s*([\s\S]*?)\s*<<<END_UI_MOMENT>>>/g;

export function parseUIMoments(content: string): {
  text: string;
  uiMoments: UIMoment[];
} {
  const moments: UIMoment[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(UI_MOMENT_REGEX_GLOBAL);
  while ((match = regex.exec(content)) !== null) {
    try {
      moments.push(JSON.parse(match[1]) as UIMoment);
    } catch {
      // skip malformed block
    }
  }
  const text = content.replace(UI_MOMENT_REGEX_GLOBAL, "").trim();
  return { text, uiMoments: moments };
}

export function hasOpenUIMoment(content: string): boolean {
  const openIdx = content.lastIndexOf("<<<UI_MOMENT>>>");
  if (openIdx === -1) return false;
  const closeIdx = content.indexOf("<<<END_UI_MOMENT>>>", openIdx);
  return closeIdx === -1;
}

export function textBeforeOpenMoment(content: string): string {
  const openIdx = content.indexOf("<<<UI_MOMENT>>>");
  return openIdx === -1 ? content : content.slice(0, openIdx).trim();
}
