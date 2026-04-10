# Worktree Setup — claude-plan

## Untracked/Ignored Files Found in Original Project

| File/Folder | Tracked? | Needed to Run? | How to Recreate |
|-------------|----------|----------------|-----------------|
| `node_modules/` | Ignored (.gitignore) | Yes (build deps) | `npm install` |
| `main.js` | Ignored (.gitignore) | Yes (build output) | `npm run build` |
| `.claude/` | Ignored (.gitignore) | No (Claude Code local state) | Auto-created by Claude Code |
| `.DS_Store` | Untracked | No (macOS metadata) | Auto-created by Finder |
| `data.json` | Untracked | No (Obsidian plugin runtime data) | Created by Obsidian when plugin saves settings |
| `package-lock.json` | Untracked | Recommended (lockfile) | `npm install` generates it |
| `Obsidian Docs/` | Untracked | No (reference docs only) | N/A |

## Environment Variables

None required. This is a pure TypeScript → esbuild build with no external APIs or secrets.

## Setup Commands

```bash
cd /Users/edwindarmadi/Projects/myproject-claude
npm install
npm run build
```
