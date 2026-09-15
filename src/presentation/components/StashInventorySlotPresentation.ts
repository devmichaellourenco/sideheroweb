import { ASSETS, getAssetUrl, imgTag } from '../assets/AssetCatalog';

/** Slot de drop no dock do baú para enviar itens arrastados ao inventário. */
export function renderStashInventorySlot(options: {
  canWithdraw: boolean;
  used: number;
  limit: number;
}): string {
  const capacity = `${options.used}/${options.limit}`;

  if (!options.canWithdraw) {
    return `
      <div
        class="inventory-dock-slot stash-inventory-slot inventory-dock-slot--disabled"
        role="img"
        title="Inventário cheio (${capacity})"
        aria-label="Inventário cheio, ${capacity}"
      >
        ${imgTag(getAssetUrl(ASSETS.ui.inventory), 'Inventário', 'inventory-dock-slot-icon')}
        <span class="inventory-dock-slot-label">Inventário</span>
      </div>
    `.trim();
  }

  return `
    <div
      class="inventory-dock-slot stash-inventory-slot gear-drop-target"
      data-drop-zone="inventory"
      role="img"
      title="Enviar ao inventário (${capacity})"
      aria-label="Solte um item aqui para enviar ao inventário"
    >
      ${imgTag(getAssetUrl(ASSETS.ui.inventory), 'Inventário', 'inventory-dock-slot-icon')}
      <span class="inventory-dock-slot-label">Inventário</span>
    </div>
  `.trim();
}
