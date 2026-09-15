import { CombatStatusEffectDto } from '../dto/GameStateDto';
import { DamageElement } from '../../domain/combat/DamageElement';

/** Caminhos relativos a `panel/assets/` — resolvidos na presentation via `getAssetUrl`. */
const STATUS_EFFECT_ICON_PATH: Record<CombatStatusEffectDto['kind'], string> = {
  buff_attack: 'ui/defense.png',
  debuff_defense: 'ui/defense.png',
  dot: 'skills/magic.png',
  heal_block: 'ui/health.png',
};

const DOT_ELEMENT_ICON_PATH: Partial<Record<DamageElement, string>> = {
  fire: 'skills/fireball.png',
  air: 'skills/magic.png',
  cold: 'skills/magic.png',
  lightning: 'skills/magic.png',
};

export function mapCombatStatusEffectIconPath(
  kind: CombatStatusEffectDto['kind'],
  dotElement?: DamageElement,
): string {
  if (kind === 'dot' && dotElement && DOT_ELEMENT_ICON_PATH[dotElement]) {
    return DOT_ELEMENT_ICON_PATH[dotElement]!;
  }
  return STATUS_EFFECT_ICON_PATH[kind];
}
