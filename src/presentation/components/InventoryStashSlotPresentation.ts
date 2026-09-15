import { ASSETS, getAssetUrl, imgTag } from '../assets/AssetCatalog';

export function renderInventoryStashSlot(options: {
  unlocked: boolean;
  canStash: boolean;
  used: number;
  limit: number;
}): string {
  const capacity = `${options.used}/${options.limit}`;
  if (!options.unlocked) {
    return `
      <div
        class="inventory-dock-slot inventory-stash-slot inventory-dock-slot--disabled"
        role="img"
        title="Baú de itens bloqueado"
        aria-label="Baú de itens bloqueado"
      >
        ${imgTag(getAssetUrl(ASSETS.ui.chestOpen), 'Baú', 'inventory-dock-slot-icon')}
        <span class="inventory-dock-slot-label">Baú</span>
      </div>
    `.trim();
  }

  if (!options.canStash) {
    return `
      <div
        class="inventory-dock-slot inventory-stash-slot inventory-dock-slot--disabled"
        role="img"
        title="Baú cheio (${capacity})"
        aria-label="Baú cheio, ${capacity}"
      >
        ${imgTag(getAssetUrl(ASSETS.ui.chestOpen), 'Baú', 'inventory-dock-slot-icon')}
        <span class="inventory-dock-slot-label">Baú</span>
      </div>
    `.trim();
  }

  return `
    <div
      class="inventory-dock-slot inventory-stash-slot gear-drop-target"
      data-drop-zone="stash"
      role="img"
      title="Guardar no baú (${capacity})"
      aria-label="Solte um item aqui para guardar no baú"
    >
      ${imgTag(getAssetUrl(ASSETS.ui.chestOpen), 'Baú', 'inventory-dock-slot-icon')}
      <span class="inventory-dock-slot-label">Baú</span>
    </div>
  `.trim();
}
