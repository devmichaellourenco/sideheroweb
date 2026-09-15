import { Hero } from '../../domain/entities/Hero';
import { CombatProfileProvider } from '../../domain/combat/CombatProfileProvider';
import { resistanceProfileFromHeroEquipment } from '../../domain/combat/ResistanceProfileAggregator';
import {
  getUnlockedBattleSkillSlotCount,
  MAX_ACTIVE_BATTLE_SKILLS,
} from '../../domain/progression/SkillBattleSlots';
import { UpgradeLevels } from '../../domain/upgrades/FeatureKey';
import { AttributesDto } from '../dto/AttributesDto';
import { HeroDto } from '../dto/GameStateDto';
import { HeroCombatStatSectionDto } from '../dto/HeroCombatStatSheetDto';
import { mapCombatResistSummary } from './CombatResistMapper';
import { mapGearToDto } from './GearDtoMapper';
import { mapHeroActiveSkills } from './HeroActiveSkillMapper';
import { mapHeroActivePassives } from './ActivePassiveMapper';
import { mapHeroCombatStatSheet } from './HeroCombatStatSheetMapper';

const combatProfiles = new CombatProfileProvider();

function mapAttributes(attrs: { str: number; dex: number; int: number }): AttributesDto {
  return { str: attrs.str, dex: attrs.dex, int: attrs.int };
}

export function mapHeroToDto(
  hero: Hero,
  upgradeLevels: UpgradeLevels = {},
  mapId?: string,
): HeroDto {
  const equipment: HeroDto['equipment'] = {};
  const slots = ['weapon', 'armor', 'accessory'] as const;
  const props = hero.toProps();
  const heroEquipment = props.equipment ?? {};

  for (const slot of slots) {
    const gear = heroEquipment[slot];
    equipment[slot] = gear ? mapGearToDto(gear) : null;
  }

  return {
    id: hero.id,
    name: hero.name,
    heroClass: hero.heroClass,
    emoji: hero.emoji,
    level: hero.level,
    experience: props.experience.current,
    experienceToNextLevel: props.experience.toNextLevel,
    attack: hero.attack,
    defense: hero.defense,
    attackSpeed: combatProfiles.forHero(hero).attackSpeed,
    castSpeed: combatProfiles.forHero(hero).castSpeed,
    critChance: combatProfiles.forHero(hero).critChance,
    critDamage: combatProfiles.forHero(hero).critDamage,
    health: hero.currentHealth,
    maxHealth: hero.maxHealth,
    baseAttributes: mapAttributes(hero.baseAttributes),
    allocatedAttributes: mapAttributes(props.allocatedAttributes),
    totalAttributes: mapAttributes(hero.totalAttributes),
    unspentImprovementPoints: props.unspentImprovementPoints,
    unspentAscensionPoints: props.unspentAscensionPoints,
    skillRanks: { ...props.skillRanks },
    equippedSkillIds: [...props.equippedSkillIds],
    activeSkills: mapHeroActiveSkills(hero, getUnlockedBattleSkillSlotCount(upgradeLevels), mapId),
    maxActiveSkills: MAX_ACTIVE_BATTLE_SKILLS,
    unlockedActiveSkillSlots: getUnlockedBattleSkillSlotCount(upgradeLevels),
    ascensionId: props.ascensionId,
    hasUnspentPoints: hero.hasUnspentPoints,
    activePassives: mapHeroActivePassives(hero),
    equipment,
    combatIntent: null,
    combatSkills: [],
    combatSkillCooldowns: [],
    actionTimeRatio: 1,
    actionTimeRemaining: 0,
    actionTimeTotal: 0,
    statusEffects: [],
    combatResists: mapCombatResistSummary(
      resistanceProfileFromHeroEquipment(props.equipment),
    ),
    combatStatSheet: mapHeroCombatStatSheet(hero),
  };
}
