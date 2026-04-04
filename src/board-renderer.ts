import { Board, BoardCallbacks } from "./types";
import { CSS } from "./constants";

function getDueStatus(dueDate: string): "overdue" | "soon" | "" {
  if (!dueDate) return "";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function renderBoard(
  board: Board,
  container: HTMLElement,
  callbacks: BoardCallbacks
): void {
  container.empty();

  const boardEl = container.createDiv({ cls: CSS.board });

  board.columns.forEach((col, colIndex) => {
    const isOverWip =
      col.wipLimit > 0 && col.cards.length > col.wipLimit;

    const columnEl = boardEl.createDiv({
      cls: `${CSS.column}${isOverWip ? ` ${CSS.columnWipOver}` : ""}`,
    });

    // Column header
    const headerEl = columnEl.createDiv({ cls: CSS.columnHeader });
    if (col.color) {
      headerEl.style.backgroundColor = col.color;
    }

    // Title + count
    const titleArea = headerEl.createDiv({ cls: CSS.columnTitle });
    titleArea.createSpan({ text: col.title });

    const countText =
      col.wipLimit > 0
        ? `${col.cards.length}/${col.wipLimit}`
        : `${col.cards.length}`;
    titleArea.createSpan({ cls: CSS.columnCount, text: countText });

    // WIP limit setter (click count to set)
    titleArea
      .querySelector(`.${CSS.columnCount}`)!
      .addEventListener("click", (e) => {
        e.stopPropagation();
        const current = col.wipLimit || "";
        const input = prompt("Set WIP limit (0 or empty = no limit):", String(current));
        if (input !== null) {
          const limit = parseInt(input) || 0;
          callbacks.onWipLimitChange(colIndex, limit);
        }
      });

    // Color picker dot
    const colorWrapper = headerEl.createDiv({
      cls: CSS.colorDot,
      attr: { "aria-label": "Change column color" },
    });
    if (col.color) {
      colorWrapper.style.backgroundColor = col.color;
    }

    const colorInput = colorWrapper.createEl("input", {
      cls: CSS.colorInput,
      type: "color",
      value: col.color || "#e3f2fd",
    });
    colorWrapper.addEventListener("click", () => colorInput.click());
    colorInput.addEventListener("input", (e) => {
      callbacks.onColumnColorChange(
        colIndex,
        (e.target as HTMLInputElement).value
      );
    });

    // Card list
    const cardListEl = columnEl.createDiv({ cls: CSS.cardList });
    cardListEl.dataset.colIndex = String(colIndex);

    col.cards.forEach((card, cardIndex) => {
      const cardEl = cardListEl.createDiv({ cls: CSS.card });
      cardEl.draggable = true;
      cardEl.dataset.colIndex = String(colIndex);
      cardEl.dataset.cardIndex = String(cardIndex);

      // Click card to open detail panel
      cardEl.addEventListener("click", () => {
        callbacks.onCardOpen(colIndex, cardIndex);
      });

      // Card content area
      const contentArea = cardEl.createDiv();

      // Card text
      contentArea.createSpan({ cls: CSS.cardText, text: card.text });

      // Badges row (due date + tags)
      const hasBadges =
        card.dueDate || card.tags.length > 0 || card.checklist.length > 0;
      if (hasBadges) {
        const badgesEl = contentArea.createDiv({ cls: CSS.cardBadges });

        // Due date badge
        if (card.dueDate) {
          const status = getDueStatus(card.dueDate);
          let badgeCls = CSS.cardDueBadge;
          if (status === "overdue") badgeCls += ` ${CSS.cardDueOverdue}`;
          if (status === "soon") badgeCls += ` ${CSS.cardDueSoon}`;

          badgesEl.createSpan({
            cls: badgeCls,
            text: formatDate(card.dueDate),
          });
        }

        // Checklist progress
        if (card.checklist.length > 0) {
          const done = card.checklist.filter((c) => c.checked).length;
          badgesEl.createSpan({
            cls: CSS.cardDueBadge,
            text: `${done}/${card.checklist.length}`,
          });
        }

        // Tags
        for (const tag of card.tags) {
          badgesEl.createSpan({ cls: CSS.cardTag, text: tag });
        }
      }

      // Delete button
      const deleteEl = cardEl.createSpan({ cls: CSS.cardDelete, text: "×" });
      deleteEl.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onCardDelete(colIndex, cardIndex);
      });
    });

    // Add card button
    const addBtn = columnEl.createEl("button", {
      cls: CSS.addCard,
      text: "+ Add card",
    });
    addBtn.addEventListener("click", () => callbacks.onCardAdd(colIndex));

    // Archive button (only on columns named "Done")
    if (col.title.toLowerCase() === "done" && col.cards.length > 0) {
      const archiveBtn = columnEl.createEl("button", {
        cls: CSS.archiveBtn,
        text: "Archive all",
      });
      archiveBtn.addEventListener("click", () =>
        callbacks.onArchiveDone(colIndex)
      );
    }
  });
}
