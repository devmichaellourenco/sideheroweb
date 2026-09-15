import { GearSlotKey } from '../components/GearPresentation';
import { hideInventoryGearTooltip } from '../components/InventoryGearTooltipBinder';
import {
  canDropGearOnSlot,
  GearDragSource,
  parseGearDragSource,
  serializeGearDragSource,
} from './GearDragDropPolicy';

const GEAR_MIME = 'application/x-side-hero-gear';
const PARTY_MIME = 'application/x-side-hero-party';
const PARTY_DRAG_ACTIVE_CLASS = 'party-drag-active';

let partyDocumentDragOverHandler: ((event: DragEvent) => void) | null = null;

function beginPartyDragSession(): void {
  document.body.classList.add(PARTY_DRAG_ACTIVE_CLASS);
  if (partyDocumentDragOverHandler) return;
  partyDocumentDragOverHandler = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };
  document.addEventListener('dragover', partyDocumentDragOverHandler);
}

function endPartyDragSession(): void {
  document.body.classList.remove(PARTY_DRAG_ACTIVE_CLASS);
  if (!partyDocumentDragOverHandler) return;
  document.removeEventListener('dragover', partyDocumentDragOverHandler);
  partyDocumentDragOverHandler = null;
}

export type GearDragDropHandlers = {
  canEditGear: () => boolean;
  canEditParty: () => boolean;
  onEquip: (heroId: string, gearId: string) => void;
  onUnequip: (heroId: string, slot: GearSlotKey) => void;
  onMoveToStash: (gearId: string) => void;
  onMoveFromStash: (gearId: string) => void;
  onMoveFromStashThenEquip: (gearId: string, heroId: string) => void;
  onEquippedToStash: (heroId: string, slot: GearSlotKey, gearId: string) => void;
  onMoveEquippedGear: (
    source: { heroId: string; slot: GearSlotKey; gearId: string },
    target: { heroId: string; slot: GearSlotKey },
  ) => void;
  onDestroyGear: (source: GearDragSource) => void;
  onBuyAndEquipShopOffer: (offerId: string, heroId: string) => void;
  onPartySlotDrop: (heroId: string, targetIndex: number) => void;
  onPartyActiveToBench: (heroId: string) => void;
  onPartyReorder: (fromIndex: number, toIndex: number) => void;
};

function isInteractiveChild(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('button, a, input, select, textarea'));
}

function isDragSource(target: EventTarget | null): boolean {
  return Boolean(
    (target as HTMLElement | null)?.closest('[data-drag-gear], [data-drag-party-hero]'),
  );
}

function clearDropHighlights(root: HTMLElement): void {
  root.querySelectorAll('.gear-drop-target--active, .gear-drop-target--valid, .gear-drop-target--invalid').forEach((el) => {
    el.classList.remove('gear-drop-target--active', 'gear-drop-target--valid', 'gear-drop-target--invalid');
  });
  root.querySelectorAll('.party-drop-target--active').forEach((el) => {
    el.classList.remove('party-drop-target--active');
  });
}

function resolveGearDropTarget(element: HTMLElement): { heroId: string; slot: GearSlotKey } | null {
  const slotEl = element.closest('[data-drop-gear-hero][data-drop-gear-slot]') as HTMLElement | null;
  if (!slotEl) return null;
  const heroId = slotEl.getAttribute('data-drop-gear-hero');
  const slot = slotEl.getAttribute('data-drop-gear-slot') as GearSlotKey | null;
  if (!heroId || !slot) return null;
  return { heroId, slot };
}

function handleGearDrop(source: GearDragSource, target: HTMLElement, handlers: GearDragDropHandlers): void {
  const zone = target.closest('[data-drop-zone]')?.getAttribute('data-drop-zone');
  const slotTarget = resolveGearDropTarget(target);

  if (zone === 'destroy') {
    if (source.kind === 'inventory' || source.kind === 'stash') {
      handlers.onDestroyGear(source);
    }
    return;
  }

  if (zone === 'inventory') {
    if (source.kind === 'equipped') {
      handlers.onUnequip(source.heroId, source.slot);
      return;
    }
    if (source.kind === 'stash') {
      handlers.onMoveFromStash(source.gearId);
    }
    return;
  }

  if (zone === 'stash') {
    if (source.kind === 'inventory') {
      handlers.onMoveToStash(source.gearId);
      return;
    }
    if (source.kind === 'equipped') {
      handlers.onEquippedToStash(source.heroId, source.slot, source.gearId);
    }
    return;
  }

  if (!slotTarget) return;

  if (source.kind === 'equipped' && source.heroId === slotTarget.heroId && source.slot === slotTarget.slot) {
    return;
  }

  if (!canDropGearOnSlot(source.slot, slotTarget.slot)) return;

  if (source.kind === 'shop') {
    handlers.onBuyAndEquipShopOffer(source.offerId, slotTarget.heroId);
    return;
  }

  if (source.kind === 'inventory') {
    handlers.onEquip(slotTarget.heroId, source.gearId);
    return;
  }

  if (source.kind === 'stash') {
    handlers.onMoveFromStashThenEquip(source.gearId, slotTarget.heroId);
    return;
  }

  if (source.kind === 'equipped') {
    handlers.onMoveEquippedGear(
      { heroId: source.heroId, slot: source.slot, gearId: source.gearId },
      slotTarget,
    );
  }
}

function previewGearDrop(source: GearDragSource, target: HTMLElement): 'valid' | 'invalid' | null {
  const zone = target.closest('[data-drop-zone]')?.getAttribute('data-drop-zone');
  if (zone === 'destroy') {
    return source.kind === 'inventory' || source.kind === 'stash' ? 'valid' : null;
  }
  if (zone === 'inventory') {
    return source.kind === 'equipped' || source.kind === 'stash' ? 'valid' : null;
  }
  if (zone === 'stash') {
    return source.kind === 'inventory' || source.kind === 'equipped' ? 'valid' : null;
  }

  const slotTarget = resolveGearDropTarget(target);
  if (!slotTarget) return null;
  if (source.kind === 'equipped' && source.heroId === slotTarget.heroId && source.slot === slotTarget.slot) {
    return null;
  }
  return canDropGearOnSlot(source.slot, slotTarget.slot) ? 'valid' : 'invalid';
}

function markDropTarget(element: HTMLElement, preview: 'valid' | 'invalid'): void {
  element.classList.add('gear-drop-target--active');
  element.classList.add(preview === 'valid' ? 'gear-drop-target--valid' : 'gear-drop-target--invalid');
}

function highlightGearTarget(target: HTMLElement, source: GearDragSource): void {
  const preview = previewGearDrop(source, target);
  if (!preview) return;

  const slotEl = target.closest('[data-drop-gear-hero], [data-drop-zone]') as HTMLElement | null;
  if (!slotEl) return;

  markDropTarget(slotEl, preview);
}

/** Destinos válidos já destacados no início do drag (sem precisar passar o mouse). */
function highlightCompatibleGearTargets(root: HTMLElement, source: GearDragSource): void {
  root.querySelectorAll('[data-drop-gear-hero][data-drop-gear-slot]').forEach((element) => {
    const slotEl = element as HTMLElement;
    const heroId = slotEl.getAttribute('data-drop-gear-hero');
    const slot = slotEl.getAttribute('data-drop-gear-slot') as GearSlotKey | null;
    if (!heroId || !slot) return;

    if (source.kind === 'equipped' && source.heroId === heroId && source.slot === slot) {
      return;
    }
    if (!canDropGearOnSlot(source.slot, slot)) return;

    markDropTarget(slotEl, 'valid');
  });

  if (source.kind === 'equipped' || source.kind === 'stash') {
    root.querySelectorAll('[data-drop-zone="inventory"]').forEach((element) => {
      markDropTarget(element as HTMLElement, 'valid');
    });
  }

  if (source.kind === 'inventory' || source.kind === 'equipped') {
    root.querySelectorAll('[data-drop-zone="stash"]').forEach((element) => {
      markDropTarget(element as HTMLElement, 'valid');
    });
  }

  if (source.kind === 'inventory' || source.kind === 'stash') {
    root.querySelectorAll('[data-drop-zone="destroy"]').forEach((element) => {
      markDropTarget(element as HTMLElement, 'valid');
    });
  }
}

export function bindGearDragDrop(root: HTMLElement, handlers: GearDragDropHandlers): () => void {
  let activeGearSource: GearDragSource | null = null;
  let activePartyHeroId: string | null = null;
  let activePartyFromIndex: number | null = null;

  const onDragStart = (event: DragEvent) => {
    if (isInteractiveChild(event.target) && !isDragSource(event.target)) {
      event.preventDefault();
      return;
    }

    const partyEl = (event.target as HTMLElement).closest('[data-drag-party-hero]') as HTMLElement | null;
    if (partyEl) {
      if (!handlers.canEditParty()) {
        event.preventDefault();
        return;
      }
      const heroId = partyEl.getAttribute('data-drag-party-hero');
      if (!heroId) return;
      activePartyHeroId = heroId;
      const fromIndexRaw = partyEl.getAttribute('data-party-from-index');
      activePartyFromIndex = fromIndexRaw !== null ? Number(fromIndexRaw) : -1;
      event.dataTransfer?.setData(PARTY_MIME, heroId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      partyEl.classList.add('party-dragging');
      beginPartyDragSession();
      return;
    }

    if (!handlers.canEditGear()) {
      event.preventDefault();
      return;
    }

    const gearEl = (event.target as HTMLElement).closest('[data-drag-gear]') as HTMLElement | null;
    if (!gearEl) return;

    const source = parseGearDragSource(gearEl.getAttribute('data-drag-gear'));
    if (!source) return;

    activeGearSource = source;
    if (event.dataTransfer) {
      event.dataTransfer.setData(GEAR_MIME, serializeGearDragSource(source));
      event.dataTransfer.effectAllowed = 'move';
    }
    gearEl.classList.add('gear-dragging');
    hideInventoryGearTooltip(true);
    clearDropHighlights(root);
    highlightCompatibleGearTargets(root, source);
  };

  const onDragOver = (event: DragEvent) => {
    if (activePartyHeroId) {
      if (!handlers.canEditParty()) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';

      const dropEl = (event.target as HTMLElement).closest(
        '[data-drop-party-slot], [data-drop-party-bench]',
      ) as HTMLElement | null;
      clearDropHighlights(root);
      if (dropEl) {
        dropEl.classList.add('party-drop-target--active');
      }
      return;
    }

    if (!activeGearSource || !handlers.canEditGear()) return;

    const dropEl = (event.target as HTMLElement).closest(
      '[data-drop-gear-hero], [data-drop-zone]',
    ) as HTMLElement | null;
    if (!dropEl) {
      clearDropHighlights(root);
      highlightCompatibleGearTargets(root, activeGearSource);
      return;
    }

    const preview = previewGearDrop(activeGearSource, dropEl);
    clearDropHighlights(root);
    highlightCompatibleGearTargets(root, activeGearSource);
    if (!preview) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = preview === 'valid' ? 'move' : 'none';
    }
    highlightGearTarget(dropEl, activeGearSource);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    clearDropHighlights(root);

    if (activePartyHeroId) {
      const heroId = activePartyHeroId;
      activePartyHeroId = null;

      if (!handlers.canEditParty()) return;

      const benchDrop = (event.target as HTMLElement).closest('[data-drop-party-bench]');
      if (benchDrop) {
        if ((activePartyFromIndex ?? -1) >= 0) {
          handlers.onPartyActiveToBench(heroId);
        }
        return;
      }

      const slotDrop = (event.target as HTMLElement).closest('[data-drop-party-slot]') as HTMLElement | null;
      if (!slotDrop) return;

      const targetIndex = Number(slotDrop.getAttribute('data-drop-party-slot'));
      if (Number.isNaN(targetIndex)) return;

      activePartyFromIndex = null;
      handlers.onPartySlotDrop(heroId, targetIndex);
      return;
    }

    const raw = event.dataTransfer?.getData(GEAR_MIME) ?? null;
    const source = activeGearSource ?? parseGearDragSource(raw);
    activeGearSource = null;
    if (!source || !handlers.canEditGear()) return;

    handleGearDrop(source, event.target as HTMLElement, handlers);
  };

  const onDragEnd = () => {
    activeGearSource = null;
    activePartyHeroId = null;
    activePartyFromIndex = null;
    clearDropHighlights(root);
    endPartyDragSession();
    root.querySelectorAll('.gear-dragging, .party-dragging').forEach((el) => {
      el.classList.remove('gear-dragging', 'party-dragging');
    });
  };

  root.addEventListener('dragstart', onDragStart);
  root.addEventListener('dragover', onDragOver);
  root.addEventListener('drop', onDrop);
  root.addEventListener('dragend', onDragEnd);

  return () => {
    endPartyDragSession();
    root.removeEventListener('dragstart', onDragStart);
    root.removeEventListener('dragover', onDragOver);
    root.removeEventListener('drop', onDrop);
    root.removeEventListener('dragend', onDragEnd);
  };
}

export function gearDragAttr(source: GearDragSource): string {
  return `draggable="true" data-drag-gear="${encodeURIComponent(serializeGearDragSource(source))}"`;
}

export function gearDropTargetAttr(heroId: string, slot: GearSlotKey): string {
  return `data-drop-gear-hero="${heroId}" data-drop-gear-slot="${slot}"`;
}
