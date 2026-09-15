import { formatSkillCooldownCountdown } from '../../domain/combat/SkillCooldownTiming';

export interface SkillCooldownPresentationDto {
  cooldownLabel: string;
  cooldownRatio: number;
}

export function mapSkillCooldownPresentation(
  secondsRemaining: number,
  cooldownTotal: number,
  ready: boolean,
): SkillCooldownPresentationDto {
  const cooldownRatio =
    ready || cooldownTotal <= 0 ? 0 : Math.min(1, secondsRemaining / cooldownTotal);

  return {
    cooldownLabel: formatSkillCooldownCountdown(secondsRemaining),
    cooldownRatio,
  };
}
