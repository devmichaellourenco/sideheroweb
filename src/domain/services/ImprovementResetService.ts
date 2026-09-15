import { Hero } from '../entities/Hero';
import { AttributeKey, Attributes } from '../progression/Attributes';
import { getAscensionById } from '../progression/ClassAscensionCatalog';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';
import { getSkillById, getSkillsForHero } from '../progression/SkillCatalog';
import {
  clearSkillSlot,
  compactSkillSlotStorage,
  MAX_ACTIVE_BATTLE_SKILLS,
  toSkillSlotLayout,
} from '../progression/SkillBattleSlots';
import { SkillId } from '../progression/SkillId';
import { getFeatureLevel, UpgradeLevels } from '../upgrades/FeatureKey';
import { HeroRequirementEvaluator } from '../requirements/HeroRequirementEvaluator';
import { ImprovementResetMessages } from './ImprovementResetMessages';

export type RefundTarget =
  | { type: 'attribute'; key: AttributeKey }
  | { type: 'skill'; skillId: SkillId };

export interface MassRefundAttributeChange {
  key: AttributeKey;
  from: number;
  to: number;
}

export interface MassRefundPreview {
  skillPoints: number;
  /** Skills de evolução zeradas (mesmo pool de aprimoramento). */
  ascensionSkillPoints: number;
  attributePoints: number;
  /** Total que volta a `unspentImprovementPoints` (todas as skills + attrs). */
  pointsRefunded: number;
  skillsCleared: number;
  ascensionSkillsCleared: number;
  attributeChanges: MassRefundAttributeChange[];
  warnings: string[];
  nextHero: Hero;
}

export interface MassRefundResult {
  hero: Hero;
  pointsRefunded: number;
  /** @deprecated Sempre 0 — evolução usa o mesmo pool; incluído em pointsRefunded. */
  ascensionPointsRefunded: number;
  warnings: string[];
  preview: Omit<MassRefundPreview, 'nextHero'>;
}

export class ImprovementResetService {
  private readonly evaluator = new HeroRequirementEvaluator();

  assertUnitaryUnlocked(upgradeLevels: UpgradeLevels): void {
    if (getFeatureLevel(upgradeLevels, 'improvement_reset') < 1) {
      throw new Error(ImprovementResetMessages.featureUnitaryBlocked);
    }
  }

  assertMassUnlocked(upgradeLevels: UpgradeLevels): void {
    if (getFeatureLevel(upgradeLevels, 'improvement_reset') < 2) {
      throw new Error(ImprovementResetMessages.featureMassBlocked);
    }
  }

  refundOne(hero: Hero, target: RefundTarget): Hero {
    if (target.type === 'attribute') {
      return this.refundAttribute(hero, target.key);
    }
    return this.refundSkillRank(hero, target.skillId);
  }

  refundAttribute(hero: Hero, key: AttributeKey): Hero {
    if (hero.toProps().allocatedAttributes[key] < 1) {
      throw new Error(ImprovementResetMessages.noAllocatedAttribute);
    }

    const next = hero.refundImprovementPointFromAttribute(key);
    this.assertAttributeFloors(next, key);
    return next;
  }

  refundSkillRank(hero: Hero, skillId: SkillId): Hero {
    if (skillId === BASIC_ATTACK_SKILL_ID) {
      throw new Error('Ataque Básico não pode ter pontos devolvidos');
    }

    const definition = getSkillById(skillId);
    if (!definition) {
      throw new Error(ImprovementResetMessages.notImprovementSkill);
    }
    if (definition.pointType !== 'improvement' && definition.pointType !== 'ascension') {
      throw new Error(ImprovementResetMessages.notImprovementSkill);
    }

    const props = hero.toProps();
    const currentRank = props.skillRanks[skillId] ?? 0;
    if (currentRank < 1) {
      throw new Error(ImprovementResetMessages.skillWithoutRank);
    }

    const nextRank = currentRank - 1;
    const floor = this.skillRankFloor(hero, skillId);
    if (nextRank < floor) {
      const ascension = props.ascensionId ? getAscensionById(props.ascensionId) : undefined;
      throw new Error(
        ImprovementResetMessages.skillBlockedByAscension(
          ascension?.name ?? 'atual',
          definition.name,
          floor,
        ),
      );
    }

    if (nextRank === 0 && props.equippedSkillIds.some((id) => id === skillId)) {
      throw new Error(ImprovementResetMessages.skillEquippedAtZero(definition.name));
    }

    this.assertSkillRankPrerequisites(hero, skillId, nextRank);

    return hero.refundImprovementPointFromSkill(skillId);
  }

  /** Simula o reset em massa sem alterar o herói persistido. */
  previewMassRefund(hero: Hero): MassRefundPreview {
    const skillPass = this.reduceSkillsToFloors(hero);
    const { allocated, attributePoints, attrWarnings, attributeChanges } =
      this.reduceAttributesToFloors(skillPass.hero);

    const props = skillPass.hero.toProps();
    const skillPointsTotal = skillPass.improvementPoints + skillPass.ascensionPoints;
    const nextHero = skillPass.hero.withProgressionRefundSnapshot({
      allocatedAttributes: allocated,
      skillRanks: props.skillRanks,
      equippedSkillIds: props.equippedSkillIds,
      unspentImprovementPoints:
        props.unspentImprovementPoints + skillPointsTotal + attributePoints,
      unspentAscensionPoints: 0,
    });

    return {
      skillPoints: skillPass.improvementPoints,
      ascensionSkillPoints: skillPass.ascensionPoints,
      attributePoints,
      pointsRefunded: skillPointsTotal + attributePoints,
      skillsCleared: skillPass.improvementSkillsTouched,
      ascensionSkillsCleared: skillPass.ascensionSkillsTouched,
      attributeChanges,
      warnings: [...skillPass.warnings, ...attrWarnings],
      nextHero,
    };
  }

  massRefund(hero: Hero): MassRefundResult {
    const preview = this.previewMassRefund(hero);
    const { nextHero, ...rest } = preview;
    return {
      hero: nextHero,
      pointsRefunded: preview.pointsRefunded,
      ascensionPointsRefunded: 0,
      warnings: preview.warnings,
      preview: rest,
    };
  }

  private reduceSkillsToFloors(hero: Hero): {
    hero: Hero;
    improvementPoints: number;
    ascensionPoints: number;
    improvementSkillsTouched: number;
    ascensionSkillsTouched: number;
    warnings: string[];
  } {
    const props = hero.toProps();
    const skills = getSkillsForHero(hero.heroClass, props.ascensionId).filter(
      (skill) => skill.pointType === 'improvement' || skill.pointType === 'ascension',
    );

    const nextRanks = { ...props.skillRanks };
    let improvementPoints = 0;
    let ascensionPoints = 0;
    let improvementSkillsTouched = 0;
    let ascensionSkillsTouched = 0;
    const warnings: string[] = [];
    const skillsToUnequip = new Set<SkillId>();

    const ascension = props.ascensionId ? getAscensionById(props.ascensionId) : undefined;

    for (const definition of skills) {
      if (definition.id === BASIC_ATTACK_SKILL_ID) continue;

      const current = nextRanks[definition.id] ?? 0;
      if (current < 1) continue;

      const floor = this.skillRankFloor(hero, definition.id);
      const target = floor;
      const refund = current - target;
      if (refund <= 0) continue;

      if (target <= 0) {
        delete nextRanks[definition.id];
        skillsToUnequip.add(definition.id);
      } else {
        nextRanks[definition.id] = target;
      }

      if (definition.pointType === 'ascension') {
        ascensionPoints += refund;
        ascensionSkillsTouched += 1;
      } else {
        improvementPoints += refund;
        improvementSkillsTouched += 1;
      }

      if (floor > 0 && ascension) {
        warnings.push(
          ImprovementResetMessages.massPartialSkillAscension(
            ascension.name,
            definition.name,
            floor,
          ),
        );
      }
    }

    let layout = toSkillSlotLayout(props.equippedSkillIds, MAX_ACTIVE_BATTLE_SKILLS);
    for (let index = 1; index < layout.length; index++) {
      const equipped = layout[index];
      if (equipped && skillsToUnequip.has(equipped)) {
        layout = clearSkillSlot(layout, index);
      }
    }

    return {
      hero: hero.withProgressionRefundSnapshot({
        allocatedAttributes: props.allocatedAttributes,
        skillRanks: nextRanks,
        equippedSkillIds: compactSkillSlotStorage(layout),
        unspentImprovementPoints: props.unspentImprovementPoints,
        unspentAscensionPoints: 0,
      }),
      improvementPoints,
      ascensionPoints,
      improvementSkillsTouched,
      ascensionSkillsTouched,
      warnings,
    };
  }

  private skillRankFloor(hero: Hero, skillId: SkillId): number {
    const ascensionId = hero.toProps().ascensionId;
    if (!ascensionId) return 0;
    const definition = getAscensionById(ascensionId);
    if (!definition) return 0;

    let floor = 0;
    for (const req of definition.requirements) {
      if (req.type === 'skill_rank' && req.skillId === skillId) {
        floor = Math.max(floor, req.minRank);
      }
    }
    return floor;
  }

  private reduceAttributesToFloors(hero: Hero): {
    allocated: Attributes;
    attributePoints: number;
    attrWarnings: string[];
    attributeChanges: MassRefundAttributeChange[];
  } {
    const props = hero.toProps();
    const allocated = { ...props.allocatedAttributes };
    const attrWarnings: string[] = [];
    const attributeChanges: MassRefundAttributeChange[] = [];
    let attributePoints = 0;

    for (const key of ['str', 'dex', 'int'] as AttributeKey[]) {
      const floorInfo = this.attributeFloor(hero, key);
      const base = hero.baseAttributes[key];
      const minAllocated = Math.max(0, floorInfo.totalFloor - base);
      const current = allocated[key];
      if (current > minAllocated) {
        attributePoints += current - minAllocated;
        allocated[key] = minAllocated;
        attributeChanges.push({ key, from: current, to: minAllocated });
      }

      if (allocated[key] <= 0) continue;

      if (floorInfo.ascensionFloor > base && floorInfo.ascensionName) {
        attrWarnings.push(
          ImprovementResetMessages.massPartialAscension(
            floorInfo.ascensionName,
            key,
            floorInfo.ascensionFloor,
          ),
        );
      }
      if (floorInfo.gearFloor > base && floorInfo.gearName) {
        attrWarnings.push(
          ImprovementResetMessages.massPartialGear(floorInfo.gearName, key, floorInfo.gearFloor),
        );
      }
    }

    return { allocated, attributePoints, attrWarnings, attributeChanges };
  }

  private attributeFloor(
    hero: Hero,
    key: AttributeKey,
  ): {
    totalFloor: number;
    ascensionFloor: number;
    ascensionName: string | null;
    gearFloor: number;
    gearName: string | null;
  } {
    let ascensionFloor = 0;
    let ascensionName: string | null = null;
    const ascensionId = hero.toProps().ascensionId;
    if (ascensionId) {
      const definition = getAscensionById(ascensionId);
      if (definition) {
        for (const req of definition.requirements) {
          if (req.type === 'attribute' && req.key === key) {
            ascensionFloor = Math.max(ascensionFloor, req.min);
            ascensionName = definition.name;
          }
        }
      }
    }

    let gearFloor = 0;
    let gearName: string | null = null;
    for (const gear of Object.values(hero.toProps().equipment ?? {})) {
      if (!gear) continue;
      const reqVal = gear.requirements[key];
      if (reqVal !== undefined && reqVal > gearFloor) {
        gearFloor = reqVal;
        gearName = gear.name;
      }
    }

    return {
      totalFloor: Math.max(ascensionFloor, gearFloor),
      ascensionFloor,
      ascensionName,
      gearFloor,
      gearName,
    };
  }

  private assertAttributeFloors(hero: Hero, key: AttributeKey): void {
    const props = hero.toProps();
    const skills = getSkillsForHero(hero.heroClass, props.ascensionId);

    for (const definition of skills) {
      const rank = props.skillRanks[definition.id] ?? 0;
      if (rank < 1) continue;

      for (const req of definition.requirements) {
        if (req.type !== 'attribute' || req.key !== key) continue;
        if (!this.evaluator.isMet(hero, req)) {
          throw new Error(
            ImprovementResetMessages.attributeBlockedBySkill(definition.name, key, req.min),
          );
        }
      }
    }

    for (const gear of Object.values(props.equipment ?? {})) {
      if (!gear) continue;
      const reqVal = gear.requirements[key];
      if (reqVal === undefined) continue;
      if (hero.totalAttributes[key] < reqVal) {
        throw new Error(ImprovementResetMessages.attributeBlockedByGear(gear.name, key, reqVal));
      }
    }

    const ascensionId = props.ascensionId;
    if (ascensionId) {
      const definition = getAscensionById(ascensionId);
      if (definition) {
        for (const req of definition.requirements) {
          if (req.type !== 'attribute' || req.key !== key) continue;
          if (!this.evaluator.isMet(hero, req)) {
            throw new Error(
              ImprovementResetMessages.attributeBlockedByAscension(definition.name, key, req.min),
            );
          }
        }
      }
    }
  }

  private assertSkillRankPrerequisites(hero: Hero, skillId: SkillId, nextRank: number): void {
    const props = hero.toProps();
    const simulatedRanks = { ...props.skillRanks, [skillId]: nextRank };
    if (nextRank <= 0) {
      delete simulatedRanks[skillId];
    }

    const simulated = Hero.restore({
      ...props,
      skillRanks: simulatedRanks,
    });

    const skills = getSkillsForHero(hero.heroClass, props.ascensionId);
    for (const definition of skills) {
      const rank = simulatedRanks[definition.id] ?? 0;
      if (rank < 1) continue;

      for (const req of definition.requirements) {
        if (req.type !== 'skill_rank' || req.skillId !== skillId) continue;
        if (!this.evaluator.isMet(simulated, req)) {
          const required = getSkillById(skillId)?.name ?? skillId;
          throw new Error(
            ImprovementResetMessages.skillRankPrerequisite(
              definition.name,
              required,
              req.minRank,
            ),
          );
        }
      }
    }
  }
}
