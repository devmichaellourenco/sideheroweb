import { Gear } from '../../domain/entities/Gear';
import { getGearCatalogItem } from '../../domain/gear/GearItemCatalog';
import { getGearTemplate } from '../../domain/gear/GearTemplateCatalog';
import { getUniqueEffectDescription } from '../../domain/unique-effects/UniqueEffectCatalog';
import { GearDto } from '../dto/GameStateDto';

export function mapGearToDto(gear: Gear): GearDto {
  const template = getGearTemplate(gear.templateId);
  const catalogItem = gear.catalogItemId
    ? getGearCatalogItem(gear.catalogItemId)
    : getGearCatalogItem(gear.templateId);
  const uniqueEffectId = template?.uniqueEffectId;

  return {
    id: gear.id,
    name: gear.name,
    templateId: gear.templateId,
    slot: gear.slot,
    rarity: gear.rarity,
    attackBonus: gear.attackBonus,
    defenseBonus: gear.defenseBonus,
    healthBonus: gear.healthBonus,
    attackSpeedBonus: gear.attackSpeedBonus,
    castSpeedBonus: gear.castSpeedBonus,
    critChanceBonus: gear.critChanceBonus,
    critDamageBonus: gear.critDamageBonus,
    fireResistBonus: gear.fireResistBonus,
    coldResistBonus: gear.coldResistBonus,
    lightningResistBonus: gear.lightningResistBonus,
    airResistBonus: gear.airResistBonus,
    allElementalResistBonus: gear.allElementalResistBonus,
    fireDamageBonus: gear.fireDamageBonus,
    fireResistPenetrationBonus: gear.fireResistPenetrationBonus,
    coldDamageBonus: gear.coldDamageBonus,
    lightningDamageBonus: gear.lightningDamageBonus,
    airDamageBonus: gear.airDamageBonus,
    allElementalDamageBonus: gear.allElementalDamageBonus,
    fireDamageFlat: gear.fireDamageFlat,
    coldDamageFlat: gear.coldDamageFlat,
    lightningDamageFlat: gear.lightningDamageFlat,
    airDamageFlat: gear.airDamageFlat,
    fireResistFlat: gear.fireResistFlat,
    coldResistFlat: gear.coldResistFlat,
    lightningResistFlat: gear.lightningResistFlat,
    airResistFlat: gear.airResistFlat,
    attackPercentBonus: gear.attackPercentBonus,
    defensePercentBonus: gear.defensePercentBonus,
    healthPercentBonus: gear.healthPercentBonus,
    physicalDamagePercentBonus: gear.physicalDamagePercentBonus,
    cooldownReductionBonus: gear.cooldownReductionBonus,
    dodgeChanceBonus: gear.dodgeChanceBonus,
    blockChanceBonus: gear.blockChanceBonus,
    damageReductionBonus: gear.damageReductionBonus,
    requirements: gear.requirements
      ? {
          minLevel: gear.requirements.minLevel,
          str: gear.requirements.str,
          dex: gear.requirements.dex,
          int: gear.requirements.int,
          heroId: gear.requirements.heroId,
        }
      : { minLevel: 1 },
    isUniqueLegendary: catalogItem?.unique ?? false,
    isNamedLegendary: catalogItem?.namedLegendary ?? false,
    uniqueEffectDescription: uniqueEffectId ? getUniqueEffectDescription(uniqueEffectId) : null,
  };
}
