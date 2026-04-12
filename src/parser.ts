import { Board, BoardSettings, Column, Card } from "./types";

let cardIdCounter = 0;
export function nextCardId(): string {
  return `c${cardIdCounter++}`;
}

// ── Tag helpers ──
//
// Single source of truth for what counts as a tag body. Used by both
// splitTrailingTags() (for chip extraction) and the menu-input validator.
// Rules: only [A-Za-z0-9_-/], must contain at least one non-numeric char
// (so #1 / #42 are rejected; #fff and #urgent are accepted).
export const TAG_BODY_RE = /^[A-Za-z0-9_\-\/]*[A-Za-z_\-\/][A-Za-z0-9_\-\/]*$/;

// Internal: walks trailing #tag tokens from the end of `segment` without
// applying any refusal-to-strip safety net. Returns the tags found AND the
// cursor position where the display portion ends (before the first stripped
// whitespace). Used by both splitTrailingTags() and findTrailingTagsRaw().
function walkTrailingTags(segment: string): { tags: string[]; displayEnd: number } {
  const tags: string[] = [];
  let cursor = segment.length;
  while (true) {
    const slice = segment.slice(0, cursor);
    const m = slice.match(/(^|\s)#([^\s#]+)$/);
    if (!m) break;
    const tagBody = m[2];
    if (!TAG_BODY_RE.test(tagBody)) break;
    const matchStart = slice.length - m[0].length + m[1].length; // start of `#`
    tags.unshift(tagBody);
    cursor = matchStart;
    while (cursor > 0 && /\s/.test(segment[cursor - 1])) cursor--;
  }
  return { tags, displayEnd: cursor };
}

// Returns trailing tags from a segment WITHOUT the refusal-to-strip safety net.
// Used for duplicate-detection on the title line, so a title like `#urgent`
// still reports `urgent` as an existing tag (which splitTrailingTags would
// suppress to keep the visible title from collapsing to empty).
export function findTrailingTagsRaw(segment: string): string[] {
  return walkTrailingTags(segment).tags;
}

// Strict trailing-tag rule for DISPLAY purposes. Accepts EITHER a full plain
// line OR a bullet content segment (the text after `• `) — callers strip the
// bullet prefix before calling. Returns { display, tags } where:
//   display = the segment with trailing tags removed and trailing whitespace trimmed
//   tags    = ordered array of tag strings (without #), case-preserved
// Refusal-to-strip safety net: if stripping would leave display empty
// or whitespace-only, returns the original segment with no tags. (Use
// findTrailingTagsRaw() if you need the tags regardless of that net.)
export function splitTrailingTags(segment: string): { display: string; tags: string[] } {
  const { tags, displayEnd } = walkTrailingTags(segment);
  if (tags.length === 0) return { display: segment, tags: [] };
  const display = segment.slice(0, displayEnd).replace(/\s+$/, "");
  if (display.length === 0) return { display: segment, tags: [] };
  return { display, tags };
}

// Returns all trailing tags from all lines of card.text, de-duped
// case-insensitively, preserving first-occurrence order and original case.
// For bullet lines this calls splitTrailingTags on the post-bullet content;
// for plain lines on the whole line.
export function extractCardTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const bulletMatch = line.match(/^(\s*)(• )(.*)$/);
    const segment = bulletMatch ? bulletMatch[3] : line;
    const { tags } = splitTrailingTags(segment);
    for (const t of tags) {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    }
  }
  return out;
}

// Append a tag to the title line (line 0) of a card's text. No-op if the
// tag is already a trailing tag on line 0 (case-insensitive). Caller must
// validate `tag` against TAG_BODY_RE first.
export function appendTagToTitle(text: string, tag: string): string {
  const lines = text.split("\n");
  const titleLine = lines[0] ?? "";
  // Use the raw walker (no safety net) so a title that consists only of tags
  // — e.g. `#urgent` — still reports `urgent` as already present.
  const existing = findTrailingTagsRaw(titleLine);
  if (existing.some((t) => t.toLowerCase() === tag.toLowerCase())) {
    return text;
  }
  // Append with a single space separator.
  const sep = titleLine.length === 0 || /\s$/.test(titleLine) ? "" : " ";
  lines[0] = `${titleLine}${sep}#${tag}`;
  return lines.join("\n");
}

export function parseMarkdown(raw: string): Board {
  const columns: Column[] = [];
  let settings: BoardSettings = { "edwin-kanban": "board" };

  // Extract settings block from bottom of file
  const settingsMatch = raw.match(
    /%%\s*kanban:settings\s*\n```\n([\s\S]*?)\n```\s*\n%%/
  );
  if (settingsMatch) {
    try {
      settings = JSON.parse(settingsMatch[1]);
    } catch {
      // Keep defaults if settings are malformed
    }
  }

  // Remove frontmatter and settings block to get the body
  let body = raw;

  // Remove frontmatter
  const frontmatterMatch = body.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (frontmatterMatch) {
    body = body.slice(frontmatterMatch[0].length);
  }

  // Remove settings block
  if (settingsMatch) {
    body = body.replace(settingsMatch[0], "");
  }

  // Split by H2 headings
  const sections = body.split(/^## /m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const title = lines[0].trim();
    const cards: Card[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cardMatch = lines[i].match(/^- \[([ x])\] (.+)$/);
      if (cardMatch) {
        let text = cardMatch[2];
        // Collect indented continuation lines
        while (i + 1 < lines.length && lines[i + 1].match(/^  /)) {
          i++;
          text += "\n" + lines[i].slice(2);
        }
        cards.push({
          id: nextCardId(),
          checked: cardMatch[1] === "x",
          text,
        });
      }
    }

    const colorMap = settings["column-colors"] ?? {};
    columns.push({
      title,
      cards,
      color: colorMap[title] ?? "",
    });
  }

  return { columns, settings };
}

export function serializeBoard(board: Board): string {
  let md = "---\nedwin-kanban: board\n---\n\n";

  for (const col of board.columns) {
    md += `## ${col.title}\n\n`;
    for (const card of col.cards) {
      const check = card.checked ? "x" : " ";
      const lines = card.text.split("\n");
      md += `- [${check}] ${lines[0]}\n`;
      for (let i = 1; i < lines.length; i++) {
        md += `  ${lines[i]}\n`;
      }
    }
    md += "\n";
  }

  // Build settings with column colors
  const colorMap: Record<string, string> = {};
  for (const col of board.columns) {
    if (col.color) {
      colorMap[col.title] = col.color;
    }
  }

  const settingsObj: BoardSettings = {
    "edwin-kanban": "board",
  };
  if (Object.keys(colorMap).length > 0) {
    settingsObj["column-colors"] = colorMap;
  }

  md += `%% kanban:settings\n\`\`\`\n${JSON.stringify(settingsObj)}\n\`\`\`\n%%\n`;

  return md;
}
