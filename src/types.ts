export interface PluginSettings {
  enableDetailPanel: boolean;
  enableDueDates: boolean;
  enableTags: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  enableDetailPanel: false,
  enableDueDates: false,
  enableTags: false,
};

export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export interface Card {
  text: string;
  checked: boolean;
  notes: string;
  checklist: ChecklistItem[];
  dueDate: string; // ISO date string "YYYY-MM-DD" or ""
  tags: string[];   // e.g. ["project", "urgent"]
}

export interface Column {
  title: string;
  cards: Card[];
  color: string;
  wipLimit: number; // 0 = no limit
}

export interface BoardSettings {
  "edwin-kanban": "board";
  "column-colors"?: Record<string, string>;
  "wip-limits"?: Record<string, number>;
}

export interface Board {
  columns: Column[];
  settings: BoardSettings;
}

export interface BoardCallbacks {
  onCardEdit(colIndex: number, cardIndex: number, newText: string): void;
  onCardReorder(
    fromCol: number,
    fromIdx: number,
    toCol: number,
    toIdx: number
  ): void;
  onCardAdd(colIndex: number): void;
  onCardDelete(colIndex: number, cardIndex: number): void;
  onColumnColorChange(colIndex: number, color: string): void;
  onCardOpen(colIndex: number, cardIndex: number): void;
  onCardUpdate(colIndex: number, cardIndex: number, card: Card): void;
  onArchiveDone(colIndex: number): void;
  onWipLimitChange(colIndex: number, limit: number): void;
}
