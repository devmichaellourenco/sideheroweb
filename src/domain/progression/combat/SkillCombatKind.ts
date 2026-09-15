export type SkillCombatKind = 'damage' | 'heal_ally' | 'buff_attack' | 'debuff_defense';

export function isStatusCombatKind(kind: SkillCombatKind): boolean {
  return kind === 'buff_attack' || kind === 'debuff_defense';
}

export function isDamageCombatKind(kind: SkillCombatKind): boolean {
  return kind === 'damage';
}
