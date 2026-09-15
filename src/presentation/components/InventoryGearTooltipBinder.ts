import { GEAR_RARITY_ORDER } from './GearRarityPresentation';

const PORTAL_ID = 'inventory-gear-tooltip-portal';
const PORTAL_Z_INDEX = 1600;
const PINNED_BRIDGE_MS = 80;
const SLOT_PINNED_CLASS = 'inventory-grid-slot--tooltip-pinned';

type TooltipInteractionState = {
  pinned: boolean;
  pinnedSlot: HTMLElement | null;
  pinnedGearId: string | null;
  slotHovered: boolean;
  portalHovered: boolean;
};

const interaction: TooltipInteractionState = {
  pinned: false,
  pinnedSlot: null,
  pinnedGearId: null,
  slotHovered: false,
  portalHovered: false,
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activeSlot: HTMLElement | null = null;
let scrollContainer: HTMLElement | null = null;

function getRarityClass(element: Element): string {
  for (let i = GEAR_RARITY_ORDER.length - 1; i >= 0; i -= 1) {
    const rarity = GEAR_RARITY_ORDER[i];
    if (element.classList.contains(rarity)) return rarity;
  }
  return '';
}

export function resolveInventorySlotGearId(slot: Element): string | null {
  return (
    slot.getAttribute('data-forge-gear-id') ??
    slot.getAttribute('data-inventory-gear-id') ??
    slot.getAttribute('data-stash-gear-id')
  );
}

function cancelScheduledHide(): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function clearSlotPinVisual(): void {
  document.querySelectorAll(`.${SLOT_PINNED_CLASS}`).forEach((element) => {
    element.classList.remove(SLOT_PINNED_CLASS);
  });
}

function setSlotPinned(slot: HTMLElement): void {
  clearSlotPinVisual();
  slot.classList.add(SLOT_PINNED_CLASS);
  interaction.pinnedSlot = slot;
  interaction.pinnedGearId = resolveInventorySlotGearId(slot);
  interaction.pinned = true;
}

function resetInteraction(): void {
  interaction.pinned = false;
  interaction.pinnedSlot = null;
  interaction.pinnedGearId = null;
  interaction.slotHovered = false;
  interaction.portalHovered = false;
  clearSlotPinVisual();
  cancelScheduledHide();
}

function applyPortalPointerMode(portal: HTMLElement): void {
  if (interaction.pinned) {
    portal.dataset.pinned = 'true';
  } else {
    delete portal.dataset.pinned;
  }
}

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'gear-tooltip-portal gear-tooltip-portal--interactive hidden';
  portal.style.zIndex = String(PORTAL_Z_INDEX);
  portal.setAttribute('role', 'tooltip');

  portal.addEventListener('mouseenter', () => {
    if (!interaction.pinned) return;
    interaction.portalHovered = true;
    cancelScheduledHide();
  });
  portal.addEventListener('mouseleave', () => {
    interaction.portalHovered = false;
    if (!interaction.pinned) {
      hideInventoryGearTooltip();
      return;
    }
    scheduleVisibilityCheck();
  });

  document.body.appendChild(portal);
  return portal;
}

function positionPortal(portal: HTMLElement, anchor: DOMRect): void {
  const margin = 8;
  const overlap = 8;

  portal.classList.remove('hidden');
  portal.style.visibility = 'hidden';

  const portalRect = portal.getBoundingClientRect();
  let top = anchor.top - portalRect.height + overlap;
  let placement: 'above' | 'below' = 'above';

  if (top < margin) {
    top = anchor.bottom - overlap;
    placement = 'below';
  }

  let left = anchor.left + anchor.width / 2 - portalRect.width / 2;
  const maxLeft = window.innerWidth - portalRect.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  portal.style.top = `${top}px`;
  portal.style.left = `${left}px`;
  portal.dataset.placement = placement;
  portal.style.visibility = 'visible';
}

function detachScrollListener(): void {
  if (!scrollContainer) return;
  scrollContainer.removeEventListener('scroll', repositionActiveTooltip);
  scrollContainer = null;
}

function repositionActiveTooltip(): void {
  const portal = document.getElementById(PORTAL_ID);
  if (!portal || portal.classList.contains('hidden') || !activeSlot) return;
  if (!activeSlot.isConnected) return;
  positionPortal(portal, activeSlot.getBoundingClientRect());
}

function attachScrollListener(slot: HTMLElement): void {
  const nextContainer = slot.closest('.modal-body') as HTMLElement | null;
  if (scrollContainer === nextContainer) return;

  detachScrollListener();
  scrollContainer = nextContainer;
  scrollContainer?.addEventListener('scroll', repositionActiveTooltip, { passive: true });
}

function updateVisibility(): void {
  if (interaction.pinned) {
    if (interaction.slotHovered || interaction.portalHovered) return;
    hideInventoryGearTooltip();
    return;
  }

  if (!interaction.slotHovered) {
    hideInventoryGearTooltip();
  }
}

function scheduleVisibilityCheck(): void {
  cancelScheduledHide();
  const delay = interaction.pinned ? PINNED_BRIDGE_MS : 0;
  hideTimer = window.setTimeout(() => {
    hideTimer = null;
    updateVisibility();
  }, delay);
}

function showPortal(slot: HTMLElement, tooltip: HTMLElement): void {
  cancelScheduledHide();
  interaction.slotHovered = true;

  const portal = ensurePortal();
  const rarity = getRarityClass(slot);
  const slotChanged = activeSlot !== slot;

  portal.className = 'gear-tooltip-portal gear-tooltip-portal--interactive';
  if (rarity) portal.classList.add(rarity);
  portal.style.zIndex = String(PORTAL_Z_INDEX);
  applyPortalPointerMode(portal);

  if (slotChanged) {
    portal.innerHTML = tooltip.innerHTML;
    activeSlot = slot;
  }

  positionPortal(portal, slot.getBoundingClientRect());
  attachScrollListener(slot);
}

function pinAndShow(slot: HTMLElement): void {
  const tooltip = slot.querySelector('.inventory-gear-tooltip-content');
  if (!tooltip) return;

  setSlotPinned(slot);
  interaction.slotHovered = true;
  interaction.portalHovered = false;
  showPortal(slot, tooltip as HTMLElement);
  applyPortalPointerMode(ensurePortal());
}

export function hideInventoryGearTooltip(_force = false): void {
  cancelScheduledHide();
  activeSlot = null;
  detachScrollListener();
  resetInteraction();

  const portal = document.getElementById(PORTAL_ID);
  if (!portal) return;

  delete portal.dataset.pinned;
  delete portal.dataset.placement;
  portal.classList.add('hidden');
  portal.style.visibility = '';
  portal.innerHTML = '';
}

/**
 * Após re-render da grade (innerHTML), reaplica o pin no slot do mesmo gearId.
 * Se o item sumiu, esconde o tooltip.
 */
export function reanchorPinnedInventoryGearTooltip(root: ParentNode = document): void {
  if (!interaction.pinned || !interaction.pinnedGearId) return;

  const gearId = interaction.pinnedGearId;
  const slot = root.querySelector(
    `[data-forge-gear-id="${CSS.escape(gearId)}"], [data-inventory-gear-id="${CSS.escape(gearId)}"], [data-stash-gear-id="${CSS.escape(gearId)}"]`,
  ) as HTMLElement | null;

  if (!slot?.querySelector('.inventory-gear-tooltip-content')) {
    hideInventoryGearTooltip();
    return;
  }

  pinAndShow(slot);
}

function handlePointerOver(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const portal = document.getElementById(PORTAL_ID);
  if (portal && portal.contains(target)) {
    if (interaction.pinned) {
      cancelScheduledHide();
      interaction.portalHovered = true;
    }
    return;
  }

  const slot = target.closest('.inventory-grid-slot') as HTMLElement | null;
  if (!slot) return;

  const tooltip = slot.querySelector('.inventory-gear-tooltip-content');
  if (!tooltip) return;

  if (interaction.pinned && interaction.pinnedSlot && interaction.pinnedSlot !== slot) {
    hideInventoryGearTooltip();
  }

  showPortal(slot, tooltip as HTMLElement);
}

function handlePointerOut(event: Event): void {
  const mouseEvent = event as MouseEvent;
  const related = mouseEvent.relatedTarget as Node | null;

  if (activeSlot && related && activeSlot.contains(related)) {
    return;
  }

  interaction.slotHovered = false;

  if (!interaction.pinned) {
    hideInventoryGearTooltip();
    return;
  }

  const portal = document.getElementById(PORTAL_ID);
  if (portal && related && portal.contains(related)) {
    interaction.portalHovered = true;
    cancelScheduledHide();
    return;
  }

  scheduleVisibilityCheck();
}

function handleSlotClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  if (
    target.closest(
      '.inventory-gear-tooltip-action, .gear-destroy-btn, [data-inventory-equip], [data-pick-gear], [data-move-to-stash], [data-move-from-stash], [data-destroy-gear]',
    )
  ) {
    return;
  }

  const slot = target.closest('.inventory-grid-slot') as HTMLElement | null;
  if (!slot?.querySelector('.inventory-gear-tooltip-content')) return;

  pinAndShow(slot);

  // Forja / picker: deixa o clique prosseguir (seleção ou equipar).
  if (slot.hasAttribute('data-forge-gear-id') || slot.hasAttribute('data-pick-gear')) {
    return;
  }

  // Inventário / baú: clique só seleciona (pin); ações ficam no tooltip.
  event.stopPropagation();
  event.preventDefault();
}

export function isInventoryGearTooltipPinned(): boolean {
  return interaction.pinned;
}

export function bindInventoryGearTooltips(container: HTMLElement): void {
  if (container.dataset.gridTooltipsBound === 'true') return;
  container.dataset.gridTooltipsBound = 'true';

  container.addEventListener('mouseover', handlePointerOver);
  container.addEventListener('mouseout', handlePointerOut);
  container.addEventListener('click', handleSlotClick, true);

  container.addEventListener('focusin', (event) => {
    const slot = (event.target as HTMLElement).closest('.inventory-grid-slot') as HTMLElement | null;
    if (!slot) return;
    const tooltip = slot.querySelector('.inventory-gear-tooltip-content');
    if (!tooltip) return;
    showPortal(slot, tooltip as HTMLElement);
  });

  container.addEventListener('focusout', () => {
    interaction.slotHovered = false;
    if (!interaction.pinned) {
      hideInventoryGearTooltip();
      return;
    }
    scheduleVisibilityCheck();
  });
}
