import { UpgradeNodeDto } from '../../application/dto/UpgradeNodeDto';

const TOOLTIP_PORTAL_ID = 'upgrade-node-tooltip-portal';
const PINNED_BRIDGE_MS = 80;
const UPGRADE_NODE_SELECTED_CLASS = 'upgrade-node--selected';

type TooltipInteractionState = {
  pinnedNodeId: string | null;
  pinnedAnchor: HTMLElement | null;
  nodeHovered: boolean;
  portalHovered: boolean;
};

const tooltipInteraction: TooltipInteractionState = {
  pinnedNodeId: null,
  pinnedAnchor: null,
  nodeHovered: false,
  portalHovered: false,
};

let tooltipHideTimer: number | null = null;

export function resetUpgradeNodeTooltipInteraction(): void {
  tooltipInteraction.pinnedNodeId = null;
  tooltipInteraction.pinnedAnchor = null;
  tooltipInteraction.nodeHovered = false;
  tooltipInteraction.portalHovered = false;
  clearUpgradeNodeSelection();
  cancelUpgradeTooltipHide();
}

function clearUpgradeNodeSelection(): void {
  document
    .querySelectorAll(`[data-upgrade-node].${UPGRADE_NODE_SELECTED_CLASS}`)
    .forEach((element) => {
      element.classList.remove(UPGRADE_NODE_SELECTED_CLASS);
      element.removeAttribute('aria-pressed');
    });
}

function setUpgradeNodeSelected(anchor: HTMLElement): void {
  clearUpgradeNodeSelection();
  anchor.classList.add(UPGRADE_NODE_SELECTED_CLASS);
  anchor.setAttribute('aria-pressed', 'true');
  tooltipInteraction.pinnedAnchor = anchor;
}

export function isUpgradeNodeTooltipPinned(): boolean {
  return tooltipInteraction.pinnedNodeId !== null;
}

export function bindUpgradeNodeTooltip(
  anchor: HTMLElement,
  node: UpgradeNodeDto,
  renderContent: (node: UpgradeNodeDto) => string,
  onPurchase: (upgradeId: string) => void,
): void {
  const show = () => {
    tooltipInteraction.nodeHovered = true;
    cancelUpgradeTooltipHide();
    showUpgradeNodeTooltip(anchor, node, renderContent(node));
  };

  const onNodeMouseLeave = () => {
    tooltipInteraction.nodeHovered = false;
    if (!tooltipInteraction.pinnedNodeId) {
      hideUpgradeNodeTooltip();
      return;
    }
    scheduleTooltipVisibilityCheck();
  };

  const onNodeBlur = () => {
    tooltipInteraction.nodeHovered = false;
    if (!tooltipInteraction.pinnedNodeId) {
      hideUpgradeNodeTooltip();
      return;
    }
    scheduleTooltipVisibilityCheck();
  };

  anchor.addEventListener('mouseenter', show);
  anchor.addEventListener('mouseleave', onNodeMouseLeave);
  anchor.addEventListener('focus', show);
  anchor.addEventListener('blur', onNodeBlur);
  anchor.addEventListener('click', (event) => {
    if (node.status === 'available') {
      event.preventDefault();
      event.stopPropagation();
      hideUpgradeNodeTooltip();
      onPurchase(node.id);
      return;
    }

    tooltipInteraction.pinnedNodeId = node.id;
    tooltipInteraction.nodeHovered = true;
    setUpgradeNodeSelected(anchor);
    show();
  });
}

function ensureTooltipPortal(): HTMLElement {
  let portal = document.getElementById(TOOLTIP_PORTAL_ID);
  if (portal) return portal;

  portal = document.createElement('div');
  portal.id = TOOLTIP_PORTAL_ID;
  portal.className = 'upgrade-node-tooltip-portal hidden';
  portal.setAttribute('role', 'tooltip');
  document.body.appendChild(portal);
  return portal;
}

function scheduleTooltipVisibilityCheck(): void {
  cancelUpgradeTooltipHide();
  const delay = tooltipInteraction.pinnedNodeId ? PINNED_BRIDGE_MS : 0;
  tooltipHideTimer = window.setTimeout(() => {
    updateTooltipVisibility();
    tooltipHideTimer = null;
  }, delay);
}

function updateTooltipVisibility(): void {
  if (tooltipInteraction.pinnedNodeId) {
    if (tooltipInteraction.nodeHovered || tooltipInteraction.portalHovered) return;
    hideUpgradeNodeTooltip();
    return;
  }

  if (!tooltipInteraction.nodeHovered) {
    hideUpgradeNodeTooltip();
  }
}

function cancelUpgradeTooltipHide(): void {
  if (tooltipHideTimer === null) return;
  window.clearTimeout(tooltipHideTimer);
  tooltipHideTimer = null;
}

function showUpgradeNodeTooltip(
  anchor: HTMLElement,
  node: UpgradeNodeDto,
  html: string,
): void {
  const portal = ensureTooltipPortal();
  portal.className = `upgrade-node-tooltip-portal upgrade-node-tooltip-portal--${node.status}`;
  portal.innerHTML = html;

  portal.onmouseenter = () => {
    if (!tooltipInteraction.pinnedNodeId) return;
    tooltipInteraction.portalHovered = true;
    cancelUpgradeTooltipHide();
  };

  portal.onmouseleave = () => {
    tooltipInteraction.portalHovered = false;
    if (!tooltipInteraction.pinnedNodeId) {
      hideUpgradeNodeTooltip();
      return;
    }
    scheduleTooltipVisibilityCheck();
  };

  const margin = 10;
  portal.style.visibility = 'hidden';
  portal.classList.remove('hidden');

  const anchorRect = anchor.getBoundingClientRect();
  const portalRect = portal.getBoundingClientRect();
  let top = anchorRect.bottom + margin;
  let left = anchorRect.left + anchorRect.width / 2 - portalRect.width / 2;

  const maxLeft = window.innerWidth - portalRect.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  if (top + portalRect.height > window.innerHeight - margin) {
    top = anchorRect.top - portalRect.height - margin;
  }

  portal.style.top = `${top}px`;
  portal.style.left = `${left}px`;
  portal.style.visibility = 'visible';
}

export function hideUpgradeNodeTooltip(): void {
  cancelUpgradeTooltipHide();
  resetUpgradeNodeTooltipInteraction();

  const portal = document.getElementById(TOOLTIP_PORTAL_ID);
  if (!portal) return;
  portal.classList.add('hidden');
  portal.style.visibility = '';
  portal.innerHTML = '';
  portal.onmouseenter = null;
  portal.onmouseleave = null;
}
