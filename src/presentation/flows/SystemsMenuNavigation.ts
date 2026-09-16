export type SystemsMenuId =
  | 'heroes'
  | 'formation'
  | 'log'
  | 'stats'
  | 'campaign'
  | 'shop'
  | 'inventory'
  | 'stash'
  | 'forge'
  | 'upgrades'
  | 'achievements'
  | 'settings';

/** Ordem visual da `actions-icon-bar` no rail inferior (`panel.html`). */
export const SYSTEMS_MENU_ORDER: readonly SystemsMenuId[] = [
  'heroes',
  'formation',
  'log',
  'stats',
  'campaign',
  'shop',
  'inventory',
  'stash',
  'forge',
  'upgrades',
  'achievements',
  'settings',
] as const;

export type SystemsMenuAvailability = {
  canEditParty: boolean;
  stashUnlocked: boolean;
  battleStats: boolean;
  divineForge: boolean;
};

export type SystemsMenuSurface = {
  logVisible: boolean;
  statsVisible: boolean;
  drawerOpen: boolean;
  modalOpen: boolean;
  modalStackRootType: string | null;
  /** Modal expandido do mapa — não inclui o mapa embutido do hub. */
  campaignOpen: boolean;
  trackedId: SystemsMenuId | null;
};

export function isSystemsMenuAvailable(
  id: SystemsMenuId,
  availability: SystemsMenuAvailability,
): boolean {
  switch (id) {
    case 'heroes':
    case 'formation':
    case 'shop':
    case 'inventory':
      return availability.canEditParty;
    case 'stash':
      return availability.canEditParty && availability.stashUnlocked;
    case 'forge':
      return availability.divineForge;
    case 'log':
    case 'stats':
    case 'campaign':
    case 'upgrades':
    case 'achievements':
    case 'settings':
      return true;
  }
}

export function listAvailableSystemsMenus(
  availability: SystemsMenuAvailability,
): SystemsMenuId[] {
  return SYSTEMS_MENU_ORDER.filter((id) => isSystemsMenuAvailable(id, availability));
}

export function adjacentSystemsMenu(
  current: SystemsMenuId,
  direction: 'prev' | 'next',
  available: readonly SystemsMenuId[],
): SystemsMenuId | null {
  if (available.length <= 1) return null;

  const index = available.indexOf(current);
  if (index < 0) {
    return direction === 'next' ? available[0]! : available[available.length - 1]!;
  }

  const nextIndex =
    direction === 'next'
      ? (index + 1) % available.length
      : (index - 1 + available.length) % available.length;
  return available[nextIndex] ?? null;
}

export function systemsMenuFromModalViewType(type: string): SystemsMenuId | null {
  switch (type) {
    case 'formation':
      return 'formation';
    case 'shop':
      return 'shop';
    case 'stash':
      return 'stash';
    case 'divine-forge':
      return 'forge';
    case 'upgrades':
      return 'upgrades';
    case 'achievements':
      return 'achievements';
    case 'settings':
      return 'settings';
    case 'inventory':
      return 'inventory';
    case 'heroes':
      return 'heroes';
    default:
      return null;
  }
}

export function resolveCurrentSystemsMenu(surface: SystemsMenuSurface): SystemsMenuId | null {
  if (surface.logVisible) return 'log';
  if (surface.statsVisible) return 'stats';

  if (surface.drawerOpen) {
    if (surface.trackedId === 'heroes' || surface.trackedId === 'inventory') {
      return surface.trackedId;
    }
    return 'heroes';
  }

  if (surface.modalOpen) {
    const fromStack = surface.modalStackRootType
      ? systemsMenuFromModalViewType(surface.modalStackRootType)
      : null;
    if (fromStack) return fromStack;
    if (surface.campaignOpen || !surface.modalStackRootType) {
      return 'campaign';
    }
    if (surface.trackedId) return surface.trackedId;
  }

  return surface.trackedId;
}

/** True quando o sheet daquele menu do rail já está aberto (segundo clique fecha). */
export function isSystemsSurfaceOpen(
  id: SystemsMenuId,
  surface: SystemsMenuSurface,
): boolean {
  switch (id) {
    case 'log':
      return surface.logVisible;
    case 'stats':
      return surface.statsVisible;
    case 'heroes':
    case 'inventory':
      return surface.drawerOpen && surface.trackedId === id;
    case 'campaign':
      return (
        surface.modalOpen &&
        surface.campaignOpen &&
        !(
          surface.modalStackRootType &&
          systemsMenuFromModalViewType(surface.modalStackRootType)
        )
      );
    default: {
      if (!surface.modalOpen) return false;
      const fromStack = surface.modalStackRootType
        ? systemsMenuFromModalViewType(surface.modalStackRootType)
        : null;
      return fromStack === id || surface.trackedId === id;
    }
  }
}
