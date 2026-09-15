const DESTROY_SLOT_ICON = `
  <svg class="inventory-dock-slot-icon inventory-destroy-slot-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M6.2 2.2h3.6l.4 1.1h2.7v1.3H3.1V3.3h2.7l.4-1.1zM4.2 5.7h7.6l-.5 7.1c0 .6-.5 1-1 1H5.7c-.6 0-1-.4-1-1L4.2 5.7zm2 1.4v5.2h1.2V7.1H6.2zm2.4 0v5.2H9.8V7.1H8.6z"/>
  </svg>
`.trim();

/** Slot de drop no canto do inventário para destruir itens arrastados. */
export function renderInventoryDestroySlot(): string {
  return `
    <div
      class="inventory-dock-slot inventory-destroy-slot gear-drop-target"
      data-drop-zone="destroy"
      role="img"
      title="Destruir item"
      aria-label="Solte um item aqui para destruir"
    >
      ${DESTROY_SLOT_ICON}
      <span class="inventory-dock-slot-label">Destruir</span>
    </div>
  `.trim();
}
