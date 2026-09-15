import { CombatStatusEffect, StatusEffectMap } from './CombatStatusEffect';
import { DamageElement } from '../../combat/DamageElement';

export interface DotTickEntry {
  magnitude: number;
  dotElement?: DamageElement;
}

export interface DotTickResult {
  damage: number;
  dotElement?: DamageElement;
  tracker: CombatStatusEffectTracker;
}

export class CombatStatusEffectTracker {
  constructor(private readonly effects: StatusEffectMap) {}

  static fromMap(effects: StatusEffectMap | undefined): CombatStatusEffectTracker {
    return new CombatStatusEffectTracker(effects ?? {});
  }

  toMap(): StatusEffectMap {
    return structuredClone(this.effects);
  }

  listFor(combatantKey: string): CombatStatusEffect[] {
    return [...(this.effects[combatantKey] ?? [])];
  }

  apply(params: {
    combatantKey: string;
    skillId: string;
    kind: CombatStatusEffect['kind'];
    magnitude: number;
    durationTurns: number;
    dotElement?: CombatStatusEffect['dotElement'];
  }): CombatStatusEffectTracker {
    const next = structuredClone(this.effects);
    next[params.combatantKey] ??= [];

    const withoutSkill = next[params.combatantKey].filter((effect) => {
      if (params.kind === 'heal_block' && effect.kind === 'heal_block') {
        return false;
      }
      return effect.skillId !== params.skillId;
    });

    withoutSkill.push({
      skillId: params.skillId,
      kind: params.kind,
      magnitude: Math.max(1, params.magnitude),
      remainingTurns: Math.max(1, params.durationTurns),
      dotElement: params.dotElement,
    });

    next[params.combatantKey] = withoutSkill;
    return new CombatStatusEffectTracker(next);
  }

  tickOnTurnEnd(combatantKey: string): CombatStatusEffectTracker {
    const current = this.effects[combatantKey];
    if (!current || current.length === 0) return this;

    const next = structuredClone(this.effects);
    next[combatantKey] = current
      .map((effect) => ({
        ...effect,
        remainingTurns: effect.kind === 'heal_block' ? effect.remainingTurns : effect.remainingTurns - 1,
      }))
      .filter((effect) => effect.remainingTurns > 0);

    if (next[combatantKey].length === 0) {
      delete next[combatantKey];
    }

    return new CombatStatusEffectTracker(next);
  }

  tickDotDamage(combatantKey: string): DotTickResult {
    const dots = this.listDotTicks(combatantKey);
    const damage = dots.reduce((sum, effect) => sum + effect.magnitude, 0);
    const dotElement = dots[0]?.dotElement;
    return { damage, dotElement, tracker: this };
  }

  listDotTicks(combatantKey: string): DotTickEntry[] {
    return (this.effects[combatantKey] ?? [])
      .filter((effect) => effect.kind === 'dot')
      .map((effect) => ({
        magnitude: effect.magnitude,
        dotElement: effect.dotElement,
      }));
  }

  getAttackBonus(combatantKey: string): number {
    return this.sumMagnitude(combatantKey, 'buff_attack');
  }

  getDefensePenalty(combatantKey: string): number {
    return this.sumMagnitude(combatantKey, 'debuff_defense');
  }

  isHealBlocked(combatantKey: string): boolean {
    return (this.effects[combatantKey] ?? []).some((effect) => effect.kind === 'heal_block');
  }

  clearNegativeEffects(combatantKey: string): CombatStatusEffectTracker {
    const current = this.effects[combatantKey];
    if (!current || current.length === 0) {
      return this;
    }

    const next = structuredClone(this.effects);
    const remaining = current.filter((effect) => effect.kind === 'buff_attack');

    if (remaining.length === 0) {
      delete next[combatantKey];
    } else {
      next[combatantKey] = remaining;
    }

    return new CombatStatusEffectTracker(next);
  }

  private sumMagnitude(
    combatantKey: string,
    kind: CombatStatusEffect['kind'],
  ): number {
    return (this.effects[combatantKey] ?? [])
      .filter((effect) => effect.kind === kind)
      .reduce((sum, effect) => sum + effect.magnitude, 0);
  }
}
