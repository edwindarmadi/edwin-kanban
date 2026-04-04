import { Board, BoardCallbacks } from "./types";
import { CSS } from "./constants";

function renderCardText(container: HTMLElement, text: string): void {
  container.empty();
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)(• )(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length / 2; // each indent level = 2 spaces
      const lineEl = container.createDiv({ cls: "ek-bullet-line" });
      lineEl.style.paddingLeft = indent * 16 + "px";
      const dot = lineEl.createSpan({ cls: "ek-bullet" });
      // Nested bullets get hollow circles, top-level get filled
      dot.classList.add(indent > 0 ? "ek-bullet-hollow" : "ek-bullet-filled");
      lineEl.createSpan({ text: bulletMatch[3] });
    } else {
      container.createDiv({ text: line || "\u200b" });
    }
  }
}

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
      const textEl = cardEl.createDiv({ cls: CSS.cardText });
      renderCardText(textEl, card.text);

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

        const autoResize = () => {
          textarea.style.height = "auto";
          textarea.style.height = textarea.scrollHeight + "px";
        };

        textEl.replaceWith(textarea);
        textarea.focus();
        textarea.select();
        autoResize();

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

        // Auto-convert "- " at line start to "• "
        textarea.addEventListener("input", () => {
          const pos = textarea.selectionStart;
          const val = textarea.value;
          const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
          const linePrefix = val.slice(lineStart, pos);
          if (/^(\s*)- $/.test(linePrefix)) {
            const indent = linePrefix.match(/^(\s*)/)?.[1] || "";
            textarea.value =
              val.slice(0, lineStart) + indent + "• " + val.slice(pos);
            textarea.selectionStart = textarea.selectionEnd =
              lineStart + indent.length + 2;
          }
          autoResize();
        });

        textarea.addEventListener("keydown", (ke) => {
          if (ke.key === "Enter" && !ke.shiftKey) {
            ke.preventDefault();
            textarea.blur();
            return;
          }
          if (ke.key === "Escape") {
            textarea.replaceWith(textEl);
            return;
          }

          // Shift+Enter on a bullet line: continue the bullet
          if (ke.key === "Enter" && ke.shiftKey) {
            const pos = textarea.selectionStart;
            const val = textarea.value;
            const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
            const lineEnd = val.indexOf("\n", pos);
            const currentLine = val.slice(
              lineStart,
              lineEnd === -1 ? undefined : lineEnd
            );
            const bulletMatch = currentLine.match(/^(\s*)(• )/);
            if (bulletMatch) {
              ke.preventDefault();
              const insert = "\n" + bulletMatch[1] + "• ";
              textarea.value =
                val.slice(0, pos) + insert + val.slice(pos);
              textarea.selectionStart = textarea.selectionEnd =
                pos + insert.length;
              autoResize();
            }
          }

          // Backspace on bullet line: unindent → remove bullet → normal
          if (ke.key === "Backspace") {
            const pos = textarea.selectionStart;
            const val = textarea.value;
            const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
            const lineEnd = val.indexOf("\n", pos);
            const currentLine = val.slice(
              lineStart,
              lineEnd === -1 ? undefined : lineEnd
            );
            const bulletMatch = currentLine.match(/^(\s*)(• )(.*)/);

            if (bulletMatch) {
              const indent = bulletMatch[1];
              const textAfter = bulletMatch[3];
              const cursorInLine = pos - lineStart;

              // Cursor is right after "• " (at the start of text content)
              if (cursorInLine === indent.length + 2) {
                ke.preventDefault();
                if (indent.length >= 2) {
                  // Unindent first
                  const newLine =
                    indent.slice(2) + "• " + textAfter;
                  textarea.value =
                    val.slice(0, lineStart) +
                    newLine +
                    val.slice(lineStart + currentLine.length);
                  textarea.selectionStart = textarea.selectionEnd =
                    pos - 2;
                } else {
                  // No indent left — remove the bullet entirely
                  textarea.value =
                    val.slice(0, lineStart) +
                    textAfter +
                    val.slice(lineStart + currentLine.length);
                  textarea.selectionStart = textarea.selectionEnd =
                    lineStart;
                }
                autoResize();
              }
            }
          }

          // Tab / Shift+Tab: indent / unindent bullet
          if (ke.key === "Tab") {
            const pos = textarea.selectionStart;
            const val = textarea.value;
            const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
            const lineEnd = val.indexOf("\n", pos);
            const currentLine = val.slice(
              lineStart,
              lineEnd === -1 ? undefined : lineEnd
            );

            if (/^\s*• /.test(currentLine)) {
              ke.preventDefault();
              if (ke.shiftKey) {
                // Unindent: remove up to 2 spaces
                const spaces = currentLine.match(/^(\s*)/)?.[1] || "";
                const remove = Math.min(2, spaces.length);
                if (remove > 0) {
                  textarea.value =
                    val.slice(0, lineStart) +
                    currentLine.slice(remove) +
                    val.slice(lineStart + currentLine.length);
                  textarea.selectionStart = textarea.selectionEnd =
                    pos - remove;
                }
              } else {
                // Indent: add 2 spaces
                textarea.value =
                  val.slice(0, lineStart) + "  " + val.slice(lineStart);
                textarea.selectionStart = textarea.selectionEnd = pos + 2;
              }
              autoResize();
            }
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
