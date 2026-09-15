import { Hero } from '../../domain/entities/Hero';
import { MAX_ACTIVE_BATTLE_SKILLS, toSkillSlotLayout } from '../../domain/progression/SkillBattleSlots';
import { getSkillById } from '../../domain/progression/SkillCatalog';
import { HeroActiveSkillDto } from '../dto/GameStateDto';
import { SkillBranchDto } from '../dto/SkillNodeDto';
import {
  buildSkillBattleStats,
  formatBranchLabel,
  formatScalingLabel,
  formatScopeLabel,
} from './SkillBattleStatsMapper';

function mapOne(hero: Hero, skillId: string, mapId?: string): HeroActiveSkillDto {
  const props = hero.toProps();
  const definition = getSkillById(skillId);
  const currentRank = props.skillRanks[skillId] ?? (skillId === 'basic_attack' ? 1 : 0);
  const branch = (definition?.branch ?? 'utility') as SkillBranchDto;
  const scalingKey = definition?.scaling ?? 'str';
  const scope = definition?.scope ?? 'universal';

  return {
    id: skillId,
    name: definition?.name ?? skillId,
    branch,
    branchLabel: formatBranchLabel(branch),
    description: definition?.description ?? 'Skill sem descrição.',
    currentRank: Math.max(1, currentRank),
    maxRank: definition?.maxRank ?? 1,
    scope,
    scopeLabel: formatScopeLabel(scope),
    scalingLabel: formatScalingLabel(scalingKey),
    battleStats: buildSkillBattleStats(hero, skillId, scalingKey, undefined, mapId),
  };
}

export function mapHeroActiveSkills(
  hero: Hero,
  unlockedSlotCount: number,
  mapId?: string,
): (HeroActiveSkillDto | null)[] {
  const layout = toSkillSlotLayout(hero.toProps().equippedSkillIds, unlockedSlotCount);

  return Array.from({ length: MAX_ACTIVE_BATTLE_SKILLS }, (_, index) => {
    if (index >= layout.length) return null;
    const skillId = layout[index];
    return skillId ? mapOne(hero, skillId, mapId) : null;
  });
}

export function mapHeroActiveSkillById(hero: Hero, skillId: string, mapId?: string): HeroActiveSkillDto {
  return mapOne(hero, skillId, mapId);
}
