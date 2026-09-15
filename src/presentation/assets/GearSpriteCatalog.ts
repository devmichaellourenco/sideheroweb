import { GearRarity } from '../../domain/entities/Gear';
import { ActiveGearSlot } from '../../domain/gear/GearSlotCatalog';
import {
  DEFAULT_GEAR_TEMPLATE_BY_SLOT,
  getGearTemplate,
  resolveGearTemplateSprite,
} from '../../domain/gear/GearTemplateCatalog';
import { getGearCatalogSprite } from '../../domain/gear/GearItemCatalog';

export interface GearSpriteInput {
  templateId?: string;
  catalogItemId?: string;
  slot: string;
  rarity?: string;
}

const SLOT_FALLBACK_SPRITES: Record<ActiveGearSlot, string> = {
  weapon: 'gear/weapon.png',
  armor: 'gear/armor.png',
  accessory: 'gear/accessory.png',
};

export function resolveGearSpritePath(gear: GearSpriteInput): string {
  const spriteId =
    gear.templateId ??
    gear.catalogItemId ??
    DEFAULT_GEAR_TEMPLATE_BY_SLOT[gear.slot as ActiveGearSlot];

  const catalogSprite = gear.catalogItemId
    ? getGearCatalogSprite(gear.catalogItemId)
    : getGearCatalogSprite(spriteId);
  if (catalogSprite) {
    return catalogSprite;
  }

  const template = spriteId ? getGearTemplate(spriteId) : undefined;
  if (template) {
    return resolveGearTemplateSprite(template);
  }

  return SLOT_FALLBACK_SPRITES[gear.slot as ActiveGearSlot] ?? SLOT_FALLBACK_SPRITES.weapon;
}
