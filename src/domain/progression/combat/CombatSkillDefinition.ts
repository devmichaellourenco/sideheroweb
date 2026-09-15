import { DamageComponent } from '../../combat/DamageComponent';
import { DamageElement } from '../../combat/DamageElement';
import { SkillId } from '../SkillId';
import { SkillCombatKind } from './SkillCombatKind';
import { SkillTargeting } from './SkillTargeting';
import { UniqueEffectId } from '../../unique-effects/UniqueEffectCatalog';

export type SkillTargetScope = 'single' | 'all';
export type SkillTargetPool = 'heroes' | 'enemies';
export type SkillTargetPriority =
  | 'lowest_hp'
  | 'lowest_hp_percent'
  | 'highest_hp'
  | 'highest_hp_percent';

export interface OnHitDotEffect {
  element: DamageElement;
  damagePerTurn: number;
  durationTurns: number;
  applyChance?: number;
}

export interface CombatSkillDefinition {
  skillId: SkillId | 'basic_attack' | string;
  kind: SkillCombatKind;
  /** Obrigatório quando kind === 'damage'. */
  damageComponents?: DamageComponent[];
  /** Pool absoluto de alvos no combate. */
  targetPool: SkillTargetPool;
  targetScope: SkillTargetScope;
  targetPriority: SkillTargetPriority;
  /**
   * Chance (0–100) de mirar no alvo da prioridade em skills de alvo único.
   * Se falhar, escolhe uniformemente entre os demais candidatos vivos.
   */
  targetPriorityPercent?: number;
  /** Maior = preferida quando pronta (ataque básico = 0). */
  usePriority: number;
  /** Turnos até a primeira utilização (legado). */
  initialCooldown: number;
  /** Turnos de espera após usar a skill (legado). */
  cooldownTurns: number;
  /** Segundos até a primeira utilização (prioridade sobre initialCooldown). */
  initialCooldownSeconds?: number;
  /** Segundos de espera após usar a skill (prioridade sobre cooldownTurns). */
  cooldownSeconds?: number;
  /** Recuperação após usar esta skill (segundos, escala com Cast Speed). Catálogo: obrigatório. */
  actionRecoverySeconds?: number;
  /** Redução de recarga em segundos por rank acima de 1. Catálogo: obrigatório. */
  cooldownSecondsPerRank?: number;
  /** Teto de CDR do gear aplicado a esta skill (fração, ex. 0.45). Catálogo: obrigatório. */
  maxCooldownReduction?: number;
  /** Piso de CDR do gear aplicado a esta skill (fração, pode ser negativa). Catálogo: obrigatório. */
  minCooldownReduction?: number;
  basePower: number;
  powerPerRank: number;
  attributeFactor: number;
  /**
   * Piso de poder como fração do ATK efetivo.
   * Default (skills de dano): ratio de básico do combatente.
   * Skills flat de inimigo usam valor maior no catálogo.
   */
  minAttackRatio?: number;
  /** Usa o ATK do combatente como poder base. */
  usesAttackStat?: boolean;
  /** Cura só é elegível se algum herói aliado estiver abaixo deste % de HP. */
  healConditionThreshold?: number;
  /** Duração em turnos do combatente afetado (buff/debuff). */
  effectDurationTurns?: number;
  /** Aplica DOT ao acertar dano (veneno, ignite, etc.). */
  onHitDot?: OnHitDotEffect;
  /** Reservado — efeito único programado (ver unique-effects.spec.md). */
  uniqueEffectId?: UniqueEffectId;
}

/** Timing de combate — obrigatório em catálogos (sem constantes globais). */
export interface SkillCombatTiming {
  actionRecoverySeconds: number;
  cooldownSecondsPerRank: number;
  maxCooldownReduction: number;
  minCooldownReduction: number;
}

export type CatalogCombatSkillDefinition = CombatSkillDefinition & SkillCombatTiming;

export function toSkillTargeting(definition: CombatSkillDefinition): SkillTargeting {
  if (definition.kind === 'heal_ally' || definition.kind === 'buff_attack') {
    return definition.targetScope === 'all' ? 'all_allies' : 'single_ally';
  }
  if (definition.kind === 'debuff_defense') {
    if (definition.targetPool === 'heroes') {
      return definition.targetScope === 'all' ? 'all_allies' : 'single_ally';
    }
    return definition.targetScope === 'all' ? 'all_enemies' : 'single_enemy';
  }
  if (definition.targetPool === 'heroes') {
    return definition.targetScope === 'all' ? 'all_allies' : 'single_ally';
  }
  return definition.targetScope === 'all' ? 'all_enemies' : 'single_enemy';
}
