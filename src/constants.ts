export const VIEW_TYPE_KANBAN = "edwin-kanban-view";
export const FRONTMATTER_KEY = "edwin-kanban";
export const FRONTMATTER_VALUE = "board";

export const DEFAULT_COLORS = [
  "#e3f2fd", // light blue
  "#fff3e0", // light orange
  "#e8f5e9", // light green
  "#fce4ec", // light pink
  "#f3e5f5", // light purple
  "#fff8e1", // light yellow
  "#e0f2f1", // light teal
  "#efebe9", // light brown
];

export const CSS = {
  view: "ek-view",
  board: "ek-board",
  boardScroller: "ek-board-scroller",
  column: "ek-column",
  columnSurface: "ek-column-surface",
  columnHeader: "ek-column-header",
  columnTitle: "ek-column-title",
  columnMeta: "ek-column-meta",
  cardList: "ek-card-list",
  card: "ek-card",
  cardChecked: "ek-card-checked",
  cardBody: "ek-card-body",
  cardChrome: "ek-card-chrome",
  cardCheckbox: "ek-card-checkbox",
  cardText: "ek-card-text",
  cardEdit: "ek-card-edit",
  cardDelete: "ek-card-delete",
  addCard: "ek-add-card",
  colorDot: "ek-color-dot",
  colorInput: "ek-color-input",
  dragging: "ek-dragging",
  dropIndicator: "ek-drop-indicator",
  cardAnimate: "ek-card-animate",
  emptyState: "ek-empty-state",
  mobile: "ek-mobile",
  mobileEditor: "ek-mobile-editor",
  mobileSpacer: "ek-mobile-bottom-spacer",
  editing: "ek-card-editing",
  reduceMotion: "ek-reduce-motion",
} as const;
