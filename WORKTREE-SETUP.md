# Worktree Setup

This worktree was created from the original project at `/Users/edwindarmadi/Projects/edwin-kanban` using:

```bash
git worktree add ../myproject-codex -b codex-plan
```

## Files and folders found in the original project that are not tracked by Git

| Path | Status in original project | Needed to run? | Notes | Recreate command / action |
| --- | --- | --- | --- | --- |
| `.DS_Store` | Untracked | No | macOS Finder metadata. Ignore it. | None |
| `Obsidian Docs/` | Untracked | No | Offline reference docs used for planning and review, not for plugin runtime. | Optional: copy from original project if local docs are needed |
| `data.json` | Untracked | No | Local plugin data/settings state. Useful only if reproducing an exact local test state. | Let Obsidian regenerate it, or copy from original project |
| `package-lock.json` | Untracked | Not strictly | Helpful for reproducible installs. The project can still install from `package.json`. | `npm install` |
| `.claude/` | Ignored | No | Local tool metadata, not required for the plugin. | None |
| `main.js` | Ignored | Yes | Built plugin output loaded by Obsidian. | `npm run build` |
| `node_modules/` | Ignored | Yes | Installed dependencies required to build the plugin. | `npm install` |

## Environment variables

No project-specific environment variables were discovered from the repository scan.

Checks performed:

- Searched the codebase for `process.env`, `import.meta.env`, `dotenv`, `API_KEY`, `SECRET`, and `TOKEN`
- Looked for `.env*` files near the repo

Result:

- No `.env` files found
- No runtime env variable usage found in the plugin source

## Commands to make this worktree runnable

Run these in the worktree folder:

```bash
cd /Users/edwindarmadi/Projects/myproject-codex
npm install
npm run build
```

## Optional local parity steps

If exact local parity with the original working folder is needed:

```bash
cp -R "/Users/edwindarmadi/Projects/edwin-kanban/Obsidian Docs" "/Users/edwindarmadi/Projects/myproject-codex/"
cp "/Users/edwindarmadi/Projects/edwin-kanban/data.json" "/Users/edwindarmadi/Projects/myproject-codex/"
```

These are optional for plugin development. The only required recreated items for build/run are dependencies and the built output.
