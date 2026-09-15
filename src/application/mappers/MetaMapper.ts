import { MetaNodeDto, MetaSummaryDto } from '../dto/MetaDto';
import { MetaNodeView, MetaService } from '../../domain/meta/MetaService';
import { MetaProgress } from '../../domain/meta/MetaProgress';

export function mapMetaNode(view: MetaNodeView): MetaNodeDto {
  return {
    id: view.definition.id,
    feature: view.definition.feature,
    level: view.definition.level,
    name: view.definition.name,
    description: view.definition.description,
    cost: view.definition.cost,
    status: view.status,
    canAfford: view.canAfford,
  };
}

export function mapMetaTree(views: MetaNodeView[]): MetaNodeDto[] {
  return views.map(mapMetaNode);
}

export function mapMetaSummary(progress: MetaProgress, metaService: MetaService): MetaSummaryDto {
  const bonuses = metaService.resolveBonuses(progress);

  return {
    sigils: progress.sigils,
    seasonsCompleted: progress.seasonsCompleted,
    totalSigilsEarned: progress.totalSigilsEarned,
    goldBonusPercent: Math.round((bonuses.goldMultiplier - 1) * 100),
    xpBonusPercent: Math.round((bonuses.xpMultiplier - 1) * 100),
    startGoldBonus: bonuses.startGoldBonus,
    purchasableMetaCount: metaService.countAvailable(progress),
  };
}
