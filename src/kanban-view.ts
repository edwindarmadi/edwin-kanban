import { Platform, TextFileView, WorkspaceLeaf } from "obsidian";
import type EdwinKanbanPlugin from "./main";
import { VIEW_TYPE_KANBAN } from "./constants";
import { KanbanBoardController } from "./board-renderer";
import { parseMarkdown, serializeBoard } from "./parser";
import { Board, BoardCallbacks } from "./types";

export class KanbanView extends TextFileView {
  private board: Board | null = null;
  private controller: KanbanBoardController | null = null;
  private actionsInitialized = false;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: EdwinKanbanPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_KANBAN;
  }

  getDisplayText(): string {
    return this.file?.basename ?? "Kanban board";
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("ek-view-root");

    if (!this.actionsInitialized) {
      this.actionsInitialized = true;
      this.addAction("file-text", "Open as markdown", async () => {
        if (this.file) {
          await this.plugin.openFileInMarkdown(this.file, this.leaf);
        }
      });
    }

    this.refreshPreferences();
  }

  async onClose(): Promise<void> {
    this.clear();
  }

  setViewData(data: string, clear: boolean): void {
    this.contentEl.addClass("ek-view-root");

    if (clear) {
      this.clear();
      this.contentEl.addClass("ek-view-root");
    }

    this.board = parseMarkdown(data);
    this.ensureController();
    this.controller?.setBoard(this.board);
    this.refreshPreferences();
  }

  getViewData(): string {
    return this.board ? serializeBoard(this.board) : "";
  }

  clear(): void {
    this.controller?.destroy();
    this.controller = null;
    this.board = null;
    this.contentEl.empty();
  }

  refreshPreferences(): void {
    this.contentEl.toggleClass("ek-mobile", Platform.isMobile);
    this.controller?.setPreferences(this.plugin.settings.reduceMotion);
  }

  private ensureController(): void {
    if (!this.controller) {
      this.controller = new KanbanBoardController(this.contentEl, this.createCallbacks());
      this.controller.setPreferences(this.plugin.settings.reduceMotion);
    }
  }

  private createCallbacks(): BoardCallbacks {
    return {
      onCardEdit: (columnIndex, cardIndex, newText) => {
        const card = this.board?.columns[columnIndex]?.cards[cardIndex];
        if (!card) return;

        card.text = newText;
        this.controller?.updateCard(columnIndex);
        this.requestSave();
      },

      onCardToggle: (columnIndex, cardIndex, checked) => {
        const card = this.board?.columns[columnIndex]?.cards[cardIndex];
        if (!card) return;

        card.checked = checked;
        this.controller?.updateCard(columnIndex);
        this.requestSave();
      },

      onCardReorder: (fromCol, fromIdx, toCol, toIdx) => {
        if (!this.board) return;

        const card = this.board.columns[fromCol]?.cards.splice(fromIdx, 1)[0];
        if (!card) return;

        this.board.columns[toCol]?.cards.splice(toIdx, 0, card);
        this.controller?.moveCard(fromCol, toCol);
        this.requestSave();
      },

      onCardAdd: (columnIndex) => {
        const column = this.board?.columns[columnIndex];
        if (!column) return;

        column.cards.push({
          text: this.plugin.settings.newCardText,
          checked: false,
        });
        this.controller?.addCard(columnIndex);
        this.requestSave();

        const cardIndex = column.cards.length - 1;
        const win = this.contentEl.ownerDocument.defaultView;
        win?.setTimeout(() => {
          this.controller?.focusCardEditor(columnIndex, cardIndex);
        }, this.plugin.settings.reduceMotion ? 0 : 24);
      },

      onCardDelete: (columnIndex, cardIndex) => {
        const column = this.board?.columns[columnIndex];
        if (!column) return;

        const viewWindow = this.contentEl.ownerDocument.defaultView;
        if (
          this.plugin.settings.confirmBeforeDelete &&
          viewWindow &&
          !viewWindow.confirm("Delete this card?")
        ) {
          return;
        }

        column.cards.splice(cardIndex, 1);
        this.controller?.removeCard(columnIndex);
        this.requestSave();
      },

      onColumnColorChange: (columnIndex, color) => {
        const column = this.board?.columns[columnIndex];
        if (!column) return;

        column.color = color;
        this.controller?.updateColumnColor(columnIndex);
        this.requestSave();
      },
    };
  }
}
