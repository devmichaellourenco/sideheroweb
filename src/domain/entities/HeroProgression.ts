import { addAttributes, Attributes, AttributeKey, createAttributes } from '../progression/Attributes';
import { BASIC_ATTACK_SKILL_ID } from '../progression/combat/BasicAttackSkill';
import {
  assignSkillToLayout,
  clearSkillSlot,
  compactSkillSlotStorage,
  MAX_ACTIVE_BATTLE_SKILLS,
  toSkillSlotLayout,
} from '../progression/SkillBattleSlots';
import { AscensionId, SkillId } from '../progression/SkillId';

export interface HeroProgressionProps {
  allocatedAttributes: Attributes;
  unspentImprovementPoints: number;
  unspentAscensionPoints: number;
  skillRanks: Record<SkillId, number>;
  equippedSkillIds: (SkillId | null)[];
  ascensionId: AscensionId | null;
}

export const STARTER_HERO_PROGRESSION: HeroProgressionProps = {
  allocatedAttributes: createAttributes(),
  unspentImprovementPoints: 0,
  unspentAscensionPoints: 0,
  skillRanks: { [BASIC_ATTACK_SKILL_ID]: 1 },
  equippedSkillIds: [BASIC_ATTACK_SKILL_ID],
  ascensionId: null,
};

export class HeroProgression {
  readonly allocatedAttributes: Attributes;
  readonly unspentImprovementPoints: number;
  readonly unspentAscensionPoints: number;
  readonly skillRanks: Record<SkillId, number>;
  readonly equippedSkillIds: (SkillId | null)[];
  readonly ascensionId: AscensionId | null;

  private constructor(props: HeroProgressionProps) {
    this.allocatedAttributes = { ...props.allocatedAttributes };
    this.unspentImprovementPoints = Math.max(0, props.unspentImprovementPoints);
    this.unspentAscensionPoints = Math.max(0, props.unspentAscensionPoints);
    this.skillRanks = { ...props.skillRanks };
    this.equippedSkillIds = [...props.equippedSkillIds];
    this.ascensionId = props.ascensionId;
  }

  static starter(): HeroProgression {
    return new HeroProgression(STARTER_HERO_PROGRESSION);
  }

  static restore(props: Partial<HeroProgressionProps>): HeroProgression {
    return new HeroProgression({
      allocatedAttributes: props.allocatedAttributes ?? createAttributes(),
      unspentImprovementPoints: props.unspentImprovementPoints ?? 0,
      unspentAscensionPoints: props.unspentAscensionPoints ?? 0,
      skillRanks: props.skillRanks ?? {},
      equippedSkillIds: props.equippedSkillIds ?? [],
      ascensionId: props.ascensionId ?? null,
    });
  }

  get hasUnspentPoints(): boolean {
    return this.unspentImprovementPoints > 0 || this.unspentAscensionPoints > 0;
  }

  withImprovementPointGranted(): HeroProgression {
    return new HeroProgression({
      ...this.toProps(),
      unspentImprovementPoints: this.unspentImprovementPoints + 1,
    });
  }

  /** @deprecated Ascensão concede Aprimoramento; preferir withImprovementPointsGranted. */
  withAscensionPointsGranted(points: number): HeroProgression {
    return this.withImprovementPointsGranted(points);
  }

  withImprovementPointsGranted(points: number): HeroProgression {
    return new HeroProgression({
      ...this.toProps(),
      unspentImprovementPoints: this.unspentImprovementPoints + Math.max(0, points),
    });
  }

  spendImprovementPointOnAttribute(key: AttributeKey): HeroProgression {
    if (this.unspentImprovementPoints < 1) {
      throw new Error('Sem pontos de aprimoramento disponíveis');
    }

    return new HeroProgression({
      ...this.toProps(),
      allocatedAttributes: { ...this.allocatedAttributes, [key]: this.allocatedAttributes[key] + 1 },
      unspentImprovementPoints: this.unspentImprovementPoints - 1,
    });
  }

  spendImprovementPointOnSkill(skillId: SkillId): HeroProgression {
    if (this.unspentImprovementPoints < 1) {
      throw new Error('Sem pontos de aprimoramento disponíveis');
    }

    const currentRank = this.skillRanks[skillId] ?? 0;

    return new HeroProgression({
      ...this.toProps(),
      skillRanks: { ...this.skillRanks, [skillId]: currentRank + 1 },
      unspentImprovementPoints: this.unspentImprovementPoints - 1,
    });
  }

  refundImprovementPointFromAttribute(key: AttributeKey): HeroProgression {
    if (this.allocatedAttributes[key] < 1) {
      throw new Error('Nenhum ponto alocado neste atributo');
    }

    return new HeroProgression({
      ...this.toProps(),
      allocatedAttributes: {
        ...this.allocatedAttributes,
        [key]: this.allocatedAttributes[key] - 1,
      },
      unspentImprovementPoints: this.unspentImprovementPoints + 1,
    });
  }

  refundImprovementPointFromSkill(skillId: SkillId): HeroProgression {
    const currentRank = this.skillRanks[skillId] ?? 0;
    if (currentRank < 1) {
      throw new Error('Skill sem rank para devolver');
    }

    const nextRanks = { ...this.skillRanks };
    if (currentRank <= 1) {
      delete nextRanks[skillId];
    } else {
      nextRanks[skillId] = currentRank - 1;
    }

    return new HeroProgression({
      ...this.toProps(),
      skillRanks: nextRanks,
      unspentImprovementPoints: this.unspentImprovementPoints + 1,
    });
  }

  /** Skills de evolução usam o mesmo pool de Aprimoramento. */
  refundAscensionPointFromSkill(skillId: SkillId): HeroProgression {
    return this.refundImprovementPointFromSkill(skillId);
  }

  withProgressionRefundSnapshot(props: {
    allocatedAttributes: Attributes;
    skillRanks: Record<SkillId, number>;
    equippedSkillIds: (SkillId | null)[];
    unspentImprovementPoints: number;
    unspentAscensionPoints: number;
  }): HeroProgression {
    return new HeroProgression({
      ...this.toProps(),
      allocatedAttributes: { ...props.allocatedAttributes },
      skillRanks: { ...props.skillRanks },
      equippedSkillIds: [...props.equippedSkillIds],
      unspentImprovementPoints: Math.max(0, props.unspentImprovementPoints),
      unspentAscensionPoints: Math.max(0, props.unspentAscensionPoints),
    });
  }

  /** @deprecated use withProgressionRefundSnapshot */
  withImprovementRefundSnapshot(props: {
    allocatedAttributes: Attributes;
    skillRanks: Record<SkillId, number>;
    equippedSkillIds: (SkillId | null)[];
    unspentImprovementPoints: number;
  }): HeroProgression {
    return this.withProgressionRefundSnapshot({
      ...props,
      unspentAscensionPoints: this.unspentAscensionPoints,
    });
  }

  activateSkill(skillId: SkillId, maxActiveSlots: number): HeroProgression {
    const layout = toSkillSlotLayout(this.equippedSkillIds, maxActiveSlots);
    const firstEmptySlot = layout.findIndex((entry, index) => index > 0 && entry === null);
    if (firstEmptySlot < 0) {
      throw new Error(`Limite de ${layout.length} skills ativas na batalha`);
    }

    return this.assignSkillToSlot(skillId, firstEmptySlot, maxActiveSlots);
  }

  assignSkillToSlot(skillId: SkillId, slotIndex: number, unlockedSlotCount: number): HeroProgression {
    if ((this.skillRanks[skillId] ?? 0) < 1) {
      throw new Error('Skill não desbloqueada');
    }

    const slotLimit = Math.max(1, Math.min(MAX_ACTIVE_BATTLE_SKILLS, unlockedSlotCount));
    const layout = toSkillSlotLayout(this.equippedSkillIds, slotLimit);
    const nextLayout = assignSkillToLayout(layout, skillId, slotIndex);

    return new HeroProgression({
      ...this.toProps(),
      equippedSkillIds: compactSkillSlotStorage(nextLayout),
    });
  }

  deactivateSkill(skillId: SkillId): HeroProgression {
    if (skillId === BASIC_ATTACK_SKILL_ID) {
      throw new Error('Ataque Básico não pode ser desativado');
    }

    const layout = toSkillSlotLayout(this.equippedSkillIds, MAX_ACTIVE_BATTLE_SKILLS);
    const slotIndex = layout.findIndex((entry) => entry === skillId);
    if (slotIndex < 0) {
      throw new Error('Esta skill não pode ser desativada');
    }

    const nextLayout = clearSkillSlot(layout, slotIndex);
    return new HeroProgression({
      ...this.toProps(),
      equippedSkillIds: compactSkillSlotStorage(nextLayout),
    });
  }

  ascend(ascensionId: AscensionId, pointsGranted: number): HeroProgression {
    return new HeroProgression({
      ...this.toProps(),
      ascensionId,
      unspentImprovementPoints: this.unspentImprovementPoints + Math.max(0, pointsGranted),
    });
  }

  /** Skills de evolução gastam Aprimoramento (mesmo pool do herói). */
  spendAscensionPointOnSkill(skillId: SkillId): HeroProgression {
    return this.spendImprovementPointOnSkill(skillId);
  }

  addAllocatedAttributes(baseAttributes: Attributes): Attributes {
    return addAttributes(baseAttributes, this.allocatedAttributes);
  }

  toProps(): HeroProgressionProps {
    return {
      allocatedAttributes: this.allocatedAttributes,
      unspentImprovementPoints: this.unspentImprovementPoints,
      unspentAscensionPoints: this.unspentAscensionPoints,
      skillRanks: this.skillRanks,
      equippedSkillIds: this.equippedSkillIds,
      ascensionId: this.ascensionId,
    };
  }
}
