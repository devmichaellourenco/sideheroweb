import { Hero } from '../entities/Hero';
import { Gear, GearRequirements } from '../entities/Gear';
import { isGalneonCatalogItem } from '../gear/GearItemDefinition';
import { findCatalogItemBySpriteId } from '../gear/GearItemCatalog';
import { GALNEON_HERO_ID } from '../gear/GalneonGearCatalog';

export interface RequirementCheckResult {
  met: boolean;
  unmetLabels: string[];
}

export class GearRequirementChecker {
  check(hero: Hero, gear: Gear): RequirementCheckResult {
    const unmetLabels: string[] = [];
    const reqs = gear.requirements;
    const attrs = hero.totalAttributes;

    if (hero.level < reqs.minLevel) {
      unmetLabels.push(`Level ${reqs.minLevel}`);
    }
    if (reqs.str !== undefined && attrs.str < reqs.str) {
      unmetLabels.push(`STR ${reqs.str}`);
    }
    if (reqs.dex !== undefined && attrs.dex < reqs.dex) {
      unmetLabels.push(`DEX ${reqs.dex}`);
    }
    if (reqs.int !== undefined && attrs.int < reqs.int) {
      unmetLabels.push(`INT ${reqs.int}`);
    }
    if (reqs.heroId !== undefined && hero.id !== reqs.heroId) {
      unmetLabels.push('Herói exclusivo');
    }

    return { met: unmetLabels.length === 0, unmetLabels };
  }

  meets(hero: Hero, gear: Gear): boolean {
    return this.check(hero, gear).met;
  }

  static inferRequirements(
    stage: number,
    slot: Gear['slot'],
    rarity: Gear['rarity'],
  ): GearRequirements {
    const baseLevel = Math.max(1, Math.floor(stage / 3));
    return GearRequirementChecker.inferRequirementsForItemLevel(baseLevel, slot, rarity);
  }

  static inferRequirementsForItemLevel(
    itemLevel: number,
    slot: Gear['slot'],
    rarity: Gear['rarity'],
  ): GearRequirements {
    const safeLevel = Math.max(1, Math.floor(itemLevel));
    const rarityRelax =
      rarity === 'mythic' || rarity === 'legendary'
        ? 0
        : rarity === 'epic'
          ? 1
          : rarity === 'rare'
            ? 2
            : 3;
    const minLevel = Math.max(1, safeLevel - rarityRelax);
    const attributeGate = Math.max(0, Math.floor(safeLevel * 0.55));

    const reqs: GearRequirements = { minLevel };

    if (slot === 'weapon') {
      reqs.str = Math.max(0, attributeGate - 1);
      if (rarity !== 'common') reqs.str = (reqs.str ?? 0) + Math.max(0, rarityRelax - 1);
    } else if (slot === 'armor') {
      reqs.dex = Math.max(0, attributeGate - 1);
      if (rarity !== 'common') reqs.dex = (reqs.dex ?? 0) + Math.max(0, rarityRelax - 1);
    } else {
      reqs.int = Math.max(0, attributeGate - 1);
      if (rarity !== 'common') reqs.int = (reqs.int ?? 0) + Math.max(0, rarityRelax - 1);
    }

    return reqs;
  }

  static inferRequirementsForTemplate(
    templateId: string,
    itemLevel: number,
    slot: Gear['slot'],
    rarity: Gear['rarity'],
  ): GearRequirements {
    const catalogItem = findCatalogItemBySpriteId(templateId, rarity, itemLevel, slot);
    if (catalogItem?.requirements) {
      const result = { ...catalogItem.requirements };
      if (isGalneonCatalogItem(catalogItem)) {
        result.heroId = GALNEON_HERO_ID;
      }
      return result;
    }

    return GearRequirementChecker.inferRequirementsForItemLevel(itemLevel, slot, rarity);
  }
}
