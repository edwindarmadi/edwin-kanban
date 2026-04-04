import { TextFileView } from "obsidian";
import { VIEW_TYPE_KANBAN } from "./constants";
import { Board, BoardCallbacks, Card } from "./types";
import { parseMarkdown, serializeBoard } from "./parser";
import { renderBoard } from "./board-renderer";
import { enableDragDrop } from "./drag-drop";
import { renderDetailPanel, removeDetailPanel } from "./detail-panel";

export class KanbanView extends TextFileView {
  private board: Board | null = null;
  private cleanupDragDrop: (() => void) | null = null;
  private openCard: { colIndex: number; cardIndex: number } | null = null;

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
    this.board = null;
    this.openCard = null;
  }

  private refresh(): void {
    const scrollLeft = this.contentEl.scrollLeft;
    const scrollTop = this.contentEl.scrollTop;

    this.contentEl.empty();
    this.cleanupDragDrop?.();

    if (!this.board) return;

    const callbacks: BoardCallbacks = {
      onCardEdit: (colIndex, cardIndex, newText) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards[cardIndex].text = newText;
        this.requestSave();
        this.refresh();
      },

      onCardReorder: (fromCol, fromIdx, toCol, toIdx) => {
        if (!this.board) return;
        const card = this.board.columns[fromCol].cards.splice(fromIdx, 1)[0];
        this.board.columns[toCol].cards.splice(toIdx, 0, card);
        this.requestSave();
        this.refresh();
      },

      onCardAdd: (colIndex) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards.push({
          text: "New card",
          checked: false,
          notes: "",
          checklist: [],
          dueDate: "",
          tags: [],
        });
        this.requestSave();
        this.refresh();

        // Open the new card's detail panel for immediate editing
        const newIdx = this.board.columns[colIndex].cards.length - 1;
        this.openDetailPanel(colIndex, newIdx);
      },

      onCardDelete: (colIndex, cardIndex) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards.splice(cardIndex, 1);
        this.requestSave();
        this.refresh();
      },

      onColumnColorChange: (colIndex, color) => {
        if (!this.board) return;
        this.board.columns[colIndex].color = color;
        this.requestSave();
        this.refresh();
      },

      onCardOpen: (colIndex, cardIndex) => {
        this.openDetailPanel(colIndex, cardIndex);
      },

      onCardUpdate: (colIndex, cardIndex, updatedCard) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards[cardIndex] = updatedCard;
        this.requestSave();
        // Don't full refresh — just save. Panel handles its own state.
      },

      onArchiveDone: (colIndex) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards = [];
        this.requestSave();
        this.refresh();
      },

      onWipLimitChange: (colIndex, limit) => {
        if (!this.board) return;
        this.board.columns[colIndex].wipLimit = limit;
        this.requestSave();
        this.refresh();
      },
    };

    renderBoard(this.board, this.contentEl, callbacks);
    this.cleanupDragDrop = enableDragDrop(
      this.contentEl,
      callbacks.onCardReorder
    );

    this.contentEl.scrollLeft = scrollLeft;
    this.contentEl.scrollTop = scrollTop;

    // Reopen detail panel if one was open
    if (this.openCard) {
      this.openDetailPanel(this.openCard.colIndex, this.openCard.cardIndex);
    }
  }

  private openDetailPanel(colIndex: number, cardIndex: number): void {
    if (!this.board) return;
    const card = this.board.columns[colIndex]?.cards[cardIndex];
    if (!card) return;

    // Close any existing panel
    removeDetailPanel(this.contentEl);
    this.openCard = { colIndex, cardIndex };

    // Add class to board for layout shift
    this.contentEl
      .querySelector(".ek-board")
      ?.classList.add("ek-board-with-panel");

    // Make a working copy so panel edits are tracked
    const cardCopy: Card = JSON.parse(JSON.stringify(card));

    renderDetailPanel(this.contentEl, cardCopy, {
      onUpdate: (updated) => {
        if (!this.board) return;
        this.board.columns[colIndex].cards[cardIndex] = updated;
        this.requestSave();
        // Re-render board to show updated badges, but keep panel open
        this.refresh();
      },
      onClose: () => {
        this.openCard = null;
        removeDetailPanel(this.contentEl);
        this.contentEl
          .querySelector(".ek-board")
          ?.classList.remove("ek-board-with-panel");
        // Refresh to update card badges on the board
        this.refresh();
      },
    });
  }
}
