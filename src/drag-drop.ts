import { CSS } from "./constants";

interface ReorderCallback {
  (fromCol: number, fromIdx: number, toCol: number, toIdx: number): void;
}

export function enableDragDrop(
  boardEl: HTMLElement,
  onReorder: ReorderCallback
): () => void {
  let dragSource: HTMLElement | null = null;
  let indicator: HTMLElement | null = null;
  let dropTarget: { colIndex: number; cardIndex: number } | null = null;

  function getCardFromEvent(e: DragEvent): HTMLElement | null {
    const target = e.target as HTMLElement;
    return target.closest(`.${CSS.card}`) as HTMLElement | null;
  }

  function getCardListFromEvent(e: DragEvent): HTMLElement | null {
    const target = e.target as HTMLElement;
    return target.closest(`.${CSS.cardList}`) as HTMLElement | null;
  }

  function removeIndicator() {
    indicator?.remove();
    indicator = null;
  }

  function createIndicator(): HTMLElement {
    const el = boardEl.ownerDocument.createElement("div");
    el.className = CSS.dropIndicator;
    return el;
  }

  function handleDragStart(e: DragEvent) {
    const card = getCardFromEvent(e);
    if (!card || !e.dataTransfer) return;

    dragSource = card;
    card.classList.add(CSS.dragging);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        colIndex: Number(card.dataset.colIndex),
        cardIndex: Number(card.dataset.cardIndex),
      })
    );
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = "move";

    const cardList = getCardListFromEvent(e);
    if (!cardList) return;

    const colIndex = Number(cardList.dataset.colIndex);
    const cards = Array.from(
      cardList.querySelectorAll(`.${CSS.card}:not(.${CSS.dragging})`)
    ) as HTMLElement[];

    removeIndicator();
    indicator = createIndicator();

    // Find insertion point based on mouse Y position
    let insertIndex = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        insertIndex = i;
        break;
      }
    }

    // Insert indicator at the right position
    if (insertIndex < cards.length) {
      cardList.insertBefore(indicator, cards[insertIndex]);
    } else {
      cardList.appendChild(indicator);
    }

    dropTarget = { colIndex, cardIndex: insertIndex };
  }

  function handleDragLeave(e: DragEvent) {
    const cardList = getCardListFromEvent(e);
    if (!cardList) {
      removeIndicator();
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer || !dropTarget) return;

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const fromCol = data.colIndex;
    const fromIdx = data.cardIndex;
    const toCol = dropTarget.colIndex;
    let toIdx = dropTarget.cardIndex;

    // Adjust index if moving within the same column and moving down
    if (fromCol === toCol && fromIdx < toIdx) {
      toIdx--;
    }

    if (fromCol !== toCol || fromIdx !== toIdx) {
      onReorder(fromCol, fromIdx, toCol, toIdx);
    }

    removeIndicator();
  }

  function handleDragEnd() {
    if (dragSource) {
      dragSource.classList.remove(CSS.dragging);
      dragSource = null;
    }
    removeIndicator();
    dropTarget = null;
  }

  // Use event delegation on the board container
  boardEl.addEventListener("dragstart", handleDragStart);
  boardEl.addEventListener("dragover", handleDragOver);
  boardEl.addEventListener("dragleave", handleDragLeave);
  boardEl.addEventListener("drop", handleDrop);
  boardEl.addEventListener("dragend", handleDragEnd);

  // Return cleanup function
  return () => {
    boardEl.removeEventListener("dragstart", handleDragStart);
    boardEl.removeEventListener("dragover", handleDragOver);
    boardEl.removeEventListener("dragleave", handleDragLeave);
    boardEl.removeEventListener("drop", handleDrop);
    boardEl.removeEventListener("dragend", handleDragEnd);
    removeIndicator();
  };
}
