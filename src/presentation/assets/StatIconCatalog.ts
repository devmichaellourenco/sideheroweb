import { getAssetUrl } from './AssetCatalog';

/**
 * Chave de ícone por contexto de estatística. O mesmo elemento (ex.: fogo)
 * serve para dano e resistência — o texto da linha desambigua.
 */
export type StatIconKey =
  | 'str'
  | 'dex'
  | 'int'
  | 'attack'
  | 'defense'
  | 'health'
  | 'dps'
  | 'attackSpeed'
  | 'castSpeed'
  | 'cooldown'
  | 'critChance'
  | 'critDamage'
  | 'dodge'
  | 'block'
  | 'damageReduction'
  | 'physicalDamage'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'air'
  | 'allElemental'
  | 'elementalDamage';

const STAT_ICON_PATHS: Record<StatIconKey, string> = {
  str: 'ui/stats/str.png',
  dex: 'ui/stats/dex.png',
  int: 'ui/stats/int.png',
  attack: 'ui/stats/attack.png',
  defense: 'ui/stats/defense.png',
  health: 'ui/stats/health.png',
  dps: 'ui/stats/dps.png',
  attackSpeed: 'ui/stats/attack-speed.png',
  castSpeed: 'ui/stats/cast-speed.png',
  cooldown: 'ui/stats/cooldown.png',
  critChance: 'ui/stats/crit-chance.png',
  critDamage: 'ui/stats/crit-damage.png',
  dodge: 'ui/stats/dodge.png',
  block: 'ui/stats/block.png',
  damageReduction: 'ui/stats/damage-reduction.png',
  physicalDamage: 'ui/stats/physical-damage.png',
  fire: 'ui/stats/fire.png',
  cold: 'ui/stats/cold.png',
  lightning: 'ui/stats/lightning.png',
  air: 'ui/stats/air.png',
  allElemental: 'ui/stats/all-elemental.png',
  elementalDamage: 'ui/stats/elemental-damage.png',
};

/** Ícone por id de linha da ficha de combate (HeroCombatStatSheetDto). */
export const STAT_LINE_ICON_BY_ID: Record<string, StatIconKey> = {
  ataque: 'attack',
  dps: 'dps',
  'attack-speed': 'attackSpeed',
  'cast-speed': 'castSpeed',
  'cooldown-reduction': 'cooldown',
  'time-to-action': 'cooldown',
  'crit-chance': 'critChance',
  'crit-damage': 'critDamage',
  defesa: 'defense',
  'max-health': 'health',
  dodge: 'dodge',
  block: 'block',
  'damage-reduction': 'damageReduction',
  'resist-fire': 'fire',
  'resist-cold': 'cold',
  'resist-lightning': 'lightning',
  'resist-air': 'air',
};

export function getStatIconUrl(key: StatIconKey): string {
  return getAssetUrl(STAT_ICON_PATHS[key]);
}

/** `<img>` decorativa da estatística; tingida via `--stat-icon-filter`. */
export function statIconImg(
  key: StatIconKey | undefined,
  className = 'stat-icon',
): string {
  if (!key) return '';
  return `<img class="${className}" src="${getStatIconUrl(key)}" alt="" aria-hidden="true" loading="lazy" draggable="false" />`;
}
