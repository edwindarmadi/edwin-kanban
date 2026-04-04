export interface Card {
  text: string;
  checked: boolean;
}

export interface Column {
  title: string;
  cards: Card[];
  color: string;
}

export interface BoardSettings {
  "edwin-kanban": "board";
  "column-colors"?: Record<string, string>;
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
}
