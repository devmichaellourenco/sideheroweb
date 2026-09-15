const PORTAL_ID = 'campaign-tooltip-portal';

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'campaign-tooltip-portal hidden';
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
  const tooltip = anchor.querySelector('.campaign-tooltip-content');
  if (!tooltip) return;

  const portal = ensurePortal();
  const theme = anchor.getAttribute('data-campaign-theme');
  portal.className = 'campaign-tooltip-portal';
  if (theme) {
    portal.setAttribute('data-campaign-theme', theme);
  } else {
    portal.removeAttribute('data-campaign-theme');
  }
  portal.innerHTML = tooltip.innerHTML;
  positionPortal(portal, anchor.getBoundingClientRect());
}

export function bindCampaignTooltips(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('[data-campaign-tooltip]').forEach((anchor) => {
    bindCampaignTooltip(anchor);
  });
}

export function bindCampaignTooltip(anchor: HTMLElement): void {
  if (anchor.dataset.campaignTooltipBound === 'true') return;
  anchor.dataset.campaignTooltipBound = 'true';

  const onShow = () => showPortal(anchor);
  const onHide = () => hidePortal();

  anchor.addEventListener('mouseenter', onShow);
  anchor.addEventListener('mouseleave', onHide);
  anchor.addEventListener('focus', onShow);
  anchor.addEventListener('blur', onHide);
}

export function hideCampaignTooltip(): void {
  hidePortal();
}
