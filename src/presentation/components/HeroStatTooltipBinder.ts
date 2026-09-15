const PORTAL_ID = 'hero-stat-tooltip-portal';

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'hero-stat-tooltip-portal hidden';
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

function showPortal(row: HTMLElement): void {
  const tooltip = row.querySelector('.hero-stat-tooltip-content');
  if (!tooltip) return;

  const portal = ensurePortal();
  portal.className = 'hero-stat-tooltip-portal';
  portal.innerHTML = tooltip.innerHTML;
  positionPortal(portal, row.getBoundingClientRect());
}

export function bindHeroStatTooltips(container: HTMLElement): void {
  container.querySelectorAll('[data-hero-stat-tooltip]').forEach((rowElement) => {
    const row = rowElement as HTMLElement;
    if (row.dataset.heroStatTooltipBound === 'true') return;
    row.dataset.heroStatTooltipBound = 'true';

    const onShow = () => showPortal(row);
    const onHide = () => hidePortal();

    row.addEventListener('mouseenter', onShow);
    row.addEventListener('mouseleave', onHide);
    row.addEventListener('focus', onShow);
    row.addEventListener('blur', onHide);
  });
}

export function hideHeroStatTooltip(): void {
  hidePortal();
}
