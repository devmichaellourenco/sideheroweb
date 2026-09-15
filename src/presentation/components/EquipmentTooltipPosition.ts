export type TooltipAnchorBox = {
  top: number;
  bottom: number;
  left: number;
  width: number;
};

export type TooltipPortalBox = {
  width: number;
  height: number;
};

/**
 * Prefers placing the tooltip above the anchor. Flips below only when above
 * does not fit and below fully fits in the viewport. If below would clip,
 * keeps the tooltip above (clamped into the viewport).
 */
export function resolveEquipmentTooltipPosition(params: {
  anchor: TooltipAnchorBox;
  portal: TooltipPortalBox;
  viewportWidth: number;
  viewportHeight: number;
  minTop: number;
  margin?: number;
}): { top: number; left: number } {
  const margin = params.margin ?? 8;
  const { anchor, portal, viewportWidth, viewportHeight, minTop } = params;

  let left = anchor.left + anchor.width / 2 - portal.width / 2;
  const maxLeft = viewportWidth - portal.width - margin;
  left = Math.max(margin, Math.min(left, maxLeft));

  const aboveTop = anchor.top - portal.height - margin;
  const belowTop = anchor.bottom + margin;
  const maxTop = Math.max(margin, viewportHeight - portal.height - margin);
  const aboveFits = aboveTop >= minTop;
  const belowFits = belowTop + portal.height <= viewportHeight - margin;

  let top: number;
  if (aboveFits) {
    top = aboveTop;
  } else if (belowFits) {
    top = belowTop;
  } else {
    // Prefer upward when the bottom would clip the details.
    top = Math.min(Math.max(aboveTop, margin), maxTop);
  }

  return { top, left };
}
