# Edwin Kanban — Obsidian Plugin

A Notion-style Kanban board plugin for Obsidian with custom colors, smooth drag-and-drop, and inline card editing.

## Tech Stack

- **TypeScript** → compiled with **esbuild** into a single `main.js`
- **Obsidian Plugin API** — uses `TextFileView` for rendering markdown files as boards
- **HTML5 Drag & Drop API** — no external libraries
- **CSS** uses Obsidian's CSS variables (`var(--background-primary)`, etc.) for theme compatibility

## Project Structure

```
src/
├── main.ts              # Plugin entry — registers view, commands, ribbon icon
├── constants.ts         # VIEW_TYPE, CSS class names, default color palette
├── types.ts             # Card, Column, Board, BoardCallbacks interfaces
├── kanban-view.ts       # TextFileView subclass — the hub connecting everything
├── parser.ts            # Markdown ↔ Board data conversion
├── board-renderer.ts    # DOM rendering (columns, cards, buttons)
└── drag-drop.ts         # HTML5 drag-and-drop with FLIP animations
```

## How It Works

- Board data is stored as **plain markdown** with `edwin-kanban: board` frontmatter
- Column colors stored in a `%% kanban:settings %%` block at the bottom of the file
- Uses `edwin-kanban: board` frontmatter (not `kanban-plugin: board`) to avoid conflict with the existing Kanban plugin

## Build & Dev

```bash
npm run dev    # watch mode — rebuilds on save
npm run build  # production build (minified)
```

The plugin lives in the Obsidian vault at:
`/Users/edwindarmadi/Edwin's Notepad/.obsidian/plugins/edwin-kanban/`

After rebuilding, reload plugins in Obsidian: Settings → Community Plugins → refresh icon.

## Progress

### Tier 1 — Core (done, tested)
- [x] Drag & drop with animations
- [x] Custom column colors (color picker per column)
- [x] Inline card editing
- [x] Add card button
- [x] Card reordering

### Tier 2 — Useful features (not started)
- [ ] WIP limit indicators
- [ ] Archive done cards
- [ ] Card detail panel (optional — off by default)
- [ ] Due dates (optional — off by default)
- [ ] Tags (optional — off by default)

### Tier 3 — Polish & power features (not started)
- [ ] Filter & search
- [ ] Card cover images / color bars
- [ ] Keyboard shortcuts
- [ ] Multiple board views (board, list, table)
- [ ] Swipe gestures
