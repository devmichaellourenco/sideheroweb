import { ActiveGearSlot } from '../gear/GearSlotCatalog';

/** Slot ativo no jogo (alias estável na UI). */
export type GearSlot = ActiveGearSlot;

export const GEAR_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const;

export type GearRarity = (typeof GEAR_RARITIES)[number];

export interface GearRequirements {
  minLevel: number;
  str?: number;
  dex?: number;
  int?: number;
  /** Herói exclusivo (ex.: Galneon). */
  heroId?: string;
}

export interface GearProps {
  id: string;
  name: string;
  templateId: string;
  /** ID estável no catálogo (`gear-items.catalog.json`). */
  catalogItemId?: string;
  slot: GearSlot;
  rarity: GearRarity;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  attackSpeedBonus?: number;
  castSpeedBonus?: number;
  critChanceBonus?: number;
  critDamageBonus?: number;
  fireResistBonus?: number;
  coldResistBonus?: number;
  lightningResistBonus?: number;
  airResistBonus?: number;
  allElementalResistBonus?: number;
  fireDamageBonus?: number;
  fireResistPenetrationBonus?: number;
  coldDamageBonus?: number;
  lightningDamageBonus?: number;
  airDamageBonus?: number;
  allElementalDamageBonus?: number;
  fireDamageFlat?: number;
  coldDamageFlat?: number;
  lightningDamageFlat?: number;
  airDamageFlat?: number;
  fireResistFlat?: number;
  coldResistFlat?: number;
  lightningResistFlat?: number;
  airResistFlat?: number;
  attackPercentBonus?: number;
  defensePercentBonus?: number;
  healthPercentBonus?: number;
  physicalDamagePercentBonus?: number;
  cooldownReductionBonus?: number;
  dodgeChanceBonus?: number;
  blockChanceBonus?: number;
  damageReductionBonus?: number;
  requirements?: GearRequirements;
}

const DEFAULT_REQUIREMENTS: GearRequirements = { minLevel: 1 };

export class Gear {
  readonly id: string;
  readonly name: string;
  readonly templateId: string;
  readonly catalogItemId: string | undefined;
  readonly slot: GearSlot;
  readonly rarity: GearRarity;
  readonly attackBonus: number;
  readonly defenseBonus: number;
  readonly healthBonus: number;
  readonly attackSpeedBonus: number;
  readonly castSpeedBonus: number;
  readonly critChanceBonus: number;
  readonly critDamageBonus: number;
  readonly fireResistBonus: number;
  readonly coldResistBonus: number;
  readonly lightningResistBonus: number;
  readonly airResistBonus: number;
  readonly allElementalResistBonus: number;
  readonly fireDamageBonus: number;
  readonly fireResistPenetrationBonus: number;
  readonly coldDamageBonus: number;
  readonly lightningDamageBonus: number;
  readonly airDamageBonus: number;
  readonly allElementalDamageBonus: number;
  readonly fireDamageFlat: number;
  readonly coldDamageFlat: number;
  readonly lightningDamageFlat: number;
  readonly airDamageFlat: number;
  readonly fireResistFlat: number;
  readonly coldResistFlat: number;
  readonly lightningResistFlat: number;
  readonly airResistFlat: number;
  readonly attackPercentBonus: number;
  readonly defensePercentBonus: number;
  readonly healthPercentBonus: number;
  readonly physicalDamagePercentBonus: number;
  readonly cooldownReductionBonus: number;
  readonly dodgeChanceBonus: number;
  readonly blockChanceBonus: number;
  readonly damageReductionBonus: number;
  readonly requirements: GearRequirements;

  private constructor(props: GearProps) {
    this.id = props.id;
    this.name = props.name;
    this.templateId = props.templateId;
    this.catalogItemId = props.catalogItemId;
    this.slot = props.slot;
    this.rarity = props.rarity;
    this.attackBonus = props.attackBonus;
    this.defenseBonus = props.defenseBonus;
    this.healthBonus = props.healthBonus;
    this.attackSpeedBonus = props.attackSpeedBonus ?? 0;
    this.castSpeedBonus = props.castSpeedBonus ?? 0;
    this.critChanceBonus = props.critChanceBonus ?? 0;
    this.critDamageBonus = props.critDamageBonus ?? 0;
    this.fireResistBonus = props.fireResistBonus ?? 0;
    this.coldResistBonus = props.coldResistBonus ?? 0;
    this.lightningResistBonus = props.lightningResistBonus ?? 0;
    this.airResistBonus = props.airResistBonus ?? 0;
    this.allElementalResistBonus = props.allElementalResistBonus ?? 0;
    this.fireDamageBonus = props.fireDamageBonus ?? 0;
    this.fireResistPenetrationBonus = props.fireResistPenetrationBonus ?? 0;
    this.coldDamageBonus = props.coldDamageBonus ?? 0;
    this.lightningDamageBonus = props.lightningDamageBonus ?? 0;
    this.airDamageBonus = props.airDamageBonus ?? 0;
    this.allElementalDamageBonus = props.allElementalDamageBonus ?? 0;
    this.fireDamageFlat = props.fireDamageFlat ?? 0;
    this.coldDamageFlat = props.coldDamageFlat ?? 0;
    this.lightningDamageFlat = props.lightningDamageFlat ?? 0;
    this.airDamageFlat = props.airDamageFlat ?? 0;
    this.fireResistFlat = props.fireResistFlat ?? 0;
    this.coldResistFlat = props.coldResistFlat ?? 0;
    this.lightningResistFlat = props.lightningResistFlat ?? 0;
    this.airResistFlat = props.airResistFlat ?? 0;
    this.attackPercentBonus = props.attackPercentBonus ?? 0;
    this.defensePercentBonus = props.defensePercentBonus ?? 0;
    this.healthPercentBonus = props.healthPercentBonus ?? 0;
    this.physicalDamagePercentBonus = props.physicalDamagePercentBonus ?? 0;
    this.cooldownReductionBonus = props.cooldownReductionBonus ?? 0;
    this.dodgeChanceBonus = props.dodgeChanceBonus ?? 0;
    this.blockChanceBonus = props.blockChanceBonus ?? 0;
    this.damageReductionBonus = props.damageReductionBonus ?? 0;
    this.requirements = props.requirements ?? DEFAULT_REQUIREMENTS;
  }

  static create(props: GearProps): Gear {
    return new Gear(props);
  }

  toProps(): GearProps {
    return {
      id: this.id,
      name: this.name,
      templateId: this.templateId,
      catalogItemId: this.catalogItemId,
      slot: this.slot,
      rarity: this.rarity,
      attackBonus: this.attackBonus,
      defenseBonus: this.defenseBonus,
      healthBonus: this.healthBonus,
      attackSpeedBonus: this.attackSpeedBonus,
      castSpeedBonus: this.castSpeedBonus,
      critChanceBonus: this.critChanceBonus,
      critDamageBonus: this.critDamageBonus,
      fireResistBonus: this.fireResistBonus,
      coldResistBonus: this.coldResistBonus,
      lightningResistBonus: this.lightningResistBonus,
      airResistBonus: this.airResistBonus,
      allElementalResistBonus: this.allElementalResistBonus,
      fireDamageBonus: this.fireDamageBonus,
      fireResistPenetrationBonus: this.fireResistPenetrationBonus,
      coldDamageBonus: this.coldDamageBonus,
      lightningDamageBonus: this.lightningDamageBonus,
      airDamageBonus: this.airDamageBonus,
      allElementalDamageBonus: this.allElementalDamageBonus,
      fireDamageFlat: this.fireDamageFlat,
      coldDamageFlat: this.coldDamageFlat,
      lightningDamageFlat: this.lightningDamageFlat,
      airDamageFlat: this.airDamageFlat,
      fireResistFlat: this.fireResistFlat,
      coldResistFlat: this.coldResistFlat,
      lightningResistFlat: this.lightningResistFlat,
      airResistFlat: this.airResistFlat,
      attackPercentBonus: this.attackPercentBonus,
      defensePercentBonus: this.defensePercentBonus,
      healthPercentBonus: this.healthPercentBonus,
      physicalDamagePercentBonus: this.physicalDamagePercentBonus,
      cooldownReductionBonus: this.cooldownReductionBonus,
      dodgeChanceBonus: this.dodgeChanceBonus,
      blockChanceBonus: this.blockChanceBonus,
      damageReductionBonus: this.damageReductionBonus,
      requirements: this.requirements,
    };
  }
}
