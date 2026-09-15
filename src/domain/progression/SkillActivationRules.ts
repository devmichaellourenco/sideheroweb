/** Custo em ouro para ativar uma skill já desbloqueada no combate (anti-swap). */
export const SKILL_ACTIVATION_GOLD_COST = 25;

export function calculateSkillActivationCost(rank: number): number {
  return SKILL_ACTIVATION_GOLD_COST + (rank - 1) * 10;
}
