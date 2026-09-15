import { ASSETS, getAssetUrl } from '../assets/AssetCatalog';
import { applyMenuTooltipAnchor } from './MenuTooltipPresentation';
import type { SystemsMenuId } from '../flows/SystemsMenuNavigation';

export type SystemsMenuIconMeta =
  | { id: SystemsMenuId; label: string; kind: 'img'; assetPath: string }
  | { id: SystemsMenuId; label: string; kind: 'glyph'; glyph: string };

const SYSTEMS_MENU_ICONS: Record<SystemsMenuId, SystemsMenuIconMeta> = {
  heroes: { id: 'heroes', label: 'Heróis', kind: 'img', assetPath: ASSETS.ui.heroes },
  formation: { id: 'formation', label: 'Formação', kind: 'img', assetPath: ASSETS.ui.defense },
  log: { id: 'log', label: 'Log', kind: 'glyph', glyph: '📜' },
  stats: { id: 'stats', label: 'Stats', kind: 'glyph', glyph: '📊' },
  campaign: { id: 'campaign', label: 'Mapa', kind: 'img', assetPath: ASSETS.ui.campaign },
  shop: { id: 'shop', label: 'Loja', kind: 'img', assetPath: ASSETS.ui.shop },
  inventory: { id: 'inventory', label: 'Inventário', kind: 'img', assetPath: ASSETS.ui.inventory },
  stash: { id: 'stash', label: 'Baús', kind: 'img', assetPath: ASSETS.ui.chestOpen },
  forge: { id: 'forge', label: 'Forja', kind: 'img', assetPath: ASSETS.ui.forge },
  upgrades: { id: 'upgrades', label: 'Runas', kind: 'img', assetPath: ASSETS.ui.rune },
  achievements: {
    id: 'achievements',
    label: 'Achievements',
    kind: 'img',
    assetPath: ASSETS.ui.bookOpen,
  },
  settings: { id: 'settings', label: 'Config', kind: 'glyph', glyph: '⚙' },
};

export function getSystemsMenuIconMeta(id: SystemsMenuId): SystemsMenuIconMeta {
  return SYSTEMS_MENU_ICONS[id];
}

export function renderSystemsMenuIconStrip(
  host: HTMLElement,
  options: {
    available: readonly SystemsMenuId[];
    current: SystemsMenuId | null;
    onSelect: (id: SystemsMenuId) => void;
  },
): void {
  const { available, current, onSelect } = options;

  host.replaceChildren();
  host.setAttribute('role', 'toolbar');
  host.setAttribute('aria-label', 'Menus do jogo');

  for (const id of available) {
    const meta = getSystemsMenuIconMeta(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'systems-menu-icon-btn';
    button.dataset.systemsMenuId = id;
    applyMenuTooltipAnchor(button, id);
    button.setAttribute('aria-label', meta.label);
    button.setAttribute('aria-current', id === current ? 'page' : 'false');
    button.classList.toggle('systems-menu-icon-btn--active', id === current);

    if (meta.kind === 'img') {
      const img = document.createElement('img');
      img.className = 'systems-menu-icon-btn__img';
      img.src = getAssetUrl(meta.assetPath);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'eager';
      img.decoding = 'async';
      button.append(img);
    } else {
      const glyph = document.createElement('span');
      glyph.className = 'systems-menu-icon-btn__glyph';
      glyph.textContent = meta.glyph;
      glyph.setAttribute('aria-hidden', 'true');
      button.append(glyph);
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      if (id === current) return;
      onSelect(id);
    });

    host.append(button);
  }
}
