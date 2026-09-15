import { hideSkillChipTooltip } from '../components/SkillChipTooltipBinder';
import { beginSkillDragSession, endSkillDragSession } from './SkillDragPresentation';

const SKILL_MIME = 'application/x-side-hero-skill';

export interface SkillDragPayload {
  skillId: string;
}

export function serializeSkillDragPayload(payload: SkillDragPayload): string {
  return JSON.stringify(payload);
}

export function parseSkillDragPayload(raw: string): SkillDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as SkillDragPayload;
    if (!parsed?.skillId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const SKILL_DRAG_MIME = SKILL_MIME;

const SKILL_SLOT_SELECTOR =
  '.hero-detail-loadout [data-skill-slot-index]:not(.hero-skill-slot-bar__slot--fixed):not(.hero-skill-slot-bar__slot--locked):not(.loadout-slot--locked)';

const EMPTY_SKILL_SLOT_SELECTOR =
  '.hero-detail-loadout .hero-skill-slot-bar__slot--empty:not(.hero-skill-slot-bar__slot--locked)';

export function bindSkillSlotAssignment(
  container: HTMLElement,
  handlers: {
    onAssign: (skillId: string, slotIndex: number) => void;
    onClear: (skillId: string) => void;
    onEquipFirstAvailable: (skillId: string) => void;
  },
): void {
  const layoutRoot = container.querySelector('.hero-detail-layout');
  if (!layoutRoot) return;

  const hasSlotBar = Boolean(layoutRoot.querySelector('.hero-detail-loadout'));

  let pendingSkillId: string | null = null;
  let pendingSlotIndex: number | null = null;

  const clearPlacementMode = () => {
    pendingSkillId = null;
    pendingSlotIndex = null;
    layoutRoot.classList.remove('hero-skills-tab--skill-picked', 'hero-skills-tab--slot-picked');
    layoutRoot.querySelectorAll('.hero-skill-slot-bar__slot--pick-target').forEach((element) => {
      element.classList.remove('hero-skill-slot-bar__slot--pick-target');
    });
    layoutRoot.querySelectorAll('.skill-card--pick-target, .skill-row--pick-target').forEach((element) => {
      element.classList.remove('skill-card--pick-target', 'skill-row--pick-target');
    });
  };

  const listEmptySlotElements = (): HTMLElement[] =>
    Array.from(layoutRoot.querySelectorAll(EMPTY_SKILL_SLOT_SELECTOR)) as HTMLElement[];

  const selectSkill = (skillId: string) => {
    if (pendingSkillId === skillId) {
      clearPlacementMode();
      return;
    }

    pendingSlotIndex = null;
    pendingSkillId = skillId;
    layoutRoot.classList.remove('hero-skills-tab--slot-picked');
    layoutRoot.classList.add('hero-skills-tab--skill-picked');

    layoutRoot.querySelectorAll('.skill-card--pick-target, .skill-row--pick-target').forEach((element) => {
      element.classList.remove('skill-card--pick-target', 'skill-row--pick-target');
    });

    layoutRoot.querySelectorAll(SKILL_SLOT_SELECTOR).forEach((element) => {
      element.classList.add('hero-skill-slot-bar__slot--pick-target');
    });
  };

  const selectSlot = (slotIndex: number) => {
    if (pendingSlotIndex === slotIndex) {
      clearPlacementMode();
      return;
    }

    pendingSkillId = null;
    pendingSlotIndex = slotIndex;
    layoutRoot.classList.remove('hero-skills-tab--skill-picked');
    layoutRoot.classList.add('hero-skills-tab--slot-picked');

    layoutRoot.querySelectorAll('.hero-skill-slot-bar__slot--pick-target').forEach((element) => {
      element.classList.remove('hero-skill-slot-bar__slot--pick-target');
    });

    layoutRoot.querySelectorAll('[data-skill-equip]').forEach((element) => {
      element.classList.add('skill-card--pick-target', 'skill-row--pick-target');
    });
  };

  layoutRoot.querySelectorAll('[data-skill-slot-index]').forEach((element) => {
    if (element.classList.contains('hero-skill-slot-bar__slot--fixed')) return;
    if (
      element.classList.contains('hero-skill-slot-bar__slot--locked') ||
      element.classList.contains('loadout-slot--locked')
    ) {
      return;
    }

    const slotIndex = Number(element.getAttribute('data-skill-slot-index'));
    if (!Number.isInteger(slotIndex) || slotIndex < 1) return;

    element.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('[data-skill-slot-clear]')) return;

      event.stopPropagation();
      event.preventDefault();

      if (pendingSkillId) {
        handlers.onAssign(pendingSkillId, slotIndex);
        clearPlacementMode();
        return;
      }

      selectSlot(slotIndex);
    });

    element.addEventListener('dragenter', (event) => {
      event.preventDefault();
    });

    element.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      element.classList.add('hero-skill-slot-bar__slot--drop-target');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('hero-skill-slot-bar__slot--drop-target');
    });

    element.addEventListener('drop', (event) => {
      event.preventDefault();
      element.classList.remove('hero-skill-slot-bar__slot--drop-target');

      const raw = event.dataTransfer?.getData(SKILL_MIME);
      if (!raw) return;
      const payload = parseSkillDragPayload(raw);
      if (!payload) return;

      handlers.onAssign(payload.skillId, slotIndex);
      clearPlacementMode();
    });
  });

  layoutRoot.querySelectorAll('[data-skill-slot-clear]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      const skillId = button.getAttribute('data-skill-slot-clear');
      if (!skillId) return;
      handlers.onClear(skillId);
      clearPlacementMode();
    });
  });

  layoutRoot.querySelectorAll('[data-skill-equip]').forEach((element) => {
    const skillId = element.getAttribute('data-skill-equip');
    if (!skillId) return;

    element.addEventListener('dragstart', (event) => {
      const dragEvent = event as DragEvent;
      hideSkillChipTooltip();
      dragEvent.dataTransfer?.setData(SKILL_MIME, serializeSkillDragPayload({ skillId }));
      dragEvent.dataTransfer?.setData('text/plain', skillId);
      if (dragEvent.dataTransfer) dragEvent.dataTransfer.effectAllowed = 'move';
      beginSkillDragSession(dragEvent, element);
      element.classList.add('skill-card--dragging', 'skill-row--dragging');
      clearPlacementMode();
    });

    element.addEventListener('dragend', () => {
      endSkillDragSession();
      hideSkillChipTooltip();
      element.classList.remove('skill-card--dragging', 'skill-row--dragging');
    });

    element.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('button[data-skill-allocate], button[data-ascension-allocate], button[data-skill-refund], button[data-ascension-refund], button[data-skill-rank-tooltip]')) return;

      event.stopPropagation();

      if (pendingSlotIndex !== null) {
        handlers.onAssign(skillId, pendingSlotIndex);
        clearPlacementMode();
        return;
      }

      if (!hasSlotBar) {
        handlers.onEquipFirstAvailable(skillId);
        return;
      }

      const emptySlots = listEmptySlotElements();
      if (emptySlots.length === 1) {
        const slotIndex = Number(emptySlots[0].getAttribute('data-skill-slot-index'));
        if (Number.isInteger(slotIndex) && slotIndex >= 1) {
          handlers.onAssign(skillId, slotIndex);
          clearPlacementMode();
          return;
        }
      }

      selectSkill(skillId);
    });
  });

  layoutRoot.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        '[data-skill-equip], [data-skill-slot-index], [data-skill-slot-clear], [data-skill-allocate], [data-skill-refund], [data-ascension-allocate], [data-ascension-refund], [data-skill-rank-tooltip]',
      )
    ) {
      return;
    }
    clearPlacementMode();
  });
}
