import { UpgradeNodeView } from '../../domain/upgrades/UpgradeService';
import { UpgradeNodeDto } from '../dto/UpgradeNodeDto';

export function mapUpgradeTree(nodes: UpgradeNodeView[]): UpgradeNodeDto[] {
  return nodes.map((node) => ({
    id: node.definition.id,
    feature: node.definition.feature,
    level: node.definition.level,
    branch: node.definition.branch,
    name: node.definition.name,
    description: node.definition.description,
    cost: node.definition.cost,
    status: node.status,
    canAfford: node.canAfford,
    requirements: node.requirements,
  }));
}
