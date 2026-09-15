import { Experience } from '../value-objects/Experience';
import { Attributes, AttributeKey } from '../progression/Attributes';
import { getBaseAttributes } from '../progression/BaseAttributes';
import { getHeroCombatIdentity } from '../combat/HeroCombatIdentityCatalog';
import {
  getHeroBaseStats,
  resolveHeroStoredBaseStat,
} from '../combat/HeroBaseStatsCatalog';
import {
  heroPassiveAttackPercent,
  heroPassiveDefensePercent,
  heroPassiveMaxHealthPercent,
} from '../passives/PassiveModifiers';
import { AscensionId, SkillId } from '../progression/SkillId';
import { canHeroEquip } from '../services/GearEquipService';
import { Gear, GearSlot } from './Gear';
import { HeroClass } from './HeroClass';
import { HeroProgression, STARTER_HERO_PROGRESSION } from './HeroProgression';

export type { HeroClass };

export interface HeroProps {
  id: string;
  name: string;
  heroClass: HeroClass;
  baseAttack: number;
  baseDefense: number;
  baseMaxHealth: number;
  currentHealth: number;
  experience: Experience;
  equipment: Partial<Record<GearSlot, Gear | null>>;
  allocatedAttributes: Attributes;
  unspentImprovementPoints: number;
  unspentAscensionPoints: number;
  skillRanks: Record<SkillId, number>;
  equippedSkillIds: (SkillId | null)[];
  ascensionId: AscensionId | null;
}

const HERO_EMOJI: Record<HeroClass, string> = {
  knight: '🛡️',
  sorcerer: '🔮',
  priest: '✨',
  berserker: '🪓',
  archer: '🏹',
  paladin: '⚔️',
};

export class Hero {
  readonly id: string;
  readonly name: string;
  readonly heroClass: HeroClass;
  readonly baseAttack: number;
  readonly baseDefense: number;
  readonly baseMaxHealth: number;
  readonly currentHealth: number;
  private readonly experience: Experience;
  private readonly equipment: Partial<Record<GearSlot, Gear | null>>;
  private readonly progression: HeroProgression;

  private constructor(props: HeroProps) {
    this.id = props.id;
    this.name = props.name;
    this.heroClass = props.heroClass;
    this.baseAttack = props.baseAttack;
    this.baseDefense = props.baseDefense;
    this.baseMaxHealth = props.baseMaxHealth;
    this.experience = props.experience;
    this.equipment = { ...(props.equipment ?? {}) };
    this.progression = HeroProgression.restore({
      allocatedAttributes: props.allocatedAttributes,
      unspentImprovementPoints: props.unspentImprovementPoints,
      unspentAscensionPoints: props.unspentAscensionPoints,
      skillRanks: props.skillRanks,
      equippedSkillIds: props.equippedSkillIds,
      ascensionId: props.ascensionId,
    });
    this.currentHealth = Math.min(props.currentHealth, this.maxHealth);
  }

  static createStarter(id: string, heroClass: HeroClass, name: string): Hero {
    const base = getHeroBaseStats(heroClass);
    return new Hero({
      id,
      name,
      heroClass,
      baseAttack: base.attack,
      baseDefense: base.defense,
      baseMaxHealth: base.health,
      currentHealth: base.health,
      experience: Experience.initial(),
      equipment: {},
      ...STARTER_HERO_PROGRESSION,
    });
  }

  static restore(props: HeroProps): Hero {
    return new Hero({
      ...props,
      allocatedAttributes: props.allocatedAttributes ?? STARTER_HERO_PROGRESSION.allocatedAttributes,
      unspentImprovementPoints: props.unspentImprovementPoints ?? 0,
      unspentAscensionPoints: props.unspentAscensionPoints ?? 0,
      skillRanks: props.skillRanks ?? {},
      equippedSkillIds: props.equippedSkillIds ?? [],
      ascensionId: props.ascensionId ?? null,
    });
  }

  get emoji(): string {
    return HERO_EMOJI[this.heroClass];
  }

  get level(): number {
    return this.experience.level;
  }

  get baseAttributes(): Attributes {
    return getBaseAttributes(this.heroClass);
  }

  get totalAttributes(): Attributes {
    return this.progression.addAllocatedAttributes(this.baseAttributes);
  }

  get hasUnspentPoints(): boolean {
    return this.progression.hasUnspentPoints;
  }

  get attack(): number {
    const gearBonus = this.sumGear((g) => g.attackBonus);
    const attrBonus = Math.floor(this.totalAttributes.str * 0.5 + this.totalAttributes.dex * 0.3);
    const raw =
      resolveHeroStoredBaseStat(this.heroClass, this.baseAttack, 'attack') +
      gearBonus +
      attrBonus;
    const percent = this.sumGear((g) => g.attackPercentBonus) + heroPassiveAttackPercent(this);
    return Math.max(0, Math.floor(raw * (1 + percent / 100)));
  }

  get defense(): number {
    const gearBonus = this.sumGear((g) => g.defenseBonus);
    const attrBonus = Math.floor(this.totalAttributes.dex * 0.5 + this.totalAttributes.str * 0.2);
    const raw =
      resolveHeroStoredBaseStat(this.heroClass, this.baseDefense, 'defense') +
      gearBonus +
      attrBonus;
    const percent = this.sumGear((g) => g.defensePercentBonus) + heroPassiveDefensePercent(this);
    return Math.max(0, Math.floor(raw * (1 + percent / 100)));
  }

  get maxHealth(): number {
    const gearBonus = this.sumGear((g) => g.healthBonus);
    const attrBonus = this.totalAttributes.str * 2;
    const raw =
      resolveHeroStoredBaseStat(this.heroClass, this.baseMaxHealth, 'health') +
      gearBonus +
      attrBonus;
    const percent = this.sumGear((g) => g.healthPercentBonus) + heroPassiveMaxHealthPercent(this);
    return Math.max(1, Math.floor(raw * (1 + percent / 100)));
  }

  isAlive(): boolean {
    return this.currentHealth > 0;
  }

  gainExperience(amount: number): Hero {
    const { experience, leveledUp } = this.experience.gain(amount);
    let hero = new Hero({ ...this.toProps(), experience });

    if (leveledUp) {
      const growth = getHeroCombatIdentity(hero.heroClass);
      hero = new Hero({
        ...hero.toProps(),
        baseAttack: hero.baseAttack + growth.levelUpAttackGain,
        baseDefense: hero.baseDefense + growth.levelUpDefenseGain,
        baseMaxHealth: hero.baseMaxHealth + growth.levelUpHealthGain,
        currentHealth: hero.maxHealth,
        ...hero.progression.withImprovementPointGranted().toProps(),
      });
    }

    return hero;
  }

  spendImprovementPointOnAttribute(key: AttributeKey): Hero {
    return this.withProgression(this.progression.spendImprovementPointOnAttribute(key));
  }

  spendImprovementPointOnSkill(skillId: SkillId): Hero {
    return this.withProgression(this.progression.spendImprovementPointOnSkill(skillId));
  }

  refundImprovementPointFromAttribute(key: AttributeKey): Hero {
    return this.withProgression(this.progression.refundImprovementPointFromAttribute(key));
  }

  refundImprovementPointFromSkill(skillId: SkillId): Hero {
    return this.withProgression(this.progression.refundImprovementPointFromSkill(skillId));
  }

  refundAscensionPointFromSkill(skillId: SkillId): Hero {
    return this.withProgression(this.progression.refundAscensionPointFromSkill(skillId));
  }

  withProgressionRefundSnapshot(props: {
    allocatedAttributes: Attributes;
    skillRanks: Record<SkillId, number>;
    equippedSkillIds: (SkillId | null)[];
    unspentImprovementPoints: number;
    unspentAscensionPoints: number;
  }): Hero {
    return this.withProgression(this.progression.withProgressionRefundSnapshot(props));
  }

  withImprovementRefundSnapshot(props: {
    allocatedAttributes: Attributes;
    skillRanks: Record<SkillId, number>;
    equippedSkillIds: (SkillId | null)[];
    unspentImprovementPoints: number;
  }): Hero {
    return this.withProgression(this.progression.withImprovementRefundSnapshot(props));
  }

  activateSkill(skillId: SkillId, maxActiveSlots: number): Hero {
    return this.withProgression(this.progression.activateSkill(skillId, maxActiveSlots));
  }

  assignSkillToSlot(skillId: SkillId, slotIndex: number, unlockedSlotCount: number): Hero {
    return this.withProgression(this.progression.assignSkillToSlot(skillId, slotIndex, unlockedSlotCount));
  }

  deactivateSkill(skillId: SkillId): Hero {
    return this.withProgression(this.progression.deactivateSkill(skillId));
  }

  ascend(ascensionId: AscensionId, pointsGranted: number): Hero {
    return this.withProgression(this.progression.ascend(ascensionId, pointsGranted));
  }

  spendAscensionPointOnSkill(skillId: SkillId): Hero {
    return this.withProgression(this.progression.spendAscensionPointOnSkill(skillId));
  }

  takeDamage(rawDamage: number): Hero {
    const mitigated = Math.max(1, rawDamage - this.defense);
    return new Hero({
      ...this.toProps(),
      currentHealth: Math.max(0, this.currentHealth - mitigated),
    });
  }

  heal(amount: number): Hero {
    return new Hero({
      ...this.toProps(),
      currentHealth: Math.min(this.maxHealth, this.currentHealth + amount),
    });
  }

  healFull(): Hero {
    return new Hero({ ...this.toProps(), currentHealth: this.maxHealth });
  }

  equip(gear: Gear): Hero {
    if (!canHeroEquip(this, gear)) {
      throw new Error('Requisitos de equipamento não atendidos');
    }

    const updated = new Hero({
      ...this.toProps(),
      equipment: { ...this.equipment, [gear.slot]: gear },
    });
    return new Hero({
      ...updated.toProps(),
      currentHealth: Math.min(this.currentHealth, updated.maxHealth),
    });
  }

  unequip(slot: GearSlot): { hero: Hero; removed: Gear | null } {
    const removed = this.equipment[slot] ?? null;
    if (!removed) {
      return { hero: this, removed: null };
    }

    const updated = new Hero({
      ...this.toProps(),
      equipment: { ...this.equipment, [slot]: null },
    });

    return {
      hero: new Hero({
        ...updated.toProps(),
        currentHealth: Math.min(this.currentHealth, updated.maxHealth),
      }),
      removed,
    };
  }

  toProps(): HeroProps {
    return {
      id: this.id,
      name: this.name,
      heroClass: this.heroClass,
      baseAttack: this.baseAttack,
      baseDefense: this.baseDefense,
      baseMaxHealth: this.baseMaxHealth,
      currentHealth: this.currentHealth,
      experience: this.experience,
      equipment: this.equipment,
      ...this.progression.toProps(),
    };
  }

  private withProgression(progression: HeroProgression): Hero {
    return new Hero({
      ...this.toProps(),
      ...progression.toProps(),
    });
  }

  private sumGear(selector: (gear: Gear) => number): number {
    return Object.values(this.equipment ?? {}).reduce((sum, gear) => {
      if (!gear) return sum;
      return sum + selector(gear);
    }, 0);
  }
}
