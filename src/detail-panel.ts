import { Card, ChecklistItem, PluginSettings } from "./types";
import { CSS } from "./constants";

interface PanelCallbacks {
  onUpdate(card: Card): void;
  onClose(): void;
}

export function renderDetailPanel(
  container: HTMLElement,
  card: Card,
  settings: PluginSettings,
  callbacks: PanelCallbacks
): void {
  // Create overlay (click to close)
  const overlay = container.createDiv({ cls: CSS.panelOverlay });
  overlay.addEventListener("click", callbacks.onClose);

  // Panel
  const panel = container.createDiv({ cls: `${CSS.panel} ${CSS.panelOpen}` });

  // Header
  const header = panel.createDiv({ cls: CSS.panelHeader });
  const titleInput = header.createEl("input", {
    cls: CSS.panelTitle,
    type: "text",
    value: card.text,
  });
  titleInput.addEventListener("change", () => {
    card.text = titleInput.value.trim() || card.text;
    callbacks.onUpdate({ ...card });
  });

  const closeBtn = header.createSpan({ cls: CSS.panelClose, text: "×" });
  closeBtn.addEventListener("click", callbacks.onClose);

  // Body
  const body = panel.createDiv({ cls: CSS.panelBody });

  // ── Due Date section (only if enabled) ──
  if (settings.enableDueDates) {
    const dateSection = body.createDiv({ cls: CSS.panelSection });
    dateSection.createDiv({ cls: CSS.panelSectionTitle, text: "Due date" });
    const dateInput = dateSection.createEl("input", {
      cls: CSS.panelDateInput,
      type: "date",
      value: card.dueDate,
    });
    dateInput.addEventListener("change", () => {
      card.dueDate = dateInput.value;
      callbacks.onUpdate({ ...card });
    });
  }

  // ── Tags section (only if enabled) ──
  if (settings.enableTags) {
    const tagsSection = body.createDiv({ cls: CSS.panelSection });
    tagsSection.createDiv({ cls: CSS.panelSectionTitle, text: "Tags" });
    const tagsContainer = tagsSection.createDiv({ cls: CSS.panelTagsContainer });

    function renderTags() {
      tagsContainer.empty();
      card.tags.forEach((tag, idx) => {
        const tagEl = tagsContainer.createSpan({ cls: CSS.panelTag, text: tag });
        const removeBtn = tagEl.createSpan({
          cls: CSS.panelTagRemove,
          text: "×",
        });
        removeBtn.addEventListener("click", () => {
          card.tags.splice(idx, 1);
          callbacks.onUpdate({ ...card });
          renderTags();
        });
      });

      const tagInput = tagsContainer.createEl("input", {
        cls: CSS.panelTagInput,
        type: "text",
        placeholder: "Add tag...",
      });
      tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const value = tagInput.value.trim();
          if (value && !card.tags.includes(value)) {
            card.tags.push(value);
            callbacks.onUpdate({ ...card });
            renderTags();
          }
        }
      });
    }
    renderTags();
  }

  // ── Notes section ──
  const notesSection = body.createDiv({ cls: CSS.panelSection });
  notesSection.createDiv({ cls: CSS.panelSectionTitle, text: "Notes" });
  const notesArea = notesSection.createEl("textarea", {
    cls: CSS.panelNotes,
    text: card.notes,
  });
  notesArea.placeholder = "Add notes...";
  notesArea.rows = Math.max(3, card.notes.split("\n").length + 1);
  notesArea.addEventListener("blur", () => {
    card.notes = notesArea.value;
    callbacks.onUpdate({ ...card });
  });

  // ── Checklist section ──
  const checkSection = body.createDiv({ cls: CSS.panelSection });
  checkSection.createDiv({ cls: CSS.panelSectionTitle, text: "Checklist" });
  const checkList = checkSection.createDiv({ cls: CSS.panelChecklist });

  function renderChecklist() {
    checkList.empty();

    card.checklist.forEach((item, idx) => {
      const row = checkList.createDiv({ cls: CSS.panelCheckItem });

      const checkbox = row.createEl("input", {
        cls: CSS.panelCheckbox,
        type: "checkbox",
      });
      (checkbox as HTMLInputElement).checked = item.checked;
      checkbox.addEventListener("change", () => {
        card.checklist[idx].checked = (checkbox as HTMLInputElement).checked;
        callbacks.onUpdate({ ...card });
      });

      const textInput = row.createEl("input", {
        cls: CSS.panelCheckText,
        type: "text",
        value: item.text,
      });
      textInput.addEventListener("change", () => {
        card.checklist[idx].text = textInput.value;
        callbacks.onUpdate({ ...card });
      });

      const deleteBtn = row.createSpan({
        cls: CSS.panelCheckDelete,
        text: "×",
      });
      deleteBtn.addEventListener("click", () => {
        card.checklist.splice(idx, 1);
        callbacks.onUpdate({ ...card });
        renderChecklist();
      });
    });

    // Add checklist item button
    const addBtn = checkList.createEl("button", {
      cls: CSS.panelAddCheck,
      text: "+ Add item",
    });
    addBtn.addEventListener("click", () => {
      card.checklist.push({ text: "New item", checked: false });
      callbacks.onUpdate({ ...card });
      renderChecklist();

      // Focus the new item
      setTimeout(() => {
        const inputs = checkList.querySelectorAll(`.${CSS.panelCheckText}`);
        const last = inputs[inputs.length - 1] as HTMLInputElement;
        last?.focus();
        last?.select();
      }, 50);
    });
  }
  renderChecklist();
}

export function removeDetailPanel(container: HTMLElement): void {
  container.querySelector(`.${CSS.panelOverlay}`)?.remove();
  container.querySelector(`.${CSS.panel}`)?.remove();
}
