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
  // Board
  board: "ek-board",
  boardWithPanel: "ek-board-with-panel",

  // Column
  column: "ek-column",
  columnHeader: "ek-column-header",
  columnTitle: "ek-column-title",
  columnCount: "ek-column-count",
  columnWipOver: "ek-column-wip-over",

  // Card list
  cardList: "ek-card-list",

  // Card
  card: "ek-card",
  cardText: "ek-card-text",
  cardEdit: "ek-card-edit",
  cardDelete: "ek-card-delete",
  cardBadges: "ek-card-badges",
  cardDueBadge: "ek-card-due-badge",
  cardDueOverdue: "ek-card-due-overdue",
  cardDueSoon: "ek-card-due-soon",
  cardTag: "ek-card-tag",

  // Buttons
  addCard: "ek-add-card",
  archiveBtn: "ek-archive-btn",

  // Color picker
  colorDot: "ek-color-dot",
  colorInput: "ek-color-input",

  // Drag and drop
  dragging: "ek-dragging",
  dropIndicator: "ek-drop-indicator",
  cardAnimate: "ek-card-animate",

  // Detail panel
  panel: "ek-panel",
  panelOpen: "ek-panel-open",
  panelOverlay: "ek-panel-overlay",
  panelHeader: "ek-panel-header",
  panelTitle: "ek-panel-title",
  panelClose: "ek-panel-close",
  panelBody: "ek-panel-body",
  panelSection: "ek-panel-section",
  panelSectionTitle: "ek-panel-section-title",
  panelNotes: "ek-panel-notes",
  panelChecklist: "ek-panel-checklist",
  panelCheckItem: "ek-panel-check-item",
  panelCheckbox: "ek-panel-checkbox",
  panelCheckText: "ek-panel-check-text",
  panelCheckDelete: "ek-panel-check-delete",
  panelAddCheck: "ek-panel-add-check",
  panelDateInput: "ek-panel-date-input",
  panelTagsContainer: "ek-panel-tags",
  panelTagInput: "ek-panel-tag-input",
  panelTag: "ek-panel-tag",
  panelTagRemove: "ek-panel-tag-remove",

  // WIP
  wipBadge: "ek-wip-badge",
  wipSetting: "ek-wip-setting",
} as const;
