import { ASSETS, getAssetUrl, getGearFrameSprite } from './AssetCatalog';
import { resolveSkillIconKey } from './SkillIconResolver';
import { getEnemySkillDisplay } from '../../domain/progression/combat/EnemySkillDisplayCatalog';
import { getSkillById } from '../../domain/progression/SkillCatalog';

export type SkillBranchKey = 'offense' | 'defense' | 'utility';

const SKILL_BRANCH_FRAME: Record<SkillBranchKey, 'common' | 'rare' | 'epic'> = {
  offense: 'rare',
  defense: 'common',
  utility: 'epic',
};

export function getSkillIconPath(skillId: string): string {
  return ASSETS.skills[resolveSkillIconKey(skillId)];
}

export function getSkillIconUrl(skillId: string): string {
  return getAssetUrl(getSkillIconPath(skillId));
}

export function getSkillBranchFrameUrl(branch: string): string {
  const key = SKILL_BRANCH_FRAME[branch as SkillBranchKey] ?? 'common';
  return getGearFrameSprite(key);
}

export function getSkillDisplayName(skillId: string, fallbackName?: string): string {
  return (
    getSkillById(skillId)?.name ??
    getEnemySkillDisplay(skillId)?.name ??
    fallbackName ??
    skillId
  );
}
