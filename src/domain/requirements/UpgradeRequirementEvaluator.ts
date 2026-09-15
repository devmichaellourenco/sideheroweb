import { GameState } from '../entities/GameState';
import { FeatureKey, getFeatureLevel } from '../upgrades/FeatureKey';
import { UpgradeRequirement } from '../upgrades/UpgradeRequirement';
import { EvaluatedRequirement } from './EvaluatedRequirement';

export class UpgradeRequirementEvaluator {
  evaluateAll(state: GameState, requirements: UpgradeRequirement[]): EvaluatedRequirement[] {
    return requirements.map((requirement) => this.evaluate(state, requirement));
  }

  allMet(state: GameState, requirements: UpgradeRequirement[]): boolean {
    return requirements.every((requirement) => this.isMet(state, requirement));
  }

  private evaluate(state: GameState, requirement: UpgradeRequirement): EvaluatedRequirement {
    return { label: this.describe(requirement), met: this.isMet(state, requirement) };
  }

  private isMet(state: GameState, requirement: UpgradeRequirement): boolean {
    switch (requirement.type) {
      case 'upgrade_level':
        return getFeatureLevel(state.upgradeLevels, requirement.feature) >= requirement.minLevel;
      case 'min_stage':
        return state.stage >= requirement.value;
      case 'min_battles_won':
        return state.totalBattlesWon >= requirement.value;
      case 'min_chests_opened':
        return state.chestsOpenedCount() >= requirement.value;
      case 'min_hero_level':
        return state.heroes.reduce((max, hero) => Math.max(max, hero.level), 0) >= requirement.value;
      case 'main_mission_completed':
        return state.campaignProgress.missionProgress.isMainCompleted(requirement.missionId);
      default:
        return false;
    }
  }

  private describe(requirement: UpgradeRequirement): string {
    switch (requirement.type) {
      case 'upgrade_level':
        return `${this.featureLabel(requirement.feature)} nível ${requirement.minLevel}`;
      case 'min_stage':
        return `Stage ${requirement.value}+`;
      case 'min_battles_won':
        return `${requirement.value} vitórias`;
      case 'min_chests_opened':
        return `${requirement.value} baús abertos`;
      case 'min_hero_level':
        return `Herói nível ${requirement.value}+`;
      case 'main_mission_completed':
        return `Missão principal ${requirement.missionId.replace(/^main:/, '')}`;
      default:
        return 'Requisito';
    }
  }

  private featureLabel(feature: FeatureKey): string {
    const labels: Record<FeatureKey, string> = {
      auto_battle: 'Auto-batalha',
      background_tick: 'Tick idle', // OFFLINE PROGRESS DESATIVADO (2026-07) — label legado
      auto_open_chests: 'Auto-abrir baús',
      open_all_chests: 'Abrir todos',
      optimize_loadout: 'Otimizar equipe',
      auto_equip_loot: 'Auto-equipar loot',
      log_filter: 'Log resumido',
      battle_stats: 'Estatísticas de batalha',
      shop_refresh: 'Renovar loja',
      battle_skill_slots: 'Slots de skill',
      hero_unlock_knight: 'Galneon',
      hero_unlock_priest: 'Elara',
      hero_unlock_berserker: 'Berserker',
      hero_unlock_archer: 'Arqueira',
      hero_unlock_paladin: 'Paladino',
      item_stash: 'Baú de itens',
      divine_forge: 'Forja Divina',
      improvement_reset: 'Reset de pontos',
    };
    return labels[feature];
  }
}
