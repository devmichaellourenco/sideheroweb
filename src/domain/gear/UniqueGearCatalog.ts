import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import {
  getGearCatalogItem,
  isSalvageBlockedCatalogItem,
} from './GearItemCatalog';

export const SWORD_VORPAL_LUPNUS_TEMPLATE_ID = 'sword_vorpal_lupnus';
export const IGNUS_IX_TEMPLATE_ID = 'ignus_ix';
export const SOLER_PLEGIUS_TEMPLATE_ID = 'soler_plegius';
export const MORTHAVEN_SEAL_TEMPLATE_ID = 'morthaven_seal';

/** Chance de forjar Vorpal Lupnus ao fundir 9 épicos (secundário ao drop do Gonodor). */
export const FORGE_VORPAL_LUPNUS_CHANCE = 0.005;
/** Chance de forjar Ignus Ix ao fundir 9 épicos (secundário ao drop do Saci). */
export const FORGE_IGNUS_IX_CHANCE = 0.005;
/** Chance de forjar Soler Plégius ao fundir 9 épicos (secundário ao drop da fase 3-50). */
export const FORGE_SOLER_PLEGIUS_CHANCE = 0.005;
/** Chance de forjar Selo de Morthaven ao fundir 9 épicos (secundário ao drop 4-50). */
export const FORGE_MORTHAVEN_SEAL_CHANCE = 0.005;

const UNIQUE_GEAR_TEMPLATE_IDS = [SWORD_VORPAL_LUPNUS_TEMPLATE_ID] as const;

export type UniqueGearTemplateId = (typeof UNIQUE_GEAR_TEMPLATE_IDS)[number];

export function isUniqueGearTemplate(templateId: string): boolean {
  return UNIQUE_GEAR_TEMPLATE_IDS.includes(templateId as UniqueGearTemplateId);
}

export function isSalvageBlockedGearTemplate(templateId: string, catalogItemId?: string): boolean {
  if (catalogItemId && isSalvageBlockedCatalogItem(catalogItemId)) {
    return true;
  }

  const catalogItem = getGearCatalogItem(templateId);
  return catalogItem?.salvageBlocked === true;
}

export function listUniqueGearTemplateIds(): readonly string[] {
  return UNIQUE_GEAR_TEMPLATE_IDS;
}

function gearMatchesTemplate(gear: Gear, templateId: string): boolean {
  if (gear.catalogItemId === templateId || gear.templateId === templateId) {
    return true;
  }

  const catalogItem = gear.catalogItemId ? getGearCatalogItem(gear.catalogItemId) : undefined;
  return catalogItem?.spriteId === templateId;
}

export function playerOwnsGearTemplate(state: GameState, templateId: string): boolean {
  const inInventory = state.inventory.some((gear) => gearMatchesTemplate(gear, templateId));
  if (inInventory) return true;

  const inStash = state.stash.some((gear) => gearMatchesTemplate(gear, templateId));
  if (inStash) return true;

  const inPendingChest = state.chests.some((chest) => {
    const guaranteedLoot = chest.guaranteedLoot;
    return !chest.opened && guaranteedLoot !== null && gearMatchesTemplate(guaranteedLoot, templateId);
  });
  if (inPendingChest) return true;

  return state.roster.some((hero) =>
    Object.values(hero.toProps().equipment ?? {}).some(
      (gear) => gear && gearMatchesTemplate(gear, templateId),
    ),
  );
}

export function playerOwnsUniqueGear(state: GameState, templateId: string): boolean {
  if (!isUniqueGearTemplate(templateId)) {
    return false;
  }

  return playerOwnsGearTemplate(state, templateId);
}

export function shouldRollForgeVorpalLupnus(state: GameState, random: () => number): boolean {
  return resolveForgeNamedLegendaryTemplate(state, random) === SWORD_VORPAL_LUPNUS_TEMPLATE_ID;
}

export function resolveForgeNamedLegendaryTemplate(
  state: GameState,
  random: () => number,
): string | null {
  const roll = random();
  let cursor = 0;

  const entries: { templateId: string; chance: number }[] = [];
  if (!playerOwnsGearTemplate(state, SWORD_VORPAL_LUPNUS_TEMPLATE_ID)) {
    entries.push({ templateId: SWORD_VORPAL_LUPNUS_TEMPLATE_ID, chance: FORGE_VORPAL_LUPNUS_CHANCE });
  }
  if (!playerOwnsGearTemplate(state, IGNUS_IX_TEMPLATE_ID)) {
    entries.push({ templateId: IGNUS_IX_TEMPLATE_ID, chance: FORGE_IGNUS_IX_CHANCE });
  }
  if (!playerOwnsGearTemplate(state, SOLER_PLEGIUS_TEMPLATE_ID)) {
    entries.push({ templateId: SOLER_PLEGIUS_TEMPLATE_ID, chance: FORGE_SOLER_PLEGIUS_CHANCE });
  }
  if (!playerOwnsGearTemplate(state, MORTHAVEN_SEAL_TEMPLATE_ID)) {
    entries.push({ templateId: MORTHAVEN_SEAL_TEMPLATE_ID, chance: FORGE_MORTHAVEN_SEAL_CHANCE });
  }

  for (const entry of entries) {
    cursor += entry.chance;
    if (roll < cursor) {
      return entry.templateId;
    }
  }

  return null;
}

export function formatUniqueGearName(templateId: string, _rarity: Gear['rarity']): string {
  const catalogItem = getGearCatalogItem(templateId);
  return catalogItem?.name ?? templateId;
}

export const IGNUS_IX_FIXED_REQUIREMENTS = {
  minLevel: 30,
  int: 28,
} as const;
