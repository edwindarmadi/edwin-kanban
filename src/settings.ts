import { App, PluginSettingTab, Setting } from "obsidian";
import type EdwinKanbanPlugin from "./main";
import { EdwinKanbanSettings } from "./types";

export const DEFAULT_SETTINGS: EdwinKanbanSettings = {
  defaultColumns: ["Backlog", "To do", "In progress", "Done"],
  openNewBoardsInKanbanView: true,
  reduceMotion: false,
  confirmBeforeDelete: true,
  newCardText: "New card",
};

export class EdwinKanbanSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: EdwinKanbanPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Default columns")
      .setDesc("One column title per line for newly created boards.")
      .addTextArea((text) =>
        text
          .setPlaceholder("Backlog\nTo do\nIn progress\nDone")
          .setValue(this.plugin.settings.defaultColumns.join("\n"))
          .onChange(async (value) => {
            this.plugin.settings.defaultColumns = value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Open new boards in kanban view")
      .setDesc("Switch newly created files into the kanban board view immediately.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openNewBoardsInKanbanView)
          .onChange(async (value) => {
            this.plugin.settings.openNewBoardsInKanbanView = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reduce motion")
      .setDesc("Limit animations and smooth scrolling in the board view.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.reduceMotion).onChange(async (value) => {
          this.plugin.settings.reduceMotion = value;
          await this.plugin.saveSettings();
          this.plugin.refreshOpenKanbanViews();
        })
      );

    new Setting(containerEl)
      .setName("Confirm before delete")
      .setDesc("Ask before permanently removing a card from a board.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.confirmBeforeDelete)
          .onChange(async (value) => {
            this.plugin.settings.confirmBeforeDelete = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("New card text")
      .setDesc("Starting text used when you add a new card.")
      .addText((text) =>
        text
          .setPlaceholder("New card")
          .setValue(this.plugin.settings.newCardText)
          .onChange(async (value) => {
            this.plugin.settings.newCardText = value.trim() || DEFAULT_SETTINGS.newCardText;
            await this.plugin.saveSettings();
          })
      );
  }
}
