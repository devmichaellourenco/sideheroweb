const PORTAL_ID = 'hero-tooltip-portal';

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'hero-tooltip-portal hidden';
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

  if (top < margin) {
    top = anchor.bottom + margin;
  }

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
  const tooltip = card.querySelector('.hero-tooltip-content');
  if (!tooltip) return;

  const portal = ensurePortal();
  portal.className = 'hero-tooltip-portal';
  portal.innerHTML = tooltip.innerHTML;
  positionPortal(portal, card.getBoundingClientRect());
}

export function bindHeroTooltips(container: HTMLElement): void {
  container.querySelectorAll('[data-hero-tooltip]').forEach((cardElement) => {
    const card = cardElement as HTMLElement;

    const onShow = () => showPortal(card);
    const onHide = () => hidePortal();

    card.addEventListener('mouseenter', onShow);
    card.addEventListener('mouseleave', onHide);
    card.addEventListener('focus', onShow);
    card.addEventListener('blur', onHide);
  });
}

export function hideHeroTooltip(): void {
  hidePortal();
}
