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
  board: "ek-board",
  column: "ek-column",
  columnHeader: "ek-column-header",
  columnTitle: "ek-column-title",
  cardList: "ek-card-list",
  card: "ek-card",
  cardText: "ek-card-text",
  cardEdit: "ek-card-edit",
  cardMenu: "ek-card-menu",
  addCard: "ek-add-card",
  colorDot: "ek-color-dot",
  colorInput: "ek-color-input",
  dragging: "ek-dragging",
  dropIndicator: "ek-drop-indicator",
  cardAnimate: "ek-card-animate",
} as const;
