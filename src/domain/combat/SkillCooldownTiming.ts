import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';

export interface SkillCooldownTimingOptions {
  /** Level da skill. Level 1 = cooldown base. */
  rank?: number;
  /** Segundos por turno do combatente (herói ou tipo de monstro). */
  turnSeconds?: number;
  /**
   * @deprecated Ignorado — cadência vem de `turnSeconds` do combatente.
   */
  forEnemy?: boolean;
}

function resolveTurnSeconds(options: SkillCooldownTimingOptions): number {
  return Math.max(0, options.turnSeconds ?? 0);
}

function resolveBaseCooldownSeconds(
  skill: CombatSkillDefinition,
  options: SkillCooldownTimingOptions,
): number {
  if (skill.cooldownSeconds !== undefined) {
    return Math.max(0, skill.cooldownSeconds);
  }

  return Math.max(0, skill.cooldownTurns) * resolveTurnSeconds(options);
}

function resolveBaseInitialCooldownSeconds(
  skill: CombatSkillDefinition,
  options: SkillCooldownTimingOptions,
): number {
  if (skill.initialCooldownSeconds !== undefined) {
    return Math.max(0, skill.initialCooldownSeconds);
  }

  return Math.max(0, skill.initialCooldown) * resolveTurnSeconds(options);
}

export function getInitialCooldownSeconds(
  skill: CombatSkillDefinition,
  options: SkillCooldownTimingOptions = {},
): number {
  void options.forEnemy;
  return resolveBaseInitialCooldownSeconds(skill, options);
}

export function getCooldownSeconds(
  skill: CombatSkillDefinition,
  options: SkillCooldownTimingOptions = {},
): number {
  void options.forEnemy;
  const base = resolveBaseCooldownSeconds(skill, options);
  if (base <= 0) return 0;

  const rank = Math.max(1, options.rank ?? 1);
  const perRank = Math.max(0, skill.cooldownSecondsPerRank ?? 0);
  return Math.max(0, base - (rank - 1) * perRank);
}

export function formatCooldownLabel(seconds: number): string {
  if (seconds <= 0) return 'Pronto';
  if (seconds < 1) return `${(seconds * 10) / 10}s`;
  return `${Math.ceil(seconds * 10) / 10}s`;
}

/** Contagem regressiva nas skills — exibe décimos abaixo de 10 s. */
export function formatSkillCooldownCountdown(seconds: number): string {
  if (seconds <= 0) return '0';
  if (seconds < 10) {
    const rounded = Math.ceil(seconds * 10) / 10;
    return rounded % 1 === 0 ? String(rounded.toFixed(0)) : rounded.toFixed(1);
  }
  return String(Math.ceil(seconds));
}
