import { GameState } from '../entities/GameState';
import { FeatureKey, getFeatureLevel, UpgradeLevels } from './FeatureKey';
import { HeroUnlockService } from '../party/HeroUnlockService';
import { UpgradeRequirementEvaluator } from '../requirements/UpgradeRequirementEvaluator';
import { getUpgradeById, listEffectiveUpgrades, UPGRADE_CATALOG } from './UpgradeCatalog';
import { UpgradeDefinition } from './UpgradeDefinition';

function minCatalogLevelForFeature(feature: FeatureKey): number {
  const levels = UPGRADE_CATALOG.filter((entry) => entry.feature === feature).map(
    (entry) => entry.level,
  );
  return levels.length > 0 ? Math.min(...levels) : 1;
}

export type UpgradeNodeStatus = 'locked' | 'ready' | 'available' | 'owned';

export interface UpgradeNodeView {
  definition: UpgradeDefinition;
  status: UpgradeNodeStatus;
  canAfford: boolean;
  requirements: { label: string; met: boolean }[];
}

export class UpgradeService {
  private readonly evaluator = new UpgradeRequirementEvaluator();

  getLevel(levels: UpgradeLevels, feature: UpgradeDefinition['feature']): number {
    return getFeatureLevel(levels, feature);
  }

  buildTree(state: GameState): UpgradeNodeView[] {
    return listEffectiveUpgrades().map((definition) => {
      const status = this.getStatus(state, definition);
      return {
        definition,
        status,
        canAfford: state.gold.canAfford(definition.cost),
        requirements: this.evaluator.evaluateAll(state, definition.requirements),
      };
    });
  }

  countAvailable(state: GameState): number {
    return this.buildTree(state).filter((node) => node.status === 'available').length;
  }

  purchase(state: GameState, upgradeId: string): GameState {
    const definition = getUpgradeById(upgradeId);
    if (!definition) {
      throw new Error('Melhoria não encontrada');
    }

    const status = this.getStatus(state, definition);
    if (status !== 'available') {
      if (status === 'ready') {
        throw new Error('Ouro insuficiente');
      }
      throw new Error('Melhoria indisponível para compra');
    }

    const nextLevels: UpgradeLevels = {
      ...state.upgradeLevels,
      [definition.feature]: definition.level,
    };

    let nextState = state
      .withGold(state.gold.spend(definition.cost))
      .withUpgradeLevels(nextLevels)
      .addLog(`Comprou melhoria: ${definition.name}`);

    if (definition.unlockHeroClass) {
      nextState = HeroUnlockService.applyUnlock(nextState, definition.unlockHeroClass);
    }

    return nextState;
  }

  private getStatus(state: GameState, definition: UpgradeDefinition): UpgradeNodeStatus {
    const currentLevel = getFeatureLevel(state.upgradeLevels, definition.feature);

    if (currentLevel >= definition.level) {
      return 'owned';
    }

    if (!this.hasRequiredPriorFeatureLevel(state, definition)) {
      return 'locked';
    }

    if (!this.areParentsOwned(state, definition)) {
      return 'locked';
    }

    if (!this.evaluator.allMet(state, definition.requirements)) {
      return 'locked';
    }

    if (!state.gold.canAfford(definition.cost)) {
      return 'ready';
    }

    return 'available';
  }

  private areParentsOwned(state: GameState, definition: UpgradeDefinition): boolean {
    if (definition.parents.length === 0) {
      return true;
    }

    return definition.parents.every((parentId) => {
      const parent = getUpgradeById(parentId);
      if (!parent) return true;
      return getFeatureLevel(state.upgradeLevels, parent.feature) >= parent.level;
    });
  }

  /**
   * Ex.: auto_battle começa em 1x grátis (nível implícito 1); o primeiro nó comprável é nível 2.
   */
  private hasRequiredPriorFeatureLevel(
    state: GameState,
    definition: UpgradeDefinition,
  ): boolean {
    const currentLevel = getFeatureLevel(state.upgradeLevels, definition.feature);
    const priorLevel = definition.level - 1;

    if (priorLevel <= 0) {
      return currentLevel === 0;
    }

    if (currentLevel >= priorLevel) {
      return true;
    }

    const minCatalogLevel = minCatalogLevelForFeature(definition.feature);
    return currentLevel === 0 && minCatalogLevel === definition.level;
  }
}
