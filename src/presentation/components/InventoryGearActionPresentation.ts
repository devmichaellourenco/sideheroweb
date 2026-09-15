function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type InventoryGearActionKind = 'equip' | 'stash' | 'withdraw' | 'destroy';

const ACTION_ICONS: Record<InventoryGearActionKind, string> = {
  equip: `
    <svg class="inventory-gear-action-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M9.2 1.4 14.6 6.8l-1.1 1.1-1.4-1.4-2.7 2.7.6 3.3-1.2 1.2-2-2-2.6 2.6-.9-.9 2.6-2.6-2-2 1.2-1.2 3.3.6 2.7-2.7-1.4-1.4L9.2 1.4z"/>
    </svg>
  `.trim(),
  stash: `
    <svg class="inventory-gear-action-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M2.5 5.2h11v1.1H13v6.2c0 .7-.6 1.3-1.3 1.3H4.3c-.7 0-1.3-.6-1.3-1.3V6.3h-.5V5.2zm1.5 1.1v6.2c0 .1.1.3.3.3h7.4c.1 0 .3-.1.3-.3V6.3H4zm1.2-3.5h5.6l.7 1.6H4.5l.7-1.6zM7.2 8h1.6v3.2H7.2V8z"/>
    </svg>
  `.trim(),
  withdraw: `
    <svg class="inventory-gear-action-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M3 3.5h6.2v1.3H4.3v7.4h7.4V9.8H13v3.7c0 .6-.5 1-1 1H3.7c-.6 0-1-.4-1-1V4.5c0-.6.4-1 1-1zm6.4 1.2 3.3 3.3-3.3 3.3-.9-.9 1.7-1.8H6.2V8.2h4l-1.7-1.8.9-.9z"/>
    </svg>
  `.trim(),
  destroy: `
    <svg class="inventory-gear-action-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.2 2.2h3.6l.4 1.1h2.7v1.3H3.1V3.3h2.7l.4-1.1zM4.2 5.7h7.6l-.5 7.1c0 .6-.5 1-1 1H5.7c-.6 0-1-.4-1-1L4.2 5.7zm2 1.4v5.2h1.2V7.1H6.2zm2.4 0v5.2H9.8V7.1H8.6z"/>
    </svg>
  `.trim(),
};

const ACTION_MODIFIER: Record<InventoryGearActionKind, string> = {
  equip: 'inventory-gear-action--equip',
  stash: 'inventory-gear-action--stash',
  withdraw: 'inventory-gear-action--withdraw',
  destroy: 'inventory-gear-action--destroy',
};

export function renderInventoryGearAction(
  kind: InventoryGearActionKind,
  label: string,
  dataAttrs: string,
): string {
  const safeLabel = escapeHtml(label);
  const destroyClass = kind === 'destroy' ? ' gear-destroy-btn' : '';
  return `
    <span
      class="inventory-gear-tooltip-action inventory-gear-action ${ACTION_MODIFIER[kind]}${destroyClass}"
      role="button"
      tabindex="0"
      title="${safeLabel}"
      aria-label="${safeLabel}"
      ${dataAttrs}
    >${ACTION_ICONS[kind]}</span>
  `.trim();
}
