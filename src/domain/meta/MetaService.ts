import { MetaBonuses, emptyMetaBonuses } from './MetaBonuses';
import { MetaProgress } from './MetaProgress';
import { META_UPGRADE_CATALOG, getMetaUpgradeById } from './MetaUpgradeCatalog';
import { MetaFeatureKey, MetaUpgradeDefinition } from './MetaUpgradeDefinition';

export type MetaNodeStatus = 'locked' | 'ready' | 'available' | 'owned';

export interface MetaNodeView {
  definition: MetaUpgradeDefinition;
  status: MetaNodeStatus;
  canAfford: boolean;
}

export interface SeasonAwardResult {
  progress: MetaProgress;
  sigilsAwarded: number;
}

export function baseSeasonSigils(highestTierReached: number): number {
  return 5 + Math.floor(Math.max(1, highestTierReached) / 3);
}

export class MetaService {
  resolveBonuses(progress: MetaProgress): MetaBonuses {
    const bonuses = emptyMetaBonuses();

    for (const definition of META_UPGRADE_CATALOG) {
      const ownedLevel = progress.upgradeLevels[definition.feature] ?? 0;
      if (ownedLevel < definition.level) continue;

      bonuses.startGoldBonus += definition.startGoldBonus ?? 0;
      if (definition.goldBonusPercent) {
        bonuses.goldMultiplier += definition.goldBonusPercent / 100;
      }
      if (definition.xpBonusPercent) {
        bonuses.xpMultiplier += definition.xpBonusPercent / 100;
      }
      bonuses.seasonSigilBonus += definition.seasonSigilBonus ?? 0;
    }

    return bonuses;
  }

  buildTree(progress: MetaProgress): MetaNodeView[] {
    return META_UPGRADE_CATALOG.map((definition) => {
      const status = this.getStatus(progress, definition);
      return {
        definition,
        status,
        canAfford: progress.sigils >= definition.cost,
      };
    });
  }

  countAvailable(progress: MetaProgress): number {
    return this.buildTree(progress).filter((node) => node.status === 'available').length;
  }

  purchase(progress: MetaProgress, upgradeId: string): MetaProgress {
    const definition = getMetaUpgradeById(upgradeId);
    if (!definition) {
      throw new Error('Melhoria de legado não encontrada');
    }

    const status = this.getStatus(progress, definition);
    if (status !== 'available') {
      if (status === 'ready') {
        throw new Error('Selos insuficientes');
      }
      throw new Error('Melhoria de legado indisponível');
    }

    const nextLevels = {
      ...progress.upgradeLevels,
      [definition.feature]: definition.level,
    };

    return progress
      .withSigils(progress.sigils - definition.cost)
      .withUpgradeLevels(nextLevels);
  }

  awardSeasonCompletion(progress: MetaProgress, highestTierReached: number): SeasonAwardResult {
    const bonuses = this.resolveBonuses(progress);
    const sigilsAwarded = baseSeasonSigils(highestTierReached) + bonuses.seasonSigilBonus;

    const next = progress
      .withSigils(progress.sigils + sigilsAwarded)
      .withSeasonsCompleted(progress.seasonsCompleted + 1)
      .withTotalSigilsEarned(progress.totalSigilsEarned + sigilsAwarded);

    return { progress: next, sigilsAwarded };
  }

  private getStatus(progress: MetaProgress, definition: MetaUpgradeDefinition): MetaNodeStatus {
    const currentLevel = progress.upgradeLevels[definition.feature] ?? 0;

    if (currentLevel >= definition.level) {
      return 'owned';
    }

    if (currentLevel !== definition.level - 1) {
      return 'locked';
    }

    if (progress.sigils < definition.cost) {
      return 'ready';
    }

    return 'available';
  }

  getFeatureLevel(progress: MetaProgress, feature: MetaFeatureKey): number {
    return progress.upgradeLevels[feature] ?? 0;
  }
}
