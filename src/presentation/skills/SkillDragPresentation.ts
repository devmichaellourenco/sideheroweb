const SKILL_DRAG_ACTIVE_CLASS = 'skill-drag-active';
const SKILL_DRAG_PREVIEW_CLASS = 'skill-drag-preview';
const SKILL_DRAG_ICON_SIZE = 42;

let activeDragGhost: HTMLElement | null = null;
let documentDragOverHandler: ((event: DragEvent) => void) | null = null;

function removeSkillDragGhost(): void {
  activeDragGhost?.remove();
  activeDragGhost = null;
}

function createSkillDragGhost(icon: HTMLImageElement): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = SKILL_DRAG_PREVIEW_CLASS;

  const img = document.createElement('img');
  img.src = icon.currentSrc || icon.src;
  img.alt = '';
  img.draggable = false;
  img.width = SKILL_DRAG_ICON_SIZE;
  img.height = SKILL_DRAG_ICON_SIZE;
  ghost.appendChild(img);

  document.body.appendChild(ghost);
  return ghost;
}

export function applySkillDragImage(dragEvent: DragEvent, source: HTMLElement): void {
  const icon =
    (source.querySelector('.skill-row__icon') as HTMLImageElement | null) ??
    (source.querySelector('.skill-card-icon') as HTMLImageElement | null);
  if (!icon || !dragEvent.dataTransfer) return;

  removeSkillDragGhost();
  const ghost = createSkillDragGhost(icon);
  const offset = SKILL_DRAG_ICON_SIZE / 2;
  dragEvent.dataTransfer.setDragImage(ghost, offset, offset);
  activeDragGhost = ghost;
}

export function beginSkillDragSession(dragEvent: DragEvent, source: HTMLElement): void {
  applySkillDragImage(dragEvent, source);
  document.body.classList.add(SKILL_DRAG_ACTIVE_CLASS);

  documentDragOverHandler = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };
  document.addEventListener('dragover', documentDragOverHandler);
}

export function endSkillDragSession(): void {
  document.body.classList.remove(SKILL_DRAG_ACTIVE_CLASS);
  if (documentDragOverHandler) {
    document.removeEventListener('dragover', documentDragOverHandler);
    documentDragOverHandler = null;
  }
  removeSkillDragGhost();
}
