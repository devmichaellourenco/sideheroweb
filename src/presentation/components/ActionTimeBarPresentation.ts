import { formatSkillCooldownCountdown } from '../../domain/combat/SkillCooldownTiming';

/** Contagem regressiva na barra de TTA (mesma formatação das skills). */
export function formatActionTimeCountdown(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return '';
  return formatSkillCooldownCountdown(remainingSeconds);
}

export function resolveActionIntervalFromSpeed(attackSpeed: number): number {
  return 1 / Math.max(attackSpeed, 0.01);
}

/** Texto do tooltip da barra de TTA (cálculo do combatente). */
export function formatActionTimeBarTooltip(
  attackSpeed: number,
  remainingSeconds: number,
  totalSeconds: number,
): string {
  const interval = resolveActionIntervalFromSpeed(attackSpeed);
  const remaining = Math.max(0, remainingSeconds);
  const cycle = totalSeconds > 0 ? totalSeconds : interval;
  const lines = [
    `ASPD ${attackSpeed.toFixed(2)}/s`,
    `TTA = 1 ÷ ${attackSpeed.toFixed(2)} = ${interval.toFixed(2)}s`,
    remaining > 0
      ? `Restante ${formatSkillCooldownCountdown(remaining)}s · ciclo ${cycle.toFixed(2)}s`
      : `Pronto · ciclo ${cycle.toFixed(2)}s`,
  ];
  return lines.join('\n');
}
