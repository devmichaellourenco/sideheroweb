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

/** Ordem visual da `actions-icon-bar` em panel.html. */
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
    case 'stats':
      return availability.battleStats;
    case 'log':
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
    if (surface.campaignOpen || !surface.modalStackRootType) {
      return 'campaign';
    }
    const fromStack = systemsMenuFromModalViewType(surface.modalStackRootType);
    if (fromStack) return fromStack;
    if (surface.trackedId) return surface.trackedId;
  }

  return surface.trackedId;
}
