import { TextFileView, WorkspaceLeaf, Platform } from "obsidian";
import { VIEW_TYPE_KANBAN } from "./constants";
import { Board, BoardCallbacks } from "./types";
import { parseMarkdown, serializeBoard, nextCardId } from "./parser";
import { renderBoard } from "./board-renderer";
import { enableDragDrop } from "./drag-drop";

export class KanbanView extends TextFileView {
  private board: Board | null = null;
  private cleanupDragDrop: (() => void) | null = null;

  getViewType(): string {
    return VIEW_TYPE_KANBAN;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "Kanban";
  }

  setViewData(data: string, clear: boolean): void {
    this.board = parseMarkdown(data);
    this.refresh();
  }

  getViewData(): string {
    return this.board ? serializeBoard(this.board) : "";
  }

  clear(): void {
    this.contentEl.empty();
    this.cleanupDragDrop?.();
    this.contentEl.removeClass("ek-mobile");
    this.board = null;
  }

  private refresh(): void {
    // Save scroll position
    const scrollLeft = this.contentEl.scrollLeft;
    const scrollTop = this.contentEl.scrollTop;

    this.contentEl.empty();
    this.cleanupDragDrop?.();

    if (!this.board) return;

    if (Platform.isMobile) {
      this.contentEl.addClass("ek-mobile");
    } else {
      this.contentEl.removeClass("ek-mobile");
    }

    const callbacks: BoardCallbacks = {
      onCardEdit: (colIndex, cardIndex, newText) => {
        if (!this.board?.columns[colIndex]?.cards[cardIndex]) return;
        this.board.columns[colIndex].cards[cardIndex].text = newText;
        this.requestSave();
        this.refresh();
      },

      onCardReorder: (fromCol, fromIdx, toCol, toIdx) => {
        if (!this.board?.columns[fromCol]?.cards[fromIdx]) return;
        if (!this.board?.columns[toCol]) return;
        const card = this.board.columns[fromCol].cards.splice(fromIdx, 1)[0];
        this.board.columns[toCol].cards.splice(toIdx, 0, card);
        this.requestSave();
        this.refresh();
      },

      onCardAdd: (colIndex) => {
        if (!this.board?.columns[colIndex]) return;
        this.board.columns[colIndex].cards.push({
          id: nextCardId(),
          text: "New card",
          checked: false,
        });
        this.requestSave();
        this.refresh();

        // Focus the new card for immediate editing
        requestAnimationFrame(() => {
          const cards = this.contentEl.querySelectorAll(
            `[data-col-index="${colIndex}"] .ek-card-text`
          );
          const lastCard = cards[cards.length - 1] as HTMLElement;
          if (lastCard) {
            lastCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
            if (!Platform.isMobile) {
              lastCard.click();
            }
          }
        });
      },

      onCardDelete: (colIndex, cardIndex) => {
        if (!this.board?.columns[colIndex]?.cards[cardIndex]) return;
        this.board.columns[colIndex].cards.splice(cardIndex, 1);
        this.requestSave();
        this.refresh();
      },

      onColumnColorChange: (colIndex, color) => {
        if (!this.board?.columns[colIndex]) return;
        this.board.columns[colIndex].color = color;
        this.requestSave();
        this.refresh();
      },
    };

    renderBoard(this.board, this.contentEl, callbacks);
    this.cleanupDragDrop = enableDragDrop(
      this.contentEl,
      callbacks.onCardReorder
    );

    if (Platform.isMobile) {
      this.contentEl.createDiv({ cls: "ek-mobile-bottom-spacer" });
    }

    // Restore scroll position
    this.contentEl.scrollLeft = scrollLeft;
    this.contentEl.scrollTop = scrollTop;
  }
}
