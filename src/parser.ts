import { Board, BoardSettings, Column, Card, ChecklistItem } from "./types";

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

  const frontmatterMatch = body.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (frontmatterMatch) {
    body = body.slice(frontmatterMatch[0].length);
  }

  if (settingsMatch) {
    body = body.replace(settingsMatch[0], "");
  }

  // Split by H2 headings
  const sections = body.split(/^## /m);

  const colorMap = settings["column-colors"] ?? {};
  const wipMap = settings["wip-limits"] ?? {};

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const title = lines[0].trim();
    const cards: Card[] = [];

    let i = 1;
    while (i < lines.length) {
      const cardMatch = lines[i].match(/^- \[([ x])\] (.+)$/);
      if (cardMatch) {
        const card: Card = {
          checked: cardMatch[1] === "x",
          text: cardMatch[2],
          notes: "",
          checklist: [],
          dueDate: "",
          tags: [],
        };

        // Parse indented lines under this card
        i++;
        const noteLines: string[] = [];

        while (i < lines.length && /^  /.test(lines[i])) {
          const indentedLine = lines[i].substring(2); // remove 2-space indent

          // Checklist item
          const checkMatch = indentedLine.match(/^- \[([ x])\] (.+)$/);
          if (checkMatch) {
            card.checklist.push({
              checked: checkMatch[1] === "x",
              text: checkMatch[2],
            });
            i++;
            continue;
          }

          // Due date
          const dueMatch = indentedLine.match(/^due::\s*(.+)$/);
          if (dueMatch) {
            card.dueDate = dueMatch[1].trim();
            i++;
            continue;
          }

          // Tags
          const tagsMatch = indentedLine.match(/^tags::\s*(.+)$/);
          if (tagsMatch) {
            card.tags = tagsMatch[1]
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t);
            i++;
            continue;
          }

          // Everything else is notes
          noteLines.push(indentedLine);
          i++;
        }

        card.notes = noteLines.join("\n").trim();
        cards.push(card);
      } else {
        i++;
      }
    }

    columns.push({
      title,
      cards,
      color: colorMap[title] ?? "",
      wipLimit: wipMap[title] ?? 0,
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
      md += `- [${check}] ${card.text}\n`;

      // Due date
      if (card.dueDate) {
        md += `  due:: ${card.dueDate}\n`;
      }

      // Tags
      if (card.tags.length > 0) {
        md += `  tags:: ${card.tags.join(", ")}\n`;
      }

      // Notes
      if (card.notes) {
        for (const line of card.notes.split("\n")) {
          md += `  ${line}\n`;
        }
      }

      // Checklist
      for (const item of card.checklist) {
        const c = item.checked ? "x" : " ";
        md += `  - [${c}] ${item.text}\n`;
      }
    }
    md += "\n";
  }

  // Build settings
  const colorMap: Record<string, string> = {};
  const wipMap: Record<string, number> = {};

  for (const col of board.columns) {
    if (col.color) colorMap[col.title] = col.color;
    if (col.wipLimit > 0) wipMap[col.title] = col.wipLimit;
  }

  const settingsObj: BoardSettings = { "edwin-kanban": "board" };
  if (Object.keys(colorMap).length > 0) settingsObj["column-colors"] = colorMap;
  if (Object.keys(wipMap).length > 0) settingsObj["wip-limits"] = wipMap;

  md += `%% kanban:settings\n\`\`\`\n${JSON.stringify(settingsObj)}\n\`\`\`\n%%\n`;

  return md;
}
