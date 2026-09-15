const PORTAL_ID = 'hero-improvement-tooltip-portal';

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'hero-improvement-tooltip-portal hidden';
  portal.setAttribute('role', 'tooltip');
  document.body.appendChild(portal);
  return portal;
}

function positionPortal(portal: HTMLElement, anchor: DOMRect): void {
  const margin = 8;
  portal.style.visibility = 'hidden';
  portal.classList.remove('hidden');

  const portalRect = portal.getBoundingClientRect();
  let top = anchor.bottom + margin;
  let left = anchor.left + anchor.width / 2 - portalRect.width / 2;

  const maxLeft = window.innerWidth - portalRect.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  if (top + portalRect.height > window.innerHeight - margin) {
    top = anchor.top - portalRect.height - margin;
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

function showPortal(anchor: HTMLElement): void {
  const tooltip = anchor.querySelector('.hero-improvement-tooltip-content');
  if (!tooltip) return;

  const portal = ensurePortal();
  portal.className = 'hero-improvement-tooltip-portal';
  portal.innerHTML = tooltip.innerHTML;
  positionPortal(portal, anchor.getBoundingClientRect());
}

export function bindHeroImprovementTooltip(anchor: HTMLElement): void {
  if (anchor.dataset.heroImprovementTooltipBound === 'true') return;
  anchor.dataset.heroImprovementTooltipBound = 'true';

  const onShow = () => showPortal(anchor);
  const onHide = () => hidePortal();

  anchor.addEventListener('mouseenter', onShow);
  anchor.addEventListener('mouseleave', onHide);
  anchor.addEventListener('focus', onShow);
  anchor.addEventListener('blur', onHide);
}

export function bindHeroImprovementTooltips(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-hero-improvement-tooltip]').forEach((anchor) => {
    bindHeroImprovementTooltip(anchor);
  });
}

export function hideHeroImprovementTooltip(): void {
  hidePortal();
}
