import { UpgradeNodeDto } from '../../application/dto/UpgradeNodeDto';
import { getUpgradeById } from '../../domain/upgrades/UpgradeCatalog';
import { UPGRADE_CATALOG } from '../../domain/upgrades/UpgradeCatalog';
import { FeatureKey } from '../../domain/upgrades/FeatureKey';
import { UpgradeRequirement } from '../../domain/upgrades/UpgradeRequirement';
import { getUpgradeNodePosition, UPGRADE_TREE_VIEWBOX } from './UpgradeTreeLayout';

export interface UpgradeTreeEdge {
  fromId: string;
  toId: string;
}

export interface PositionedUpgradeNode {
  node: UpgradeNodeDto;
  x: number;
  y: number;
}

const NODE_RADIUS = 28;
const AXIS_EPSILON = 8;

interface Point {
  x: number;
  y: number;
}

export function resolveUpgradeParentIds(upgradeId: string): string[] {
  const definition = getUpgradeById(upgradeId);
  if (!definition) return [];

  if (definition.parents.length > 0) {
    return definition.parents;
  }

  return definition.requirements
    .filter((requirement): requirement is Extract<UpgradeRequirement, { type: 'upgrade_level' }> => {
      return requirement.type === 'upgrade_level';
    })
    .map((requirement) => findUpgradeIdByFeatureLevel(requirement.feature, requirement.minLevel))
    .filter((parentId): parentId is string => Boolean(parentId));
}

function findUpgradeIdByFeatureLevel(feature: FeatureKey, level: number): string | undefined {
  return UPGRADE_CATALOG.find((entry) => entry.feature === feature && entry.level === level)?.id;
}

export function buildUpgradeTreeEdges(nodes: UpgradeNodeDto[]): UpgradeTreeEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: UpgradeTreeEdge[] = [];

  for (const node of nodes) {
    for (const parentId of resolveUpgradeParentIds(node.id)) {
      if (!nodeIds.has(parentId)) continue;
      edges.push({ fromId: parentId, toId: node.id });
    }
  }

  return edges;
}

export interface SiblingBranchConflict {
  parentId: string;
  direction: string;
  childIds: string[];
}

/**
 * Duas arestas do mesmo pai com a mesma direção se sobrepõem: a mais longa passa
 * por cima do irmão mais próximo. O layout precisa dar um ângulo distinto a cada filho.
 */
export function findSiblingBranchConflicts(
  edges: readonly UpgradeTreeEdge[],
): SiblingBranchConflict[] {
  const byParentDirection = new Map<string, { parentId: string; direction: string; childIds: string[] }>();

  for (const edge of edges) {
    const from = getUpgradeNodePosition(edge.fromId);
    const to = getUpgradeNodePosition(edge.toId);
    if (!from || !to) continue;

    const direction = branchDirection(from, to);
    const key = `${edge.fromId}|${direction}`;
    const bucket = byParentDirection.get(key) ?? {
      parentId: edge.fromId,
      direction,
      childIds: [],
    };
    bucket.childIds.push(edge.toId);
    byParentDirection.set(key, bucket);
  }

  return [...byParentDirection.values()].filter((bucket) => bucket.childIds.length > 1);
}

function branchDirection(from: Point, to: Point): string {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const step = Math.round((angle * 180) / Math.PI / 45) * 45;
  return String(((step % 360) + 360) % 360);
}

/** @deprecated use buildUpgradeTreeEdges */
export const buildBranchEdges = buildUpgradeTreeEdges;

export function buildPositionedNodes(nodes: UpgradeNodeDto[]): PositionedUpgradeNode[] {
  return nodes
    .map((node) => {
      const position = getUpgradeNodePosition(node.id);
      if (!position) return null;
      return { node, x: position.x, y: position.y };
    })
    .filter((entry): entry is PositionedUpgradeNode => Boolean(entry));
}

function anchorOnNode(node: PositionedUpgradeNode, toward: Point): Point {
  const dx = toward.x - node.x;
  const dy = toward.y - node.y;
  const distance = Math.hypot(dx, dy) || 1;

  return {
    x: node.x + (dx / distance) * NODE_RADIUS,
    y: node.y + (dy / distance) * NODE_RADIUS,
  };
}

export function isStraightBranchEdge(from: Point, to: Point): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  return dx <= AXIS_EPSILON || dy <= AXIS_EPSILON || Math.abs(dx - dy) <= AXIS_EPSILON;
}

export function buildEdgePath(from: PositionedUpgradeNode, to: PositionedUpgradeNode): string {
  const start = anchorOnNode(from, { x: to.x, y: to.y });
  const end = anchorOnNode(to, { x: from.x, y: from.y });

  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function getUnifiedViewBox(): { width: number; height: number } {
  return UPGRADE_TREE_VIEWBOX;
}

export function findFocusNodeId(nodes: UpgradeNodeDto[]): string | null {
  const available = nodes.find((node) => node.status === 'available');
  if (available) return available.id;

  const ready = nodes.find((node) => node.status === 'ready');
  if (ready) return ready.id;

  const locked = nodes.find((node) => node.status === 'locked');
  return locked?.id ?? nodes[0]?.id ?? null;
}

export function upgradeNodeShortLabel(node: UpgradeNodeDto): string {
  if (node.feature.startsWith('hero_unlock')) {
    if (node.name.includes('Berserker')) return '⚔';
    if (node.name.includes('Arqueira') || node.name.includes('Rain')) return '🏹';
    return '🛡';
  }

  if (node.feature === 'divine_forge') return '⚒';

  if (node.feature === 'background_tick') return '⏱';

  if (node.feature === 'battle_skill_slots') return '✦';

  if (node.feature === 'shop_refresh') return '🛒';

  if (node.feature === 'log_filter') return '📋';

  if (node.feature === 'battle_stats') return '📊';

  if (node.level > 1) {
    return toRoman(node.level);
  }

  return node.name.slice(0, 1).toUpperCase();
}

function toRoman(level: number): string {
  const map: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
  };
  return map[level] ?? String(level);
}
