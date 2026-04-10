import { Platform } from "obsidian";
import { CSS } from "./constants";
import { enableDragDrop } from "./drag-drop";
import { Board, BoardCallbacks, Card, Column } from "./types";

interface ColumnDom {
  rootEl: HTMLDivElement;
  headerEl: HTMLDivElement;
  countEl: HTMLSpanElement;
  colorButtonEl: HTMLButtonElement;
  colorInputEl: HTMLInputElement;
  cardListEl: HTMLDivElement;
}

const DEFAULT_COLUMN_COLOR = "#8fb5ff";

function renderCardText(container: HTMLElement, text: string): void {
  container.empty();

  for (const line of text.split("\n")) {
    const bulletMatch = line.match(/^(\s*)(• )(.*)$/);
    if (!bulletMatch) {
      container.createDiv({ text: line || "\u200b" });
      continue;
    }

    const indent = Math.floor(bulletMatch[1].length / 2);
    const lineEl = container.createDiv({ cls: "ek-bullet-line" });
    lineEl.style.setProperty("--ek-bullet-indent", String(indent));

    const dot = lineEl.createSpan({ cls: "ek-bullet" });
    dot.classList.add(indent > 0 ? "ek-bullet-hollow" : "ek-bullet-filled");
    lineEl.createSpan({ text: bulletMatch[3] });
  }
}

export class KanbanBoardController {
  private board: Board | null = null;
  private readonly scrollerEl: HTMLDivElement;
  private readonly boardEl: HTMLDivElement;
  private cleanupDragDrop: (() => void) | null = null;
  private columns: ColumnDom[] = [];
  private reduceMotion = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: BoardCallbacks
  ) {
    this.container.empty();
    this.container.addClass(CSS.view);
    this.scrollerEl = this.container.createDiv({ cls: CSS.boardScroller });
    this.boardEl = this.scrollerEl.createDiv({ cls: CSS.board });
  }

  destroy(): void {
    this.cleanupDragDrop?.();
    this.cleanupDragDrop = null;
    this.columns = [];
    this.container.empty();
  }

  setPreferences(reduceMotion: boolean): void {
    this.reduceMotion = reduceMotion;
    this.container.toggleClass(CSS.reduceMotion, reduceMotion);
  }

  setBoard(board: Board): void {
    const scrollLeft = this.scrollerEl.scrollLeft;
    const scrollTop = this.scrollerEl.scrollTop;

    this.board = board;
    this.columns = [];
    this.cleanupDragDrop?.();
    this.boardEl.empty();

    if (Platform.isMobile) {
      this.container.addClass(CSS.mobile);
    } else {
      this.container.removeClass(CSS.mobile);
    }

    if (board.columns.length === 0) {
      this.boardEl.createDiv({
        cls: CSS.emptyState,
        text: "This board does not have any columns yet.",
      });
      return;
    }

    board.columns.forEach((column, columnIndex) => {
      const dom = this.createColumn(column, columnIndex);
      this.columns.push(dom);
      this.renderColumn(columnIndex);
    });

    this.cleanupDragDrop = enableDragDrop(this.boardEl, (fromCol, fromIdx, toCol, toIdx) => {
      this.callbacks.onCardReorder(fromCol, fromIdx, toCol, toIdx);
    });

    this.scrollerEl.scrollLeft = scrollLeft;
    this.scrollerEl.scrollTop = scrollTop;
  }

  updateCard(columnIndex: number): void {
    this.renderColumn(columnIndex);
  }

  addCard(columnIndex: number): void {
    this.renderColumn(columnIndex);
  }

  removeCard(columnIndex: number): void {
    this.renderColumn(columnIndex);
  }

  moveCard(fromColumnIndex: number, toColumnIndex: number): void {
    this.renderColumn(fromColumnIndex);
    if (toColumnIndex !== fromColumnIndex) {
      this.renderColumn(toColumnIndex);
    }
  }

  updateColumnColor(columnIndex: number): void {
    if (!this.board) return;
    const dom = this.columns[columnIndex];
    if (!dom) return;

    const column = this.board.columns[columnIndex];
    const color = column.color || DEFAULT_COLUMN_COLOR;

    dom.rootEl.style.setProperty("--ek-column-accent", color);
    dom.colorButtonEl.style.setProperty("--ek-column-accent", color);
    dom.colorInputEl.value = color;
  }

  focusCardEditor(columnIndex: number, cardIndex: number): void {
    const cardEl = this.getCardEl(columnIndex, cardIndex);
    if (!cardEl) return;

    cardEl.scrollIntoView({
      behavior: this.reduceMotion ? "auto" : "smooth",
      block: Platform.isMobile ? "center" : "nearest",
      inline: "nearest",
    });

    this.startEditing(columnIndex, cardIndex);
  }

  private createColumn(column: Column, columnIndex: number): ColumnDom {
    const rootEl = this.boardEl.createDiv({ cls: CSS.column });
    rootEl.dataset.colIndex = String(columnIndex);

    const surfaceEl = rootEl.createDiv({ cls: CSS.columnSurface });
    const headerEl = surfaceEl.createDiv({ cls: CSS.columnHeader });
    headerEl.createEl("h3", { cls: CSS.columnTitle, text: column.title });
    const countEl = headerEl.createSpan({ cls: CSS.columnMeta });

    const colorButtonEl = headerEl.createEl("button", {
      cls: CSS.colorDot,
      attr: {
        type: "button",
        "aria-label": `Change color for ${column.title}`,
      },
    });
    const colorInputEl = colorButtonEl.createEl("input", {
      cls: CSS.colorInput,
      type: "color",
      value: column.color || DEFAULT_COLUMN_COLOR,
    });
    colorButtonEl.addEventListener("click", () => colorInputEl.click());
    colorInputEl.addEventListener("input", (event) => {
      this.callbacks.onColumnColorChange(
        columnIndex,
        (event.target as HTMLInputElement).value
      );
    });

    const cardListEl = surfaceEl.createDiv({ cls: CSS.cardList });
    cardListEl.dataset.colIndex = String(columnIndex);

    const addCardButton = surfaceEl.createEl("button", {
      cls: CSS.addCard,
      text: "+ Add card",
      attr: {
        type: "button",
        "aria-label": `Add card to ${column.title}`,
      },
    });
    addCardButton.addEventListener("click", () => {
      this.callbacks.onCardAdd(columnIndex);
    });

    return {
      rootEl,
      headerEl,
      countEl,
      colorButtonEl,
      colorInputEl,
      cardListEl,
    };
  }

  private renderColumn(columnIndex: number): void {
    if (!this.board) return;

    const column = this.board.columns[columnIndex];
    const dom = this.columns[columnIndex];
    if (!column || !dom) return;

    this.updateColumnColor(columnIndex);
    dom.countEl.setText(this.getCardCountLabel(column.cards.length));
    dom.cardListEl.empty();

    column.cards.forEach((card, cardIndex) => {
      this.renderCard(dom.cardListEl, columnIndex, cardIndex, card);
    });
  }

  private renderCard(
    cardListEl: HTMLElement,
    columnIndex: number,
    cardIndex: number,
    card: Card
  ): void {
    const cardEl = cardListEl.createDiv({ cls: CSS.card });
    cardEl.dataset.colIndex = String(columnIndex);
    cardEl.dataset.cardIndex = String(cardIndex);
    cardEl.draggable = true;
    cardEl.toggleClass(CSS.cardChecked, card.checked);

    const bodyEl = cardEl.createDiv({ cls: CSS.cardBody });
    const checkboxEl = bodyEl.createEl("button", {
      cls: CSS.cardCheckbox,
      attr: {
        type: "button",
        "aria-label": card.checked ? "Mark card as incomplete" : "Mark card as complete",
        "aria-pressed": String(card.checked),
      },
    });
    checkboxEl.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onCardToggle(columnIndex, cardIndex, !card.checked);
    });

    const textEl = bodyEl.createDiv({ cls: CSS.cardText });
    renderCardText(textEl, card.text);
    textEl.addEventListener("click", (event) => {
      event.stopPropagation();
      this.startEditing(columnIndex, cardIndex);
    });

    const chromeEl = cardEl.createDiv({ cls: CSS.cardChrome });
    const deleteEl = chromeEl.createEl("button", {
      cls: CSS.cardDelete,
      text: "×",
      attr: {
        type: "button",
        "aria-label": `Delete card ${cardIndex + 1} from ${this.board?.columns[columnIndex].title ?? "column"}`,
      },
    });
    deleteEl.addEventListener("click", (event) => {
      event.stopPropagation();
      this.callbacks.onCardDelete(columnIndex, cardIndex);
    });
  }

  private startEditing(columnIndex: number, cardIndex: number): void {
    if (!this.board) return;

    const card = this.board.columns[columnIndex]?.cards[cardIndex];
    const cardEl = this.getCardEl(columnIndex, cardIndex);
    const textEl = cardEl?.querySelector(`.${CSS.cardText}`) as HTMLDivElement | null;

    if (!card || !cardEl || !textEl) return;
    if (cardEl.querySelector(`.${CSS.cardEdit}`)) return;

    const doc = cardEl.ownerDocument;
    const textarea = doc.createElement("textarea");
    textarea.className = CSS.cardEdit;
    textarea.value = card.text;

    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    let finished = false;
    let overlay: HTMLDivElement | null = null;

    const restoreInlineText = () => {
      if (!overlay && textarea.parentElement) {
        textarea.replaceWith(textEl);
      }
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      cardEl.removeClass(CSS.editing);
    };

    const commit = () => {
      if (finished) return;
      finished = true;

      const nextText = textarea.value.trim();
      restoreInlineText();

      if (nextText && nextText !== card.text) {
        this.callbacks.onCardEdit(columnIndex, cardIndex, nextText);
      }
    };

    const cancel = () => {
      if (finished) return;
      finished = true;
      restoreInlineText();
    };

    if (Platform.isMobile) {
      overlay = doc.createElement("div");
      overlay.className = CSS.mobileEditor;
      overlay.appendChild(textarea);
      doc.body.appendChild(overlay);
      cardEl.addClass(CSS.editing);
    } else {
      textEl.replaceWith(textarea);
    }

    textarea.addEventListener("input", () => {
      const pos = textarea.selectionStart;
      const lineStart = textarea.value.lastIndexOf("\n", pos - 1) + 1;
      const linePrefix = textarea.value.slice(lineStart, pos);

      if (/^(\s*)- $/.test(linePrefix)) {
        const indent = linePrefix.match(/^(\s*)/)?.[1] || "";
        textarea.value =
          textarea.value.slice(0, lineStart) + indent + "• " + textarea.value.slice(pos);
        textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length + 2;
      }

      autoResize();
    });

    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        textarea.blur();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
        return;
      }

      if (event.key === "Enter" && event.shiftKey) {
        const pos = textarea.selectionStart;
        const lineStart = textarea.value.lastIndexOf("\n", pos - 1) + 1;
        const lineEnd = textarea.value.indexOf("\n", pos);
        const currentLine = textarea.value.slice(
          lineStart,
          lineEnd === -1 ? undefined : lineEnd
        );
        const bulletMatch = currentLine.match(/^(\s*)(• )/);

        if (bulletMatch) {
          event.preventDefault();
          const insert = `\n${bulletMatch[1]}• `;
          textarea.value = textarea.value.slice(0, pos) + insert + textarea.value.slice(pos);
          textarea.selectionStart = textarea.selectionEnd = pos + insert.length;
          autoResize();
        }
      }

      if (event.key === "Backspace") {
        const pos = textarea.selectionStart;
        const lineStart = textarea.value.lastIndexOf("\n", pos - 1) + 1;
        const lineEnd = textarea.value.indexOf("\n", pos);
        const currentLine = textarea.value.slice(
          lineStart,
          lineEnd === -1 ? undefined : lineEnd
        );
        const bulletMatch = currentLine.match(/^(\s*)(• )(.*)/);

        if (!bulletMatch) return;

        const indent = bulletMatch[1];
        const textAfter = bulletMatch[3];
        const cursorInLine = pos - lineStart;

        if (cursorInLine === indent.length + 2) {
          event.preventDefault();
          if (indent.length >= 2) {
            const nextLine = `${indent.slice(2)}• ${textAfter}`;
            textarea.value =
              textarea.value.slice(0, lineStart) +
              nextLine +
              textarea.value.slice(lineStart + currentLine.length);
            textarea.selectionStart = textarea.selectionEnd = pos - 2;
          } else {
            textarea.value =
              textarea.value.slice(0, lineStart) +
              textAfter +
              textarea.value.slice(lineStart + currentLine.length);
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }
          autoResize();
        }
      }

      if (event.key === "Tab") {
        const pos = textarea.selectionStart;
        const lineStart = textarea.value.lastIndexOf("\n", pos - 1) + 1;
        const lineEnd = textarea.value.indexOf("\n", pos);
        const currentLine = textarea.value.slice(
          lineStart,
          lineEnd === -1 ? undefined : lineEnd
        );

        if (!/^\s*• /.test(currentLine)) return;

        event.preventDefault();
        if (event.shiftKey) {
          const spaces = currentLine.match(/^(\s*)/)?.[1] || "";
          const remove = Math.min(2, spaces.length);
          if (remove > 0) {
            textarea.value =
              textarea.value.slice(0, lineStart) +
              currentLine.slice(remove) +
              textarea.value.slice(lineStart + currentLine.length);
            textarea.selectionStart = textarea.selectionEnd = pos - remove;
          }
        } else {
          textarea.value = textarea.value.slice(0, lineStart) + "  " + textarea.value.slice(lineStart);
          textarea.selectionStart = textarea.selectionEnd = pos + 2;
        }
        autoResize();
      }
    });

    textarea.addEventListener("blur", commit);

    textarea.focus();
    textarea.select();
    autoResize();
  }

  private getCardCountLabel(count: number): string {
    return count === 1 ? "1 card" : `${count} cards`;
  }

  private getCardEl(columnIndex: number, cardIndex: number): HTMLDivElement | null {
    return this.columns[columnIndex]?.cardListEl.querySelector(
      `.${CSS.card}[data-card-index="${cardIndex}"]`
    ) as HTMLDivElement | null;
  }
}
