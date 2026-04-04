import { Board, BoardCallbacks } from "./types";
import { CSS } from "./constants";

export function renderBoard(
  board: Board,
  container: HTMLElement,
  callbacks: BoardCallbacks
): void {
  container.empty();

  const boardEl = container.createDiv({ cls: CSS.board });

  board.columns.forEach((col, colIndex) => {
    const columnEl = boardEl.createDiv({ cls: CSS.column });

    // Column header with color strip
    const headerEl = columnEl.createDiv({ cls: CSS.columnHeader });
    if (col.color) {
      headerEl.style.backgroundColor = col.color;
    }

    // Column title
    headerEl.createEl("h3", { cls: CSS.columnTitle, text: col.title });

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
      const value = (e.target as HTMLInputElement).value;
      callbacks.onColumnColorChange(colIndex, value);
    });

    // Card list
    const cardListEl = columnEl.createDiv({ cls: CSS.cardList });
    cardListEl.dataset.colIndex = String(colIndex);

    col.cards.forEach((card, cardIndex) => {
      const cardEl = cardListEl.createDiv({ cls: CSS.card });
      cardEl.draggable = true;
      cardEl.dataset.colIndex = String(colIndex);
      cardEl.dataset.cardIndex = String(cardIndex);

      // Card text (click to edit)
      const textEl = cardEl.createSpan({ cls: CSS.cardText, text: card.text });

      // Delete button (visible on hover via CSS)
      const deleteEl = cardEl.createSpan({ cls: CSS.cardDelete, text: "×" });
      deleteEl.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.onCardDelete(colIndex, cardIndex);
      });

      // Inline editing
      textEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const textarea = document.createElement("textarea");
        textarea.className = CSS.cardEdit;
        textarea.value = card.text;
        textarea.rows = Math.max(1, Math.ceil(card.text.length / 30));

        textEl.replaceWith(textarea);
        textarea.focus();
        textarea.select();

        const save = () => {
          const newText = textarea.value.trim();
          if (newText && newText !== card.text) {
            callbacks.onCardEdit(colIndex, cardIndex, newText);
          } else {
            // Restore original text if empty or unchanged
            textarea.replaceWith(textEl);
          }
        };

        textarea.addEventListener("blur", save);
        textarea.addEventListener("keydown", (ke) => {
          if (ke.key === "Enter" && !ke.shiftKey) {
            ke.preventDefault();
            textarea.blur();
          }
          if (ke.key === "Escape") {
            textarea.replaceWith(textEl);
          }
        });
      });
    });

    // Add card button
    const addBtn = columnEl.createEl("button", {
      cls: CSS.addCard,
      text: "+ Add card",
    });
    addBtn.addEventListener("click", () => {
      callbacks.onCardAdd(colIndex);
    });
  });
}
