import { GearRequirements, GearRarity, GearSlot } from '../entities/Gear';

/** Entrada estática do catálogo de itens — cada ID é um item único com stats e sprite fixos. */
export type GearItemDefinition = {
  readonly id: string;
  readonly name: string;
  /** Valor canônico do item antes de modificadores da loja. */
  readonly basePrice: number;
  /** ID único do sprite — igual ao `id` do item. */
  readonly spriteId: string;
  /** Caminho relativo em `panel/assets/` (único por item; imagem pode ser placeholder copiado). */
  readonly sprite: string;
  readonly slot: GearSlot;
  readonly rarity: GearRarity;
  readonly attackBonus?: number;
  readonly defenseBonus?: number;
  readonly healthBonus?: number;
  readonly attackSpeedBonus?: number;
  readonly castSpeedBonus?: number;
  readonly critChanceBonus?: number;
  readonly critDamageBonus?: number;
  readonly fireResistBonus?: number;
  readonly coldResistBonus?: number;
  readonly lightningResistBonus?: number;
  readonly airResistBonus?: number;
  readonly allElementalResistBonus?: number;
  readonly fireDamageBonus?: number;
  readonly fireResistPenetrationBonus?: number;
  readonly coldDamageBonus?: number;
  readonly lightningDamageBonus?: number;
  readonly airDamageBonus?: number;
  readonly allElementalDamageBonus?: number;
  readonly fireDamageFlat?: number;
  readonly coldDamageFlat?: number;
  readonly lightningDamageFlat?: number;
  readonly airDamageFlat?: number;
  readonly fireResistFlat?: number;
  readonly coldResistFlat?: number;
  readonly lightningResistFlat?: number;
  readonly airResistFlat?: number;
  readonly attackPercentBonus?: number;
  readonly defensePercentBonus?: number;
  readonly healthPercentBonus?: number;
  readonly physicalDamagePercentBonus?: number;
  readonly cooldownReductionBonus?: number;
  readonly dodgeChanceBonus?: number;
  readonly blockChanceBonus?: number;
  readonly damageReductionBonus?: number;
  readonly requirements?: GearRequirements;
  readonly lootPool?: boolean;
  readonly exclusiveHeroId?: string;
  readonly unique?: boolean;
  readonly namedLegendary?: boolean;
  readonly salvageBlocked?: boolean;
};

export type GearItemCatalogEntry = GearItemDefinition;

export function isGalneonCatalogItem(entry: GearItemDefinition): boolean {
  return entry.id.startsWith('galneon_') || entry.requirements?.heroId !== undefined;
}

export function isLootPoolItem(entry: GearItemDefinition): boolean {
  if (entry.unique || entry.namedLegendary) {
    return false;
  }

  if (entry.exclusiveHeroId || isGalneonCatalogItem(entry)) {
    return false;
  }

  return entry.lootPool !== false;
}

export function gearItemMatchesLoot(
  entry: GearItemDefinition,
  slot: GearSlot,
  rarity: GearRarity,
  itemLevelMin: number,
  itemLevelMax: number,
): boolean {
  if (!isLootPoolItem(entry)) {
    return false;
  }

  if (entry.slot !== slot || entry.rarity !== rarity) {
    return false;
  }

  const minLevel = entry.requirements?.minLevel ?? 1;
  return minLevel >= itemLevelMin && minLevel <= itemLevelMax;
}
