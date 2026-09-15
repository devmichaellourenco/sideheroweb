import {
  getMenuTooltipCopy,
  isMenuTooltipId,
  MENU_TOOLTIP_KIND_LABEL,
  type MenuTooltipId,
} from './MenuTooltipCatalog';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type MenuTooltipContent = {
  id: MenuTooltipId;
  title: string;
  flavor: string;
  kindLabel: string;
  detail?: string;
};

export function resolveMenuTooltipContent(anchor: HTMLElement): MenuTooltipContent | null {
  const rawId = anchor.dataset.menuTooltip;
  if (!rawId || !isMenuTooltipId(rawId)) return null;

  const copy = getMenuTooltipCopy(rawId);
  const title = anchor.dataset.menuTooltipTitle?.trim() || copy.title;
  const detail = anchor.dataset.menuTooltipDetail?.trim() || undefined;

  return {
    id: rawId,
    title,
    flavor: copy.flavor,
    kindLabel: MENU_TOOLTIP_KIND_LABEL[copy.kind],
    detail,
  };
}

export function renderMenuTooltipHtml(content: MenuTooltipContent): string {
  const detail = content.detail
    ? `<p class="menu-tooltip-detail">${escapeHtml(content.detail)}</p>`
    : '';

  return `
    <div class="menu-tooltip-card">
      <span class="menu-tooltip-kind">${escapeHtml(content.kindLabel)}</span>
      <strong class="menu-tooltip-title">${escapeHtml(content.title)}</strong>
      <p class="menu-tooltip-flavor">${escapeHtml(content.flavor)}</p>
      ${detail}
    </div>
  `;
}

export function applyMenuTooltipAnchor(
  anchor: HTMLElement,
  id: MenuTooltipId,
  options: { title?: string; detail?: string } = {},
): void {
  anchor.dataset.menuTooltip = id;
  if (options.title) {
    anchor.dataset.menuTooltipTitle = options.title;
  } else {
    delete anchor.dataset.menuTooltipTitle;
  }
  if (options.detail) {
    anchor.dataset.menuTooltipDetail = options.detail;
  } else {
    delete anchor.dataset.menuTooltipDetail;
  }
  anchor.removeAttribute('title');
}
