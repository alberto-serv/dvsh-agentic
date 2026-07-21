import type { UIMoment } from "./types";

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
