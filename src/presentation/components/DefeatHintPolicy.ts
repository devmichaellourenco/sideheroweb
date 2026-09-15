import { EnemyDto } from '../../application/dto/GameStateDto';
import { DAMAGE_ELEMENT_LABELS, DamageElement } from '../../domain/combat/DamageElement';

const DEFAULT_DEFEAT_HINT =
  'No Acampamento: ajuste formação, skills ou resistências e tente de novo.';

/** Infere o elemento ofensivo dominante dos inimigos da wave do wipe. */
export function resolveDefeatHint(enemies: readonly EnemyDto[]): string {
  const counts = new Map<string, number>();

  for (const enemy of enemies) {
    for (const skill of enemy.combatSkills ?? []) {
      const element = skill.damageElement;
      if (!element || element === 'physical') continue;
      counts.set(element, (counts.get(element) ?? 0) + 1);
    }
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [element, count] of counts) {
    if (count > bestCount) {
      best = element;
      bestCount = count;
    }
  }

  if (!best) return DEFAULT_DEFEAT_HINT;

  const label = DAMAGE_ELEMENT_LABELS[best as DamageElement] ?? best;
  return `No Acampamento: suba resistência a ${label} (gear/skills) e revise a formação.`;
}
