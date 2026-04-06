import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_KANBAN, FRONTMATTER_KEY, FRONTMATTER_VALUE } from "./constants";
import { KanbanView } from "./kanban-view";

export default class EdwinKanbanPlugin extends Plugin {
  async onload() {
    // Register the Kanban view type
    this.registerView(VIEW_TYPE_KANBAN, (leaf) => new KanbanView(leaf));

    // When a file is opened, check if it's a kanban board
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!file || !(file instanceof TFile)) return;
        this.checkAndSwitchView(file);
      })
    );

    // When switching tabs, check if the new leaf is a kanban board
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf) return;
        const file = (leaf.view as any)?.file;
        if (file instanceof TFile) {
          this.checkAndSwitchView(file, leaf);
        }
      })
    );

    // Check files already open when plugin loads
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        const file = (leaf.view as any)?.file;
        if (file instanceof TFile) {
          this.checkAndSwitchView(file, leaf);
        }
      });
    });

    // Catch cache race: metadata wasn't ready when file first opened
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.app.workspace.iterateAllLeaves((leaf) => {
          if (
            (leaf.view as any)?.file?.path === file.path &&
            leaf.view.getViewType() === "markdown"
          ) {
            this.checkAndSwitchView(file, leaf);
          }
        });
      })
    );

    // Catch startup race: layout ready before cache finished
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        this.app.workspace.iterateAllLeaves((leaf) => {
          const file = (leaf.view as any)?.file;
          if (file instanceof TFile) {
            this.checkAndSwitchView(file, leaf);
          }
        });
      })
    );

    // Add ribbon icon
    this.addRibbonIcon("columns-3", "New Kanban Board", async () => {
      await this.createNewBoard();
    });

    // Add command
    this.addCommand({
      id: "create-kanban-board",
      name: "Create new Kanban board",
      callback: () => this.createNewBoard(),
    });
  }

  private checkAndSwitchView(file: TFile, existingLeaf?: WorkspaceLeaf) {
    const cache = this.app.metadataCache.getFileCache(file);
    if (cache?.frontmatter?.[FRONTMATTER_KEY] === FRONTMATTER_VALUE) {
      const leaf = existingLeaf ?? this.app.workspace.getActiveViewOfType(KanbanView)?.leaf
        ?? this.app.workspace.getMostRecentLeaf();
      if (leaf && leaf.view.getViewType() !== VIEW_TYPE_KANBAN) {
        leaf.setViewState({
          type: VIEW_TYPE_KANBAN,
          state: { file: file.path },
        });
      }
    }
  }

  private async createNewBoard() {
    const template = `---\nedwin-kanban: board\n---\n\n## Backlog\n\n## To Do\n\n## In Progress\n\n## Done\n\n%% kanban:settings\n\`\`\`\n{"edwin-kanban":"board"}\n\`\`\`\n%%\n`;

    const file = await this.app.vault.create(
      `Kanban Board ${Date.now()}.md`,
      template
    );

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }

  onunload() {
    // Obsidian handles view cleanup automatically
  }
}
