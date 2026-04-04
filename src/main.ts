import { Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf, App } from "obsidian";
import { VIEW_TYPE_KANBAN, FRONTMATTER_KEY, FRONTMATTER_VALUE } from "./constants";
import { KanbanView } from "./kanban-view";
import { PluginSettings, DEFAULT_SETTINGS } from "./types";

export default class EdwinKanbanPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Register the Kanban view type
    this.registerView(VIEW_TYPE_KANBAN, (leaf) => new KanbanView(leaf, this));

    // Add settings tab
    this.addSettingTab(new EdwinKanbanSettingTab(this.app, this));

    // When a file is opened, check if it's a kanban board
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!file || !(file instanceof TFile)) return;
        this.checkAndSwitchView(file);
      })
    );

    // Also check files that are already open when plugin loads
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        const file = (leaf.view as any)?.file;
        if (file instanceof TFile) {
          this.checkAndSwitchView(file, leaf);
        }
      });
    });

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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Refresh all open kanban views so they pick up the new settings
    this.app.workspace.getLeavesOfType(VIEW_TYPE_KANBAN).forEach((leaf) => {
      (leaf.view as KanbanView).onSettingsChanged();
    });
  }

  onunload() {
    // Obsidian handles view cleanup automatically
  }
}

class EdwinKanbanSettingTab extends PluginSettingTab {
  plugin: EdwinKanbanPlugin;

  constructor(app: App, plugin: EdwinKanbanPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Card detail panel")
      .setDesc("Click a card to open a side panel with notes and checklist")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableDetailPanel).onChange(async (value) => {
          this.plugin.settings.enableDetailPanel = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Due dates")
      .setDesc("Add due dates to cards with overdue/soon warnings")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableDueDates).onChange(async (value) => {
          this.plugin.settings.enableDueDates = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Tags")
      .setDesc("Add colored tags to cards for categorization")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableTags).onChange(async (value) => {
          this.plugin.settings.enableTags = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
