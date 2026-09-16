import { getSkillIconPath } from '../../src/presentation/assets/SkillIconCatalog';
import type { StatIconKey } from '../../src/presentation/assets/StatIconCatalog';
import { getStatIconPath } from '../../src/presentation/assets/StatIconCatalog';
import type { AscensionId } from '../../src/domain/progression/SkillId';
import { resolveKnightSpritePath } from '../../src/domain/progression/KnightEvolutionCatalog';
import { resolvePriestSpritePath } from '../../src/domain/progression/PriestEvolutionCatalog';
import { resolveSorcererSpritePath } from '../../src/domain/progression/SorcererEvolutionCatalog';
import { heroSpriteUrlForLab } from './heroSprites';

/** SVGs específicos em `public/sprites/skills/svg/` (id do arquivo sem extensão). */
const SKILL_SVG_IDS = new Set([
  'aegis',
  'arc_nova',
  'arc_rift',
  'basic_attack',
  'bleed',
  'blessing',
  'blizzard',
  'cleave',
  'comet',
  'curse',
  'decree',
  'dragon_breath',
  'ether_storm',
  'fireball',
  'frost_shard',
  'ground_slam',
  'heal',
  'holy_light',
  'impact_fireball',
  'martial_flow',
  'poison_spit',
  'power_attack',
  'pyro_ember',
  'pyro_inferno',
  'radiance',
  'sanctuary',
  'smite',
  'thunder_bolt',
  'thrust',
  'wraith_drain',
]);

const SKILL_SVG_ALIAS: Record<string, string> = {
  minor_heal: 'heal',
  oracle_mend: 'heal',
  regenerate: 'heal',
  oracle_sanctuary: 'sanctuary',
  guardian_resolve: 'aegis',
  reaver_cleave: 'cleave',
  sag_clr_smite: 'smite',
  inquisitor_judgment: 'blessing',
  inquisitor_flame: 'fireball',
  pyro_inferno: 'pyro_inferno',
  pyro_ember: 'pyro_ember',
  dragon_breath: 'dragon_breath',
  dragon_bite: 'cleave',
  wraith_curse: 'curse',
  slime_acid: 'poison_spit',
  marked_prey: 'bleed',
};

const FIELD_STAT_ICON: Record<string, StatIconKey> = {
  attack: 'attack',
  defense: 'defense',
  health: 'health',
  basicAttackDamageRatio: 'attack',
  skillCooldownTurnSeconds: 'cooldown',
  attackSpeedFactor: 'attackSpeed',
  attackPerLevel: 'attack',
  defensePerLevel: 'defense',
  healthPerLevel: 'health',
  levelUpAttackGain: 'attack',
  levelUpDefenseGain: 'defense',
  levelUpHealthGain: 'health',
  powerPerRank: 'dps',
  basePower: 'physicalDamage',
  attributeFactor: 'str',
  cooldownTurns: 'cooldown',
  initialCooldown: 'cooldown',
  actionRecoverySeconds: 'castSpeed',
  cooldownSecondsPerRank: 'cooldown',
  maxCooldownReduction: 'cooldown',
  minCooldownReduction: 'cooldown',
  usePriority: 'attack',
};

export function labAssetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const encoded = clean.split('/').map(encodeURIComponent).join('/');
  return `/panel/assets/${encoded}`;
}

export function labStatIconUrl(key: StatIconKey): string {
  return labAssetUrl(getStatIconPath(key));
}

export function labFieldStatIconUrl(fieldKey: string): string | null {
  const key = FIELD_STAT_ICON[fieldKey];
  return key ? labStatIconUrl(key) : null;
}

function skillSvgName(skillId: string): string | null {
  const aliased = SKILL_SVG_ALIAS[skillId] ?? skillId;
  return SKILL_SVG_IDS.has(aliased) ? `${aliased}.svg` : null;
}

export function labSkillIconUrl(skillId: string): string {
  const svg = skillSvgName(skillId);
  if (svg) return labAssetUrl(`skills/svg/${svg}`);
  return labAssetUrl(getSkillIconPath(skillId));
}

export function labSkillIconFallbackUrl(skillId: string): string {
  return labAssetUrl(getSkillIconPath(skillId));
}

function iconFromEffectKind(kind: string): StatIconKey {
  if (kind.includes('health')) return 'health';
  if (kind.includes('defense')) return 'defense';
  if (kind.includes('attack')) return 'attack';
  if (kind.includes('_str')) return 'str';
  if (kind.includes('_dex')) return 'dex';
  if (kind.includes('_int') || kind.includes('support')) return 'int';
  if (kind.includes('tree_damage')) return 'elementalDamage';
  return 'allElemental';
}

export function labPassiveIconUrl(effectKind?: string): string {
  return labStatIconUrl(iconFromEffectKind(effectKind ?? ''));
}

export function labEvolutionSpriteUrl(heroClass: string, ascensionId: string): string {
  let path: string | null = null;
  if (heroClass === 'knight') path = resolveKnightSpritePath(ascensionId as AscensionId);
  else if (heroClass === 'sorcerer') path = resolveSorcererSpritePath(ascensionId as AscensionId);
  else if (heroClass === 'priest') path = resolvePriestSpritePath(ascensionId as AscensionId);
  if (path) return labAssetUrl(path);
  return heroSpriteUrlForLab(heroClass);
}

export function bindLabArtFallback(img: HTMLImageElement): void {
  img.addEventListener('error', () => {
    if (img.dataset.fallbackApplied !== '1') {
      const fallback = img.dataset.fallback;
      const current = img.getAttribute('src') ?? '';
      if (fallback && !current.includes(fallback)) {
        img.dataset.fallbackApplied = '1';
        img.src = fallback;
        return;
      }
    }
    img.classList.add('is-missing');
  });
}
