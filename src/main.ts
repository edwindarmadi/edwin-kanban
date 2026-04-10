import { Plugin, TFile, WorkspaceLeaf, normalizePath } from "obsidian";
import { FRONTMATTER_KEY, FRONTMATTER_VALUE, VIEW_TYPE_KANBAN } from "./constants";
import { KanbanView } from "./kanban-view";
import { DEFAULT_SETTINGS, EdwinKanbanSettingTab } from "./settings";
import { EdwinKanbanSettings } from "./types";

export default class EdwinKanbanPlugin extends Plugin {
  settings: EdwinKanbanSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_KANBAN, (leaf) => new KanbanView(leaf, this));

    this.addSettingTab(new EdwinKanbanSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file instanceof TFile) {
          void this.openFileInKanbanIfNeeded(file);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const file = this.getFileFromLeaf(leaf);
        if (file) {
          void this.openFileInKanbanIfNeeded(file, leaf ?? undefined);
        }
      })
    );

    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        const file = this.getFileFromLeaf(leaf);
        if (file) {
          void this.openFileInKanbanIfNeeded(file, leaf);
        }
      });
    });

    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        leaves.forEach((leaf) => {
          const leafFile = this.getFileFromLeaf(leaf);
          if (leafFile?.path === file.path) {
            void this.openFileInKanbanIfNeeded(file, leaf);
          }
        });
      })
    );

    this.addRibbonIcon("columns-3", "Create new kanban board", async () => {
      await this.createNewBoard();
    });

    this.addCommand({
      id: "create-kanban-board",
      name: "Create new kanban board",
      callback: () => this.createNewBoard(),
    });

    this.addCommand({
      id: "open-current-note-as-kanban-board",
      name: "Open current note as kanban board",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const activeView = this.app.workspace.getActiveViewOfType(KanbanView);

        if (!file || !this.isKanbanFile(file) || activeView) {
          return false;
        }

        if (!checking) {
          void this.openFileInKanbanIfNeeded(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "open-current-board-as-markdown",
      name: "Open current board as markdown",
      checkCallback: (checking) => {
        const activeView = this.app.workspace.getActiveViewOfType(KanbanView);
        if (!activeView?.file) {
          return false;
        }

        if (!checking) {
          void this.openFileInMarkdown(activeView.file, activeView.leaf);
        }

        return true;
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.defaultColumns = [
      ...(this.settings.defaultColumns.length > 0
        ? this.settings.defaultColumns
        : DEFAULT_SETTINGS.defaultColumns),
    ];
    this.settings.newCardText =
      this.settings.newCardText.trim() || DEFAULT_SETTINGS.newCardText;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshOpenKanbanViews(): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_KANBAN).forEach((leaf) => {
      if (leaf.view instanceof KanbanView) {
        leaf.view.refreshPreferences();
      }
    });
  }

  async openFileInMarkdown(file: TFile, leaf?: WorkspaceLeaf): Promise<void> {
    const targetLeaf = leaf ?? this.app.workspace.getMostRecentLeaf();
    if (!targetLeaf) return;

    await targetLeaf.setViewState({
      type: "markdown",
      state: { file: file.path },
      active: true,
    });
  }

  private async openFileInKanbanIfNeeded(
    file: TFile,
    leaf?: WorkspaceLeaf
  ): Promise<void> {
    if (!this.isKanbanFile(file)) return;

    const targetLeaf =
      leaf ?? this.app.workspace.activeLeaf ?? this.app.workspace.getMostRecentLeaf();

    if (!targetLeaf || targetLeaf.view.getViewType() === VIEW_TYPE_KANBAN) {
      return;
    }

    await targetLeaf.setViewState({
      type: VIEW_TYPE_KANBAN,
      state: { file: file.path },
      active: true,
    });
  }

  private getFileFromLeaf(leaf: WorkspaceLeaf | null): TFile | null {
    if (!leaf || !("file" in leaf.view)) {
      return null;
    }

    const candidate = (leaf.view as { file?: unknown }).file;
    return candidate instanceof TFile ? candidate : null;
  }

  private isKanbanFile(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.[FRONTMATTER_KEY] === FRONTMATTER_VALUE;
  }

  private async createNewBoard(): Promise<void> {
    const template = this.createBoardTemplate();
    const basePath = normalizePath(`Kanban Board ${Date.now()}.md`);
    const file = await this.app.vault.create(basePath, template);
    const leaf = this.app.workspace.getLeaf(false);

    if (this.settings.openNewBoardsInKanbanView) {
      await leaf.setViewState({
        type: VIEW_TYPE_KANBAN,
        state: { file: file.path },
        active: true,
      });
      return;
    }

    await leaf.openFile(file);
  }

  private createBoardTemplate(): string {
    const columns =
      this.settings.defaultColumns.length > 0
        ? this.settings.defaultColumns
        : DEFAULT_SETTINGS.defaultColumns;
    const columnSections = columns.map((title) => `## ${title}\n`).join("\n");

    return `---\nedwin-kanban: board\n---\n\n${columnSections}\n%% kanban:settings\n\`\`\`\n{"edwin-kanban":"board"}\n\`\`\`\n%%\n`;
  }
}
