import {
  renderMenuTooltipHtml,
  resolveMenuTooltipContent,
} from './MenuTooltipPresentation';

const PORTAL_ID = 'menu-tooltip-portal';

let activeAnchor: HTMLElement | null = null;
let delegationBound = false;

function ensurePortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = PORTAL_ID;
  portal.className = 'menu-tooltip-portal hidden';
  portal.setAttribute('role', 'tooltip');
  document.body.appendChild(portal);
  return portal;
}

function positionPortal(portal: HTMLElement, anchor: DOMRect): void {
  const margin = 10;
  portal.style.visibility = 'hidden';
  portal.classList.remove('hidden');

  const portalRect = portal.getBoundingClientRect();
  let top = anchor.top - portalRect.height - margin;
  let left = anchor.left + anchor.width / 2 - portalRect.width / 2;
  let placement: 'above' | 'below' = 'above';

  const maxLeft = window.innerWidth - portalRect.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  if (top < margin) {
    top = anchor.bottom + margin;
    placement = 'below';
  }

  portal.dataset.placement = placement;
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
  delete portal.dataset.placement;
}

function showPortal(anchor: HTMLElement): void {
  const content = resolveMenuTooltipContent(anchor);
  if (!content) return;

  const portal = ensurePortal();
  portal.className = 'menu-tooltip-portal';
  portal.dataset.menuTooltipId = content.id;
  portal.innerHTML = renderMenuTooltipHtml(content);
  positionPortal(portal, anchor.getBoundingClientRect());
}

function handleMouseOver(event: MouseEvent): void {
  const anchor = (event.target as Element | null)?.closest('[data-menu-tooltip]') as HTMLElement | null;
  if (!anchor || anchor === activeAnchor) return;
  activeAnchor = anchor;
  showPortal(anchor);
}

function handleMouseOut(event: MouseEvent): void {
  const anchor = (event.target as Element | null)?.closest('[data-menu-tooltip]') as HTMLElement | null;
  if (!anchor || anchor !== activeAnchor) return;

  const related = event.relatedTarget as Node | null;
  if (related && anchor.contains(related)) return;

  activeAnchor = null;
  hidePortal();
}

function handleFocusIn(event: FocusEvent): void {
  const anchor = (event.target as Element | null)?.closest('[data-menu-tooltip]') as HTMLElement | null;
  if (!anchor) return;
  activeAnchor = anchor;
  showPortal(anchor);
}

function handleFocusOut(event: FocusEvent): void {
  const anchor = (event.target as Element | null)?.closest('[data-menu-tooltip]') as HTMLElement | null;
  if (!anchor || anchor !== activeAnchor) return;

  const related = event.relatedTarget as Node | null;
  if (related && anchor.contains(related)) return;

  activeAnchor = null;
  hidePortal();
}

export function bindMenuTooltips(): void {
  if (delegationBound) return;
  delegationBound = true;

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);
}

export function hideMenuTooltip(): void {
  activeAnchor = null;
  hidePortal();
}

/** Expõe estado para testes. */
export function getActiveMenuTooltipAnchor(): HTMLElement | null {
  return activeAnchor;
}

export function resetMenuTooltipBinderForTests(): void {
  hideMenuTooltip();
  if (!delegationBound) return;
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('focusin', handleFocusIn);
  document.removeEventListener('focusout', handleFocusOut);
  delegationBound = false;
}
