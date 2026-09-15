const PORTAL_ID = 'enemy-tooltip-portal';

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'enemy-tooltip-portal hidden';
  portal.setAttribute('role', 'tooltip');
  document.body.appendChild(portal);
  return portal;
}

function positionPortal(portal: HTMLElement, anchor: DOMRect): void {
  const margin = 8;
  portal.style.visibility = 'hidden';
  portal.classList.remove('hidden');

  const portalRect = portal.getBoundingClientRect();
  let top = anchor.top - portalRect.height - margin;
  let left = anchor.left + anchor.width / 2 - portalRect.width / 2;

  const maxLeft = window.innerWidth - portalRect.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  const modalHeader = document.querySelector(
    '.modal-root:not(.hidden) .modal-header',
  ) as HTMLElement | null;
  const headerBottom = modalHeader?.getBoundingClientRect().bottom ?? 0;
  const minTop = Math.max(margin, headerBottom + margin);
  const maxTop = window.innerHeight - portalRect.height - margin;

  if (top < minTop) {
    const below = anchor.bottom + margin;
    const spaceAbove = anchor.top - minTop;
    const spaceBelow = window.innerHeight - anchor.bottom - margin;
    top = spaceBelow >= spaceAbove ? below : minTop;
  }

  top = Math.max(minTop, Math.min(top, Math.max(minTop, maxTop)));

  portal.style.top = `${top}px`;
  portal.style.left = `${left}px`;
  portal.style.visibility = 'visible';
}

function hidePortal(): void {
  const portal = document.getElementById(PORTAL_ID);
  if (!portal) return;
  portal.classList.add('hidden');
  portal.style.visibility = '';
  portal.innerHTML = '';
}

function showPortal(card: HTMLElement): void {
  const tooltip = card.querySelector('.enemy-tooltip-content');
  if (!tooltip) return;

  const portal = ensurePortal();
  portal.className = 'enemy-tooltip-portal';
  portal.innerHTML = tooltip.innerHTML;
  positionPortal(portal, card.getBoundingClientRect());
}

export function bindEnemyTooltips(container: HTMLElement): void {
  container.querySelectorAll('[data-enemy-tooltip]').forEach((cardElement) => {
    const card = cardElement as HTMLElement;

    const onShow = () => showPortal(card);
    const onHide = () => hidePortal();

    card.addEventListener('mouseenter', onShow);
    card.addEventListener('mouseleave', onHide);
    card.addEventListener('focus', onShow);
    card.addEventListener('blur', onHide);
  });
}

export function hideEnemyTooltip(): void {
  hidePortal();
}
