import { Board, BoardSettings, Column, Card } from "./types";

let cardIdCounter = 0;
export function nextCardId(): string {
  return `c${cardIdCounter++}`;
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
